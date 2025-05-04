"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    DownloadIcon,
    EyeIcon,
    FileIcon,
    FolderIcon,
    SearchIcon,
    ShareIcon,
    ShieldIcon,
    TrashIcon,
    FileTextIcon,
    VideoIcon,
    ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useGetMyFiles } from "@/hooks/useGetMyFiles";
import type { FileDetail } from "@/types/move";
import Link from "next/link";
import { useGetSharedToMeFiles } from "@/hooks/useGetSharedToMeFiles";
import React from "react";
import { ShareDialog } from "@/components/share-dialog";
import { formatDate } from "@/lib/dateUtils";
import { formatFileSize, getFileType } from "@/lib/fileUtils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { useSuiClient } from "@mysten/dapp-kit";
import { downloadAndDecryptFile } from "@/lib/fileDownloader";
import { Progress } from "@/components/ui/progress";

// 获取访问类型的函数
const getAccessType = (
    isEncrypt: boolean,
    price: number,
    access_list: string[],
    t: (key: string) => string
) => {
    if (!isEncrypt) return t("public");
    else if (price > 0 || access_list.length > 0) return t("authorized");
    else return t("private");
};

// 地址截断函数
const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 获取文件图标的函数
const getFileIcon = (type: string) => {
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

export default function FilesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortColumn, setSortColumn] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
        null
    );
    const [downloadProgress, setDownloadProgress] = useState(0);

    const { data: myFiles = [] } = useGetMyFiles();
    const { data: sharedToMeFiles = [] } = useGetSharedToMeFiles();
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

    const { t } = useLanguage();

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    // 过滤并准备文件数据
    const prepareFileData = (files: (FileDetail | null)[]) => {
        return files
            .filter((file) => file !== null)
            .filter(
                (file) =>
                    file &&
                    file.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((file) => {
                if (!file) return null;
                const fileType = getFileType(file.name, file.file_type);
                return {
                    id: file.id.id,
                    name: file.name,
                    type: fileType,
                    size: formatFileSize(file.file_size),
                    lastModified: formatDate(new Date(Number(file.created_at))),
                    shared: file.access_list.length > 0,
                    encrypted: file.is_encrypt,
                    icon: getFileIcon(fileType),
                    ownerAddress: file.owner,
                    price: file.price ? Number(file.price) / 1_000_000_000 : 0,
                    accessType: getAccessType(
                        file.is_encrypt,
                        file.price ? Number(file.price) : 0,
                        file.access_list,
                        t
                    ),
                };
            })
            .filter((file) => file !== null) as {
            id: string;
            name: string;
            type: string;
            size: string;
            lastModified: string;
            shared: boolean;
            encrypted: boolean;
            icon: React.ReactNode;
            ownerAddress?: string;
            price: number;
            accessType: string;
        }[];
    };

    const preparedFiles = prepareFileData(myFiles);
    const preparedSharedFiles = prepareFileData(sharedToMeFiles);

    const sortedFiles = [...preparedFiles].sort((a, b) => {
        const aValue = a[sortColumn as keyof typeof a];
        const bValue = b[sortColumn as keyof typeof b];

        if (typeof aValue === "string" && typeof bValue === "string") {
            return sortDirection === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        return 0;
    });

    // 对共享给我的文件进行排序
    const sortedSharedFiles = [...preparedSharedFiles].sort((a, b) => {
        const aValue = a[sortColumn as keyof typeof a];
        const bValue = b[sortColumn as keyof typeof b];

        if (typeof aValue === "string" && typeof bValue === "string") {
            return sortDirection === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        return 0;
    });

    const handleDownload = async (fileId: string) => {
        try {
            setIsDownloading(true);
            setDownloadingFileId(fileId);
            setDownloadProgress(0);

            // 从现有文件列表中找到文件
            const file = [...myFiles, ...sharedToMeFiles]
                .filter((f) => f !== null)
                .find((f) => f?.id.id === fileId);

            if (!file) {
                toast.error(t("fileNotFound"));
                setIsDownloading(false);
                setDownloadingFileId(null);
                return;
            }

            // 使用封装的函数下载文件
            const success = await downloadAndDecryptFile(
                {
                    file_blob_id: file.file_blob_id,
                    name: file.name,
                    is_encrypt: file.is_encrypt,
                    owner: file.owner,
                },
                currentAccount,
                suiClient,
                signPersonalMessage,
                fileId,
                t,
                (progress) => {
                    setDownloadProgress(progress);
                }
            );

            if (!success) {
                toast.error(t("downloadFailed"));
            }

            // 重置状态
            setIsDownloading(false);
            setDownloadingFileId(null);
        } catch (error) {
            console.error(t("error"), error);
            toast.error(t("error"));
            setIsDownloading(false);
            setDownloadingFileId(null);
        }
    };

    const handleShare = (fileId: string, fileName: string) => {
        setSelectedFile({ id: fileId, name: fileName });
        setShareDialogOpen(true);
    };

    const handleDelete = (fileId: string) => {
        console.log(`${t("deleteFile")}: ${fileId}`);
        toast.success(t("deleteFile"));
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container mx-auto py-8">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl font-bold tracking-tight mb-6">
                            {t("fileManagement")}
                        </h1>

                        <Tabs defaultValue="my-files" className="mb-8">
                            <TabsList className="mb-4">
                                <TabsTrigger value="my-files" className="gap-2">
                                    <FolderIcon className="h-4 w-4" />
                                    {t("myFiles")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="shared-with-me"
                                    className="gap-2"
                                >
                                    <ShareIcon className="h-4 w-4" />
                                    {t("sharedWithMe")}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="my-files">
                                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="relative w-full sm:w-96">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t("searchFiles")}
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {sortedFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-lg">
                                        <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">
                                            {t("noFiles")}
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            {t("noFilesDesc")}
                                        </p>
                                        <Button asChild>
                                            <Link href="/upload">
                                                {t("upload")}
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort("name")
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("fileName")}
                                                        {sortColumn ===
                                                            "name" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort("type")
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("fileType")}
                                                        {sortColumn ===
                                                            "type" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort("size")
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("fileSize")}
                                                        {sortColumn ===
                                                            "size" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort(
                                                                "accessType"
                                                            )
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("accessType")}
                                                        {sortColumn ===
                                                            "accessType" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort(
                                                                "lastModified"
                                                            )
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("uploadDate")}
                                                        {sortColumn ===
                                                            "lastModified" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead>
                                                        {t("operations")}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sortedFiles.map((file) => (
                                                    <TableRow
                                                        key={file.id}
                                                        className="h-14"
                                                    >
                                                        <TableCell className="h-14 flex items-center justify-start gap-2 font-medium align-middle">
                                                            <div className="flex items-center h-full">
                                                                <span className="flex items-center justify-center">
                                                                    {file.icon}
                                                                </span>
                                                                <Link
                                                                    href={`/files/${file.id}`}
                                                                    className="hover:underline ml-2 flex items-center"
                                                                >
                                                                    {file.name}
                                                                </Link>
                                                                {file.encrypted && (
                                                                    <span className="flex items-center justify-center ml-2">
                                                                        <ShieldIcon className="h-4 w-4 text-green-500" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-middle">
                                                            {file.type}
                                                        </TableCell>
                                                        <TableCell className="align-middle">
                                                            {file.size}
                                                        </TableCell>
                                                        <TableCell className="align-middle">
                                                            <span
                                                                className={`px-2 py-1 text-xs rounded-full ${
                                                                    file.accessType ===
                                                                    t("private")
                                                                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                                        : file.accessType ===
                                                                          t(
                                                                              "authorized"
                                                                          )
                                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                }`}
                                                            >
                                                                {
                                                                    file.accessType
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="align-middle">
                                                            {file.lastModified}
                                                        </TableCell>
                                                        <TableCell className="align-middle">
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleDownload(
                                                                            file.id
                                                                        )
                                                                    }
                                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                    disabled={
                                                                        isDownloading &&
                                                                        downloadingFileId ===
                                                                            file.id
                                                                    }
                                                                >
                                                                    {isDownloading &&
                                                                    downloadingFileId ===
                                                                        file.id ? (
                                                                        <div className="flex items-center justify-center">
                                                                            <Progress
                                                                                value={
                                                                                    downloadProgress
                                                                                }
                                                                                className="h-1 w-12"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <DownloadIcon className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleShare(
                                                                            file.id,
                                                                            file.name
                                                                        )
                                                                    }
                                                                    className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                                                >
                                                                    <ShareIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    asChild
                                                                    className="text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                                                                >
                                                                    <Link
                                                                        href={`/files/${file.id}`}
                                                                    >
                                                                        <EyeIcon className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            file.id
                                                                        )
                                                                    }
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="shared-with-me">
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="relative w-full sm:w-96">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t("searchSharedFiles")}
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {sortedSharedFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-lg">
                                        <ShareIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">
                                            {t("noSharedFiles")}
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            {t("noSharedFilesDesc")}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort("name")
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("fileName")}
                                                        {sortColumn ===
                                                            "name" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort("type")
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("fileType")}
                                                        {sortColumn ===
                                                            "type" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort("size")
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("fileSize")}
                                                        {sortColumn ===
                                                            "size" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort(
                                                                "accessType"
                                                            )
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("accessType")}
                                                        {sortColumn ===
                                                            "accessType" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort(
                                                                "ownerAddress"
                                                            )
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("owner")}
                                                        {sortColumn ===
                                                            "ownerAddress" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead
                                                        onClick={() =>
                                                            handleSort(
                                                                "lastModified"
                                                            )
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        {t("sharedDate")}
                                                        {sortColumn ===
                                                            "lastModified" && (
                                                            <span className="ml-2 inline-block">
                                                                {sortDirection ===
                                                                "asc" ? (
                                                                    <ArrowUpIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="h-3 w-3" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                    <TableHead>
                                                        {t("operations")}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sortedSharedFiles.map(
                                                    (file) => (
                                                        <TableRow
                                                            key={file.id}
                                                            className="h-14"
                                                        >
                                                            <TableCell className="h-14 flex items-center justify-start gap-2 font-medium align-middle">
                                                                <div className="flex items-center h-full">
                                                                    <span className="flex items-center justify-center">
                                                                        {
                                                                            file.icon
                                                                        }
                                                                    </span>
                                                                    <Link
                                                                        href={`/files/${file.id}`}
                                                                        className="hover:underline ml-2 flex items-center"
                                                                    >
                                                                        {
                                                                            file.name
                                                                        }
                                                                    </Link>
                                                                    {file.encrypted && (
                                                                        <span className="flex items-center justify-center ml-2">
                                                                            <ShieldIcon className="h-4 w-4 text-green-500" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="align-middle">
                                                                {file.type}
                                                            </TableCell>
                                                            <TableCell className="align-middle">
                                                                {file.size}
                                                            </TableCell>
                                                            <TableCell className="align-middle">
                                                                <span
                                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                                        file.accessType ===
                                                                        t(
                                                                            "private"
                                                                        )
                                                                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                                            : file.accessType ===
                                                                              t(
                                                                                  "authorized"
                                                                              )
                                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                    }`}
                                                                >
                                                                    {
                                                                        file.accessType
                                                                    }
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="align-middle">
                                                                <span
                                                                    className="cursor-pointer hover:text-primary"
                                                                    onClick={() => {
                                                                        if (
                                                                            file.ownerAddress
                                                                        ) {
                                                                            navigator.clipboard.writeText(
                                                                                file.ownerAddress
                                                                            );
                                                                            toast.success(
                                                                                t(
                                                                                    "addressCopied"
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                    title={
                                                                        file.ownerAddress ||
                                                                        ""
                                                                    }
                                                                >
                                                                    {file.ownerAddress
                                                                        ? truncateAddress(
                                                                              file.ownerAddress
                                                                          )
                                                                        : "未知用户"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="align-middle">
                                                                {
                                                                    file.lastModified
                                                                }
                                                            </TableCell>
                                                            <TableCell className="align-middle">
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            handleDownload(
                                                                                file.id
                                                                            )
                                                                        }
                                                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                        disabled={
                                                                            isDownloading &&
                                                                            downloadingFileId ===
                                                                                file.id
                                                                        }
                                                                    >
                                                                        {isDownloading &&
                                                                        downloadingFileId ===
                                                                            file.id ? (
                                                                            <div className="flex items-center justify-center">
                                                                                <Progress
                                                                                    value={
                                                                                        downloadProgress
                                                                                    }
                                                                                    className="h-1 w-12"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <DownloadIcon className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        asChild
                                                                        className="text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                                                                    >
                                                                        <Link
                                                                            href={`/files/${file.id}`}
                                                                        >
                                                                            <EyeIcon className="h-4 w-4" />
                                                                        </Link>
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>
            </main>
            <Footer />

            {selectedFile && (
                <ShareDialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                    fileId={selectedFile.id}
                    fileName={selectedFile.name}
                />
            )}
        </div>
    );
}
