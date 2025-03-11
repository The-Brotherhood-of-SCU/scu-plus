import { notification } from "antd";
import type { NotificationInstance, NotificationPlacement } from "antd/es/notification/interface";
import type { PlasmoCSConfig } from "plasmo";
import { createSecondPageElement } from "~script/utils";

export const config: PlasmoCSConfig = {
    matches: [
        "http://zhjw.scu.edu.cn/student/courseSelect/quitCourse/*",
    ],
    all_frames: true,
}
let notificationApi: NotificationInstance = null;
export default () => {
    const [api, contextHolder] = notification.useNotification();
    notificationApi = api;
    return contextHolder;
}

const openNotification = (title: string, content: string, location: NotificationPlacement) => {
    notificationApi?.info({
        message: title,
        description: content,
        placement: location,
    });
};

window.addEventListener("load", () => {
    createSecondPageElement("退课时，SCU+会提示退课的课程名，防止退课退错");
    document.addEventListener('click', function (event) {
        const element = event.target as HTMLElement;
        if (element.tagName === "I") {
            const row = element.parentNode.parentNode;
            const rowNodes = (row as HTMLElement).querySelector("td:nth-child(4)");
            const courseName=(rowNodes as HTMLElement).innerText
            console.log("deleing: " + courseName);
            openNotification("正在删除课程:", courseName, "topRight");
        }

    });
})

