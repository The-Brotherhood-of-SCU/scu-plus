import { dailySentence } from "../script/utils";

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

export default (dailyQuoteSwitch: boolean) => {
    updateCookie("selectionBar", "");
    if (dailyQuoteSwitch) {
        setTimeout(() => showModal(), 1000)
    }

}

const showModal = async () => {
    const word = await dailySentence();
    if (!word) return;

    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.style.cssText = `
        position: fixed;
        top: 100px;
        right: -400px;
        background: linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(245,247,250,0.96) 100%);
        backdrop-filter: blur(12px);
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08);
        z-index: 9999;
        width: 380px;
        font-family: 'Segoe UI', 'PingFang SC', system-ui;
        transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        border: 1px solid rgba(255,255,255,0.3);
        transform-origin: 95% 0;
        opacity: 0;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(0,0,0,0.08);
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 20px;
        color: #666;
        cursor: pointer;
        transition: all 0.5s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    closeButton.onmouseover = () => {
        closeButton.style.background = 'rgba(255,80,80,0.15)';
        closeButton.style.color = '#ff5050';
    };

    closeButton.onmouseout = () => {
        closeButton.style.background = 'rgba(0,0,0,0.08)';
        closeButton.style.color = '#666';
    };

    closeButton.onclick = () => {
        modal.style.transform = 'scale(0.95)';
        modal.style.opacity = '0';
        modal.style.right = '-400px';
        setTimeout(() => modal.remove(), 400);
    };

    const content = document.createElement('div');
    content.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <svg style="width: 24px; height: 24px; margin-right: 12px; color: #4a90e2;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
            </svg>
            <h3 style="margin:0; font-size: 18px; color: #2c3e50; font-weight: 600;">诗词歌赋</h3>
        </div>
        <div style="padding-left: 36px;">
            <p style="margin:0; font-size: 15px; color: #34495e; line-height: 1.7; 
               position: relative; padding-left: 20px;">
                <span style="position: absolute; left: 0; color: #4a90e2; font-weight: bold;">“</span>
                ${word}
            </p>
        </div>
    `;

    modal.appendChild(closeButton);
    modal.appendChild(content);
    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.style.right = '24px';
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    });

    setTimeout(() => {
        modal.style.transform = 'scale(0.98)';
        modal.style.opacity = '0.8';
    }, 5000);
    setTimeout(() => {
        modal.style.opacity = '0';
        modal.style.right = '-400px';
        setTimeout(() => modal.remove(), 400);
    }, 8000);
};