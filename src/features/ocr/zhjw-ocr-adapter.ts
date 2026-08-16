/**
 * zhjw 验证码识别器适配层。
 *
 * 模型的 CNN 推理引擎与权重已迁移到独立的 OCR 包
 * `@scu-plus/zhjw-captcha-ocr`（见 `docs/ocr-package-integration.md`），
 * 本文件负责创建并持有识别器实例，供登录页集成代码调用。
 */
import {
  createZhjwCaptchaOcr,
  type ZhjwCaptchaRecognizer,
} from "@scu-plus/zhjw-captcha-ocr"

export type { ZhjwCaptchaRecognizer }

let recognizer: ZhjwCaptchaRecognizer | null = null

/** 惰性创建识别器实例 */
function ensureRecognizer(): ZhjwCaptchaRecognizer | null {
  if (!recognizer) {
    try {
      recognizer = createZhjwCaptchaOcr()
    } catch (e) {
      console.warn("[SCU+] zhjw OCR 识别器创建失败", e)
    }
  }
  return recognizer
}

/** 获取当前识别器；创建失败时返回 null（识别降级） */
export function getZhjwCaptchaRecognizer(): ZhjwCaptchaRecognizer | null {
  return ensureRecognizer()
}

/** 覆盖/注入识别器实例（调试或自定义实现时使用） */
export function setZhjwCaptchaRecognizer(impl: ZhjwCaptchaRecognizer | null): void {
  recognizer = impl
}

/** 预热识别器（若可用） */
export function warmupZhjwOcr(): void {
  try {
    ensureRecognizer()?.warmup()
  } catch (e) {
    console.warn("[SCU+] zhjw OCR 预热失败", e)
  }
}
