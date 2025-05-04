import { useMutation } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { CONSTANTS } from "../constants";
import { bcs } from "@mysten/sui/bcs";
import { useTransactionExecution } from "@/hooks/useTransactionExecution";

export function useGrantAccess() {
    const account = useCurrentAccount();
    const executeTransaction = useTransactionExecution();

    return useMutation({
        mutationFn: async ({
            fileId,
            granteeAddresses,
        }: {
            fileId: string;
            granteeAddresses: string[];
        }) => {
            if (!account?.address) {
                throw new Error("You need to connect your wallet first pls!");
            }

            const tx = new Transaction();

            tx.moveCall({
                target: `${CONSTANTS.SECURE_FILE_SHARE_CONTRACT.PACKAGE_ID}::secure_file_share::grant_access`,
                arguments: [
                    tx.object(
                        CONSTANTS.SECURE_FILE_SHARE_CONTRACT
                            .FILE_REGISTRY_SHARED_OBJECT_ID
                    ),
                    tx.object(fileId),
                    tx.pure(
                        bcs.vector(bcs.Address).serialize(granteeAddresses)
                    ),
                ],
            });

            return executeTransaction(tx);
        },
        onError: (error) => {
            console.error("授权访问文件失败:", error);
            throw error;
        },
        onSuccess: (data) => {
            console.log("成功授权访问文件:", data);
        },
    });
}
