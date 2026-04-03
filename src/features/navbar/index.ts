import { $ } from "~common";
import package_config from "../../../package.json"
import { SettingItem } from "../../common/types"

export function injectNavbar(settings: SettingItem): void {
  $("#navbar", (navBar) => {
    navBar.style.backgroundImage = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    navBar.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    navBar.style.borderRadius = "4px";

    $("#navbar-container > div.navbar-header.pull-left > a > small", (title) => {
      title.style.color = "black";
      title.innerText = `四川大学教务管理系统(SCU+ v${package_config.version})\u{1f3af}`;
    });

    if (settings.nameHideSwitch) {
      $("#navbar-container > div.navbar-buttons.navbar-header.pull-right > ul > li.light-blue > a > span", (e) => {
        e.innerHTML = `
          <small>欢迎您，</small>
          ${settings.nameHideText}
        `;
      });
    }
  });
}
