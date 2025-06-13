import type { PlasmoCSConfig } from "plasmo"
import { getSetting, SettingItem } from "~script/config";
import { ocr_external } from "~script/ocr_external";

export const config: PlasmoCSConfig = {
    matches: ["*://acm.scu.edu.cn/teach/"],
    run_at: "document_end",
}
let savedSettings: SettingItem;
let savedSettingsAsync: Promise<SettingItem>;

//OCR次数
let ocr_counts = 0;

(async () => {
    savedSettingsAsync = getSetting();
    savedSettings = await savedSettingsAsync;
})();

window.addEventListener("load", () => {
    setTimeout(() => {
        const img = document.querySelector("#app > div > div > form > img") as HTMLImageElement
        const input = document.getElementsByClassName("el-input__inner")[2] as HTMLInputElement
        const ocrFunc = async () => {
            if (savedSettings == null) {
                savedSettings = await savedSettingsAsync;
            }
            if (savedSettings.ocrProvider != "") {
                ocr_counts++;
                process(savedSettings.ocrProvider, img, input);
            }
        }
        img.onload = ocrFunc
        ocrFunc();
    }, 1000);
})



async function process(provider: string, img: HTMLImageElement, input: HTMLInputElement): Promise<void> {
    try {
        var result = await ocr_external(img, provider);
        // 验证码识别问题，最多重试3次
        if (result.length != 4 && ocr_counts <= 3) {
            ocr_counts++;
            img.click();
            return;
        }
        ocr_counts = 0;
        console.log("ocr: " + result)
        input.value = result;
        input.dispatchEvent(new Event('input'));
    } catch (e) {
        console.error(e)
    }
}

