import type { PlasmoCSConfig } from "plasmo"
import { initRedirectLogin } from "~features/redirect-login"

export const config: PlasmoCSConfig = {
    matches: [
        "*://zhjw.scu.edu.cn/*login*",
    ],
    run_at: "document_start",
    all_frames: true
}

initRedirectLogin();
