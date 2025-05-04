export const formatDate = (date: Date | undefined) => {
    if (!date) return "未设置日期";

    // 格式化年、月、日
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 格式化时、分、秒
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    const second = date.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
