//将http://zhjw.scu.edu.cn/login重定向到川大统一登陆

import type { PlasmoCSConfig } from "plasmo";
import { getSetting } from "~script/config";

export const config: PlasmoCSConfig = {
    matches: [
        "http://zhjw.scu.edu.cn/login*",
    ],
    run_at: "document_start",
    all_frames: true
}
getSetting().then((setting) => {
    if (setting.redirectLoginSwitch) {
        window.location.href="https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index"
    }
})
