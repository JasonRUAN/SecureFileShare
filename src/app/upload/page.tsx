"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowUpIcon,
    LockIcon,
    ShieldIcon,
    UserRoundIcon,
    XIcon,
    PlusIcon,
    UsersRound,
    Coins,
    CheckIcon,
    PencilIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { sealEncryptBytes } from "@/lib/sealClient";
import { useCreateFiles } from "@/mutations/create_files";
import { FileInfo } from "@/types";
import { storeBlob } from "@/lib/walrusClient";
import { useLanguage } from "@/providers/LanguageProvider";

// 地址截断函数
const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function UploadPage() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [fileMetadata, setFileMetadata] = useState<{
        [key: string]: {
            name: string;
            description: string;
            isEditing: boolean;
            isEditingDescription: boolean;
        };
    }>({});
    const [isDragging, setIsDragging] = useState(false);
    const [accessType, setAccessType] = useState("private");
    const [recipients, setRecipients] = useState<string[]>([]);
    const [newRecipient, setNewRecipient] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isPurchasable, setIsPurchasable] = useState(false);
    const [purchaseAmount, setPurchaseAmount] = useState("");
    const [needSpecifyAddress, setNeedSpecifyAddress] = useState(false);
    const { t } = useLanguage();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const createFiles = useCreateFiles();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const fileArray = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...fileArray]);
            // 为每个新文件初始化元数据
            for (const file of fileArray) {
                setFileMetadata((prev) => ({
                    ...prev,
                    [file.name]: {
                        name: file.name,
                        description: "",
                        isEditing: false,
                        isEditingDescription: false,
                    },
                }));
            }
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const fileArray = Array.from(e.dataTransfer.files);
            setFiles((prev) => [...prev, ...fileArray]);
            // 为每个新文件初始化元数据
            for (const file of fileArray) {
                setFileMetadata((prev) => ({
                    ...prev,
                    [file.name]: {
                        name: file.name,
                        description: "",
                        isEditing: false,
                        isEditingDescription: false,
                    },
                }));
            }
        }
    };

    const startEditing = (fileName: string) => {
        setFileMetadata((prev) => ({
            ...prev,
            [fileName]: {
                ...prev[fileName],
                isEditing: true,
            },
        }));
    };

    const startEditingDescription = (fileName: string) => {
        setFileMetadata((prev) => ({
            ...prev,
            [fileName]: {
                ...prev[fileName],
                isEditingDescription: true,
            },
        }));
    };

    const cancelEditing = (fileName: string) => {
        setFileMetadata((prev) => ({
            ...prev,
            [fileName]: {
                ...prev[fileName],
                name: files.find((f) => f.name === fileName)?.name || fileName,
                isEditing: false,
            },
        }));
    };

    const cancelEditingDescription = (fileName: string) => {
        setFileMetadata((prev) => ({
            ...prev,
            [fileName]: {
                ...prev[fileName],
                description: prev[fileName].description,
                isEditingDescription: false,
            },
        }));
    };

    const confirmEditing = (fileName: string) => {
        setFileMetadata((prev) => ({
            ...prev,
            [fileName]: {
                ...prev[fileName],
                isEditing: false,
            },
        }));
    };

    const confirmEditingDescription = (fileName: string) => {
        setFileMetadata((prev) => ({
            ...prev,
            [fileName]: {
                ...prev[fileName],
                isEditingDescription: false,
            },
        }));
    };

    const handleNameChange = (fileName: string, newName: string) => {
        setFileMetadata((prev) => ({
            ...prev,
            [fileName]: {
                ...prev[fileName],
                name: newName,
            },
        }));
    };

    const handleDescriptionChange = (fileName: string, description: string) => {
        setFileMetadata((prev) => ({
            ...prev,
            [fileName]: {
                ...prev[fileName],
                description,
            },
        }));
    };

    const removeFile = (file: File) => {
        setFiles((prev) => prev.filter((f) => f !== file));
        setFileMetadata((prev) => {
            const newMetadata = { ...prev };
            delete newMetadata[file.name];
            return newMetadata;
        });
    };

    const addRecipient = () => {
        if (newRecipient && !recipients.includes(newRecipient)) {
            setRecipients((prev) => [...prev, newRecipient]);
            setNewRecipient("");
        }
    };

    const removeRecipient = (index: number) => {
        setRecipients((prev) => prev.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addRecipient();
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error(t("pleaseSelectFiles"));
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const fileInfos: FileInfo[] = [];

            // 逐个处理文件
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const metadata = fileMetadata[file.name];

                // 更新进度
                setUploadProgress(Math.round((i / files.length) * 100));

                // 读取文件内容
                const fileBuffer = await file.arrayBuffer();
                const fileData = new Uint8Array(fileBuffer);

                let blobId: string;
                if (accessType === "public") {
                    // 公开文件直接上传
                    // blobId = await storeFile(fileData);
                    blobId = await storeBlob(fileData);
                } else {
                    // 私密和授权文件先加密后上传
                    const encryptedData = await sealEncryptBytes(fileData);
                    console.log(
                        `fileData size: ${fileData.length}, encryptedData size: ${encryptedData.length}`
                    );
                    // blobId = await storeFile(encryptedData);
                    blobId = await storeBlob(encryptedData);
                    console.log(`file ${metadata.name} blobId: ${blobId}`);
                }

                fileInfos.push({
                    name: metadata.name,
                    description: metadata.description,
                    file_blob_id: blobId,
                    file_type: file.type,
                    file_size: file.size,
                    price: isPurchasable ? Number(purchaseAmount) * 1e9 : 0, // 转换为 MIST
                    is_encrypt: accessType !== "public",
                    grantee_addresses:
                        accessType === "shared" ? recipients : [],
                });
            }

            // 使用 useCreateFiles 上传文件
            await createFiles.mutateAsync(fileInfos);

            // 上传完成
            setUploadProgress(100);
            setIsUploading(false);
            toast.success(t("allFilesUploaded"));

            // 跳转到我的文件页面
            router.push("/files");

            // 重置状态
            setFiles([]);
            setFileMetadata({});
            setRecipients([]);
            setNewRecipient("");
            setIsPurchasable(false);
            setPurchaseAmount("");
        } catch (error) {
            console.error(t("uploadFailed"), error);
            toast.error(t("uploadFailed"));
            setIsUploading(false);
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes("image")) return "🖼️";
        if (fileType.includes("video")) return "🎬";
        if (fileType.includes("audio")) return "🎵";
        if (fileType.includes("pdf")) return "📄";
        if (
            fileType.includes("word") ||
            fileType.includes("document") ||
            fileType.includes("txt")
        )
            return "📝";
        if (fileType.includes("excel") || fileType.includes("sheet"))
            return "📊";
        if (
            fileType.includes("presentation") ||
            fileType.includes("powerpoint")
        )
            return "📽️";
        if (fileType.includes("zip") || fileType.includes("compressed"))
            return "🗜️";
        return "📁";
    };

    const handleDivClick = () => {
        fileInputRef.current?.click();
    };

    const handleDivKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
        }
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
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            {t("uploadTitle")}
                        </h1>
                        <p className="text-muted-foreground">
                            {t("uploadDescription")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl">
                                        {t("selectFiles")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("dropOrClick")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-12 text-center ${
                                            isDragging
                                                ? "border-primary bg-primary/5"
                                                : "border-muted-foreground/20"
                                        } transition-colors`}
                                        onDragEnter={handleDragEnter}
                                        onDragLeave={handleDragLeave}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        onClick={handleDivClick}
                                        onKeyDown={handleDivKeyDown}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={t("uploadTitle")}
                                    >
                                        <div className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
                                            <div className="rounded-full bg-primary/10 p-4">
                                                <ArrowUpIcon className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {t("dropHere")}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t("supportedTypes")}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                type="button"
                                                className="mt-2"
                                            >
                                                {t("selectFile")}
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium">
                                                    {t("selectedFiles")} (
                                                    {files.length})
                                                </h3>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setFiles([])}
                                                    className="h-auto px-2 py-1 text-xs"
                                                >
                                                    {t("clearAll")}
                                                </Button>
                                            </div>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                {files.map((file) => (
                                                    <div
                                                        key={`${file.name}-${file.size}-${file.lastModified}`}
                                                        className="flex flex-col p-3 rounded-lg bg-muted/50"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3 flex-1">
                                                                <div className="text-2xl">
                                                                    {getFileIcon(
                                                                        file.type
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col space-y-1 flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center space-x-2 flex-1">
                                                                            {fileMetadata[
                                                                                file
                                                                                    .name
                                                                            ]
                                                                                ?.isEditing ? (
                                                                                <div className="flex items-center space-x-2 flex-1">
                                                                                    <Input
                                                                                        value={
                                                                                            fileMetadata[
                                                                                                file
                                                                                                    .name
                                                                                            ]
                                                                                                ?.name
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            handleNameChange(
                                                                                                file.name,
                                                                                                e
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        className="text-sm font-medium h-8"
                                                                                        autoFocus
                                                                                    />
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0"
                                                                                        onClick={() =>
                                                                                            confirmEditing(
                                                                                                file.name
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0"
                                                                                        onClick={() =>
                                                                                            cancelEditing(
                                                                                                file.name
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <XIcon className="h-4 w-4 text-red-500" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center space-x-2 flex-1">
                                                                                    <span className="text-sm font-medium truncate">
                                                                                        {fileMetadata[
                                                                                            file
                                                                                                .name
                                                                                        ]
                                                                                            ?.name ||
                                                                                            file.name}
                                                                                    </span>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0"
                                                                                        onClick={() =>
                                                                                            startEditing(
                                                                                                file.name
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <PencilIcon className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-xs text-muted-foreground ml-2">
                                                                            {formatBytes(
                                                                                file.size
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        {fileMetadata[
                                                                            file
                                                                                .name
                                                                        ]
                                                                            ?.isEditingDescription ? (
                                                                            <div className="flex items-center space-x-2 flex-1">
                                                                                <Input
                                                                                    placeholder={t(
                                                                                        "addDescription"
                                                                                    )}
                                                                                    value={
                                                                                        fileMetadata[
                                                                                            file
                                                                                                .name
                                                                                        ]
                                                                                            ?.description ||
                                                                                        ""
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        handleDescriptionChange(
                                                                                            file.name,
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    className="text-xs h-7"
                                                                                    autoFocus
                                                                                    onKeyDown={(
                                                                                        e
                                                                                    ) => {
                                                                                        if (
                                                                                            e.key ===
                                                                                            "Enter"
                                                                                        ) {
                                                                                            confirmEditingDescription(
                                                                                                file.name
                                                                                            );
                                                                                        } else if (
                                                                                            e.key ===
                                                                                            "Escape"
                                                                                        ) {
                                                                                            cancelEditingDescription(
                                                                                                file.name
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 w-7 p-0"
                                                                                    onClick={() =>
                                                                                        confirmEditingDescription(
                                                                                            file.name
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <CheckIcon className="h-3 w-3 text-green-500" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 w-7 p-0"
                                                                                    onClick={() =>
                                                                                        cancelEditingDescription(
                                                                                            file.name
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <XIcon className="h-3 w-3 text-red-500" />
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <div
                                                                                className="flex items-center space-x-2 flex-1 cursor-pointer group"
                                                                                onClick={() =>
                                                                                    startEditingDescription(
                                                                                        file.name
                                                                                    )
                                                                                }
                                                                                onKeyDown={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        e.key ===
                                                                                            "Enter" ||
                                                                                        e.key ===
                                                                                            " "
                                                                                    ) {
                                                                                        e.preventDefault();
                                                                                        startEditingDescription(
                                                                                            file.name
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                tabIndex={
                                                                                    0
                                                                                }
                                                                                role="button"
                                                                                aria-label="编辑文件描述"
                                                                            >
                                                                                <span className="text-xs text-muted-foreground truncate flex-1 group-hover:text-foreground transition-colors">
                                                                                    {fileMetadata[
                                                                                        file
                                                                                            .name
                                                                                    ]
                                                                                        ?.description ||
                                                                                        t(
                                                                                            "addDescription"
                                                                                        )}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-9 w-9 p-0 hover:bg-red-50"
                                                                onClick={() =>
                                                                    removeFile(
                                                                        file
                                                                    )
                                                                }
                                                            >
                                                                <XIcon className="h-6 w-6 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl">
                                        {t("encryptionAndAccess")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("setWhoCanAccess")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Tabs
                                        defaultValue="private"
                                        value={accessType}
                                        onValueChange={setAccessType}
                                    >
                                        <TabsList className="mb-4">
                                            <TabsTrigger
                                                value="private"
                                                className="gap-2"
                                            >
                                                <LockIcon className="h-4 w-4" />
                                                {t("privateAccess")}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="shared"
                                                className="gap-2"
                                            >
                                                <ShieldIcon className="h-4 w-4" />
                                                {t("sharedAccess")}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="public"
                                                className="gap-2"
                                            >
                                                <UsersRound className="h-4 w-4" />
                                                {t("publicAccess")}
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="private">
                                            <p className="text-sm text-muted-foreground">
                                                {t("privateDesc")}
                                            </p>
                                        </TabsContent>

                                        <TabsContent value="shared">
                                            <div className="space-y-4">
                                                <p className="text-sm text-muted-foreground">
                                                    {t("sharedDesc")}
                                                </p>

                                                <div className="flex items-center gap-2 mt-2">
                                                    <input
                                                        type="checkbox"
                                                        id="needSpecifyAddress"
                                                        checked={
                                                            needSpecifyAddress
                                                        }
                                                        onChange={() =>
                                                            setNeedSpecifyAddress(
                                                                (prev) => !prev
                                                            )
                                                        }
                                                    />
                                                    <label
                                                        htmlFor="needSpecifyAddress"
                                                        className="text-sm"
                                                    >
                                                        {t(
                                                            "needSpecifyAddress"
                                                        )}
                                                    </label>
                                                </div>

                                                {needSpecifyAddress && (
                                                    <>
                                                        <div className="flex gap-2 mt-2">
                                                            <div className="flex-1">
                                                                <Input
                                                                    placeholder={t(
                                                                        "enterWalletAddress"
                                                                    )}
                                                                    value={
                                                                        newRecipient
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setNewRecipient(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    onKeyDown={
                                                                        handleKeyDown
                                                                    }
                                                                    className="w-full"
                                                                />
                                                            </div>
                                                            <Button
                                                                onClick={
                                                                    addRecipient
                                                                }
                                                                type="button"
                                                            >
                                                                <PlusIcon className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        {recipients.length >
                                                            0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {recipients.map(
                                                                    (
                                                                        recipient,
                                                                        idx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                recipient
                                                                            }
                                                                            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                                                                        >
                                                                            <UserRoundIcon className="h-3 w-3" />
                                                                            <span
                                                                                className="max-w-[150px] truncate"
                                                                                title={
                                                                                    recipient
                                                                                }
                                                                            >
                                                                                {truncateAddress(
                                                                                    recipient
                                                                                )}
                                                                            </span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-4 w-4 p-0 ml-1"
                                                                                onClick={() =>
                                                                                    removeRecipient(
                                                                                        idx
                                                                                    )
                                                                                }
                                                                            >
                                                                                <XIcon className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                <div className="flex items-center gap-2 mt-4">
                                                    <input
                                                        type="checkbox"
                                                        id="purchasable"
                                                        checked={isPurchasable}
                                                        onChange={() =>
                                                            setIsPurchasable(
                                                                (prev) => !prev
                                                            )
                                                        }
                                                    />
                                                    <label
                                                        htmlFor="purchasable"
                                                        className="text-sm"
                                                    >
                                                        {t("allowPurchase")}
                                                    </label>
                                                </div>
                                                {isPurchasable && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-sm">
                                                            {t("paymentAmount")}
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder={t(
                                                                "enterAmount"
                                                            )}
                                                            value={
                                                                purchaseAmount
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target
                                                                        .value;
                                                                if (
                                                                    /^\d*\.?\d{0,2}$/.test(
                                                                        value
                                                                    )
                                                                ) {
                                                                    setPurchaseAmount(
                                                                        value
                                                                    );
                                                                }
                                                            }}
                                                            className="w-32"
                                                        />
                                                        <span className="text-sm">
                                                            SUI
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="public">
                                            <p className="text-sm text-muted-foreground">
                                                {t("publicDesc")}
                                            </p>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>

                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">
                                        {t("uploadSummary")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {t("selectedFiles")}
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {files.length}
                                        </p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <p className="text-sm font-medium">
                                            {t("totalSize")}
                                        </p>
                                        <p className="text-lg font-bold">
                                            {formatBytes(
                                                files.reduce(
                                                    (acc, file) =>
                                                        acc + file.size,
                                                    0
                                                )
                                            )}
                                        </p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <p className="text-sm font-medium">
                                            {t("securitySettings")}
                                        </p>
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <ShieldIcon
                                                    className={`h-4 w-4 ${
                                                        accessType === "public"
                                                            ? "text-muted-foreground"
                                                            : "text-green-500"
                                                    }`}
                                                />
                                                <span>
                                                    {accessType === "public"
                                                        ? t("notEncrypted")
                                                        : t("encrypted")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <LockIcon className="h-4 w-4 text-primary" />
                                                <span>
                                                    {t("accessType")}:{" "}
                                                    {accessType === "private"
                                                        ? t("privateAccess")
                                                        : accessType ===
                                                          "shared"
                                                        ? t("authorized")
                                                        : t("public")}
                                                </span>
                                            </div>
                                            {accessType === "shared" &&
                                                needSpecifyAddress && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <UserRoundIcon className="h-4 w-4 text-primary" />
                                                        <span>
                                                            {t(
                                                                "authorizedUsers"
                                                            )}
                                                            :{" "}
                                                            {recipients.length}
                                                        </span>
                                                    </div>
                                                )}
                                            {accessType === "shared" &&
                                                isPurchasable && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Coins className="h-4 w-4 text-primary" />
                                                        <span>
                                                            {t("canPurchase")}
                                                            <span className="mx-2 text-muted-foreground">
                                                                |
                                                            </span>
                                                            {t("amountToPay")}:{" "}
                                                            <span className="font-medium">
                                                                {purchaseAmount ||
                                                                    t("notSet")}
                                                            </span>{" "}
                                                            SUI
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative overflow-hidden group"
                                        onClick={handleUpload}
                                        disabled={
                                            isUploading || files.length === 0
                                        }
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div
                                            className="absolute inset-0 bg-white/20"
                                            style={{
                                                width: `${uploadProgress}%`,
                                                transition:
                                                    "width 0.3s ease-in-out",
                                            }}
                                        />
                                        <div className="relative flex items-center justify-center">
                                            {isUploading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    <span>
                                                        {t("uploadingText")}{" "}
                                                        {Math.round(
                                                            uploadProgress
                                                        )}
                                                        %
                                                    </span>
                                                </>
                                            ) : (
                                                t("uploadFileBtn")
                                            )}
                                        </div>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
}
