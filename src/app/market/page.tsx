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
import { motion } from "framer-motion";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    SearchIcon,
    ShareIcon,
    ShieldIcon,
    ShoppingCartIcon,
    PlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { FileDetail } from "@/types/move";
import Link from "next/link";
import { useGetMarketFiles } from "@/hooks/useGetMarketFiles";
import { useBuyFile } from "@/mutations/buy_file";
import React from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useAddPublicFile } from "@/mutations/add_public_file";
import { formatDate } from "@/lib/dateUtils";
import { formatFileSize, getFileType } from "@/lib/fileUtils";
import { useLanguage } from "@/providers/LanguageProvider";
import {
    FileIcon,
    FileTextIcon,
    VideoIcon,
    ImageIcon,
    FolderIcon,
} from "lucide-react";

// 获取访问类型的函数
const getAccessType = (
    isEncrypt: boolean,
    price: number,
    t: (key: string) => string
) => {
    if (!isEncrypt) return t("public");
    return price > 0 ? t("authorized") : t("private");
};

// 地址截断函数
const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 获取文件图标的函数
const getFileIcon = (type: string): React.ReactNode => {
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
    const { t } = useLanguage();

    const { data: marketFiles = [] } = useGetMarketFiles();
    const buyFile = useBuyFile();
    const addPublicFile = useAddPublicFile();
    const currentAccount = useCurrentAccount();

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
                    isCurrentUser: file.owner === currentAccount?.address,
                    price: file.price ? Number(file.price) / 1_000_000_000 : 0,
                    isPublicFree:
                        !file.is_encrypt &&
                        (!file.price || Number(file.price) === 0),
                    accessType: getAccessType(
                        file.is_encrypt,
                        file.price ? Number(file.price) : 0,
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
            isCurrentUser: boolean;
            price: number;
            isPublicFree: boolean;
            accessType: string;
        }[];
    };

    const preparedMarketFiles = prepareFileData(marketFiles);

    // 对市场文件进行排序
    const sortedMarketFiles = [...preparedMarketFiles].sort((a, b) => {
        const aValue = a[sortColumn as keyof typeof a];
        const bValue = b[sortColumn as keyof typeof b];

        if (typeof aValue === "string" && typeof bValue === "string") {
            return sortDirection === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        return 0;
    });

    const handleBuyFile = (fileId: string, isPublicFree: boolean) => {
        console.log(
            `${t("handling")} ${fileId}，${t("publicFree")}：${isPublicFree}`
        );

        if (isPublicFree) {
            addPublicFile.mutate(fileId, {
                onSuccess: () => {
                    toast.success(t("addPublicFileSuccess"));
                },
                onError: (error) => {
                    console.error(t("addPublicFileFailed"), error);
                    toast.error(t("addPublicFileFailedRetry"));
                },
            });
        } else {
            buyFile.mutate(fileId, {
                onSuccess: () => {
                    toast.success(t("buyFileSuccess"));
                },
                onError: (error) => {
                    console.error(t("buyFileFailed"), error);
                    toast.error(t("buyFileFailedRetry"));
                },
            });
        }
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
                            {t("fileMarket")}
                        </h1>

                        <div className="mb-6 flex items-center justify-between">
                            <div className="relative w-full sm:w-96">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("searchMarketFiles")}
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {sortedMarketFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-lg">
                                <ShareIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">
                                    {t("noMarketFiles")}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {t("noMarketFilesDesc")}
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
                                                {sortColumn === "name" && (
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
                                                {sortColumn === "type" && (
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
                                                {sortColumn === "size" && (
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
                                                    handleSort("ownerAddress")
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
                                                    handleSort("accessType")
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
                                                    handleSort("price")
                                                }
                                                className="cursor-pointer"
                                            >
                                                {t("price")}(SUI)
                                                {sortColumn === "price" && (
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
                                                    handleSort("lastModified")
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
                                        {sortedMarketFiles.map((file) => (
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
                                                        className={`cursor-pointer hover:text-primary ${
                                                            file.isCurrentUser
                                                                ? "bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md"
                                                                : ""
                                                        }`}
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
                                                        {file.isCurrentUser
                                                            ? t("me")
                                                            : file.ownerAddress
                                                            ? truncateAddress(
                                                                  file.ownerAddress
                                                              )
                                                            : t("unknownUser")}
                                                    </span>
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
                                                        {file.accessType}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="align-middle">
                                                    {file.isPublicFree ? (
                                                        <span className="text-gray-500">
                                                            -
                                                        </span>
                                                    ) : (
                                                        `${file.price.toFixed(
                                                            2
                                                        )} SUI`
                                                    )}
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
                                                                handleBuyFile(
                                                                    file.id,
                                                                    file.isPublicFree
                                                                )
                                                            }
                                                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                            title={
                                                                file.isPublicFree
                                                                    ? t(
                                                                          "addPublicFile"
                                                                      )
                                                                    : t(
                                                                          "buyFile"
                                                                      )
                                                            }
                                                        >
                                                            {file.isPublicFree ? (
                                                                <PlusIcon className="h-4 w-4" />
                                                            ) : (
                                                                <ShoppingCartIcon className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
