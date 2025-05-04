import { CLOCK_OBJECT_ID } from "@/constants";
import { useMutation } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { CONSTANTS } from "../constants";
import { bcs } from "@mysten/sui/bcs";
import { useTransactionExecution } from "@/hooks/useTransactionExecution";
import type { FileInfo } from "@/types";

export function useCreateFiles() {
    const account = useCurrentAccount();
    const executeTransaction = useTransactionExecution();

    return useMutation({
        mutationFn: async (infos: FileInfo[]) => {
            if (!account?.address) {
                throw new Error("You need to connect your wallet first pls!");
            }

            const tx = new Transaction();

            for (const info of infos) {
                tx.moveCall({
                    target: CONSTANTS.SECURE_FILE_SHARE_CONTRACT
                        .TARGET_CREATE_FILE,
                    arguments: [
                        tx.object(
                            CONSTANTS.SECURE_FILE_SHARE_CONTRACT
                                .FILE_REGISTRY_SHARED_OBJECT_ID
                        ),
                        tx.pure.string(info.name),
                        tx.pure.string(info.description),
                        tx.pure.string(info.file_blob_id),
                        tx.pure.string(info.file_type),
                        tx.pure.u64(info.file_size),
                        tx.pure.u64(info.price),
                        tx.pure.bool(info.is_encrypt),
                        tx.pure(
                            bcs
                                .vector(bcs.Address)
                                .serialize(info.grantee_addresses)
                        ),
                        tx.object(CLOCK_OBJECT_ID),
                    ],
                });
            }

            return executeTransaction(tx);
        },
        onError: (error) => {
            console.error("Failed to create File:", error);
            throw error;
        },
        onSuccess: (data) => {
            console.log("Successfully created File:", data);
        },
    });
}
