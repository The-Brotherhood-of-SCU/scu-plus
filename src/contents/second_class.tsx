import type { PlasmoCSConfig } from "plasmo";
import ReactDOM from "react-dom/client";
import { $, $all } from "~script/utils";
import { QRCode, Flex } from 'antd';
import React from "react";
import type { NotificationArgsProps } from 'antd';
import {  notification } from "antd"

export const config: PlasmoCSConfig = {
    matches: [
        "*://zjczs.scu.edu.cn/**",
    ],
    all_frames: true,
}
export default () => <></>

async function insertQRcode() {
    let container = document.querySelector('body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(4) > uni-view')
    if (container == null) return;
    let qr_container = document.createElement("div")
    qr_container.style.margin = "20px";
    qr_container.style.padding = "2px";
    container.appendChild(qr_container)
    $('body > uni-app > uni-page > uni-page-wrapper > uni-page-body > uni-view > uni-view:nth-child(4) > uni-view > uni-view:nth-child(6) > uni-view', e => {
        e.style.marginBottom = '0'
    })
    const root = ReactDOM.createRoot(qr_container);
    const searchParams = new URLSearchParams(window.location.search);
    const activity_id = searchParams.get("id");
    if (activity_id == "") return;
    root.render(<QR_container id={activity_id} />)
}

window.addEventListener('load',()=>{
    insertQRcode()
})

function QR_container({ id }: { id: string }) {
    const pref_in = 'https://zjczs.scu.edu.cn/ccylmp/pages/main/index/signing?type=in&state=1&id='
    const pref_out = 'https://zjczs.scu.edu.cn/ccylmp/pages/main/index/signing?type=out&state=1&id='
    return <>
        <span>🎯签到、签退二维码</span>
        <Flex gap="middle" wrap>
            <QRCode value={`${pref_in}${id}`}></QRCode>
            <QRCode value={`${pref_out}${id}`}></QRCode>
        </Flex>
    </>
}