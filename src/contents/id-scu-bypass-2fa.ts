import type { PlasmoCSConfig } from "plasmo"

import { Actions } from "~constants/actions"
import { getSetting } from "~script/config"
import captchaHookUrl from "url:./id-scu-captcha-hook.js"

export const config: PlasmoCSConfig = {
  matches: ["*://id.scu.edu.cn/*"],
  run_at: "document_start"
}

const BASE = "https://id.scu.edu.cn"
const TOKEN_URL = `${BASE}/api/public/bff/v1.2/rest_token`
const REDIRECT_URL =
  "https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index"

let latestCapCode = ""
let loginInFlight = false
const STATUS_BOX_ID = "scu-plus-login-status"

function ensureStatusBox(): HTMLDivElement {
  let box = document.getElementById(STATUS_BOX_ID) as HTMLDivElement | null
  if (box) return box

  box = document.createElement("div")
  box.id = STATUS_BOX_ID
  box.style.position = "fixed"
  box.style.right = "20px"
  box.style.top = "20px"
  box.style.zIndex = "2147483647"
  box.style.maxWidth = "360px"
  box.style.padding = "10px 14px"
  box.style.borderRadius = "8px"
  box.style.background = "rgba(0, 0, 0, 0.78)"
  box.style.color = "#fff"
  box.style.fontSize = "14px"
  box.style.lineHeight = "1.4"
  box.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)"
  box.style.display = "none"
  box.style.whiteSpace = "pre-wrap"
  box.style.pointerEvents = "none"
  ;(document.body || document.documentElement).appendChild(box)
  return box
}

function setStatus(text: string, kind: "info" | "success" | "error" = "info") {
  const box = ensureStatusBox()
  box.style.display = "block"
  box.textContent = text
  if (kind === "success") {
    box.style.background = "rgba(16, 125, 16, 0.9)"
  } else if (kind === "error") {
    box.style.background = "rgba(168, 28, 28, 0.92)"
  } else {
    box.style.background = "rgba(0, 0, 0, 0.78)"
  }
}

function clearStatus(delayMs = 0) {
  const box = document.getElementById(STATUS_BOX_ID) as HTMLDivElement | null
  if (!box) return
  if (delayMs <= 0) {
    box.style.display = "none"
    return
  }
  window.setTimeout(() => {
    box.style.display = "none"
  }, delayMs)
}

function injectCaptchaHook() {
  if (document.getElementById("scu-plus-captcha-hook-script")) return
  const script = document.createElement("script")
  script.id = "scu-plus-captcha-hook-script"
  script.src = captchaHookUrl
  script.async = false
  script.onload = () => script.remove()
  script.onerror = () => script.remove()
  const parent = document.documentElement || document.head || document.body
  if (!parent) return
  parent.appendChild(script)
}

function isVisible(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  const style = window.getComputedStyle(el)
  return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null
}

function isAccountLoginActive(): boolean {
  const tabs = Array.from(
    document.querySelectorAll<HTMLElement>(".login-tab .login-tab-item")
  )
  const accountTab = tabs.find((tab) => (tab.textContent || "").includes("账号登录"))
  if (!accountTab) return false
  if ((accountTab.className || "").includes("login-tab-item-active")) return true
  return accountTab.getAttribute("aria-selected") === "true"
}

function getVisibleLoginForm(): HTMLFormElement | null {
  const forms = Array.from(document.querySelectorAll<HTMLFormElement>("form"))
  for (const form of forms) {
    const btn = form.querySelector("button.login-btn")
    const pwd =
      form.querySelector<HTMLInputElement>('input[type="password"]') ||
      Array.from(form.querySelectorAll<HTMLInputElement>("input")).find((i) =>
        /密码/.test(i.placeholder || "")
      ) ||
      null
    if (btn && pwd && isVisible(btn)) {
      return form
    }
  }
  return null
}

function findAccountInputs(form: HTMLFormElement) {
  const textInputs = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])')
  )
  const usernameByPlaceholder = textInputs.find((i) =>
    /(学\(工\)号|账号|用户名)/.test(i.placeholder || "")
  )
  const captchaByPlaceholder = textInputs.find((i) => /验证码/.test(i.placeholder || ""))
  const username = usernameByPlaceholder || textInputs[0] || null
  const captcha =
    captchaByPlaceholder ||
    textInputs.find((i) => i !== username) ||
    null
  const password =
    form.querySelector<HTMLInputElement>('input[type="password"]') ||
    Array.from(form.querySelectorAll<HTMLInputElement>("input")).find((i) =>
      /密码/.test(i.placeholder || "")
    ) ||
    null
  const loginButton = form.querySelector<HTMLButtonElement>("button.login-btn")
  const captchaImg = form.querySelector<HTMLImageElement>("img.captcha-img")
  return { username, password, captcha, loginButton, captchaImg }
}

function setButtonState(btn: HTMLButtonElement, loading: boolean) {
  const span = btn.querySelector("span")
  if (loading) {
    btn.disabled = true
    btn.dataset.scuPlusOriginalText = span?.textContent || ""
    if (span) span.textContent = "登录中..."
  } else {
    btn.disabled = false
    if (span && typeof btn.dataset.scuPlusOriginalText === "string") {
      span.textContent = btn.dataset.scuPlusOriginalText
    }
  }
}

function sendRuntimeMessage<T>(payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response: T) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve(response)
    })
  })
}

async function handleBypassLogin(clickedButton: HTMLButtonElement) {
  if (loginInFlight) return
  const form = getVisibleLoginForm()
  if (!form || !form.contains(clickedButton)) return

  const { username, password, captcha, loginButton, captchaImg } = findAccountInputs(form)
  if (!username || !password || !captcha || !loginButton) return

  const usernameValue = username.value.trim()
  const passwordValue = password.value
  const captchaValue = captcha.value.trim()

  if (!usernameValue || !passwordValue) {
    alert("请输入用户名和密码")
    return
  }
  if (!captchaValue) {
    alert("请输入验证码")
    return
  }

  loginInFlight = true
  setButtonState(loginButton, true)
  setStatus("正在准备登录...", "info")

  try {
    setStatus("步骤 1/4：请求加密参数...", "info")
    const prepared = await sendRuntimeMessage<{
      success?: boolean
      encryptedPassword?: string
      sm2_code?: string
      error?: string
    }>({
      action: Actions.SCU_AUTH_PREPARE,
      username: usernameValue,
      password: passwordValue
    })

    if (!prepared?.success || !prepared.encryptedPassword || !prepared.sm2_code) {
      throw new Error(prepared?.error || "密码加密失败")
    }

    setStatus("步骤 2/4：提交账号密码和验证码...", "info")
    const payload: Record<string, string> = {
      client_id: (window as any).client_id || "1371cbeda563697537f28d99b4744a973uDKtgYqL5B",
      grant_type: "password",
      scope: "read",
      username: usernameValue,
      password: prepared.encryptedPassword,
      _enterprise_id: "scdx",
      sm2_code: prepared.sm2_code,
      cap_text: captchaValue
    }
    if (latestCapCode) payload.cap_code = latestCapCode

    const tokenResp = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Accept: "application/json, text/plain, */*"
      },
      body: JSON.stringify(payload),
      credentials: "include"
    })
    const tokenText = await tokenResp.text()

    let tokenJson: any = null
    try {
      tokenJson = JSON.parse(tokenText)
    } catch (e) {
      tokenJson = null
    }

    const tokenOk =
      tokenJson &&
      (tokenJson.success === true || tokenJson.code === 200 || tokenJson.code === "200")
    if (!tokenOk) {
      if (captchaImg) captchaImg.click()
      throw new Error("获取 token 失败，请检查账号密码或验证码")
    }

    setStatus("步骤 3/4：绑定登录会话...", "info")
    const finalized = await sendRuntimeMessage<{ success?: boolean; error?: string }>({
      action: Actions.SCU_AUTH_FINALIZE,
      raw: tokenJson
    })
    if (!finalized?.success) {
      throw new Error(finalized?.error || "绑定会话失败")
    }

    setStatus("步骤 4/4：登录成功，正在跳转...", "success")
    clearStatus(1200)
    window.location.href = REDIRECT_URL
  } catch (error) {
    setStatus((error as Error)?.message || "登录失败，请稍后重试", "error")
    clearStatus(3200)
    alert((error as Error)?.message || "登录失败，请稍后重试")
  } finally {
    setButtonState(loginButton, false)
    loginInFlight = false
  }
}

function bindBypass() {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element | null
      const button = target?.closest("button.login-btn") as HTMLButtonElement | null
      if (!button || !isVisible(button)) return
      if (!isAccountLoginActive()) return

      event.preventDefault()
      event.stopPropagation()
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation()
      }
      void handleBypassLogin(button)
    },
    true
  )
}

function onCaptchaCodeMessage(event: MessageEvent) {
  if (event.source !== window) return
  const data = event.data
  if (!data || data.__scu_plus_type !== "captcha-code") return
  if (typeof data.capCode === "string" && data.capCode.trim() !== "") {
    latestCapCode = data.capCode.trim()
  }
}

void (async () => {
  try {
    const setting = await getSetting()
    if (setting?.skip2faSwitch) {
      window.addEventListener("message", onCaptchaCodeMessage)
      injectCaptchaHook()
      bindBypass()
    }
  } catch (e) {}
})()
