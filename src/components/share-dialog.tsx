"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PlusIcon, UserRoundIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { useGrantAccess } from "@/mutations/grant_access";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/constants";
import { useLanguage } from "@/providers/LanguageProvider";

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileId: string;
    fileName: string;
}

export function ShareDialog({
    open,
    onOpenChange,
    fileId,
    fileName,
}: ShareDialogProps) {
    const [recipients, setRecipients] = useState<string[]>([]);
    const [newRecipient, setNewRecipient] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const { mutateAsync: grantAccess } = useGrantAccess();

    const truncateAddress = (address: string) => {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addRecipient();
        }
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

    const handleShare = async () => {
        if (recipients.length === 0) {
            toast.error(t("addAtLeastOneAddress"));
            return;
        }

        setIsSubmitting(true);
        try {
            await grantAccess({
                fileId,
                granteeAddresses: recipients,
            });

            // 刷新文件列表数据
            queryClient.invalidateQueries({
                queryKey: [QueryKey.GetMultipleFilesQueryKey],
            });

            // 刷新单个文件详情数据
            queryClient.invalidateQueries({
                queryKey: [QueryKey.GetFileQueryKey, fileId],
            });

            toast.success(t("authorizationSuccess"));
            onOpenChange(false);
            setRecipients([]);
            setNewRecipient("");
        } catch (error) {
            console.error("授权失败:", error);
            toast.error(t("authorizationFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("authorizeFile")}</DialogTitle>
                    <DialogDescription>
                        {t("enterAddressToAuthorize")} &ldquo;{fileName}&rdquo;
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-4 py-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder={t("enterWalletAddress")}
                                value={newRecipient}
                                onChange={(e) =>
                                    setNewRecipient(e.target.value)
                                }
                                onKeyDown={handleKeyDown}
                                className="w-full"
                            />
                        </div>
                        <Button onClick={addRecipient} type="button">
                            <PlusIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {recipients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {recipients.map((recipient, idx) => (
                                <div
                                    key={recipient}
                                    className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                                >
                                    <UserRoundIcon className="h-3 w-3" />
                                    <span
                                        className="max-w-[150px] truncate cursor-pointer hover:text-primary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                recipient
                                            );
                                            toast.success(t("addressCopied"));
                                        }}
                                        title={recipient}
                                    >
                                        {truncateAddress(recipient)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 ml-1"
                                        onClick={() => removeRecipient(idx)}
                                    >
                                        <XIcon className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setRecipients([]);
                            setNewRecipient("");
                            onOpenChange(false);
                        }}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={handleShare}
                        disabled={isSubmitting || recipients.length === 0}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                <span>{t("authorizing")}</span>
                            </>
                        ) : (
                            t("confirmAuthorization")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
