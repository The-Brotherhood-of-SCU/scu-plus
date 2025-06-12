import type { PlasmoCSConfig } from "plasmo"
import { getSetting, SettingItem } from "~script/config";
import { ocr_external } from "~script/ocr_external";

export const config: PlasmoCSConfig = {
    matches: ["*://acm.scu.edu.cn/teach/"],
    run_at: "document_end",
}
let savedSettings: SettingItem;
let savedSettingsAsync: Promise<SettingItem>;

(async () => {
    savedSettingsAsync = getSetting();
    savedSettings = await savedSettingsAsync;
})();

window.addEventListener("load", () => {
    const img = document.querySelector("#app > div > div > form > img") as HTMLImageElement
    const input = document.getElementsByClassName("el-input__inner")[2] as HTMLInputElement
    const ocrFunc = async () => {
        if (savedSettings == null) {
            savedSettings = await savedSettingsAsync;
        }
        if (savedSettings.ocrProvider != "") {
            process(savedSettings.ocrProvider, img, input);
        }
    }
    img.onload = ocrFunc
    ocrFunc();
})



async function process(provider: string, img: HTMLImageElement, input: HTMLInputElement): Promise<void> {
    try {
        var result = await ocr_external(img, provider);
        // 验证码识别问题，最多重试2次
        for (let i = 0; i < 2; i++) {
            if (result.length == 4) {
                break;
            }
            img.click()
        }
        console.log("ocr: " + result)
        input.value = result;
        input.dispatchEvent(new Event('input'));
    } catch (e) {
        console.error(e)
    }
}

