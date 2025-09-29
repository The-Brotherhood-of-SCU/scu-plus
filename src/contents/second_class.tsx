import type { PlasmoCSConfig } from "plasmo";
import ReactDOM from "react-dom/client";
import { $, $all } from "~script/utils";
import { QRCode, Flex } from 'antd';
import React from "react";

export const config: PlasmoCSConfig = {
    matches: [
        "*://zjczs.scu.edu.cn/**",
    ],
    all_frames: true,
}

export default () => <></>

let currentRoot: ReactDOM.Root | null = null;
let lastUrl = '';

async function insertQRcode() {
    const container = document.querySelector('body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view');
    if (!container) return;

    const existingQR = container.querySelector('[data-qr-container]');
    if (existingQR) {
        existingQR.remove();
        if (currentRoot) {
            currentRoot.unmount();
            currentRoot = null;
        }
    }

    const qr_container = document.createElement("div");
    qr_container.setAttribute('data-qr-container', 'true');
    qr_container.style.margin = "20px";
    qr_container.style.padding = "2px";
    container.appendChild(qr_container);

    $('body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(4) > uni-view > uni-view:nth-child(6) > uni-view', e => {
        e.style.marginBottom = '0';
    });

    const searchParams = new URLSearchParams(window.location.search);
    const activity_id = searchParams.get("id");
    if (!activity_id) return;

    currentRoot = ReactDOM.createRoot(qr_container);
    currentRoot.render(<QR_container id={activity_id} />);
}

function watchUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(() => insertQRcode(), 300);
    }
}

function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
        watchUrlChange();
    });

    const targetNode = document.querySelector('body > uni-app');
    if (targetNode) {
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    }
}

window.addEventListener('load', () => {
    lastUrl = window.location.href;
    insertQRcode();
    observePageChanges();
    
    setInterval(watchUrlChange, 500);
});

window.addEventListener('popstate', () => {
    setTimeout(() => insertQRcode(), 300);
});

function QR_container({ id }: { id: string }) {
    const pref_in = 'https://zjczs.scu.edu.cn/ccylmp/pages/main/index/signing?type=in&state=1&id=';
    const pref_out = 'https://zjczs.scu.edu.cn/ccylmp/pages/main/index/signing?type=out&state=1&id=';
    
    return (
        <>
            <span>🎯签到、签退二维码 -- by scu-plus</span>
            <Flex gap="middle" wrap>
                <QRCode value={`${pref_in}${id}`} />
                <QRCode value={`${pref_out}${id}`} />
            </Flex>
        </>
    );
}