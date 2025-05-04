import { toast } from "sonner";
import { readBlob } from "./walrusClient";
import { CONSTANTS } from "@/constants";
import {
    EncryptedObject,
    SessionKey,
    SealClient,
    getAllowlistedKeyServers,
} from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { SuiClient } from "@mysten/sui/client";

export interface FileData {
    file_blob_id: string;
    name: string;
    is_encrypt: boolean;
    owner: string;
}

export const downloadAndDecryptFile = async (
    file: FileData,
    currentAccount: { address: string } | null | undefined,
    suiClient: SuiClient,
    signPersonalMessage: (args: {
        message: Uint8Array;
    }) => Promise<{ signature: string }>,
    fileId: string,
    t: (key: string) => string,
    progressCallback?: (progress: number) => void
): Promise<boolean> => {
    try {
        // 设置初始进度
        progressCallback?.(0);

        // 调用readBlob获取文件内容
        const arrayBuffer = await readBlob(file.file_blob_id);

        // 更新进度到25%
        progressCallback?.(25);

        let fileData;

        // 如果文件是加密的，需要解密
        if (file.is_encrypt) {
            try {
                // 获取签名者
                if (!currentAccount) {
                    throw new Error(t("walletRequired"));
                }

                // 创建 SealClient 实例
                const sealClient = new SealClient({
                    suiClient,
                    serverObjectIds: getAllowlistedKeyServers("testnet"),
                    verifyKeyServers: false,
                });

                // 1. 将arrayBuffer转为Uint8Array
                const encryptedData = new Uint8Array(arrayBuffer);

                // 更新进度到40%
                progressCallback?.(40);

                // 2. 创建会话密钥
                const sessionKey = new SessionKey({
                    address: currentAccount.address,
                    packageId: CONSTANTS.SECURE_FILE_SHARE_CONTRACT.PACKAGE_ID,
                    ttlMin: 10,
                });

                // 3. 签名
                const message = sessionKey.getPersonalMessage();
                const sign = await signPersonalMessage({
                    message,
                });

                await sessionKey.setPersonalMessageSignature(sign.signature);

                // 更新进度到50%
                progressCallback?.(50);

                // 4. 解析 sealId
                const sealId = EncryptedObject.parse(encryptedData).id;

                // 5. 创建交易
                const tx = new Transaction();
                tx.moveCall({
                    target: `${CONSTANTS.SECURE_FILE_SHARE_CONTRACT.PACKAGE_ID}::secure_file_share::seal_approve`,
                    arguments: [
                        tx.pure.vector("u8", fromHex(sealId)),
                        tx.object(
                            CONSTANTS.SECURE_FILE_SHARE_CONTRACT
                                .FILE_REGISTRY_SHARED_OBJECT_ID
                        ),
                        tx.object(fileId),
                    ],
                });

                const txBytes = await tx.build({
                    client: suiClient,
                    onlyTransactionKind: true,
                });

                // 更新进度到60%
                progressCallback?.(60);

                // 6. 获取解密密钥
                await sealClient.fetchKeys({
                    ids: [sealId],
                    txBytes,
                    sessionKey,
                    threshold: 2,
                });

                // 更新进度到75%
                progressCallback?.(75);

                // 7. 解密数据
                const decryptedData = await sealClient.decrypt({
                    data: encryptedData,
                    sessionKey,
                    txBytes,
                });

                // 将解密后的数据转换为ArrayBuffer
                fileData =
                    decryptedData instanceof Uint8Array
                        ? decryptedData
                        : new TextEncoder().encode(decryptedData);

                // 更新进度到90%
                progressCallback?.(90);

                toast.success(t("success"));
            } catch (error) {
                console.error(t("error"), error);
                toast.error(t("error"));
                return false;
            }
        } else {
            // 如果文件未加密，直接使用原始数据
            fileData = new Uint8Array(arrayBuffer);
            // 更新进度到75%（跳过加密步骤的进度）
            progressCallback?.(75);
        }

        // 创建Blob对象
        const blob = new Blob([fileData]);

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();

        // 清理
        URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // 完成下载，进度100%
        progressCallback?.(100);

        toast.success(t("downloadFile"));
        return true;
    } catch (error) {
        console.error(t("error"), error);
        toast.error(t("error"));
        return false;
    }
};
