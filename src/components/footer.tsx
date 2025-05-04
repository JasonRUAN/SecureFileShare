// import Link from "next/link";
// import { GithubIcon, HeartIcon } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="border-t bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        {t("footerDescription")}
                    </p>
                </div>
                {/* <div className="flex items-center gap-4">
                    <Link
                        href="https://github.com/JasonRUAN/SecureFileShare"
                        target="_blank"
                        rel="noreferrer"
                        className="group"
                    >
                        <GithubIcon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                        <span className="sr-only">GitHub</span>
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{t("builtWith")}</span>
                        <HeartIcon className="h-4 w-4 fill-current text-red-500" />
                        <span>{t("love")}</span>
                    </div>
                </div> */}
            </div>
        </footer>
    );
}
