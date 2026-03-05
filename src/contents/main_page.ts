import type { PlasmoCSConfig } from "plasmo"
import { getSetting, SettingItem } from "~script/config";
import { injectNavbar } from "../features/navbar"
import { injectMenu } from "../features/menu"
import { injectSchoolSchedule } from "../features/schedule"
import { injectBeautify, injectCss, hideFailCourse, customText, removePasswordPopup, isHomePage, injectDailyQuote } from "../features/homepage"

export const config: PlasmoCSConfig = {
  matches: [
    "*://zhjw.scu.edu.cn/*",
  ],
  all_frames: true
}

let savedSettings: SettingItem;
let savedSettingsAsync: Promise<SettingItem>;

(async () => {
  savedSettingsAsync = getSetting();
  savedSettings = await savedSettingsAsync;
})();

window.addEventListener("load", async () => {
  if (savedSettings == null) {
    savedSettings = await savedSettingsAsync;
  }

  console.log("SCU+插件加载成功🎯");

  if (savedSettings.passwordPopupSwitch) {
    removePasswordPopup();
  }

  injectNavbar(savedSettings);

  if (savedSettings.beautifySwitch) {
    injectBeautify();
    injectCss();
  }

  injectSchoolSchedule();
  injectMenu();

  if (!isHomePage()) {
    console.log("不是主页，不注入主页特定内容");
    return;
  }

  if (savedSettings.dailyQuoteSwitch) {
    injectDailyQuote();
  }

  hideFailCourse(savedSettings.failSwitch);

  if (savedSettings.gpaCustomText) {
    customText("#gpa", savedSettings.gpaCustomText);
  }

  if (savedSettings.failedCourseCustomText) {
    customText("#coursePas", savedSettings.failedCourseCustomText);
  }
});
