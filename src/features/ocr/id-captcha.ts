import { getSetting, SettingItem } from "~script/config";
import { ocr_external } from "~script/ocr_external";

export async function initIdCaptchaOcr(): Promise<void> {
  const img = document.getElementsByClassName("captcha-img")[0] as HTMLImageElement;
  const input = document.getElementsByClassName("ivu-input ivu-input-default")[2] as HTMLInputElement;

  if (!img || !input) return;

  //OCR次数
  let ocr_counts = 0;

  const savedSettings = await getSetting();

  img.onload = async () => {
    if (savedSettings.ocrProvider != "") {
      await process(img, input, savedSettings.ocrProvider);
    }
  }

  // 初次加载也执行一次
  if (img.complete) {
    if (savedSettings.ocrProvider != "") {
      await process(img, input, savedSettings.ocrProvider);
    }
  }

  async function process(img: HTMLImageElement, input: HTMLInputElement, provider: string): Promise<void> {
    try {
      var result = await ocr_external(img, provider);
      // 验证码识别问题，最多重试3次
      if (result.length != 4 && ocr_counts <= 3) {
        ocr_counts++;
        img.click();
        return;
      }
      ocr_counts=0;
      console.log("ocr: " + result)
      input.value = result;
      input.dispatchEvent(new Event('input'));
    } catch (e) {
      console.error(e)
    }
  }
}
