"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";

type Language = "zh" | "en";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
    undefined
);

// 定义翻译类型
interface TranslationDict {
    [key: string]: string;
}

interface Translations {
    zh: TranslationDict;
    en: TranslationDict;
}

// 中英文翻译
const translations: Translations = {
    zh: {
        // 侧边栏
        home: "首页",
        profile: "个人中心",
        language: "Language (EN)",
        settings: "设置",

        // 文件相关
        myFiles: "我的文件",
        fileMarket: "文件市场",
        upload: "上传",
        file: "文件",
        files: "文件",
        fileName: "文件名",
        fileSize: "文件大小",
        fileType: "文件类型",
        uploadTime: "上传时间",
        uploadFile: "上传文件",
        downloadFile: "下载文件",
        deleteFile: "删除文件",
        shareFile: "分享文件",
        browseFiles: "浏览文件",
        fileManagement: "文件管理",
        searchFiles: "搜索文件...",
        searchSharedFiles: "搜索共享文件...",
        sharedWithMe: "共享给我",
        sharedAddresses: "已授权地址",
        noFiles: "没有文件",
        noFilesDesc: "您还没有上传任何文件，或者没有符合搜索条件的文件",
        noSharedFiles: "没有共享文件",
        noSharedFilesDesc: "暂无描述",
        SharedFilesManage: "管理有权访问此文件的用户",
        accessType: "访问类型",
        uploadDate: "上传日期",
        operations: "操作",
        public: "公开",
        private: "私有",
        authorized: "授权",
        addressCopied: "地址已复制到剪贴板",
        owner: "共享人",
        sharedDate: "共享日期",
        onlyMe: "仅自己可见",
        alreadyShared: "已共享给",
        users: "人",
        blobIdCopied: "BlobId已复制到剪贴板",

        // 首页
        secureFileSharing: "安全文件分享",
        decentralizedStorage: "去中心化存储",
        homeDescription: "基于Sui+Seal+Walrus构建的安全文件分享平台",
        getStarted: "立即开始",
        secureEncryption: "安全加密",
        secureEncryptionDesc:
            "文件将被端到端加密，只有指定的接收者能够解密和访问。",
        powerfulFeatures: "强大功能",
        featuresDescription: "我们的平台提供多种功能，确保您的文件安全无忧",
        endToEndEncryption: "端到端加密",
        endToEndEncryptionDesc:
            "采用Seal加密技术，确保只有授权用户能够解密您的文件。",
        decentralizedStorageTitle: "去中心化存储",
        decentralizedStorageDesc:
            "文件存储在Walrus去中心化的网络上，不受单一服务商的控制。",
        smartAccessControl: "智能访问控制",
        smartAccessControlDesc:
            "通过Sui智能合约设置访问规则，精确控制谁可以查看您的文件。",

        // 页脚
        footerDescription: "基于 Sui + Seal + Walrus 构建的安全文件共享平台",
        builtWith: "用",
        love: "构建",

        // 主题切换
        toggleTheme: "切换主题",

        // 错误信息
        fileNotFound: "文件不存在",
        uploadFailed: "文件上传失败",
        walletRequired: "需要连接钱包才能解密文件",
        dateNotSet: "未设置日期",

        // 提示信息
        walletConnectedMsg: "已连接钱包",

        // 按钮和通用文本
        submit: "提交",
        cancel: "取消",
        confirm: "确认",
        edit: "编辑",
        delete: "删除",
        save: "保存",
        loading: "加载中...",
        success: "成功",
        error: "错误",
        back: "返回",
        next: "下一步",

        // 用户档案页面
        accountInfo: "账户信息",
        walletAddress: "钱包地址",
        copyAddress: "复制地址",
        copySuccess: "地址已复制到剪贴板",
        copyError: "复制失败，请手动复制",
        statistics: "统计数据",
        balance: "余额",
        recentActivity: "奖励事件",
        noRecentActivity: "暂无奖励事件",
        connectWalletFirst: "请先连接钱包",
        connectWalletDesc: "连接钱包以查看您的个人信息",

        fileDescription: "文件描述",
        deadline: "截止日期",
        reward: "奖励",
        penalty: "惩罚",
        witness: "见证人",
        progress: "进度",
        completed: "已完成",
        inProgress: "进行中",
        failed: "未完成",

        // 表单提示
        titleRequired: "请输入目标标题",
        descriptionRequired: "请输入目标描述",
        deadlineRequired: "请选择截止日期",

        // 连接钱包
        connectWallet: "连接钱包",
        disconnectWallet: "断开钱包连接",
        walletConnected: "钱包已连接",
        walletDisconnected: "钱包未连接",

        rewardAmount: "奖励金额",
        rewardMethod: "奖励操作",

        // 文件市场
        searchMarketFiles: "搜索市场文件...",
        noMarketFiles: "没有市场文件",
        noMarketFilesDesc:
            "当前市场没有任何文件，或者没有符合搜索条件的市场文件",
        price: "售价",
        addPublicFile: "添加公开文件",
        buyFile: "购买文件",
        addPublicFileSuccess: "公开文件添加成功",
        addPublicFileFailed: "添加公开文件失败",
        addPublicFileFailedRetry: "添加公开文件失败，请重试",
        buyFileSuccess: "文件购买成功",
        buyFileFailed: "购买文件失败",
        buyFileFailedRetry: "购买文件失败，请重试",
        handling: "处理文件",
        publicFree: "公开免费",
        me: "我",
        unknownUser: "未知用户",

        // 文件上传页面
        uploadTitle: "上传文件",
        uploadDescription:
            "上传并安全地授权您的文件，所有文件都将使用加密技术保护",
        selectFiles: "选择文件",
        dropOrClick: "将文件拖放到此处或点击浏览",
        dropHere: "点击或将文件拖放到此处上传",
        supportedTypes: "支持所有文件类型，最大文件大小: 10 MB",
        selectFile: "选择文件",
        selectedFiles: "已选文件",
        clearAll: "清除全部",
        addDescription: "点击添加描述",
        editFileDescription: "编辑文件描述",
        encryptionAndAccess: "加密与访问控制",
        setWhoCanAccess: "设置谁可以访问您的文件",
        privateAccess: "私密",
        sharedAccess: "授权",
        publicAccess: "公开",
        privateDesc: "只有您可以访问此文件。文件将被加密存储。",
        sharedDesc: "添加可以访问此文件的用户Sui钱包地址。文件将被加密存储。",
        publicDesc: "任何人都可以访问此文件，无需授权。文件不会加密存储。",
        needSpecifyAddress: "是否需要指定授权地址",
        enterWalletAddress: "输入钱包地址",
        authorizedUsers: "授权用户",
        allowPurchase: "是否允许购买",
        paymentAmount: "需支付金额",
        enterAmount: "请输入金额",
        uploadSummary: "上传摘要",
        totalSize: "总大小",
        securitySettings: "安全设置",
        encrypted: "已加密",
        notEncrypted: "未加密",
        uploadingText: "上传中",
        uploadFileBtn: "上传文件",
        allFilesUploaded: "所有文件上传成功",
        pleaseSelectFiles: "请选择要上传的文件",
        addOptionalDesc: "添加文件描述（可选）",
        canPurchase: "可购买",
        amountToPay: "需支付",
        notSet: "未设置",
    },
    en: {
        // 侧边栏
        home: "Home",
        profile: "Profile",
        language: "语言 (中)",
        settings: "Settings",

        // 文件相关
        myFiles: "My Files",
        fileMarket: "File Market",
        upload: "Upload",
        file: "File",
        files: "Files",
        fileName: "File Name",
        fileSize: "File Size",
        fileType: "File Type",
        uploadTime: "Upload Time",
        uploadFile: "Upload File",
        downloadFile: "Download File",
        deleteFile: "Delete File",
        shareFile: "Share File",
        browseFiles: "Browse Files",
        fileManagement: "File Management",
        searchFiles: "Search files...",
        searchSharedFiles: "Search shared files...",
        sharedWithMe: "Shared With Me",
        sharedAddresses: "Authorized Addresses",
        noFiles: "No Files",
        noFilesDesc:
            "You haven't uploaded any files yet, or no files match your search criteria",
        noSharedFiles: "No Shared Files",
        noSharedFilesDesc: "No file description",
        SharedFilesManage: "Manage users with access to this file",
        accessType: "Access Type",
        uploadDate: "Upload Date",
        operations: "Operations",
        public: "Public",
        private: "Private",
        authorized: "Authorized",
        addressCopied: "Address copied to clipboard",
        owner: "Owner",
        sharedDate: "Shared Date",
        onlyMe: "Only me can see",
        alreadyShared: "Already shared with",
        users: "users",
        blobIdCopied: "BlobId copied to clipboard",

        // 首页
        secureFileSharing: "Secure File Sharing",
        decentralizedStorage: "Decentralized Storage",
        homeDescription:
            "A secure file sharing platform based on Sui + Seal + Walrus",
        getStarted: "Get Started",
        secureEncryption: "Secure Encryption",
        secureEncryptionDesc:
            "Files are end-to-end encrypted, only designated recipients can decrypt and access them.",
        powerfulFeatures: "Powerful Features",
        featuresDescription:
            "Our platform offers multiple features to ensure your files are secure",
        endToEndEncryption: "End-to-End Encryption",
        endToEndEncryptionDesc:
            "Using Seal encryption technology to ensure only authorized users can decrypt your files.",
        decentralizedStorageTitle: "Decentralized Storage",
        decentralizedStorageDesc:
            "Files are stored on the decentralized Walrus network, not controlled by a single service provider.",
        smartAccessControl: "Smart Access Control",
        smartAccessControlDesc:
            "Set access rules through Sui smart contracts to precisely control who can view your files.",

        // 页脚
        footerDescription:
            "Secure file sharing platform built on Sui + Seal + Walrus",
        builtWith: "Built with",
        love: "love",

        // 主题切换
        toggleTheme: "Toggle Theme",

        // 错误信息
        fileNotFound: "File not found",
        uploadFailed: "File upload failed",
        walletRequired: "Wallet connection required to decrypt file",
        dateNotSet: "Date not set",

        // 提示信息
        walletConnectedMsg: "Wallet connected",

        // 按钮和通用文本
        submit: "Submit",
        cancel: "Cancel",
        confirm: "Confirm",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        loading: "Loading...",
        success: "Success",
        error: "Error",
        back: "Back",
        next: "Next",

        // 用户档案页面
        accountInfo: "Account Info",
        walletAddress: "Wallet Address",
        copyAddress: "Copy Address",
        copySuccess: "Address copied to clipboard",
        copyError: "Copy failed, please copy manually",
        statistics: "Statistics",
        balance: "Balance",
        recentActivity: "Reward Events",
        noRecentActivity: "No reward events",
        connectWalletFirst: "Please Connect Wallet First",
        connectWalletDesc:
            "Connect your wallet to view your profile information",

        fileDescription: "File Description",
        deadline: "Deadline",
        reward: "Reward",
        penalty: "Penalty",
        witness: "Witness",
        progress: "Progress",
        completed: "Completed",
        inProgress: "In Progress",
        failed: "Failed",

        // 表单提示
        deadlineRequired: "Please select a deadline",

        // 连接钱包
        connectWallet: "Connect Wallet",
        disconnectWallet: "Disconnect Wallet",
        walletConnected: "Wallet Connected",
        walletDisconnected: "Wallet Disconnected",

        rewardAmount: "Reward Amount",
        rewardMethod: "Reward Method",

        // 文件市场
        searchMarketFiles: "Search market files...",
        noMarketFiles: "No Market Files",
        noMarketFilesDesc:
            "There are no files in the market, or no files match your search criteria",
        price: "Price",
        addPublicFile: "Add Public File",
        buyFile: "Buy File",
        addPublicFileSuccess: "Public file added successfully",
        addPublicFileFailed: "Failed to add public file",
        addPublicFileFailedRetry: "Failed to add public file, please try again",
        buyFileSuccess: "File purchased successfully",
        buyFileFailed: "Failed to purchase file",
        buyFileFailedRetry: "Failed to purchase file, please try again",
        handling: "Handling file",
        publicFree: "Public free",
        me: "Me",
        unknownUser: "Unknown User",

        // 文件上传页面
        uploadTitle: "Upload Files",
        uploadDescription:
            "Upload and securely authorize your files, all files will be protected using encryption technology",
        selectFiles: "Select Files",
        dropOrClick: "Drop files here or click to browse",
        dropHere: "Click or drop files here to upload",
        supportedTypes: "All file types supported, max file size: 10 MB",
        selectFile: "Select File",
        selectedFiles: "Selected Files",
        clearAll: "Clear All",
        addDescription: "Click to add description",
        editFileDescription: "Edit file description",
        encryptionAndAccess: "Encryption & Access Control",
        setWhoCanAccess: "Set who can access your files",
        privateAccess: "Private",
        sharedAccess: "Authorized",
        publicAccess: "Public",
        privateDesc:
            "Only you can access this file. The file will be encrypted.",
        sharedDesc:
            "Add Sui wallet addresses that can access this file. The file will be encrypted.",
        publicDesc:
            "Anyone can access this file without authorization. The file will not be encrypted.",
        needSpecifyAddress: "Do you need to specify authorized addresses",
        enterWalletAddress: "Enter wallet address",
        authorizedUsers: "Authorized users",
        allowPurchase: "Allow purchase",
        paymentAmount: "Payment amount",
        enterAmount: "Enter amount",
        uploadSummary: "Upload Summary",
        totalSize: "Total Size",
        securitySettings: "Security Settings",
        encrypted: "Encrypted",
        notEncrypted: "Not Encrypted",
        uploadingText: "Uploading",
        uploadFileBtn: "Upload Files",
        allFilesUploaded: "All files uploaded successfully",
        pleaseSelectFiles: "Please select files to upload",
        addOptionalDesc: "Add file description (optional)",
        canPurchase: "Can purchase",
        amountToPay: "Amount to pay",
        notSet: "Not set",
    },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    // 首先尝试从本地存储获取语言设置，默认为英文
    const [language, setLanguageState] = useState<Language>("en");

    useEffect(() => {
        // 确保代码只在客户端执行
        if (typeof window !== "undefined") {
            // 获取本地存储的语言设置
            const savedLanguage = localStorage.getItem("language") as Language;
            if (
                savedLanguage &&
                (savedLanguage === "zh" || savedLanguage === "en")
            ) {
                setLanguageState(savedLanguage);
            }
        }
    }, []);

    // 设置语言并保存到本地存储
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== "undefined") {
            localStorage.setItem("language", lang);
        }
    };

    // 翻译函数
    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

// 创建一个自定义钩子，方便在组件中使用
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
