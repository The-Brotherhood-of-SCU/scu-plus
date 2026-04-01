import React from "react";
import ReactDOM from "react-dom/client"
import { notification } from "antd";
import type { NotificationInstance, NotificationPlacement } from "antd/es/notification/interface";
import { createSecondPageElement } from "~script/utils";

let notificationApi: NotificationInstance | null = null;

const NotificationProvider = () => {
    const [api, contextHolder] = notification.useNotification();
    notificationApi = api;
    return <>{contextHolder}</>;
}

const openNotification = (title: string, content: string, location: NotificationPlacement) => {
    notificationApi?.info({
        message: title,
        description: content,
        placement: location,
    });
};

export function initEnhanceQuitCourse(): void {
    // 渲染通知容器
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);
    root.render(<NotificationProvider />);

    createSecondPageElement("退课时，SCU+会提示退课的课程名，防止退课退错");
    document.addEventListener('click', function (event) {
        const element = event.target as HTMLElement;
        if (element.tagName === "I") {
            const row = element.parentNode?.parentNode;
            if (row) {
                const rowNodes = (row as HTMLElement).querySelector("td:nth-child(4)");
                if (rowNodes) {
                    const courseName = (rowNodes as HTMLElement).innerText;
                    console.log("deleing: " + courseName);
                    openNotification("正在删除课程:", courseName, "topRight");
                }
            }
        }
    });
}
