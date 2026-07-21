import { MAGAZINE_THEME_CSS } from "./theme";
import {
  isDarkModeEffective,
  mixWithWhite,
  normalizeDarkMode,
  type DarkModeSetting
} from "./palette";

const THEME_STYLE_ID = "scu-plus-magazine-theme";

/** 默认点缀色（锦绣红） */
export const DEFAULT_ACCENT_COLOR = "#9e1b32";

/**
 * 将 #rrggbb 颜色转换为 rgba() 字符串
 */
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(158, 27, 50, ${alpha})`;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 校验用户配置的颜色值，非法值回退为默认锦绣红
 */
function normalizeAccent(color: string | undefined | null): string {
  if (color && /^#[0-9a-f]{6}$/i.test(color.trim())) {
    return color.trim();
  }
  return DEFAULT_ACCENT_COLOR;
}

/**
 * 文档解析期间保持主题 <style> 位于 head 末尾。
 *
 * 主题在 document_start 注入时会排在站点自身样式表之前；
 * 部分同优先级的 !important 规则依赖“后定义者胜”，需要一直压着站点样式。
 */
let orderGuard: MutationObserver | null = null;

function keepStyleLast(style: HTMLStyleElement): void {
  orderGuard?.disconnect();
  orderGuard = null;
  if (document.readyState !== "loading") return;

  // 仅观察 <head> 的子节点变化（link、style、script 等被添加/移除），
  // 不再监视整棵 document 树，避免大量 DOM 变更触发无效样式重算。
  const guard = new MutationObserver(() => {
    const host = document.head;
    if (!host) return;
    if (style.parentElement !== host || host.lastElementChild !== style) {
      host.appendChild(style);
    }
  });

  // document_start 极早期 <head> 可能尚未创建，先观察 <html> 直子节点等它出现
  if (document.head) {
    guard.observe(document.head, { childList: true });
  } else {
    const headWaiter = new MutationObserver(() => {
      if (document.head) {
        headWaiter.disconnect();
        guard.observe(document.head, { childList: true });
      }
    });
    headWaiter.observe(document.documentElement, { childList: true });
  }

  orderGuard = guard;
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      guard.disconnect();
      if (orderGuard === guard) orderGuard = null;
    },
    { once: true }
  );
}

/** 当前注入参数 —— 系统主题变化时按相同参数重算深浅色 */
let currentAccent: string = DEFAULT_ACCENT_COLOR;
let currentMode: DarkModeSetting = "auto";

let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * 按当前模式计算深浅色并写入 <html>：
 * data-scu-theme 属性切换 CSS 变量覆盖块；深色模式下点缀色混合白色调亮。
 */
function applyThemeMode(): void {
  const dark = isDarkModeEffective(currentMode);
  const root = document.documentElement;
  if (dark) {
    root.setAttribute("data-scu-theme", "dark");
  } else {
    root.removeAttribute("data-scu-theme");
  }

  const accentText = dark ? mixWithWhite(currentAccent, 0.38) : currentAccent;
  const accentFill = dark ? mixWithWhite(currentAccent, 0.15) : currentAccent;
  root.style.setProperty("--scu-accent", accentText);
  root.style.setProperty("--scu-accent-soft", hexToRgba(accentText, dark ? 0.16 : 0.06));
  root.style.setProperty("--scu-accent-line", hexToRgba(accentText, dark ? 0.4 : 0.22));
  root.style.setProperty("--scu-accent-fill", accentFill);
  root.style.setProperty("--scu-c1", accentText);
}

/** "auto" 模式下监听系统主题变化，实时切换深浅色 */
function bindMediaListener(): void {
  unbindMediaListener();
  if (currentMode !== "auto") return;
  try {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaListener = () => applyThemeMode();
    mediaQuery.addEventListener("change", mediaListener);
  } catch {
    // 极少数环境不支持 matchMedia 监听，保持当前解析结果即可
  }
}

function unbindMediaListener(): void {
  if (mediaQuery && mediaListener) {
    try {
      mediaQuery.removeEventListener("change", mediaListener);
    } catch {
      // 忽略解绑异常
    }
  }
  mediaQuery = null;
  mediaListener = null;
}

/**
 * 注入杂志风主题。
 *
 * - 全量 CSS 覆盖（!important），追加为文档中最后一个样式，
 *   后于站点自身样式表生效。
 * - 点缀色取自用户设置的 beautifyColor，写入 :root 的 --scu-accent 变量，
 *   并同步生成柔和底色 --scu-accent-soft、边框 --scu-accent-line、
 *   填充按钮底色 --scu-accent-fill 与课表色块 --scu-c1。
 * - 深色模式（darkMode = "dark"，或 "auto" 且系统为深色）：
 *   在 <html> 上设置 data-scu-theme="dark" 切换 CSS 变量覆盖块，
 *   并将点缀色调亮以保证暗底可读性；"auto" 时监听系统主题实时切换。
 * - 幂等：重复调用不会叠加多个 <style>。
 * - 可在 document_start 调用（<head> 尚未创建时挂到 documentElement 下，
 *   并由 orderGuard 保证解析过程中始终位于末尾）。
 */
export function injectBeautify(accentColor?: string, darkMode?: string): void {
  const host = document.head || document.documentElement;
  if (!host) return; // document_start 极早期根元素可能尚未创建，调用方负责重试

  currentAccent = normalizeAccent(accentColor);
  currentMode = normalizeDarkMode(darkMode);

  document.getElementById(THEME_STYLE_ID)?.remove();

  const style = document.createElement("style");
  style.id = THEME_STYLE_ID;
  style.textContent = MAGAZINE_THEME_CSS;
  host.appendChild(style);
  keepStyleLast(style);

  applyThemeMode();
  bindMediaListener();
}

/**
 * 移除杂志风主题（幂等）。
 */
export function removeBeautify(): void {
  orderGuard?.disconnect();
  orderGuard = null;
  unbindMediaListener();
  document.getElementById(THEME_STYLE_ID)?.remove();

  const root = document.documentElement;
  root.removeAttribute("data-scu-theme");
  root.style.removeProperty("--scu-accent");
  root.style.removeProperty("--scu-accent-soft");
  root.style.removeProperty("--scu-accent-line");
  root.style.removeProperty("--scu-accent-fill");
  root.style.removeProperty("--scu-c1");
}

/**
 * 根据开关应用或移除主题（幂等）。
 */
export function applyBeautify(enabled: boolean, accentColor?: string, darkMode?: string): void {
  if (enabled) {
    injectBeautify(accentColor, darkMode);
  } else {
    removeBeautify();
  }
}
