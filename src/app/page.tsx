"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { FileIcon, LockIcon, ShieldIcon, ZapIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

export default function Home() {
    const { t } = useLanguage();

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/50 py-24 md:py-32">
                    <div className="absolute inset-0 bg-grid-small-black/[0.2] bg-[length:20px_20px] dark:bg-grid-small-white/[0.2]" />
                    <div className="container mx-auto relative">
                        <div className="grid gap-10 md:grid-cols-2 md:gap-16 items-center">
                            <div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-1">
                                        {t("secureFileSharing")}
                                        <br />
                                        {t("decentralizedStorage")}
                                    </h1>
                                    <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                                        {t("homeDescription")}
                                    </p>
                                    <div className="mt-8 flex flex-wrap gap-4">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Button
                                                asChild
                                                size="lg"
                                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                            >
                                                <Link href="/upload">
                                                    {t("getStarted")}
                                                </Link>
                                            </Button>
                                        </motion.div>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            asChild
                                        >
                                            <Link href="/files">
                                                {t("browseFiles")}
                                            </Link>
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                            <div className="flex justify-center">
                                <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.8,
                                            delay: 0.2,
                                            type: "spring",
                                            stiffness: 100,
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-3xl" />
                                        <div className="absolute inset-4 rounded-full bg-background p-8 backdrop-blur-sm">
                                            <div className="flex h-full flex-col items-center justify-center">
                                                <LockIcon className="h-20 w-20 text-primary" />
                                                <h2 className="mt-4 text-2xl font-bold">
                                                    {t("secureEncryption")}
                                                </h2>
                                                <p className="mt-2 text-center text-muted-foreground">
                                                    {t("secureEncryptionDesc")}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                                {t("powerfulFeatures")}
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {t("featuresDescription")}
                            </p>
                        </div>
                        <div className="mt-16 grid gap-8 md:grid-cols-3">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="flex flex-col items-center rounded-lg border border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-white via-indigo-50/30 to-indigo-100/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-indigo-900/20 p-8 text-card-foreground shadow-md hover:shadow-xl hover:shadow-indigo-200/20 dark:hover:shadow-indigo-900/30 transition-all hover:bg-gradient-to-b hover:from-background hover:to-indigo-50/30 dark:hover:to-indigo-950/20 h-full">
                                    <motion.div
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    >
                                        <div className="rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 p-4">
                                            <ShieldIcon className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="mt-4 text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                                            {t("endToEndEncryption")}
                                        </h3>
                                        <p className="mt-2 text-center text-muted-foreground min-h-[4rem]">
                                            {t("endToEndEncryptionDesc")}
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <div className="flex flex-col items-center rounded-lg border border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-white via-purple-50/30 to-purple-100/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-purple-900/20 p-8 text-card-foreground shadow-md hover:shadow-xl hover:shadow-purple-200/20 dark:hover:shadow-purple-900/30 transition-all hover:bg-gradient-to-b hover:from-background hover:to-purple-50/30 dark:hover:to-purple-950/20 h-full">
                                    <motion.div
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.1,
                                        }}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    >
                                        <div className="rounded-full bg-gradient-to-br from-purple-400 to-pink-600 p-4">
                                            <FileIcon className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="mt-4 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                                            {t("decentralizedStorageTitle")}
                                        </h3>
                                        <p className="mt-2 text-center text-muted-foreground min-h-[4rem]">
                                            {t("decentralizedStorageDesc")}
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <div className="flex flex-col items-center rounded-lg border border-pink-200/50 dark:border-pink-800/30 bg-gradient-to-br from-white via-pink-50/30 to-pink-100/30 dark:from-gray-900 dark:via-pink-950/20 dark:to-pink-900/20 p-8 text-card-foreground shadow-md hover:shadow-xl hover:shadow-pink-200/20 dark:hover:shadow-pink-900/30 transition-all hover:bg-gradient-to-b hover:from-background hover:to-pink-50/30 dark:hover:to-pink-950/20 h-full">
                                    <motion.div
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.2,
                                        }}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    >
                                        <div className="rounded-full bg-gradient-to-br from-pink-400 to-indigo-600 p-4">
                                            <ZapIcon className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="mt-4 text-xl font-bold bg-gradient-to-r from-pink-500 to-indigo-600 bg-clip-text text-transparent">
                                            {t("smartAccessControl")}
                                        </h3>
                                        <p className="mt-2 text-center text-muted-foreground min-h-[4rem]">
                                            {t("smartAccessControlDesc")}
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
