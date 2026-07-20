/**
 * 纯 JS 实现的验证码 OCR 推理引擎（无任何 DOM / Plasmo 依赖，可在 Node 中测试）。
 *
 * 模型结构（与 scu_ocr_lite_dart 相同，权重文件通用）：
 *   Conv3x3(3→5)  + BN + ReLU + MaxPool2x2   → 5×13×40
 *   Conv3x3(5→7)  + BN + ReLU + MaxPool2x2   → 7×6×20
 *   Conv3x3(7→10) + BN + ReLU + MaxPool2x2   → 10×3×10
 *   Flatten(300) → Linear(300→200) + ReLU → Linear(200→150) + ReLU → Linear(150→144)
 *   144 = 4 位字符 × 36 类（0-9a-z），逐位 argmax 解码。
 *
 * 相对 Dart 版的优化：
 *   - 加载权重时把 BatchNorm 折叠进前一层卷积（数学上等价），推理时不再单独跑 BN；
 *   - ReLU 融合进卷积/全连接的写回阶段；
 *   - 推理全程复用预分配的 Float32Array 缓冲，零中途分配。
 */

/** 验证码图像尺寸（模型输入固定为该尺寸） */
export const CAPTCHA_WIDTH = 80;
export const CAPTCHA_HEIGHT = 26;

/** 字符集：0-9a-z */
export const CHARSET = "0123456789abcdefghijklmnopqrstuvwxyz";
const CHAR_LEN = 36;
const CAPTCHA_LEN = 4;

export interface WeightTensor {
  shape: number[];
  data: Float32Array;
}

export interface OcrResult {
  /** 识别出的 4 位验证码 */
  text: string;
  /** 置信度：4 位字符中最低的 softmax 概率（0~1），可用于低置信时主动换一张验证码 */
  confidence: number;
}

// ---------------------------------------------------------------------------
// .scuocr 权重格式解析
//
// 格式定义（全部为 little-endian）：
//   [Header]
//     magic:        8 bytes  = "SCUOCRLT"
//     version:      4 bytes  = uint32（当前为 1）
//     tensor_count: 4 bytes  = uint32
//   [Per Tensor] × tensor_count
//     name_len: 4 bytes uint32
//     name:     N bytes UTF-8
//     ndim:     4 bytes uint32
//     shape:    ndim × 4 bytes uint32
//     data:     product(shape) × 4 bytes float32
// ---------------------------------------------------------------------------

const SCUOCR_MAGIC = [0x53, 0x43, 0x55, 0x4f, 0x43, 0x52, 0x4c, 0x54]; // "SCUOCRLT"

export function parseScuOcr(bytes: ArrayBuffer): Map<string, WeightTensor> {
  const view = new DataView(bytes);
  const u8 = new Uint8Array(bytes);
  let offset = 0;

  for (let i = 0; i < 8; i++) {
    if (u8[offset + i] !== SCUOCR_MAGIC[i]) {
      throw new Error("无效的 .scuocr 文件：magic 不匹配");
    }
  }
  offset += 8;

  const version = view.getUint32(offset, true);
  offset += 4;
  if (version !== 1) {
    throw new Error(`不支持的 .scuocr 版本: ${version}`);
  }

  const tensorCount = view.getUint32(offset, true);
  offset += 4;

  const decoder = new TextDecoder();
  const tensors = new Map<string, WeightTensor>();

  for (let t = 0; t < tensorCount; t++) {
    const nameLen = view.getUint32(offset, true);
    offset += 4;
    const name = decoder.decode(u8.subarray(offset, offset + nameLen));
    offset += nameLen;

    const ndim = view.getUint32(offset, true);
    offset += 4;
    const shape: number[] = [];
    let numel = 1;
    for (let d = 0; d < ndim; d++) {
      const dim = view.getUint32(offset, true);
      offset += 4;
      shape.push(dim);
      numel *= dim;
    }

    // 名称长度不定导致 data 起始偏移未必 4 字节对齐，slice 拷贝一份保证对齐
    const data = new Float32Array(bytes.slice(offset, offset + numel * 4));
    offset += numel * 4;

    tensors.set(name, { shape, data });
  }

  return tensors;
}

// ---------------------------------------------------------------------------
// 推理算子（均为内部实现，zero-pad 3x3 卷积与 BN 折叠是为本模型特化的）
// ---------------------------------------------------------------------------

/** 3x3 卷积（stride=1, padding=1, zero pad），ReLU 融合在写回阶段 */
function conv3x3Relu(
  input: Float32Array, cIn: number, h: number, w: number,
  weight: Float32Array, bias: Float32Array, cOut: number,
  out: Float32Array
): void {
  const hw = h * w;
  for (let co = 0; co < cOut; co++) {
    const wCo = co * cIn * 9;
    const outCo = co * hw;
    for (let y = 0; y < h; y++) {
      const yM = y - 1, yP = y + 1;
      const hasYM = yM >= 0, hasYP = yP < h;
      const rowM = yM * w, row = y * w, rowP = yP * w;
      for (let x = 0; x < w; x++) {
        const xM = x - 1, xP = x + 1;
        const hasXM = xM >= 0, hasXP = xP < w;
        let sum = bias[co];
        for (let ci = 0; ci < cIn; ci++) {
          const inBase = ci * hw;
          const wBase = wCo + ci * 9;
          if (hasYM) {
            if (hasXM) sum += input[inBase + rowM + xM] * weight[wBase];
            sum += input[inBase + rowM + x] * weight[wBase + 1];
            if (hasXP) sum += input[inBase + rowM + xP] * weight[wBase + 2];
          }
          if (hasXM) sum += input[inBase + row + xM] * weight[wBase + 3];
          sum += input[inBase + row + x] * weight[wBase + 4];
          if (hasXP) sum += input[inBase + row + xP] * weight[wBase + 5];
          if (hasYP) {
            if (hasXM) sum += input[inBase + rowP + xM] * weight[wBase + 6];
            sum += input[inBase + rowP + x] * weight[wBase + 7];
            if (hasXP) sum += input[inBase + rowP + xP] * weight[wBase + 8];
          }
        }
        out[outCo + row + x] = sum > 0 ? sum : 0;
      }
    }
  }
}

/** 2x2 MaxPool（stride=2，奇数边长时丢弃最后一行/列，与 PyTorch 默认行为一致） */
function maxPool2x2(
  input: Float32Array, c: number, h: number, w: number,
  out: Float32Array
): void {
  const hOut = h >> 1;
  const wOut = w >> 1;
  const inHw = h * w;
  const outHw = hOut * wOut;
  for (let ci = 0; ci < c; ci++) {
    const inBase = ci * inHw;
    const outBase = ci * outHw;
    for (let oh = 0; oh < hOut; oh++) {
      const r0 = inBase + oh * 2 * w;
      const r1 = r0 + w;
      const outRow = outBase + oh * wOut;
      for (let ow = 0; ow < wOut; ow++) {
        const col = ow * 2;
        const v00 = input[r0 + col];
        const v01 = input[r0 + col + 1];
        const v10 = input[r1 + col];
        const v11 = input[r1 + col + 1];
        const m01 = v00 > v01 ? v00 : v01;
        const m23 = v10 > v11 ? v10 : v11;
        out[outRow + ow] = m01 > m23 ? m01 : m23;
      }
    }
  }
}

/** 全连接层：out = weight · input + bias（weight 为 [outFeatures, inFeatures] 行优先） */
function linear(
  input: Float32Array, inFeatures: number,
  weight: Float32Array, bias: Float32Array, outFeatures: number,
  out: Float32Array, relu: boolean
): void {
  for (let o = 0; o < outFeatures; o++) {
    let sum = bias[o];
    const wOff = o * inFeatures;
    for (let i = 0; i < inFeatures; i++) {
      sum += input[i] * weight[wOff + i];
    }
    out[o] = relu && sum < 0 ? 0 : sum;
  }
}

/** 把 BatchNorm（推理态）折叠进前一层卷积：W' = W·s，b' = (b-μ)·s + β，其中 s = γ/√(σ²+ε) */
function foldBnIntoConv(
  convWeight: Float32Array, convBias: Float32Array,
  bnWeight: Float32Array, bnBias: Float32Array,
  bnMean: Float32Array, bnVar: Float32Array
): { weight: Float32Array; bias: Float32Array } {
  const cOut = convBias.length;
  const perChannel = convWeight.length / cOut;
  const weight = new Float32Array(convWeight.length);
  const bias = new Float32Array(cOut);
  for (let c = 0; c < cOut; c++) {
    const scale = bnWeight[c] / Math.sqrt(bnVar[c] + 1e-5);
    bias[c] = (convBias[c] - bnMean[c]) * scale + bnBias[c];
    const off = c * perChannel;
    for (let i = 0; i < perChannel; i++) {
      weight[off + i] = convWeight[off + i] * scale;
    }
  }
  return { weight, bias };
}

// ---------------------------------------------------------------------------
// 模型
// ---------------------------------------------------------------------------

export class CaptchaModel {
  private readonly conv1W: Float32Array; private readonly conv1B: Float32Array;
  private readonly conv2W: Float32Array; private readonly conv2B: Float32Array;
  private readonly conv3W: Float32Array; private readonly conv3B: Float32Array;
  private readonly fc1W: Float32Array; private readonly fc1B: Float32Array;
  private readonly fc2W: Float32Array; private readonly fc2B: Float32Array;
  private readonly outW: Float32Array; private readonly outB: Float32Array;

  // 预分配的推理缓冲（尺寸按 80×26 输入推导，ping-pong 复用）
  private readonly bufA = new Float32Array(5 * 26 * 80);
  private readonly bufB = new Float32Array(5 * 26 * 80);
  private readonly fc1Out = new Float32Array(200);
  private readonly fc2Out = new Float32Array(150);
  private readonly logits = new Float32Array(CAPTCHA_LEN * CHAR_LEN);

  constructor(tensors: Map<string, WeightTensor>) {
    const need = (name: string): WeightTensor => {
      const t = tensors.get(name);
      if (!t) throw new Error(`权重文件中缺少张量 '${name}'`);
      return t;
    };

    // 加载时折叠 BN，后续推理无需 BN 层
    const conv1 = foldBnIntoConv(
      need("conv1.weight").data, need("conv1.bias").data,
      need("bn1.weight").data, need("bn1.bias").data,
      need("bn1.running_mean").data, need("bn1.running_var").data
    );
    this.conv1W = conv1.weight; this.conv1B = conv1.bias;

    const conv2 = foldBnIntoConv(
      need("conv2.weight").data, need("conv2.bias").data,
      need("bn2.weight").data, need("bn2.bias").data,
      need("bn2.running_mean").data, need("bn2.running_var").data
    );
    this.conv2W = conv2.weight; this.conv2B = conv2.bias;

    const conv3 = foldBnIntoConv(
      need("conv3.weight").data, need("conv3.bias").data,
      need("bn3.weight").data, need("bn3.bias").data,
      need("bn3.running_mean").data, need("bn3.running_var").data
    );
    this.conv3W = conv3.weight; this.conv3B = conv3.bias;

    this.fc1W = need("fc1.weight").data; this.fc1B = need("fc1.bias").data;
    this.fc2W = need("fc2.weight").data; this.fc2B = need("fc2.bias").data;
    this.outW = need("output_layer.weight").data; this.outB = need("output_layer.bias").data;
  }

  static fromBytes(weightBytes: ArrayBuffer): CaptchaModel {
    return new CaptchaModel(parseScuOcr(weightBytes));
  }

  /**
   * 前向推理。
   * @param chw 反相并归一化到 [0,1] 的 CHW 平面像素（3×26×80，见 rgbaToInvertedChw）
   */
  forward(chw: Float32Array): OcrResult {
    if (chw.length !== 3 * CAPTCHA_HEIGHT * CAPTCHA_WIDTH) {
      throw new Error(`输入尺寸错误：期望 ${3 * CAPTCHA_HEIGHT * CAPTCHA_WIDTH}，实际 ${chw.length}`);
    }

    // Conv1(3→5) + ReLU + Pool → 5×13×40
    conv3x3Relu(chw, 3, 26, 80, this.conv1W, this.conv1B, 5, this.bufA);
    maxPool2x2(this.bufA, 5, 26, 80, this.bufB);

    // Conv2(5→7) + ReLU + Pool → 7×6×20
    conv3x3Relu(this.bufB, 5, 13, 40, this.conv2W, this.conv2B, 7, this.bufA);
    maxPool2x2(this.bufA, 7, 13, 40, this.bufB);

    // Conv3(7→10) + ReLU + Pool → 10×3×10 = 300
    conv3x3Relu(this.bufB, 7, 6, 20, this.conv3W, this.conv3B, 10, this.bufA);
    maxPool2x2(this.bufA, 10, 6, 20, this.bufB);

    // Flatten → FC1(300→200) + ReLU → FC2(200→150) + ReLU → Out(150→144)
    linear(this.bufB, 300, this.fc1W, this.fc1B, 200, this.fc1Out, true);
    linear(this.fc1Out, 200, this.fc2W, this.fc2B, 150, this.fc2Out, true);
    linear(this.fc2Out, 150, this.outW, this.outB, CAPTCHA_LEN * CHAR_LEN, this.logits, false);

    // 逐位 argmax 解码，同时用 softmax 概率估计置信度
    let text = "";
    let confidence = 1;
    for (let i = 0; i < CAPTCHA_LEN; i++) {
      const base = i * CHAR_LEN;
      let maxIdx = 0;
      let maxVal = this.logits[base];
      for (let j = 1; j < CHAR_LEN; j++) {
        const v = this.logits[base + j];
        if (v > maxVal) {
          maxVal = v;
          maxIdx = j;
        }
      }
      // 数值稳定的 softmax（只关心获胜类别的概率）
      let sumExp = 0;
      for (let j = 0; j < CHAR_LEN; j++) {
        sumExp += Math.exp(this.logits[base + j] - maxVal);
      }
      const prob = 1 / sumExp;
      if (prob < confidence) confidence = prob;
      text += CHARSET[maxIdx];
    }

    return { text, confidence };
  }
}

/**
 * RGBA 像素（如 canvas 的 ImageData.data）→ 反相 + 归一化 [0,1] 的 CHW 平面数据。
 * 反相（x = 1 - x）是模型训练时的预处理，深色字符变为高响应。
 */
export function rgbaToInvertedChw(
  rgba: Uint8ClampedArray, width: number, height: number
): Float32Array {
  const hw = width * height;
  const out = new Float32Array(3 * hw);
  const gBase = hw;
  const bBase = 2 * hw;
  for (let i = 0, p = 0; i < hw; i++, p += 4) {
    out[i] = 1 - rgba[p] / 255;
    out[gBase + i] = 1 - rgba[p + 1] / 255;
    out[bBase + i] = 1 - rgba[p + 2] / 255;
  }
  return out;
}
