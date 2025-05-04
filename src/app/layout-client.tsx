"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import { Toaster } from "sonner";

interface RootLayoutContentProps {
    children: React.ReactNode;
    geistSans: string;
    geistMono: string;
}

export function RootLayoutContent({
    children,
    geistSans,
    geistMono,
}: RootLayoutContentProps) {
    const { language } = useLanguage();

    return (
        <html lang={language} suppressHydrationWarning>
            <body className={`${geistSans} ${geistMono} antialiased`}>
                <Toaster />
                {children}
            </body>
        </html>
    );
}
