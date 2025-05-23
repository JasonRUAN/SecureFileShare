import { useSuiClientQuery } from "@mysten/dapp-kit";
import { toast } from "sonner";

export function useGetObject({ objectId }: { objectId: string }) {
    const { data, isPending, error } = useSuiClientQuery(
        "getObject",
        {
            id: objectId,
            options: {
                showType: true,
                showOwner: true,
                showContent: true,
            },
        },
        {
            enabled: !!objectId,
        }
    );

    if (error) {
        toast.error(`get user object failed: ${error.message}`);
        return;
    }

    if (isPending || !data) {
        // toast.error("loading data...");
        return;
    }

    return data;
}
