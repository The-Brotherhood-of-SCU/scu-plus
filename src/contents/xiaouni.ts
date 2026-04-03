import type { PlasmoCSConfig } from "plasmo";
import { initMarketEnhance } from "~features/market-enhance";

export const config: PlasmoCSConfig = {
    matches: ["https://u.xiaouni.com/mobile/pages/pd/*"],
    all_frames: true,
};

initMarketEnhance();
