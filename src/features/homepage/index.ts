import { getSetting, SettingItem } from "../../script/config";
import { dailySentence } from "../../script/utils";
import { injectNavbar } from "../navbar";
import { injectMenu } from "../menu";
import { injectSchoolSchedule } from "../schedule";

function updateCookie(key: string, value: string) {
  const cookies = document.cookie
    .split("; ")
    .reduce((acc, cookie) => {
      const [key, val] = cookie.split("=");
      acc[decodeURIComponent(key)] = decodeURIComponent(val);
      return acc;
    }, {} as Record<string, string>);
  cookies[key] = value;
  for (const [k, v] of Object.entries(cookies)) {
    document.cookie = `${encodeURIComponent(k)}=${encodeURIComponent(v)}; path=/`;
  }
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

export function injectBeautify(): void {
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

  $("#page-content-template", (widgetBox) => {
    widgetBox.style.borderRadius = "20px";
    widgetBox.style.border = `2px solid #96e6a1`;
    widgetBox.style.backgroundColor = '#caeae3';
    widgetBox.style.minHeight = "80vh";
    widgetBox.style.margin = "15px";
  });

  for (const sheet of document.styleSheets) {
    try {
      for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
        const rule = sheet.cssRules[i] as any;
        if (rule.selectorText === '.green_background' || rule.selectorText === '.red_background') {
          sheet.deleteRule(i);
        }
      }
    } catch (e) {
      console.warn('无法访问样式表', sheet.href);
    }
  }
}

export function injectCss(): void {
  const css = document.createElement("style");
  css.setAttribute("type", "text/css");
  css.innerHTML = `
    .table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th {
      background-color: #00000000 !important;
    }
    .table-hover>tbody>tr:hover>td,.table-hover>tbody>tr:hover>th {
      background-color: #00000000 !important;
    }
  `;
  document.head.appendChild(css);

  if (window.location.href.match("/student/integratedQuery/scoreQuery/schemeScores/index")) {
    const styles = document.getElementsByTagName("style");
    for (const s of styles) {
      s.innerHTML = s.innerHTML.replaceAll("#d4f0c6", "#00000000");
    }
  }
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
}
