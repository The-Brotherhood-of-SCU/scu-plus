/**
 * 纯 JS 实现的质心模板匹配 OCR 推理引擎。
 *
 * 特征：48 像素 (8×6 二值图) + 1 宽高比 = 49 维。
 * 模型：36 类 × 49 维 uint8 质心模板，欧氏距离 + 宽高比加权。
 * 零外部依赖，无 DOM 依赖。
 */

/** 验证码图像尺寸 */
export const CAPTCHA_WIDTH = 80;
export const CAPTCHA_HEIGHT = 26;

/** 字符尺寸（预处理输出） */
export const CHAR_H = 8;
export const CHAR_W = 6;
export const FEAT_DIM = CHAR_H * CHAR_W; // 48
export const FEAT_DIM_WITH_AR = FEAT_DIM + 1; // 49

/** 字符集：0-9a-z */
export const CHARSET = "0123456789abcdefghijklmnopqrstuvwxyz";
const NUM_CLASSES = 36;
const CAPTCHA_LEN = 4;

/** 宽高比归一化上限 */
const MAX_ASPECT_RATIO = 2.0;
/** 宽高比权重（推理时施加，避免 uint8 量化截断丢失信息） */
const AR_WEIGHT = 25.0;

export interface CentroidWeights {
  model_type: string;
  version: string;
  charset: string;
  num_classes: number;
  char_h: number;
  char_w: number;
  input_dim: number;
  ar_weight: number;
  max_aspect_ratio: number;
  centroids_b64: string;
  centroids_shape: [number, number];
  preprocessing: {
    gray_line_color: [number, number, number];
    gray_line_tolerance: number;
    color_quantize_step: number;
    num_chars: number;
    char_threshold: number;
    max_aspect_ratio: number;
    ar_weight: number;
  };
}

/**
 * 解析质心模板 JSON（将 base64 编码的 uint8 质心解码为 Float32Array [0,1]）。
 */
export function parseCentroidJson(data: CentroidWeights): Float32Array {
  const binaryStr = atob(data.centroids_b64);
  const raw = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    raw[i] = binaryStr.charCodeAt(i);
  }
  const centroids = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    centroids[i] = raw[i] / 255.0;
  }
  return centroids;
}

/**
 * 对单个字符特征向量进行分类。
 *
 * @param feature - 49 维 Float32Array：[48 像素值, 宽高比归一化值]
 * @param centroids - 36×49 质心模板 Float32Array
 * @returns [字符索引, 置信度]
 */
export function classifyChar(
  feature: Float32Array | number[],
  centroids: Float32Array
): [number, number] {
  const numClasses = NUM_CLASSES;
  const dim = FEAT_DIM_WITH_AR;
  let bestIdx = 0;
  let bestDist = Infinity;
  let worstDist = 0;

  for (let c = 0; c < numClasses; c++) {
    const offset = c * dim;
    let pixelDist = 0;
    // 前 48 维：像素距离
    for (let i = 0; i < FEAT_DIM; i++) {
      const d = feature[i] - centroids[offset + i];
      pixelDist += d * d;
    }
    // 第 49 维：宽高比加权距离
    const arDiff = feature[FEAT_DIM] - centroids[offset + FEAT_DIM];
    const dist = pixelDist + AR_WEIGHT * arDiff * arDiff;

    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = c;
    }
    if (dist > worstDist) {
      worstDist = dist;
    }
  }

  // 置信度：1 - sqrt(d_min) / sqrt(d_max)
  const confidence = worstDist > 0
    ? 1.0 - Math.sqrt(bestDist) / Math.sqrt(worstDist)
    : 0;

  return [bestIdx, Math.max(0, Math.min(1, confidence))];
}

/** 归一化宽高比到 [0, 1] */
export function normalizeAspectRatio(ar: number): number {
  return Math.max(0, Math.min(1, ar / MAX_ASPECT_RATIO));
}
