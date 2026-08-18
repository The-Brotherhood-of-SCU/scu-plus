import type { PlasmoCSConfig } from "plasmo"
import { initRedirectLogin } from "~features/redirect-login"
import { initZhjwCaptchaOcr } from "~features/ocr/zhjw-captcha-ocr"

export const config: PlasmoCSConfig = {
    matches: [
        "*://zhjw.scu.edu.cn/*login*",
    ],
    run_at: "document_start",
    all_frames: true
}

initRedirectLogin().catch((e) => console.warn("SCU+: 登录重定向初始化失败", e));

// 登录重定向关闭时，zhjw 登录页自带验证码 → 启动本地 OCR 识别。
// 若重定向开启，页面会立即跳走，OCR 初始化自然作废，无副作用。
initZhjwCaptchaOcr().catch((e) => console.warn("SCU+: zhjw 验证码 OCR 初始化失败", e));
