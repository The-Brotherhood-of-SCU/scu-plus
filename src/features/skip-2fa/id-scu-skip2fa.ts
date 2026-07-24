// 此 content script 运行在 MAIN world，用于拦截页面的 fetch/XHR 请求
// 必须运行在 MAIN world 才能拦截页面的网络请求（ISOLATED world 的 window.fetch 是独立副本）
// 开关状态通过 document.documentElement.dataset.__scu_skip2fa 从 ISOLATED world 的 content script 传入


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

// ── 505/2factor-pending 检测 ──────────────────────────────────────
// 教务处高峰期可能返回 505 错误，此时跳2FA与系统不兼容，需要提示用户关闭
let _notified505 = false;

function is505PendingError(json: any): boolean {
  return json?.code === "505" && json?.data?.info === "2factor-pending";
}

function isSpLogged(url: string): boolean {
  return url.includes("/api/bff/v1.2/commons/sp_logged");
}

function check505Error(json: any, url: string): void {
  if (_notified505) return;
  if (!isSpLogged(url)) return;
  if (!is505PendingError(json)) return;
  _notified505 = true;
  console.warn("[SCU+] 505/2factor-pending detected, skip-2fa is incompatible:", url);
  show505Notification();
}

function show505Notification(): void {
  // 自动关闭跳2FA，避免继续拦截导致连锁问题
  document.documentElement.dataset.__scu_skip2fa = "false";

  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:fixed!important;inset:0!important;z-index:2147483647!important;",
    "background:rgba(0,0,0,.45)!important;display:flex!important;",
    "align-items:center!important;justify-content:center!important;",
  ].join("");

  const modal = document.createElement("div");
  modal.style.cssText = [
    "box-sizing:border-box!important;width:400px!important;",
    "max-width:calc(100vw - 48px)!important;background:#fffdf8!important;",
    "color:#1d1c1a!important;border:1px solid #e4e0d4!important;",
    "border-radius:8px!important;padding:24px!important;",
    "font:14px/1.6 system-ui,-apple-system,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif!important;",
    "box-shadow:0 6px 16px 0 rgba(0,0,0,.08)!important;",
  ].join("");

  modal.innerHTML = [
    '<div style="font-weight:600;font-size:15px;margin:0;display:flex;align-items:center;gap:8px;">',
    '  <span style="color:#d4544a;font-style:normal;font-size:15px;line-height:1;">⚠</span>',
    '  <span>跳2FA提示</span>',
    '</div>',
    '<div style="margin:12px 0 0;font-size:13px;color:#57564f;line-height:1.6;">',
    '  出现 505 错误为教务系统高峰期使用跳2FA的已知异常，',
    '  已自动关闭跳2FA，请重新登陆。',
    '</div>',
    '<div style="margin-top:20px;display:flex;justify-content:flex-end;gap:8px;">',
    '  <button id="scu-505-ok" style="',
    '    display:inline-block;padding:4px 16px;',
    '    font:600 13px/1.5 system-ui,-apple-system,\'Segoe UI\',\'PingFang SC\',\'Microsoft YaHei\',sans-serif;',
    '    color:#fff;background:#9e1b32;border:1px solid #9e1b32;border-radius:4px;cursor:pointer;',
    '  ">我知道了</button>',
    '</div>',
  ].join("");

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const loginUrl = "https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index";

  function closeAndRedirect(): void {
    overlay.remove();
    try { window.location.replace(loginUrl); } catch (_) { window.location.href = loginUrl; }
  }

  document.getElementById("scu-505-ok")?.addEventListener("click", closeAndRedirect);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeAndRedirect();
  });
}

function initSkip2Fa() {
  // ===== 1. Intercept fetch =====
  const origFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);
    return origFetch.call(window, input, init).then(function (response) {
      // 505/2factor-pending 检测（独立于修改规则）
      if (isEnabled() && isSpLogged(url) && !_notified505) {
        return response.clone().json().then(function (json: any) {
          check505Error(json, url);
          return response;
        }).catch(function () {
          return response;
        });
      }

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
        if (this.readyState !== 4 || !isEnabled()) return value;
        const url: string = (this as any).__scu_skip_url || "";
        if (!url) return value;
        try {
          const json = JSON.parse(value);
          // 505 detection even for non-200 responses
          check505Error(json, url);
          if (this.status !== 200) return value;
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
        if (this.readyState !== 4 || !isEnabled()) return value;
        const url: string = (this as any).__scu_skip_url || "";
        if (!url) return value;
        try {
          const obj = typeof value === "string" ? JSON.parse(value) : value;
          // 505 detection even for non-200 responses
          check505Error(obj, url);
          if (this.status !== 200) return value;
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

}

export { initSkip2Fa };