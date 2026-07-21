import { Button, notification } from "antd";
import { createElement } from "react";
import { getSetting, SettingItem } from "../../script/config";
import { checkVersion, UpdateCheckResult } from "../../script/utils";
import { injectNavbar } from "../navbar";
import { injectMenu } from "../menu";
import { injectSchoolSchedule } from "../schedule";

export function hideFailCourse(enabled: boolean): void {
  if (!enabled) return;

  const $ = (selector: string, callback: (element: HTMLElement) => void) => {
    const e = document.querySelector(selector) as HTMLElement;
    if (e) {
      try {
        callback(e);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  try {
    $("#coursePas", (notpass) => {
      notpass.style.display = "None";
      const noticeText = document.createElement("div");
      noticeText.innerText = "点击显示";
      noticeText.style.color = "var(--scu-ink, black)";
      notpass.parentNode?.appendChild(noticeText);

      noticeText.onclick = () => {
        notpass.style.display = "";
        noticeText.style.display = "None";
      };

      notpass.onclick = () => {
        notpass.style.display = "None";
        noticeText.style.display = "";
      };
    });
  } catch (e) {
    console.warn(e);
  }
}

export function customText(id: string, text: string): void {
  const $ = (selector: string, callback: (element: HTMLElement) => void) => {
    const e = document.querySelector(selector) as HTMLElement;
    if (e) {
      try {
        callback(e);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  $(id, (e) => {
    e.innerText = text;
    e.setAttribute("id", id + "_changed");
    console.log(`修改${id}文本成功`);
  });
}

export function removePasswordPopup(): void {
  const $ = (selector: string, callback: (element: HTMLElement) => void) => {
    const e = document.querySelector(selector) as HTMLElement;
    if (e) {
      try {
        callback(e);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  $("#view-table > div > div > div > h4 > span > button.btn.btn-default.btn-xs.btn-round", (e) => e.click());

  // 兼容新版修改密码弹窗：提取 helper，检测并移除包含“修改密码/更改密码”或密码字段的 .modal-dialog
  function removeIfPasswordModal(md: Element) {
    try {
      const text = md.textContent || '';
      const hasKeywords = /修改密码|更改密码/.test(text);
      const hasPasswordFields = !!(md.querySelector && (md.querySelector('#oldPass') || md.querySelector('#newPass1') || md.querySelector('#newPass2')));
      if (!(hasKeywords || hasPasswordFields)) return;

      const containerEl = md.closest && md.closest('.modal') || md.parentElement || md;
      const container = containerEl as HTMLElement;
      if (container && typeof container.remove === 'function') {
        container.remove();
      }
    } catch (err) {
      console.warn(err);
    }
  }

  try {
    document.querySelectorAll('.modal-dialog').forEach(removeIfPasswordModal);
  } catch (e) {
    console.warn(e);
  }

  // 同时移除残留的遮罩层
  try {
    document.querySelectorAll('.modal-backdrop.fade.in').forEach(b => { try { (b as HTMLElement).remove(); } catch (e) { console.warn(e); } });
  } catch (e) {
    console.warn(e);
  }
}

export function isHomePage(): boolean {
  const pathname = window.location.pathname;
  return pathname === '/' || /^\/index(\.[a-zA-Z]+)?$/.test(pathname);
}

const UPDATE_CHECKED_SESSION_KEY = "scu-plus-update-checked";

/**
 * 进入教务主页时自动检查更新，有新版本则在右下角弹出提示（每个标签页会话只提示一次）
 */
async function autoCheckUpdate(): Promise<void> {
  try {
    if (sessionStorage.getItem(UPDATE_CHECKED_SESSION_KEY)) return;
    sessionStorage.setItem(UPDATE_CHECKED_SESSION_KEY, "1");

    const info = await checkVersion();
    if (info.result !== UpdateCheckResult.NEW_VERSION_AVAILABLE) return;

    notification.open({
      message: "SCU+ 有新版本可用 🎉",
      description: `检测到新版本 v${info.latestVersion}，点击下方按钮前往下载（已使用 gh-proxy 加速）。`,
      btn: createElement(Button, {
        type: "primary",
        size: "small",
        onClick: () => window.open(info.downloadUrl)
      }, "立即下载"),
      duration: 0,
      placement: "bottomRight",
    });
  } catch (e) {
    // 自动检查失败不应影响主页其他功能
    console.warn("自动检查更新失败:", e);
  }
}

export async function initHomePage(): Promise<void> {
  let savedSettings = await getSetting();

  console.log("SCU+插件加载成功✦");

  if (savedSettings.passwordPopupSwitch) {
    removePasswordPopup();
  }

  injectNavbar(savedSettings);

  // 杂志风主题由 contents/zhjw-beautify.ts 在 document_start 提前注入，此处不再重复

  injectSchoolSchedule();
  injectMenu();

  if (!isHomePage()) {
    console.log("不是主页，不注入主页特定内容");
    return;
  }

  if (savedSettings.autoUpdateCheckSwitch) {
    autoCheckUpdate();
  }

  hideFailCourse(savedSettings.failSwitch);

  if (savedSettings.gpaCustomText) {
    customText("#gpa", savedSettings.gpaCustomText);
  }

  if (savedSettings.failedCourseCustomText) {
    customText("#coursePas", savedSettings.failedCourseCustomText);
  }
}
