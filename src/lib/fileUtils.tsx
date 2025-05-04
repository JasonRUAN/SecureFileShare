import React from "react";
import {
    FileIcon,
    FileTextIcon,
    FolderIcon,
    ImageIcon,
    VideoIcon,
} from "lucide-react";

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 根据文件类型返回对应的图标组件
export const getFileIcon = (type: string): React.ReactNode => {
    switch (type.toLowerCase()) {
        case "document":
        case "pdf":
        case "application/pdf":
        case "text/plain":
        case "spreadsheet":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        case "application/vnd.ms-excel":
            return <FileTextIcon className="h-4 w-4" />;
        case "video":
        case "video/mp4":
        case "video/quicktime":
        case "video/x-msvideo":
            return <VideoIcon className="h-4 w-4" />;
        case "image":
        case "image/jpeg":
        case "image/png":
        case "image/gif":
        case "image/svg+xml":
            return <ImageIcon className="h-4 w-4" />;
        case "folder":
            return <FolderIcon className="h-4 w-4" />;
        default:
            return <FileIcon className="h-4 w-4" />;
    }
};

// 获取文件类型的函数
export const getFileType = (fileName: string, fileType: string): string => {
    if (fileType && fileType !== "") {
        return fileType;
    }

    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    switch (extension) {
        case "pdf":
            return "pdf";
        case "doc":
        case "docx":
            return "document";
        case "xls":
        case "xlsx":
            return "spreadsheet";
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "webp":
            return "image";
        case "mp4":
        case "mov":
        case "avi":
            return "video";
        default:
            return "other";
    }
};
