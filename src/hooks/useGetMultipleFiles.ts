import { QueryKey } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import type { SuiClient } from "@mysten/sui/client";
import type { FileDetail } from "@/types/move";

export function useGetMultipleFiles({
    fileIds,
    queryKeyId,
}: {
    fileIds: string[];
    queryKeyId?: QueryKey;
}) {
    const client = useSuiClient();

    return useQuery({
        queryKey: [queryKeyId || QueryKey.GetMultipleFilesQueryKey, fileIds],
        queryFn: async () => {
            const promises = fileIds.map((fileId) => {
                return fetchOneFile({
                    client,
                    fileId,
                });
            });
            return Promise.all(promises);
        },
        enabled: !!fileIds && fileIds.length > 0,
        select: (data) => {
            return data.map((file) => {
                if (file.data?.content && "fields" in file.data.content) {
                    return file.data.content.fields as FileDetail;
                }
                return null;
            });
        },
    });
}

async function fetchOneFile({
    client,
    fileId,
}: {
    client: SuiClient;
    fileId: string;
}) {
    return await client.getObject({
        id: fileId,
        options: {
            showContent: true,
        },
    });

    // file:  {
    //     "data": {
    //       "objectId": "0x24bab33b012f31ca42d2fe530d540250a4793d89126d29e518aec89a8dc9ac0b",
    //       "version": "406695600",
    //       "digest": "DixdQXfUJrUYzGQFHcjCJ7zPJJvVVwjBMYJTRA64geVi",
    //       "content": {
    //         "dataType": "moveObject",
    //         "type": "0xa714b7196735cd3231852547e50bf27ec4b880178fc77fa398902f5e1160208f::secure_file_share::File",
    //         "hasPublicTransfer": true,
    //         "fields": {
    //           "access_list": [],
    //           "balance": "0",
    //           "created_at": "1745909230245",
    //           "description": "",
    //           "file_blob_id": "Nd2SWb4RUzlTAuaFLcjo2DFbVlcGEkmpBkEB2E6Bwvs",
    //           "id": {
    //             "id": "0x24bab33b012f31ca42d2fe530d540250a4793d89126d29e518aec89a8dc9ac0b"
    //           },
    //           "is_encrypt": true,
    //           "name": "proof-0x63c997987b6640a0b03bb6f3bb763627d79aa2106d28e3069aa05d9797c0b5cb.jpg",
    //           "owner": "0xfbe1d8ae7a6ca3f94d670c57307376619696feb9b43069e55e53ae088b98ef8c",
    //           "price": "0"
    //         }
    //       }
    //     }
    //   }
}
