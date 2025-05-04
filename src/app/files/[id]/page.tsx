"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    ArrowLeftIcon,
    CalendarIcon,
    ClipboardIcon,
    DownloadIcon,
    ShareIcon,
    ShieldIcon,
    TrashIcon,
    UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useGetFile } from "@/hooks/useGetFile";
import { formatDate } from "@/lib/dateUtils";
import { formatFileSize, getFileIcon, getFileType } from "@/lib/fileUtils";
import { ShareDialog } from "@/components/share-dialog";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/constants";
import { useSuiClient } from "@mysten/dapp-kit";
import { useLanguage } from "@/providers/LanguageProvider";
import { downloadAndDecryptFile } from "@/lib/fileDownloader";

export default function FileDetailPage() {
    const params = useParams();
    const fileId = params.id as string;
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const queryClient = useQueryClient();
    const suiClient = useSuiClient();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const { t } = useLanguage();

    const { data: file } = useGetFile({
        fileId,
    });

    const [sharedWithList, setSharedWithList] = useState<string[]>([]);

    // 使用useEffect监听file变化，更新sharedWithList
    useEffect(() => {
        if (file?.access_list) {
            setSharedWithList(file.access_list);
        }
    }, [file]);

    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const currentAccount = useCurrentAccount();

    if (!file) {
        return <div>{t("fileNotFound")}</div>;
    }

    console.log(JSON.stringify(file, null, 2));

    // 检查当前用户是否是文件所有者
    const isOwner = currentAccount?.address === file.owner;

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadProgress(0);

        const interval = setInterval(() => {
            setDownloadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
        }, 150);

        try {
            // 使用封装的函数处理文件下载和解密
            const success = await downloadAndDecryptFile(
                file,
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
                clearInterval(interval);
                setIsDownloading(false);
            } else {
                // 完成下载
                setIsDownloading(false);
                clearInterval(interval);
            }
        } catch (error) {
            console.error(t("error"), error);
            setIsDownloading(false);
            clearInterval(interval);
            toast.error(t("error"));
        }
    };

    const handleRemoveShare = (userAddress: string) => {
        setSharedWithList(
            sharedWithList.filter((user) => user !== userAddress)
        );
        toast.success(t("success"));
    };

    const formatShortAddress = (address: string) => {
        return `${address.substring(0, 6)}...${address.substring(
            address.length - 4
        )}`;
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container mx-auto py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-8 flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="mr-4"
                        >
                            <Link href="/files">
                                <ArrowLeftIcon className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {file.name}
                        </h1>
                        {file.is_encrypt && (
                            <ShieldIcon className="ml-3 h-5 w-5 text-green-500" />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("file")}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6 border rounded-lg p-6">
                                        <div className="flex-shrink-0 bg-muted/50 rounded-lg p-4 flex items-center justify-center">
                                            <div className="w-16 h-16 flex items-center justify-center text-primary">
                                                {getFileIcon(
                                                    getFileType(
                                                        file.name,
                                                        file.file_type
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {t("fileName")}
                                                </p>
                                                <p className="font-medium">
                                                    {file.name}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {t("fileSize")}
                                                </p>
                                                <p className="font-medium">
                                                    {formatFileSize(
                                                        file.file_size
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {t("uploadDate")}
                                                </p>
                                                <p className="font-medium flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {formatDate(
                                                        new Date(
                                                            Number(
                                                                file.created_at
                                                            )
                                                        )
                                                    )}
                                                </p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <p className="text-sm text-muted-foreground">
                                                    {t("file")} BlobId
                                                </p>
                                                <div className="font-mono text-xs border p-2 rounded flex items-center justify-between">
                                                    <span className="truncate">
                                                        {file?.file_blob_id}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 flex-shrink-0"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(
                                                                file?.file_blob_id ||
                                                                    ""
                                                            );
                                                            toast.success(
                                                                t(
                                                                    "blobIdCopied"
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        <ClipboardIcon className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 mt-2">
                                                <p className="text-sm text-muted-foreground">
                                                    {t("fileDescription")}
                                                </p>
                                                <div className="text-sm p-2 rounded border">
                                                    {file?.description ||
                                                        t("noSharedFilesDesc")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-6">
                                        <div className="space-x-2">
                                            <Button
                                                onClick={handleDownload}
                                                disabled={isDownloading}
                                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                            >
                                                {isDownloading ? (
                                                    <>
                                                        {t("loading")}{" "}
                                                        {downloadProgress}%
                                                        <Progress
                                                            value={
                                                                downloadProgress
                                                            }
                                                            className="h-1 w-16 ml-2"
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <DownloadIcon className="mr-2 h-4 w-4" />
                                                        {t("downloadFile")}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex justify-between">
                                        <span>{t("sharedAddresses")}</span>
                                        {isOwner && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setShareDialogOpen(true)
                                                }
                                            >
                                                <ShareIcon className="mr-2 h-4 w-4" />
                                                {t("shareFile")}
                                            </Button>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("SharedFilesManage")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {sharedWithList.map((userAddress) => (
                                            <div
                                                key={userAddress}
                                                className="flex items-center gap-3 p-3 rounded-lg border"
                                            >
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage
                                                        src="/avatar-placeholder.png"
                                                        alt={t("owner")}
                                                    />
                                                    <AvatarFallback>
                                                        {userAddress.substring(
                                                            userAddress.length -
                                                                4
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-grow">
                                                    <p className="text-sm text-muted-foreground">
                                                        <span
                                                            className="cursor-pointer hover:text-primary hover:underline"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(
                                                                    userAddress
                                                                );
                                                                toast.success(
                                                                    t(
                                                                        "addressCopied"
                                                                    )
                                                                );
                                                            }}
                                                        >
                                                            {formatShortAddress(
                                                                userAddress
                                                            )}
                                                        </span>
                                                    </p>
                                                </div>
                                                {isOwner && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleRemoveShare(
                                                                userAddress
                                                            )
                                                        }
                                                    >
                                                        <TrashIcon className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                        {sharedWithList.length === 0 && (
                                            <div className="text-center py-6 text-muted-foreground">
                                                <UserRoundIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>{t("noSharedFiles")}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t("secureEncryption")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                {t("endToEndEncryption")}
                                            </p>
                                            {/* <div
                                                className={`px-2 py-1 rounded-full text-xs ${
                                                    file.is_encrypt
                                                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                                                        : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
                                                }`}
                                            >
                                                {file.is_encrypt
                                                    ? t("private")
                                                    : t("public")}
                                            </div> */}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {file.is_encrypt
                                                ? t("endToEndEncryptionDesc")
                                                : t("endToEndEncryptionDesc")}
                                        </p>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">
                                            {t("decentralizedStorageTitle")}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                            <p className="text-sm">
                                                {t("decentralizedStorageDesc")}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">
                                            {t("smartAccessControl")}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                            <p className="text-sm">
                                                {sharedWithList.length > 0
                                                    ? `${t("alreadyShared")} ${
                                                          sharedWithList.length
                                                      } ${t("users")}`
                                                    : t("onlyMe")}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </motion.div>
            </main>
            <Footer />
            {isOwner && (
                <ShareDialog
                    open={shareDialogOpen}
                    onOpenChange={(open) => {
                        setShareDialogOpen(open);
                        // 当关闭Dialog后刷新文件数据
                        if (!open) {
                            // 刷新文件详情数据
                            queryClient.invalidateQueries({
                                queryKey: [QueryKey.GetFileQueryKey, fileId],
                            });
                        }
                    }}
                    fileId={fileId}
                    fileName={file.name}
                />
            )}
        </div>
    );
}
