"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/LanguageProvider";
import { GlobeIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <GlobeIcon className="h-4 w-4" />
                    <span className="sr-only">切换语言</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setLanguage("zh")}
                    className={language === "zh" ? "bg-muted" : ""}
                >
                    中文
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLanguage("en")}
                    className={language === "en" ? "bg-muted" : ""}
                >
                    English
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
