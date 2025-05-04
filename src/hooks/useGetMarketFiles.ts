import { useGetMultipleFiles } from "./useGetMultipleFiles";
import { useGetFileRegistryParentId } from "./useGetFileRegistryParentId";
import { QueryKey } from "@/constants";

export function useGetMarketFiles() {
    const { marketFiles } = useGetFileRegistryParentId();

    console.log(">>>>>>>>>>>> ", marketFiles);

    const { data: files } = useGetMultipleFiles({
        fileIds: marketFiles as string[],
        queryKeyId: QueryKey.GetMarketFilesQueryKey,
    });

    console.log(JSON.stringify(files, null, 2));

    return {
        data: files || [],
        isLoading: false,
        error: null,
    };
}
