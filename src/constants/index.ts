import secureFileShareContract from "../../secure-file-share-contract.json";

export enum QueryKey {
    GetFileQueryKey = "GetFileQueryKey",
    GetMultipleFilesQueryKey = "GetMultipleFilesQueryKey",
    GetMyFilesQueryKey = "GetMyFilesQueryKey",
    GetSharedToMeFilesQueryKey = "GetSharedToMeFilesQueryKey",
    GetMarketFilesQueryKey = "GetMarketFilesQueryKey",
}

export const CLOCK_OBJECT_ID = "0x6";
export const SUI_COIN_TYPE = "0x2::sui::SUI";

export const CONSTANTS = {
    SECURE_FILE_SHARE_CONTRACT: {
        TARGET_CREATE_FILE: `${secureFileShareContract.packageId}::secure_file_share::create_file`,
        PACKAGE_ID: secureFileShareContract.packageId,
        FILE_REGISTRY_SHARED_OBJECT_ID:
            secureFileShareContract.fileRegistrySharedObjectId,
    },
    WALRUS: {
        PUBLISHER_URL: "https://publisher.walrus-testnet.walrus.space",
        // PUBLISHER_URL: "https://publisher.testnet.walrus.atalma.io",
        // PUBLISHER_URL: "https://publisher.walrus-01.tududes.com",
        AGGREGATOR_URL: "https://aggregator.walrus-testnet.walrus.space",
        // AGGREGATOR_URL: "https://aggregator.testnet.walrus.atalma.io",
    },
    BACKEND_URL: "http://localhost:5050",
};
