import { useCurrentAccount } from "@mysten/dapp-kit";
import { useGetDynamicFieldObject } from "./useGetDynamicFieldObject";
import { useGetMultipleFiles } from "./useGetMultipleFiles";
import { useGetFileRegistryParentId } from "./useGetFileRegistryParentId";
import { QueryKey } from "@/constants";

export function useGetSharedToMeFiles() {
    const account = useCurrentAccount();

    const { sharedToMeFilesParentId } = useGetFileRegistryParentId();

    // console.log(">>>>>>>>>>>> ", sharedToMeFilesParentId);

    const { data: sharedToMeFileIds } = useGetDynamicFieldObject({
        parentId: sharedToMeFilesParentId || "",
        fieldType: "address",
        fieldValue: account?.address || "",
    });

    // console.log(">>>>>>>>>>>> ", ownerFileIds);

    const { data: files } = useGetMultipleFiles({
        fileIds: sharedToMeFileIds as string[],
        queryKeyId: QueryKey.GetSharedToMeFilesQueryKey,
    });

    // console.log(JSON.stringify(files, null, 2));

    return {
        data: files || [],
        isLoading: false,
        error: null,
    };
}
