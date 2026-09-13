/**
 * zhjw 验证码 OCR 的浏览器侧封装：
 *   1. 通过外部 OCR 包识别验证码（模型与 CNN 推理已移至独立仓库）
 *   2. 预处理（去黑线、灰度反色、缩放）与推理由外部包完成
 *   3. 本文件只负责 zhjw 登录页的 DOM 集成：查找验证码图片/输入框，
 *      识别/填写/重试的状态机在 `captcha-autofill.ts`
 *
 * 若外部 OCR 包尚未接入（见 `docs/ocr-package-integration.md`），
 * 识别自动降级为空串，不影响登录页其余功能。
 */
import { getZhjwCaptchaRecognizer, warmupZhjwOcr } from "~features/ocr/zhjw-ocr-adapter"
import { createCaptchaAutoFill } from "~features/ocr/captcha-autofill"
import { getSetting } from "~script/config"

/**
 * 识别 zhjw 验证码图片。
 * 未接入外部 OCR 包、或置信度不足、或图片不可用时返回空串。
 */
async function ocrZhjw(imageElement: HTMLImageElement): Promise<string> {
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

/**
 * 初始化 zhjw 登录页验证码自动识别。
 * 在 zhjw 登录页（未重定向到统一认证时）自动识别并填写验证码。
 */
export async function initZhjwCaptchaOcr(): Promise<void> {
  const savedSettings = await getSetting();
  if (!savedSettings.ocrSwitch) return;

  createCaptchaAutoFill({
    recognize: ocrZhjw,
    warmup: warmupZhjwOcr,
    locate: () => {
      const img = getCaptchaImage();
      if (!img) return null;
      const input = getCaptchaInput();
      if (!input) return null;
      return { img, input };
    },
    onClickCapture: (target) => {
      // 点击验证码图（刷新验证码）后立即重新识别
      if (target instanceof HTMLImageElement) {
        const src = (target.src || "").toLowerCase();
        if (src.includes("captcha") || src.includes("verifycode") || src.includes("imgcode")) {
          return 120;
        }
      }
      return null;
    },
    initialDelay: 200
  });
}
