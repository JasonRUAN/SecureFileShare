import { useCurrentAccount } from "@mysten/dapp-kit";
import { useGetDynamicFieldObject } from "./useGetDynamicFieldObject";
import { useGetMultipleFiles } from "./useGetMultipleFiles";
import { useGetFileRegistryParentId } from "./useGetFileRegistryParentId";
import { QueryKey } from "@/constants";

export function useGetMyFiles() {
    const account = useCurrentAccount();

    const { ownerFilesParentId } = useGetFileRegistryParentId();

    // console.log(">>>>>>>>>>>> ", ownerFilesParentId);

    const { data: ownerFileIds } = useGetDynamicFieldObject({
        parentId: ownerFilesParentId || "",
        fieldType: "address",
        fieldValue: account?.address || "",
    });

    // console.log(">>>>>>>>>>>> ", ownerFileIds);

    const { data: files } = useGetMultipleFiles({
        fileIds: ownerFileIds as string[],
        queryKeyId: QueryKey.GetMyFilesQueryKey,
    });

    // console.log(JSON.stringify(files, null, 2));

    return {
        data: files || [],
        isLoading: false,
        error: null,
    };
}
