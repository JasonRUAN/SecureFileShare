import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import SuiDappProvider from "@/providers/SuiDappProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { RootLayoutContent } from "./layout-client";

import "@mysten/dapp-kit/dist/index.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Secure File Share",
    description: "A secure file sharing platform based on Sui + Seal + Walrus",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SuiDappProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <LanguageProvider>
                    <RootLayoutContent
                        geistSans={geistSans.variable}
                        geistMono={geistMono.variable}
                    >
                        {children}
                    </RootLayoutContent>
                </LanguageProvider>
            </ThemeProvider>
        </SuiDappProvider>
    );
}
