/**
 * 本地 OCR 的浏览器侧封装：加载内置质心模板权重，用 canvas 对验证码图片
 * 做去灰线、颜色分割、缩放二值化、提取宽高比，最后用质心模板匹配识别。
 *
 * 权重经 Plasmo 内联导入（JSON），零网络请求。
 */
import modelData from "~assets/model_centroid.json"

import {
  CAPTCHA_HEIGHT,
  CAPTCHA_WIDTH,
  CHARSET,
  CHAR_H,
  CHAR_W,
  FEAT_DIM,
  FEAT_DIM_WITH_AR,
  CentroidWeights,
  parseCentroidJson,
  classifyChar,
  normalizeAspectRatio
} from "~features/ocr/model"

// ---------------------------------------------------------------------------
// 预处理常量（与训练一致）
// ---------------------------------------------------------------------------

/** 灰线颜色 RGB（来自验证码生成代码 fill="#6f6e70"） */
const LINE_COLOR_RGB: [number, number, number] = [111, 110, 112];
/** 颜色容差（JPEG 压缩导致的 ±5 偏差） */
const LINE_TOLERANCE = 10;
/** 颜色量化步长 */
const COLOR_QUANT_STEP = 8;
/** 非白像素阈值 */
const WHITE_THRESHOLD = 250;
/** 二值化阈值：白字黑底，值 < 阈值视为文字 */
const BINARIZE_THRESHOLD = 0.3;
/** 最小字符置信度 */
const MIN_CONFIDENCE = 0.3;

// ---------------------------------------------------------------------------
// 预处理函数（纯 canvas API，无外部依赖）
// ---------------------------------------------------------------------------

/** 获取 canvas 的 RGB 像素数据 (Uint8ClampedArray, [R,G,B,R,G,B,...]) */
function getRgbPixels(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): Uint8ClampedArray {
  const imageData = ctx.getImageData(0, 0, w, h);
  const rgba = imageData.data;
  const len = w * h;
  const rgb = new Uint8ClampedArray(len * 3);
  for (let i = 0, p = 0; i < len; i++) {
    rgb[p] = rgba[i * 4];
    rgb[p + 1] = rgba[i * 4 + 1];
    rgb[p + 2] = rgba[i * 4 + 2];
    p += 3;
  }
  return rgb;
}

/** 检查 RGB 像素是否匹配灰线颜色（含容差） */
function isLineColor(
  r: number, g: number, b: number,
  lineColor: [number, number, number],
  tolerance: number
): boolean {
  return (
    Math.abs(r - lineColor[0]) <= tolerance &&
    Math.abs(g - lineColor[1]) <= tolerance &&
    Math.abs(b - lineColor[2]) <= tolerance
  );
}

/** 检查 RGB 像素是否为白色 */
function isWhite(r: number, g: number, b: number, threshold: number): boolean {
  return r > threshold && g > threshold && b > threshold;
}

/**
 * 去掉灰线（精确颜色匹配），返回去灰线后的 RGB 像素数组。
 */
function removeGrayLines(rgb: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const cleaned = new Uint8ClampedArray(rgb.length);
  const len = w * h;
  for (let i = 0, p = 0; i < len; i++) {
    const r = rgb[p], g = rgb[p + 1], b = rgb[p + 2];
    if (isLineColor(r, g, b, LINE_COLOR_RGB, LINE_TOLERANCE)) {
      cleaned[p] = cleaned[p + 1] = cleaned[p + 2] = 255; // 填白
    } else {
      cleaned[p] = r;
      cleaned[p + 1] = g;
      cleaned[p + 2] = b;
    }
    p += 3;
  }
  return cleaned;
}

/**
 * 按颜色分割字符。
 * 返回按 x 中心排序的字符信息数组。
 */
function segmentCharacters(
  rgb: Uint8ClampedArray,
  w: number,
  h: number
): Array<{
  image: Float32Array;  // 8×6 二值图，展平 48 维
  bbox: [number, number, number, number]; // x1, y1, x2, y2
}> {
  const len = w * h;

  // 1. 收集非白像素
  interface Pixel { r: number; g: number; b: number; idx: number; }
  const charPixels: Pixel[] = [];
  for (let i = 0, p = 0; i < len; i++) {
    const r = rgb[p], g = rgb[p + 1], b = rgb[p + 2];
    if (!isWhite(r, g, b, WHITE_THRESHOLD)) {
      charPixels.push({ r, g, b, idx: i });
    }
    p += 3;
  }

  if (charPixels.length < 20) return [];

  // 2. 颜色量化（步长 8），统计最频繁的 4 种颜色
  const quantMap = new Map<string, { rSum: number; gSum: number; bSum: number; count: number }>();
  for (const px of charPixels) {
    const qr = Math.floor(px.r / COLOR_QUANT_STEP) * COLOR_QUANT_STEP;
    const qg = Math.floor(px.g / COLOR_QUANT_STEP) * COLOR_QUANT_STEP;
    const qb = Math.floor(px.b / COLOR_QUANT_STEP) * COLOR_QUANT_STEP;
    const key = `${qr},${qg},${qb}`;
    const existing = quantMap.get(key);
    if (existing) {
      existing.rSum += px.r;
      existing.gSum += px.g;
      existing.bSum += px.b;
      existing.count++;
    } else {
      quantMap.set(key, { rSum: px.r, gSum: px.g, bSum: px.b, count: 1 });
    }
  }

  if (quantMap.size < 4) return [];

  // 按数量降序取 top-4 量化颜色中心
  const sorted = Array.from(quantMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);
  const centers = sorted.map(([_, v]) => ({
    r: Math.round(v.rSum / v.count),
    g: Math.round(v.gSum / v.count),
    b: Math.round(v.bSum / v.count)
  }));

  // 3. 每个像素归属到最近的量化颜色中心
  function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
  }

  const labels = new Int32Array(len).fill(-1);
  for (const px of charPixels) {
    let bestDist = Infinity;
    let bestC = -1;
    for (let c = 0; c < centers.length; c++) {
      const d = colorDist(px.r, px.g, px.b, centers[c].r, centers[c].g, centers[c].b);
      if (d < bestDist) { bestDist = d; bestC = c; }
    }
    labels[px.idx] = bestC;
  }

  // 4. 对每个聚类取 bounding box，裁剪、缩放、二值化
  const chars: Array<{
    image: Float32Array;
    bbox: [number, number, number, number];
  }> = [];

  for (let c = 0; c < centers.length; c++) {
    const ys: number[] = [];
    const xs: number[] = [];
    for (let i = 0; i < len; i++) {
      if (labels[i] === c) {
        const y = Math.floor(i / w);
        const x = i % w;
        ys.push(y);
        xs.push(x);
      }
    }
    if (xs.length < 5) continue;

    const x1 = Math.min(...xs), x2 = Math.max(...xs);
    const y1 = Math.min(...ys), y2 = Math.max(...ys);

    // 裁剪区域 + 颜色蒙版：只保留当前字符颜色的像素，其余设白
    const cropW = x2 - x1 + 1, cropH = y2 - y1 + 1;
    const gray = new Float32Array(cropW * cropH);
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const idx = y * w + x;
        const p = idx * 3;
        if (labels[idx] === c) {
          // 灰度：0.299*R + 0.587*G + 0.114*B
          gray[(y - y1) * cropW + (x - x1)] =
            (0.299 * rgb[p] + 0.587 * rgb[p + 1] + 0.114 * rgb[p + 2]) / 255.0;
        } else {
          gray[(y - y1) * cropW + (x - x1)] = 1.0; // 设为白色
        }
      }
    }

    // 反色 + 二值化
    const bin = new Float32Array(cropW * cropH);
    for (let i = 0; i < cropW * cropH; i++) {
      bin[i] = (1.0 - gray[i]) > BINARIZE_THRESHOLD ? 1.0 : 0.0;
    }

    // 最近邻缩放到 CHAR_H × CHAR_W
    const resized = new Float32Array(CHAR_H * CHAR_W);
    for (let ch = 0; ch < CHAR_H; ch++) {
      const srcY = Math.floor((ch / CHAR_H) * cropH);
      for (let cw = 0; cw < CHAR_W; cw++) {
        const srcX = Math.floor((cw / CHAR_W) * cropW);
        resized[ch * CHAR_W + cw] = bin[srcY * cropW + srcX];
      }
    }

    chars.push({
      image: resized,
      bbox: [x1, y1, x2, y2]
    });
  }

  // 按 x 中心排序
  chars.sort((a, b) => {
    const ax = (a.bbox[0] + a.bbox[2]) / 2;
    const bx = (b.bbox[0] + b.bbox[2]) / 2;
    return ax - bx;
  });

  return chars;
}

// ---------------------------------------------------------------------------
// 模型加载与推理
// ---------------------------------------------------------------------------

/** 缓存的质心模板 Float32Array */
let centroidsCache: Float32Array | null = null;

/** 懒加载质心模板 */
function getCentroids(): Float32Array {
  if (!centroidsCache) {
    centroidsCache = parseCentroidJson(modelData as unknown as CentroidWeights);
  }
  return centroidsCache;
}

/** 提前在后台加载模型（可安全重复调用） */
export function warmupLocalOcr(): void {
  getCentroids();
}

/**
 * 识别验证码图片。
 * 返回 4 位字符；置信度过低或图片不可用时返回空串。
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
    // 裁剪左上角 80×26
    ctx.drawImage(imageElement, 0, 0);
  } else {
    // 缩放到 80×26
    ctx.drawImage(imageElement, 0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
  }

  // 获取 RGB 像素
  const rgb = getRgbPixels(ctx, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);

  // 去灰线
  const cleaned = removeGrayLines(rgb, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);

  // 颜色分割
  const chars = segmentCharacters(cleaned, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
  if (chars.length !== 4) {
    console.log(`ocr(local): 分割失败，得到 ${chars.length} 个字符`);
    return "";
  }

  // 获取质心模板
  const centroids = getCentroids();

  // 逐字符识别
  let text = "";
  let minConf = 1;
  const feature = new Float32Array(FEAT_DIM_WITH_AR);
  for (const ch of chars) {
    // 前 48 维：像素值
    for (let i = 0; i < FEAT_DIM; i++) {
      feature[i] = ch.image[i];
    }

    // 第 49 维：宽高比
    const [x1, y1, x2, y2] = ch.bbox;
    const bw = x2 - x1 + 1;
    const bh = y2 - y1 + 1;
    const ar = bw / Math.max(bh, 1);
    feature[FEAT_DIM] = normalizeAspectRatio(ar);

    const [charIdx, conf] = classifyChar(feature, centroids);
    text += CHARSET[charIdx];
    if (conf < minConf) minConf = conf;
  }

  console.log(`ocr(local): ${text} (confidence: ${minConf.toFixed(3)})`);
  return minConf >= MIN_CONFIDENCE ? text : "";
}
