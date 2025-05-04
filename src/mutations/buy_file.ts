import { useMutation } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { CONSTANTS } from "../constants";
import { useTransactionExecution } from "@/hooks/useTransactionExecution";

export function useBuyFile() {
    const account = useCurrentAccount();
    const executeTransaction = useTransactionExecution();

    return useMutation({
        mutationFn: async (fileId: string) => {
            if (!account?.address) {
                throw new Error("You need to connect your wallet first pls!");
            }

            const tx = new Transaction();

            tx.moveCall({
                package: CONSTANTS.SECURE_FILE_SHARE_CONTRACT.PACKAGE_ID,
                module: "secure_file_share",
                function: "buy_file",
                arguments: [
                    tx.object(
                        CONSTANTS.SECURE_FILE_SHARE_CONTRACT
                            .FILE_REGISTRY_SHARED_OBJECT_ID
                    ),
                    tx.object(fileId),
                    tx.gas,
                ],
            });

            return executeTransaction(tx);
        },
        onError: (error) => {
            console.error("Failed to buy file:", error);
            throw error;
        },
        onSuccess: (data) => {
            console.log("Successfully bought file:", data);
        },
    });
}
