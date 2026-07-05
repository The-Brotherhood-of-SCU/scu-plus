import type { PlasmoCSConfig } from "plasmo"

import {initSkip2Fa} from "~features/skip-2fa/id-scu-skip2fa";
import {initChangePasswd} from "~features/skip-2fa/id-scu-skip-change-passwd";


export const config: PlasmoCSConfig = {
  matches: ["*://id.scu.edu.cn/*"],
  run_at: "document_start",
  world: "MAIN",
}

initSkip2Fa();
initChangePasswd();