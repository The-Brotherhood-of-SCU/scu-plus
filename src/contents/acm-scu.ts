import type { PlasmoCSConfig } from "plasmo"
import { initAcmCaptchaOcr } from "~features/ocr/acm-captcha"

export const config: PlasmoCSConfig = {
    matches: ["*://acm.scu.edu.cn/teach/"],
    run_at: "document_end",
}

initAcmCaptchaOcr();
