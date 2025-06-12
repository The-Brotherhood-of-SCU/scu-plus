import type { PlasmoCSConfig } from "plasmo"
import { getSetting, SettingItem } from "~script/config";
import { ocr_external } from "~script/ocr_external";

export const config: PlasmoCSConfig = {
  matches: ["*://id.scu.edu.cn/*"],
  run_at: "document_end",
}


var img = document.getElementsByClassName("captcha-img")[0] as HTMLImageElement;
var input = document.getElementsByClassName("ivu-input ivu-input-default")[2] as HTMLInputElement;

let savedSettings: SettingItem;
let savedSettingsAsync: Promise<SettingItem>;
(async () => {
  savedSettingsAsync = getSetting();
  savedSettings = await savedSettingsAsync;
})();
img.onload = async () => {
  if (savedSettings == null) {
    savedSettings = await savedSettingsAsync;
  }
  if (savedSettings.ocrProvider != "") {
    process(savedSettings.ocrProvider);
  }
}


async function process(provider: string): Promise<void> {
  try {
    var result = await ocr_external(img, provider);
    // 验证码识别问题，最多重试2次
    for(let i=0;i<2;i++){
      if(result.length==4){
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

