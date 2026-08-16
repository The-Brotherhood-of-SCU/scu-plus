/**
 * zhjw 验证码 OCR 的浏览器侧封装：
 *   1. 通过外部 OCR 包识别验证码（模型与 CNN 推理已移至独立仓库）
 *   2. 预处理（去黑线、灰度反色、缩放）与推理由外部包完成
 *   3. 本文件只负责 zhjw 登录页的 DOM 集成：查找验证码图片/输入框、自动识别并填写
 *
 * 若外部 OCR 包尚未接入（见 `docs/ocr-package-integration.md`），
 * 识别自动降级为空串，不影响登录页其余功能。
 */
import { getZhjwCaptchaRecognizer, warmupZhjwOcr } from "~features/ocr/zhjw-ocr-adapter"
import { getSetting } from "~script/config"

export { warmupZhjwOcr }

/**
 * 识别 zhjw 验证码图片，返回 4 位字符。
 * 未接入外部 OCR 包、或置信度不足、或图片不可用时返回空串。
 */
export async function ocrZhjw(imageElement: HTMLImageElement): Promise<string> {
  const recognizer = getZhjwCaptchaRecognizer();
  if (!recognizer) {
    console.warn("[SCU+] zhjw 验证码识别未接入（外部 OCR 包未安装），跳过识别");
    return "";
  }
  try {
    return await recognizer.recognize(imageElement);
  } catch (e) {
    console.warn("[SCU+] zhjw 验证码识别失败", e);
    return "";
  }
}

// ---------------------------------------------------------------------------
// 内容脚本集成
// ---------------------------------------------------------------------------

/**
 * 初始化 zhjw 登录页验证码自动识别。
 * 在 zhjw 登录页（未重定向到统一认证时）自动识别并填写验证码。
 */
export async function initZhjwCaptchaOcr(): Promise<void> {
  const savedSettings = await getSetting();
  if (!savedSettings.ocrSwitch) return;

  // 后台预加载模型
  warmupZhjwOcr();

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

  /** 查找验证码图片 */
  const getCaptchaImage = (): HTMLImageElement | null => {
    const selectors = [
      "img#captchaImg",
      "img.captcha",
      "img[src*='captcha']",
      "img[src*='verifyCode']",
      "img[src*='imgcode']",
      "img[src*='Captcha']",
    ];
    for (const sel of selectors) {
      const img = document.querySelector<HTMLImageElement>(sel);
      if (img && isVisible(img)) return img;
    }
    // 兜底：查找登录表单内的图片
    const form = document.querySelector("form");
    if (form) {
      const img = form.querySelector<HTMLImageElement>("img");
      if (img && isVisible(img)) return img;
    }
    return null;
  };

  /** 查找验证码输入框 */
  const getCaptchaInput = (): HTMLInputElement | null => {
    const selectors = [
      "input#captcha",
      "input[name='captcha']",
      "input[name='validateCode']",
      "input[name='verifyCode']",
      "input[placeholder*='验证码']",
      "input[placeholder*='captcha' i]",
    ];
    for (const sel of selectors) {
      const input = document.querySelector<HTMLInputElement>(sel);
      if (input && isVisible(input)) return input;
    }
    // 兜底：查找登录表单内较短的文本输入框（验证码输入框通常较短）
    const form = document.querySelector("form");
    if (form) {
      const inputs = Array.from(form.querySelectorAll<HTMLInputElement>("input[type='text']"));
      const visible = inputs.filter(isVisible);
      // 排除用户名输入框（通常 name/placeholder 包含 user/账号/学号）
      const captchaLike = visible.filter((i) => {
        const name = (i.name + " " + i.placeholder + " " + i.id).toLowerCase();
        return !name.includes("user") && !name.includes("账号") && !name.includes("学号") && !name.includes("username");
      });
      if (captchaLike.length > 0) return captchaLike[captchaLike.length - 1];
    }
    return null;
  };

  const scheduleRun = (delay = 120) => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void runOcr();
    }, delay);
  };

  const bindCaptchaLoadListener = (img: HTMLImageElement) => {
    const marker = "__scuZhjwOcrLoadBound";
    if ((img as any)[marker]) return;
    (img as any)[marker] = true;
    img.addEventListener("load", () => scheduleRun(60));
  };

  const runOcr = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      const img = getCaptchaImage();
      if (!img) return;
      bindCaptchaLoadListener(img);

      if (!img.complete || !(img.naturalWidth || img.width) || !(img.naturalHeight || img.height)) {
        return;
      }

      const input = getCaptchaInput();
      if (!input || !isVisible(input)) return;

      const src = img.currentSrc || img.src || "";
      if (src !== lastCaptchaSrc) {
        if (lastRecognizedSrc && input.value.trim().length === 4) {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        lastCaptchaSrc = src;
        lastRecognizedSrc = "";
        retryCount = 0;
      }
      if (input.value.trim().length > 0 && !lastRecognizedSrc) return;
      if (src === lastRecognizedSrc && input.value.trim().length === 4) return;

      const resultRaw = await ocrZhjw(img);
      const result = String(resultRaw || "").replace(/\s+/g, "");

      if (result.length !== 4) {
        if (retryCount < 3) {
          retryCount++;
          window.setTimeout(() => img.click(), 350);
        }
        return;
      }

      retryCount = 0;
      input.value = result;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      lastRecognizedSrc = src;
    } catch (e) {
      // 偶发失败，静默等待下次触发
    } finally {
      running = false;
    }
  };

  document.addEventListener("click", (e) => {
    const target = e.target as Element | null;
    if (!target) return;
    if (target instanceof HTMLImageElement) {
      const src = (target.src || "").toLowerCase();
      if (src.includes("captcha") || src.includes("verifycode") || src.includes("imgcode")) {
        scheduleRun(120);
      }
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

  scheduleRun(200);
}
