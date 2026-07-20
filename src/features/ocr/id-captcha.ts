import { ocrLocal, warmupLocalOcr } from "~features/ocr/local-ocr";
import { getSetting } from "~script/config";

export async function initIdCaptchaOcr(): Promise<void> {
  const savedSettings = await getSetting();
  if (!savedSettings.ocrSwitch) return;

  // 后台预加载本地模型，消除首次识别的加载延迟
  warmupLocalOcr();

  let running = false;
  let timer: number | null = null;
  let lastCaptchaSrc = "";
  let lastRecognizedSrc = "";
  let retryCount = 0;

  const isVisible = (el: Element | null): el is HTMLElement => {
    if (!(el instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
  };

  const getActiveTabText = (): string => {
    const activeTab = document.querySelector<HTMLElement>(".login-tab .login-tab-item-active");
    return (activeTab?.textContent || "").trim();
  };

  const getCurrentLoginForm = (): HTMLFormElement | null => {
    const activeTab = getActiveTabText();
    const forms = Array.from(document.querySelectorAll<HTMLFormElement>("form"))
      .filter((form) => isVisible(form));

    if (!forms.length) return null;

    if (activeTab.includes("账号登录")) {
      return forms.find((form) =>
        Array.from(form.querySelectorAll<HTMLInputElement>("input"))
          .some((i) => /请输入密码/.test(i.placeholder || ""))
      ) || null;
    }

    if (activeTab.includes("短信登录")) {
      return forms.find((form) =>
        Array.from(form.querySelectorAll<HTMLInputElement>("input"))
          .some((i) => /短信验证码/.test(i.placeholder || ""))
      ) || null;
    }

    return forms[0] || null;
  };

  const getCaptchaInput = (form: HTMLFormElement): HTMLInputElement | null => {
    const inputs = Array.from(form.querySelectorAll<HTMLInputElement>("input"));
    return inputs.find((i) => {
      const p = i.placeholder || "";
      return /请输入验证码/.test(p) && !/短信验证码/.test(p);
    }) || null;
  };

  const getCaptchaImage = (form: HTMLFormElement, input: HTMLInputElement): HTMLImageElement | null => {
    const explicit = form.querySelector<HTMLImageElement>("img.captcha-img");
    if (explicit) return explicit;

    const inCaptchaBox = input.closest(".captcha-box")?.querySelector<HTMLImageElement>("img");
    if (inCaptchaBox) return inCaptchaBox;

    const inFormItem = input.closest(".form-item")?.querySelector<HTMLImageElement>("img");
    if (inFormItem) return inFormItem;

    return form.querySelector<HTMLImageElement>("img");
  };

  const scheduleRun = (delay = 120) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      void runOcrForCurrentTab();
    }, delay);
  };

  const bindCaptchaLoadListener = (img: HTMLImageElement) => {
    const marker = "__scuOcrLoadBound";
    if ((img as any)[marker]) return;
    (img as any)[marker] = true;
    img.addEventListener("load", () => scheduleRun(60));
  };

  const runOcrForCurrentTab = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      const activeTab = getActiveTabText();
      if (!(activeTab.includes("账号登录") || activeTab.includes("短信登录"))) return;

      const form = getCurrentLoginForm();
      if (!form) return;

      const input = getCaptchaInput(form);
      if (!input || !isVisible(input)) return;
      if (input.value.trim().length > 0) return;

      const img = getCaptchaImage(form, input);
      if (!img || !isVisible(img)) return;

      bindCaptchaLoadListener(img);

      if (!img.complete || !(img.naturalWidth || img.width) || !(img.naturalHeight || img.height)) {
        return;
      }

      const src = img.currentSrc || img.src || "";
      if (src !== lastCaptchaSrc) {
        lastCaptchaSrc = src;
        lastRecognizedSrc = "";
        retryCount = 0;
      }
      if (src === lastRecognizedSrc && input.value.trim().length === 4) return;

      const resultRaw = await ocrLocal(img);
      const result = String(resultRaw || "").replace(/\s+/g, "");

      if (result.length !== 4) {
        if (retryCount < 3) {
          retryCount++;
          img.click();
        }
        return;
      }

      retryCount = 0;
      input.value = result;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      lastRecognizedSrc = src;
    } catch (e) {
      // 本地 OCR 偶发失败（如图片未加载完成），保持静默等待下次触发。
    } finally {
      running = false;
    }
  };

  document.addEventListener("click", (e) => {
    const target = e.target as Element | null;
    if (!target) return;
    if (target.closest(".login-tab .login-tab-item")) {
      scheduleRun(160);
      return;
    }
    if (target instanceof HTMLImageElement && target.closest(".captcha-box")) {
      scheduleRun(120);
    }
  }, true);

  try {
    const mo = new MutationObserver(() => scheduleRun(120));
    mo.observe(document.body || document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "style", "src"]
    });
  } catch (e) {}

  scheduleRun(50);
}
