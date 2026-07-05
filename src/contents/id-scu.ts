import type { PlasmoCSConfig } from "plasmo"
import { initChangePasswd } from "~features/skip-2fa/id-scu-skip-change-passwd"

export const config: PlasmoCSConfig = {
  matches: ["*://id.scu.edu.cn/*"],
  run_at: "document_start",
}

initChangePasswd()
