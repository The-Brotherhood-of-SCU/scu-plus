import { ocrLocal, warmupLocalOcr } from "~features/ocr/local-ocr";
import { createCaptchaAutoFill } from "~features/ocr/captcha-autofill";
import { getSetting } from "~script/config";

export async function initIdCaptchaOcr(): Promise<void> {
  const savedSettings = await getSetting();
  if (!savedSettings.ocrSwitch) return;

  // 登录页随浏览器语言切换中/英文，文案匹配必须双语覆盖。
  // 英文文案来自 id.scu.edu.cn 的 en-US 语言包：
  // Account / SMS / Password / Captcha code / SMS code
  const ACCOUNT_TAB_RE = /账号登录|account/i;
  const SMS_TAB_RE = /短信登录|sms/i;
  const PASSWORD_PLACEHOLDER_RE = /请输入密码|password/i;
  const SMS_CODE_PLACEHOLDER_RE = /短信验证码|sms\s*code/i;
  const CAPTCHA_PLACEHOLDER_RE = /请输入验证码|captcha/i;

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

    if (ACCOUNT_TAB_RE.test(activeTab)) {
      return forms.find((form) =>
        Array.from(form.querySelectorAll<HTMLInputElement>("input"))
          .some((i) => PASSWORD_PLACEHOLDER_RE.test(i.placeholder || ""))
      ) || null;
    }

    if (SMS_TAB_RE.test(activeTab)) {
      return forms.find((form) =>
        Array.from(form.querySelectorAll<HTMLInputElement>("input"))
          .some((i) => SMS_CODE_PLACEHOLDER_RE.test(i.placeholder || ""))
      ) || null;
    }

    return forms[0] || null;
  };

  const getCaptchaInput = (form: HTMLFormElement): HTMLInputElement | null => {
    const inputs = Array.from(form.querySelectorAll<HTMLInputElement>("input"));
    return inputs.find((i) => {
      const p = i.placeholder || "";
      return CAPTCHA_PLACEHOLDER_RE.test(p) && !SMS_CODE_PLACEHOLDER_RE.test(p);
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

  createCaptchaAutoFill({
    recognize: ocrLocal,
    warmup: warmupLocalOcr,
    locate: () => {
      // 只处理账号登录 / 短信登录页签，其他页签没有验证码
      const activeTab = getActiveTabText();
      if (!(ACCOUNT_TAB_RE.test(activeTab) || SMS_TAB_RE.test(activeTab))) return null;

      const form = getCurrentLoginForm();
      if (!form) return null;

      const input = getCaptchaInput(form);
      if (!input || !isVisible(input)) return null;

      const img = getCaptchaImage(form, input);
      if (!img || !isVisible(img)) return null;

      return { img, input };
    },
    onClickCapture: (target) => {
      // 切换登录页签后表单整体更换，需要重新定位
      if (target.closest(".login-tab .login-tab-item")) return 160;
      // 点击验证码图（刷新验证码）后立即重新识别
      if (target instanceof HTMLImageElement && target.closest(".captcha-box")) return 120;
      return null;
    },
    initialDelay: 50
  });
}
