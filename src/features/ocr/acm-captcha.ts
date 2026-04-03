import { getSetting, SettingItem } from "~script/config";
import { ocr_external } from "~script/ocr_external";

export async function initAcmCaptchaOcr(): Promise<void> {
    const savedSettings = await getSetting();
    let ocr_counts = 0;

    const runOcr = async () => {
        const containers = document.getElementsByClassName("captcha-img-box");
        if (containers.length === 0) return;
        
        const container = containers[0];
        const imgs = container.getElementsByTagName("img");
        if (imgs.length === 0) return;
        
        const img = imgs[0] as HTMLImageElement;
        const inputs = document.getElementsByClassName("el-input__inner");
        if (inputs.length < 3) return;
        
        const input = inputs[2] as HTMLInputElement;

        const process = async (provider: string, img: HTMLImageElement, input: HTMLInputElement): Promise<void> => {
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

        const ocrFunc = async () => {
            if (savedSettings.ocrProvider != "") {
                ocr_counts++;
                await process(savedSettings.ocrProvider, img, input);
            }
        }
        
        img.onload = ocrFunc;
        await ocrFunc();
    }

    // Acm uses some async loading, wait a bit
    setTimeout(runOcr, 1000);
}
