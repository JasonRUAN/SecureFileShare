import { CONSTANTS } from "@/constants";
import { useGetObject } from "./useGetObject";
import type { FileRegistry } from "@/types/move";
import type { SuiParsedData } from "@mysten/sui/client";

export function useGetFileRegistryParentId() {
    const objectsData = useGetObject({
        objectId:
            CONSTANTS.SECURE_FILE_SHARE_CONTRACT.FILE_REGISTRY_SHARED_OBJECT_ID,
    });

    const parsedFileRegistry = objectsData?.data?.content as
        | SuiParsedData
        | undefined;
    const fileRegistry =
        parsedFileRegistry && "fields" in parsedFileRegistry
            ? (parsedFileRegistry.fields as FileRegistry)
            : undefined;

    const ownerFilesParentId = fileRegistry?.files_by_owner?.fields?.id?.id;
    const sharedToMeFilesParentId =
        fileRegistry?.shared_to_me_files?.fields?.id?.id;
    const marketFiles = fileRegistry?.market_files;

    return {
        ownerFilesParentId,
        sharedToMeFilesParentId,
        marketFiles,
    };
}
