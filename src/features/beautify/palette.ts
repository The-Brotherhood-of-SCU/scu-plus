/**
 * 杂志风主题共享色板与深色模式工具。
 *
 * 供三处复用：
 * - contents/zhjw-beautify.ts / features/beautify/index.ts（教务页面主题注入）
 * - popup.tsx（工具栏弹窗）
 * - tabs/setting.tsx（设置页）
 */

/** 深色模式设置值："auto" 跟随系统 | "light" 浅色 | "dark" 深色 */
export type DarkModeSetting = "auto" | "light" | "dark"

/**
 * 校验用户配置的深色模式值，非法值回退为 "auto"
 */
export function normalizeDarkMode(value: string | undefined | null): DarkModeSetting {
  if (value === "light" || value === "dark" || value === "auto") return value
  return "auto"
}

/**
 * 解析当前是否应呈现深色（同步可用，document_start 首绘前调用无闪烁）。
 */
export function isDarkModeEffective(mode: DarkModeSetting): boolean {
  if (mode === "dark") return true
  if (mode === "light") return false
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  } catch {
    return false
  }
}

/**
 * 将 #rrggbb 与白色按比例混合（ratio=0 原色，1 纯白），用于深色模式下调亮点缀色。
 * 非法输入原样返回。
 */
export function mixWithWhite(hex: string, ratio: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const num = parseInt(m[1], 16)
  const mix = (c: number) => Math.round(c + (255 - c) * ratio)
  const r = mix((num >> 16) & 0xff)
  const g = mix((num >> 8) & 0xff)
  const b = mix(num & 0xff)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

/** 杂志风界面色板（popup / 设置页等扩展自身页面使用） */
export interface MagazineColors {
  paper: string
  surface: string
  ink: string
  inkSoft: string
  inkFaint: string
  line: string
  lineStrong: string
  serif: string
  sans: string
}

const SERIF = '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif'
const SANS = 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'

export const LIGHT_COLORS: MagazineColors = {
  paper: "#f4f2ec",
  surface: "#fffdf8",
  ink: "#1d1c1a",
  inkSoft: "#57564f",
  inkFaint: "#8f8e85",
  line: "#e4e0d4",
  lineStrong: "#c9c4b4",
  serif: SERIF,
  sans: SANS
}

export const DARK_COLORS: MagazineColors = {
  paper: "#171615",
  surface: "#201f1d",
  ink: "#e6e3da",
  inkSoft: "#b5b2a8",
  inkFaint: "#84827a",
  line: "#35332e",
  lineStrong: "#4c4a43",
  serif: SERIF,
  sans: SANS
}
