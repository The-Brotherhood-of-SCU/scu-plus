;(() => {
  if (window.__scuPlusCaptchaHookInstalled) return
  window.__scuPlusCaptchaHookInstalled = true

  const postCap = (capCode) => {
    if (!capCode) return
    window.postMessage(
      { __scu_plus_type: "captcha-code", capCode: String(capCode) },
      "*"
    )
  }

  const parseAndPost = (value) => {
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value
      const data = parsed && parsed.data ? parsed.data : parsed
      const capCode =
        data && (data.code || data.cap_code || data.captcha_code || data.token || data.capCode)
      postCap(capCode)
    } catch (e) {}
  }

  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    const resp = await originalFetch.apply(this, args)
    try {
      const req = args && args[0]
      const url = typeof req === "string" ? req : (req && req.url) || ""
      if (url && url.includes("/one_time_login/captcha")) {
        resp
          .clone()
          .text()
          .then(parseAndPost)
          .catch(() => {})
      }
    } catch (e) {}
    return resp
  }

  const originalOpen = XMLHttpRequest.prototype.open
  const originalSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    try {
      this.__scuPlusUrl = String(url || "")
    } catch (e) {}
    return originalOpen.call(this, method, url, ...rest)
  }

  XMLHttpRequest.prototype.send = function (...args) {
    try {
      this.addEventListener("load", function () {
        try {
          const url = this.__scuPlusUrl || ""
          if (url && url.includes("/one_time_login/captcha")) {
            parseAndPost(this.responseText)
          }
        } catch (e) {}
      })
    } catch (e) {}
    return originalSend.apply(this, args)
  }
})()

