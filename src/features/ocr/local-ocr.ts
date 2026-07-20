/**
 * 本地 OCR 的浏览器侧封装：负责加载内置权重、用 canvas 把验证码图片
 * 预处理为模型输入（左上角 80×26 裁剪，不足则缩放），再调用纯 JS 推理引擎。
 *
 * 权重经 Plasmo `url:` 导入打入扩展包并自动注册到 web_accessible_resources，
 * 识别全程在本地完成，不发起任何网络请求。
 */
import modelUrl from "url:~assets/model.scuocr"

import {
  CAPTCHA_HEIGHT,
  CAPTCHA_WIDTH,
  CaptchaModel,
  rgbaToInvertedChw
} from "~features/ocr/model"

/**
 * 单字符 softmax 概率低于该阈值时认为识别不可靠，返回空串，
 * 由调用方点击验证码换一张重试（模型在统一认证验证码上的正常
 * 表现远高于此阈值，基本只拦截异常情形）。
 */
const MIN_CHAR_CONFIDENCE = 0.5;

let modelPromise: Promise<CaptchaModel> | null = null;

/** 懒加载并缓存模型（首次调用时 fetch 权重并完成 BN 折叠） */
function getModel(): Promise<CaptchaModel> {
  if (!modelPromise) {
    modelPromise = fetch(modelUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`加载 OCR 权重失败: HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => CaptchaModel.fromBytes(buf))
      .catch((e) => {
        // 失败后允许下次重试
        modelPromise = null;
        throw e;
      });
  }
  return modelPromise;
}

/** 提前在后台加载模型，消除首次识别时的加载延迟（可安全重复调用） */
export function warmupLocalOcr(): void {
  getModel().catch((e) => console.warn("OCR 模型预加载失败", e));
}

/**
 * 识别验证码图片。
 * 返回 4 位字符；置信度过低或图片不可用时返回空串（调用方应换一张验证码重试）。
 */
export async function ocrLocal(imageElement: HTMLImageElement): Promise<string> {
  const naturalW = imageElement.naturalWidth || imageElement.width;
  const naturalH = imageElement.naturalHeight || imageElement.height;
  if (!naturalW || !naturalH) {
    throw new Error("Captcha image size is invalid");
  }

  const canvas = document.createElement("canvas");
  canvas.width = CAPTCHA_WIDTH;
  canvas.height = CAPTCHA_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  // 白底打底，避免透明背景 PNG 合成出黑色
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);

  if (naturalW >= CAPTCHA_WIDTH && naturalH >= CAPTCHA_HEIGHT) {
    // 与训练预处理一致：裁剪左上角 80×26（drawImage 超出画布部分自动裁掉）
    ctx.drawImage(imageElement, 0, 0);
  } else {
    // 图片小于模型输入时缩放到 80×26
    ctx.drawImage(imageElement, 0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
  }

  const imageData = ctx.getImageData(0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
  const model = await getModel();
  const { text, confidence } = model.forward(
    rgbaToInvertedChw(imageData.data, CAPTCHA_WIDTH, CAPTCHA_HEIGHT)
  );
  console.log(`ocr(local): ${text} (confidence: ${confidence.toFixed(3)})`);
  return confidence >= MIN_CHAR_CONFIDENCE ? text : "";
}
