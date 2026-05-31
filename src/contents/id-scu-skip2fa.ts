// 此 content script 运行在 MAIN world，用于拦截页面的 fetch/XHR 请求
// 必须运行在 MAIN world 才能拦截页面的网络请求（ISOLATED world 的 window.fetch 是独立副本）
// 开关状态通过 document.documentElement.dataset.__scu_skip2fa 从 ISOLATED world 的 content script 传入
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["*://id.scu.edu.cn/*"],
  run_at: "document_start",
  world: "MAIN",
}

// 需要拦截的 API 及其修改逻辑
const RULES: Array<{ url: string; modify(json: any): boolean }> = [
  {
    url: "/api/bff/v1.2/2factor/select",
    modify(json: any): boolean {
      if (json?.data?.formDto?.userTwoFactory !== true) return false;
      json.data.formDto.userTwoFactory = false;
      return true;
    },
  },
  {
    url: "/api/bff/v1.2/commons/user_setting_info",
    modify(json: any): boolean {
      if (json?.data?.user2factor !== true) return false;
      json.data.user2factor = false;
      return true;
    },
  },
];

function isEnabled(): boolean {
  return document.documentElement.dataset.__scu_skip2fa === "true";
}

function findRule(url: string) {
  return RULES.find((r) => url.includes(r.url));
}

function applyModify(json: any, url: string): boolean {
  const rule = findRule(url);
  if (!rule) return false;
  return rule.modify(json);
}

// ===== 1. Intercept fetch =====
const origFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);
  return origFetch.call(window, input, init).then(function (response) {
    if (!isEnabled() || !findRule(url)) return response;
    return response.clone().json().then(function (json: any) {
      if (applyModify(json, url)) {
        console.log("[SCU+] 2FA intercepted (fetch):", url);
        return new Response(JSON.stringify(json), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
      return response;
    }).catch(function () {
      return response;
    });
  });
};

// ===== 2. Intercept XHR =====
const origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  async?: boolean,
  username?: string | null,
  password?: string | null
) {
  (this as any).__scu_skip_url = typeof url === "string" ? url : (url as URL).href;
  return origOpen.call(this, method, url, async as boolean, username, password);
};

// responseText getter —— 重写 prototype getter，页面任何时机读取都能拿到修改后的值
const textDescriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText");
if (textDescriptor?.get) {
  const origTextGetter = textDescriptor.get;
  Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
    get: function (): string {
      const value = origTextGetter.call(this);
      if (this.readyState !== 4 || this.status !== 200 || !isEnabled()) return value;
      const url: string = (this as any).__scu_skip_url || "";
      if (!url) return value;
      try {
        const json = JSON.parse(value);
        if (applyModify(json, url)) {
          console.log("[SCU+] 2FA intercepted (XHR responseText):", url);
          return JSON.stringify(json);
        }
      } catch (e) { /* ignore */ }
      return value;
    },
    configurable: true,
    enumerable: true,
  });
}

// response getter
const respDescriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "response");
if (respDescriptor?.get) {
  const origRespGetter = respDescriptor.get;
  Object.defineProperty(XMLHttpRequest.prototype, "response", {
    get: function (): any {
      const value = origRespGetter.call(this);
      if (this.readyState !== 4 || this.status !== 200 || !isEnabled()) return value;
      const url: string = (this as any).__scu_skip_url || "";
      if (!url) return value;
      try {
        const obj = typeof value === "string" ? JSON.parse(value) : value;
        if (applyModify(obj, url)) {
          console.log("[SCU+] 2FA intercepted (XHR response):", url);
          return this.responseType === "json" ? obj : JSON.stringify(obj);
        }
      } catch (e) { /* ignore */ }
      return value;
    },
    configurable: true,
    enumerable: true,
  });
}

console.log("[SCU+] 2FA interceptor injected (main world), rules:", RULES.map((r) => r.url));
