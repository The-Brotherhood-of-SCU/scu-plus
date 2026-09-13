import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"
import { test } from "node:test"
import ts from "typescript"

const source = readFileSync(new URL("../src/script/utils.ts", import.meta.url), "utf8")
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true
} }).outputText
const releaseUrl = "https://github.com/The-Brotherhood-of-SCU/scu-plus/releases/tag/v9.0.0"
const asset = (name) => ({ name, browser_download_url: `https://github.com/example/releases/download/v9.0.0/${name}` })

async function check(browser, assets) {
  const context = vm.createContext({
    exports: {}, console, process: { env: { PLASMO_BROWSER: browser } },
    require: (path) => {
      if (path.includes("package.json")) return { version: "2.3.3", checkForUpdateLink: "https://api.github.com/repos/The-Brotherhood-of-SCU/scu-plus/releases/latest", downloadProxyPrefix: "https://gh-proxy.org/" }
      if (path.includes("types")) return { UpdateCheckResult: { NEW_VERSION_AVAILABLE: 0, NETWORK_ERROR: 2 } }
      if (path.includes("actions")) return { Actions: { REQUEST: "request" } }
      return {}
    },
    chrome: { runtime: { sendMessage: async (message) => { assert.equal(message.url, browser === "safari" ? "https://api.github.com/repos/Visio-Vanitas/scu-plus/releases/latest" : "https://api.github.com/repos/The-Brotherhood-of-SCU/scu-plus/releases/latest"); return ({ success: true, data: JSON.stringify({ tag_name: "v9.0.0", html_url: releaseUrl, assets }) }); } } }
  })
  vm.runInContext(code, context)
  return context.exports.checkVersion()
}

test("Safari without a Safari asset links to the release, not a Chromium or source ZIP", async () => {
  const result = await check("safari", [asset("chrome-mv3-prod.zip"), asset("scu-plus-source-v9.0.0.zip")])
  assert.equal(result.downloadUrl, releaseUrl)
})
for (const browser of ["chrome", "firefox"]) {
  test(`${browser} selects only its own production archive`, async () => {
    const result = await check(browser, [asset("scu-plus-source-v9.0.0.zip"), ...["chrome", "firefox", "safari"].map((b) => asset(`${b}-mv3-prod.zip`))])
    assert.equal(result.downloadUrl, `https://gh-proxy.org/https://github.com/example/releases/download/v9.0.0/${browser}-mv3-prod.zip`)
  })
}
