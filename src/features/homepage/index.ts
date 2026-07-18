import { getSetting, SettingItem } from "../../script/config";
import { dailySentence } from "../../script/utils";
import { injectNavbar } from "../navbar";
import { injectMenu } from "../menu";
import { injectSchoolSchedule } from "../schedule";

function updateCookie(key: string, value: string) {
  // 只写目标 cookie 即可；不要解析重写整个 cookie 串——
  // split("=") 会截断含 = 的值，统一 path=/ 会改变其他 cookie 的作用域并丢失 expires
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/`;
}

export function injectDailyQuote(): void {
  updateCookie("selectionBar", "");
  setTimeout(() => showDailyQuoteModal(), 1000);
}

async function showDailyQuoteModal() {
  const word = await dailySentence();
  if (!word) return;

  const modal = document.createElement('div');
  modal.id = 'custom-modal';
  modal.style.cssText = `
    position: fixed;
    top: 100px;
    right: -400px;
    background: linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(245,247,250,0.96) 100%);
    backdrop-filter: blur(12px);
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08);
    z-index: 9999;
    width: 380px;
    font-family: 'Segoe UI', 'PingFang SC', system-ui;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    border: 1px solid rgba(255,255,255,0.3);
    transform-origin: 95% 0;
    opacity: 0;
  `;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.08);
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 20px;
    color: #666;
    cursor: pointer;
    transition: all 0.5s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  closeButton.onmouseover = () => {
    closeButton.style.background = 'rgba(255,80,80,0.15)';
    closeButton.style.color = '#ff5050';
  };

  closeButton.onmouseout = () => {
    closeButton.style.background = 'rgba(0,0,0,0.08)';
    closeButton.style.color = '#666';
  };

  closeButton.onclick = () => {
    modal.style.transform = 'scale(0.95)';
    modal.style.opacity = '0';
    modal.style.right = '-400px';
    setTimeout(() => modal.remove(), 400);
  };

  const content = document.createElement('div');
  content.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 16px;">
      <svg style="width: 24px; height: 24px; margin-right: 12px; color: #4a90e2;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
      </svg>
      <h3 style="margin:0; font-size: 18px; color: #2c3e50; font-weight: 600;">诗词歌赋</h3>
    </div>
    <div style="padding-left: 36px;">
      <p style="margin:0; font-size: 15px; color: #34495e; line-height: 1.7; 
         position: relative; padding-left: 20px;">
        <span style="position: absolute; left: 0; color: #4a90e2; font-weight: bold;">"</span>
        ${word}
      </p>
    </div>
  `;

  modal.appendChild(closeButton);
  modal.appendChild(content);
  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    modal.style.right = '24px';
    modal.style.opacity = '1';
    modal.style.transform = 'scale(1)';
  });

  setTimeout(() => {
    modal.style.transform = 'scale(0.98)';
    modal.style.opacity = '0.8';
  }, 5000);
  setTimeout(() => {
    modal.style.opacity = '0';
    modal.style.right = '-400px';
    setTimeout(() => modal.remove(), 400);
  }, 8000);
}

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
      noticeText.style.color = "black";
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

export async function initHomePage(): Promise<void> {
  let savedSettings = await getSetting();

  console.log("SCU+插件加载成功\u{1f3af}");

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
}
