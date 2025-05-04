export interface FileInfo {
    name: string;
    description: string;
    file_blob_id: string;
    file_type: string;
    file_size: number;
    price: number; // unit: MIST, 1 MIST = 10^-9 SUI. 为0表示不支持购买，仅支持文件所有者授权分享
    is_encrypt: boolean; // 若为true，则文件有加密
    grantee_addresses: string[];
}
