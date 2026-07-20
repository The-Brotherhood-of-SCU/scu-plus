import { $ } from "~common";
import package_config from "../../../package.json"
import { SettingItem } from "../../common/types"

export function injectNavbar(settings: SettingItem): void {
  $("#navbar", (navBar) => {
    if (!settings.beautifySwitch) {
      // 未开启美化时保留旧版渐变导航栏
      navBar.style.backgroundImage = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      navBar.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
      navBar.style.borderRadius = "4px";
    }

    $("#navbar-container > div.navbar-header.pull-left > a > small", (title) => {
      if (settings.beautifySwitch) {
        // 杂志风主题下保持报头简洁，仅展示站点名
        title.innerText = "四川大学教务管理系统";
      } else {
        title.style.color = "black";
        title.innerHTML = `四川大学教务管理系统(SCU+ v${package_config.version})<span style="color:var(--scu-accent,#9e1b32)">✦</span>`;
      }
    });

    if (settings.nameHideSwitch) {
      $("#navbar-container > div.navbar-buttons.navbar-header.pull-right > ul > li.light-blue > a > span", (e) => {
        e.innerHTML = `
          <small>欢迎您，</small>
          ${settings.nameHideText}
        `;
        // 确保父容器不裁剪替换后的内容
        const parent = e.parentElement;
        if (parent) {
          parent.style.overflow = "visible";
          const grandparent = parent.parentElement;
          if (grandparent) {
            grandparent.style.overflow = "visible";
          }
        }
      });
    }
  });
}
