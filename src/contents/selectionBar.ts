import type { PlasmoCSConfig } from "plasmo";
import { dailySentence } from "../background";

export const config: PlasmoCSConfig = {
    matches: ["http://zhjw.scu.edu.cn/", "http://zhjw.scu.edu.cn/index", "http://zhjw.scu.edu.cn/index.*"],
    all_frames: true,
};

// 更新 Cookie 的函数
function updateCookie(key, value) {
    const cookies = document.cookie
        .split("; ")
        .reduce((acc, cookie) => {
            const [key, val] = cookie.split("=");
            acc[decodeURIComponent(key)] = decodeURIComponent(val);
            return acc;
        }, {});
    cookies[key] = value;
    for (const [k, v] of Object.entries(cookies)) {
        document.cookie = `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}; path=/`;
    }
}

updateCookie("selectionBar", "");

window.addEventListener("load", () => {
    showModal();
});

const showModal = async () => {
    const word = await dailySentence();
    if (word) {
        // 创建弹窗容器
        const modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.style.position = 'fixed';
        modal.style.top = '120px';
        modal.style.right = '-370px'; // 初始位置：隐藏在屏幕右侧
        modal.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'; // 半透明背景
        modal.style.backdropFilter = 'blur(10px)'; // 毛玻璃效果
        modal.style.padding = '20px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.1)';
        modal.style.zIndex = '1000';
        modal.style.width = '350px';
        modal.style.fontFamily = 'Arial, sans-serif';
        modal.style.transition = 'right 0.3s ease'; // 添加过渡动画

        // 创建关闭按钮
        const closeButton = document.createElement('button');
        closeButton.innerText = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '20px';
        closeButton.style.color = '#333';
        closeButton.style.cursor = 'pointer';
        closeButton.style.transition = 'color 0.3s ease';
        closeButton.onmouseover = () => {
            closeButton.style.color = '#ff4d4f'; // 鼠标悬停时变红
        };
        closeButton.onmouseout = () => {
            closeButton.style.color = '#333'; // 恢复默认颜色
        };
        closeButton.onclick = () => {
            modal.style.right = '-370px'; // 关闭时向右滑动
            setTimeout(() => modal.remove(), 300); // 等待动画完成后再移除元素
        };

        // 创建内容区域
        const content = document.createElement('div');
        content.innerHTML = `
            <p style="margin: 0; font-size: 16px; color: #333;"><strong>每日一句:</strong></p>
            <p style="margin-top: 8px; font-size: 14px; color: #555; line-height: 1.6;">${word}</p>
        `;
        content.style.marginTop = '10px';

        // 将关闭按钮和内容添加到弹窗中
        modal.appendChild(closeButton);
        modal.appendChild(content);

        // 将弹窗添加到页面中
        document.body.appendChild(modal);

        // 弹窗显示动画
        setTimeout(() => {
            modal.style.right = '20px'; // 弹窗从右侧滑入
        }, 10);
    }
};