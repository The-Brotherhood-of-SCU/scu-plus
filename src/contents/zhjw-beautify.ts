import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"

import { applyBeautify } from "~features/beautify"
import { getSetting, SettingItem } from "~script/config"

export const config: PlasmoCSConfig = {
  matches: ["*://zhjw.scu.edu.cn/*"],
  run_at: "document_start",
  all_frames: true
}

/**
 * 杂志风主题的提前注入器（防闪屏）。
 *
 * zhjw.ts 主内容脚本要等 window load 才运行，若由它注入主题，
 * 每次导航都会先以原版样式渲染、加载完成后才突然切换主题。
 *
 * chrome.storage 只能异步读取，等它 resolve 时首屏早已绘制。
 * 因此把上一次确认的开关状态镜像到页面 localStorage（可同步读取），
 * 在 document_start、浏览器首次绘制之前就同步注入主题；
 * 之后再异步读取真实设置校准，并监听设置变更实时更新镜像。
 */
const MIRROR_KEY = "scu-plus:beautify"

interface BeautifyMirror {
  on: boolean
  color?: string
  /** 深色模式设置（"auto" | "light" | "dark"），旧镜像缺失时按 "auto" 处理 */
  dark?: string
}

function readMirror(): BeautifyMirror | null {
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.on !== "boolean") return null
    return {
      on: parsed.on,
      color: typeof parsed.color === "string" ? parsed.color : undefined,
      dark: typeof parsed.dark === "string" ? parsed.dark : undefined
    }
  } catch {
    return null
  }
}

function writeMirror(mirror: BeautifyMirror): void {
  try {
    window.localStorage.setItem(MIRROR_KEY, JSON.stringify(mirror))
  } catch {
    // 隐私模式等写入失败的场景可忽略，下次导航仍会按真实设置校准
  }
}

function applyAndMirror(on: boolean, color?: string, dark?: string): void {
  applyBeautify(on, color, dark)
  writeMirror({ on, color, dark })
}

function boot(): void {
  // 1) 首绘之前：按镜像同步注入（常规导航时镜像已存在，页面直接以主题渲染）
  earlyInject();

  // 2) 异步校准真实设置（首次启用、跨标签页修改、镜像被清除等情况）
  getSetting()
    .then((s) => applyAndMirror(s.beautifySwitch, s.beautifyColor, s.beautifyDarkMode))
    .catch((e) => console.warn("SCU+: 读取美化设置失败，保持镜像状态", e))

  // 3) 设置页保存后实时同步，无需等下次导航
  new Storage().watch({
    setting: (change) => {
      const next = change?.newValue as Partial<SettingItem> | undefined
      if (!next || typeof next.beautifySwitch !== "boolean") return
      applyAndMirror(next.beautifySwitch, next.beautifyColor, next.beautifyDarkMode)
    }
  })
}

/**
 * 按镜像尝试提前注入；镜像未开启或根元素尚未创建时返回 false。
 */
function earlyInject(): boolean {
  if (!document.documentElement) return false
  const mirror = readMirror()
  if (!mirror?.on) return false
  applyBeautify(true, mirror.color, mirror.dark)
  return true
}

// document_start 极早期 documentElement 可能为 null：
// 观察文档，根元素一创建就注入（仍早于首次绘制）。
if (!document.documentElement) {
  const rootObserver = new MutationObserver(() => {
    if (document.documentElement) {
      rootObserver.disconnect()
      earlyInject()
    }
  })
  rootObserver.observe(document, { childList: true })
  // 兜底：DOMContentLoaded 后不再观察
  document.addEventListener("DOMContentLoaded", () => rootObserver.disconnect(), { once: true })
}

boot()
