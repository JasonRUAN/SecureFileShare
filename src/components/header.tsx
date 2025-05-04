"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { motion } from "framer-motion";
import {
    FileIcon,
    UploadIcon,
    HomeIcon,
    LockIcon,
    ShoppingCartIcon,
} from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";
import { useLanguage } from "@/providers/LanguageProvider";

export function Header() {
    const { t } = useLanguage();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <Link href="/" className="flex items-center gap-2">
                        <LockIcon className="h-6 w-6 text-primary" />
                        <span className="font-bold text-xl hidden sm:inline-block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                            Secure File Share
                        </span>
                    </Link>
                </motion.div>
                <nav className="hidden md:flex items-center space-x-4">
                    <Button variant="ghost" asChild>
                        <Link href="/" className="flex items-center gap-2">
                            <HomeIcon className="h-4 w-4" />
                            {t("home")}
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/files" className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4" />
                            {t("myFiles")}
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link
                            href="/market"
                            className="flex items-center gap-2"
                        >
                            <ShoppingCartIcon className="h-4 w-4" />
                            {t("fileMarket")}
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link
                            href="/upload"
                            className="flex items-center gap-2"
                        >
                            <UploadIcon className="h-4 w-4" />
                            {t("upload")}
                        </Link>
                    </Button>
                </nav>
                <div className="flex items-center gap-2">
                    <LanguageToggle />
                    <ThemeToggle />
                    {/* <UserButton /> */}
                    <ConnectButton />
                </div>
            </div>
        </header>
    );
}
