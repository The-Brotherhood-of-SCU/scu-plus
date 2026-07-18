import type { PlasmoCSConfig } from "plasmo"
import { initRedirectLogin } from "~features/redirect-login"

export const config: PlasmoCSConfig = {
    matches: [
        "*://zhjw.scu.edu.cn/*login*",
    ],
    run_at: "document_start",
    all_frames: true
}

initRedirectLogin().catch((e) => console.warn("SCU+: 登录重定向初始化失败", e));
