import { FileDetail } from "@/types/move";
import { useGetObject } from "./useGetObject";

export function useGetFile({ fileId }: { fileId: string }) {
    const fileObj = useGetObject({
        objectId: fileId,
    });

    // console.log(JSON.stringify(file, null, 2));

    if (!fileObj) {
        return {
            data: null,
            isLoading: false,
            error: "File not found",
        };
    }

    let file: FileDetail | null = null;

    if (fileObj.data?.content && "fields" in fileObj.data.content) {
        file = fileObj.data.content.fields as FileDetail;
    }

    return {
        data: file || null,
        isLoading: !file,
        error: null,
    };
}
