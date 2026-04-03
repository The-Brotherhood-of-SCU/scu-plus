import type { PlasmoCSConfig } from "plasmo"
import { initIdCaptchaOcr } from "~features/ocr/id-captcha"

export const config: PlasmoCSConfig = {
  matches: ["*://id.scu.edu.cn/*"],
  run_at: "document_end",
}

initIdCaptchaOcr();
