/**
 * 验证码自动识别的通用集成层。
 *
 * id.scu 与 zhjw 两个登录页查找验证码图片/输入框的方式不同，
 * 但"识别 → 填写 → 刷新重试"的状态机完全一致，收敛在这里避免两份拷贝各自演化。
 * 各登录页通过 CaptchaAutoFillOptions 注入差异点：定位、点击响应、识别函数。
 */
export interface CaptchaTarget {
  img: HTMLImageElement;
  input: HTMLInputElement;
}

export interface CaptchaAutoFillOptions {
  /** 识别验证码图片，返回待填入文本（置信度不足时返回空串或非 4 位串） */
  recognize: (img: HTMLImageElement) => Promise<string>;
  /** 后台预加载识别模型，消除首次识别的加载延迟 */
  warmup?: () => void;
  /** 定位当前可用的验证码图片与输入框（需通过可见性校验）；无目标时返回 null */
  locate: () => CaptchaTarget | null;
  /**
   * 捕获阶段点击监听：返回调度延迟毫秒数表示命中（如点击验证码图刷新、切换登录页签），
   * 返回 null 表示不处理。
   */
  onClickCapture?: (target: Element) => number | null;
  /** 初始调度延迟（ms），默认 120 */
  initialDelay?: number;
}

export function createCaptchaAutoFill(options: CaptchaAutoFillOptions): void {
  options.warmup?.();

  let running = false;
  let timer: number | null = null;
  let lastCaptchaSrc = "";
  let lastRecognizedSrc = "";
  let retryCount = 0;

  const scheduleRun = (delay = 120) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      void runOnce();
    }, delay);
  };

  const bindCaptchaLoadListener = (img: HTMLImageElement) => {
    const marker = "__scuOcrLoadBound";
    if ((img as any)[marker]) return;
    (img as any)[marker] = true;
    img.addEventListener("load", () => scheduleRun(60));
  };

  const runOnce = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      const target = options.locate();
      if (!target) return;
      const { img, input } = target;
      bindCaptchaLoadListener(img);

      if (!img.complete || !(img.naturalWidth || img.width) || !(img.naturalHeight || img.height)) {
        return;
      }

      const src = img.currentSrc || img.src || "";
      if (src !== lastCaptchaSrc) {
        // 验证码已刷新：若输入框里是上次自动填入的结果，先清空再重新识别
        if (lastRecognizedSrc && input.value.trim().length === 4) {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        lastCaptchaSrc = src;
        lastRecognizedSrc = "";
        retryCount = 0;
      }
      // 输入框已有内容且并非本插件填入（用户手动输入）→ 不打扰
      if (input.value.trim().length > 0 && !lastRecognizedSrc) return;
      // 当前验证码已识别且结果仍在输入框 → 跳过
      if (src === lastRecognizedSrc && input.value.trim().length === 4) return;

      const resultRaw = await options.recognize(img);
      const result = String(resultRaw || "").replace(/\s+/g, "");

      if (result.length !== 4) {
        // 识别置信度过低：稍作延迟再换一张，给新验证码的加载留出时间，
        // 避免在新图就位前把重试次数烧在旧图上（本地 OCR 几乎是瞬时返回）
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
      // 偶发失败（如图片未加载完成），保持静默等待下次触发。
    } finally {
      running = false;
    }
  };

  document.addEventListener("click", (e) => {
    const target = e.target as Element | null;
    if (!target) return;
    const delay = options.onClickCapture?.(target);
    if (delay != null) scheduleRun(delay);
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

  scheduleRun(options.initialDelay ?? 120);
}
