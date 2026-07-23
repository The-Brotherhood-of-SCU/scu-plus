import { useEffect, useState } from "react"
import { checkVersion, UpdateCheckResult } from "~/script/utils"
import { getSetting, saveSetting } from "~/script/config"
import { DARK_COLORS, LIGHT_COLORS, DEFAULT_ACCENT, isDarkModeEffective, mixWithWhite, normalizeAccent, normalizeDarkMode, type DarkModeSetting } from "~features/beautify/palette"
import packagejson from "package.json"
import "style.css"

const login_link = "https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index"
const project_link = packagejson.projectLink
const gotoSettingPage = () => {
  const url = chrome.runtime.getURL("options.html");
  openLink(url)
}
const openLink = (link: string) => {
  window.open(link)
}

function IndexPopup() {
  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  const [darkMode, setDarkMode] = useState<DarkModeSetting>("auto")
  const dark = isDarkModeEffective(darkMode)

  useEffect(() => {
    getSetting().then((s) => {
      setAccent(normalizeAccent(s.beautifyColor))
      setDarkMode(normalizeDarkMode(s.beautifyDarkMode))
    })
  }, [])

  /** 快捷切换深色模式：立即持久化，教务页面经 storage watch 实时生效 */
  const changeDarkMode = (mode: DarkModeSetting) => {
    setDarkMode(mode)
    getSetting().then((s) => {
      s.beautifyDarkMode = mode
      saveSetting(s)
    })
  }

  /* 杂志风调色板 —— 与 features/beautify/theme.ts 保持一致，按深色模式切换 */
  const palette = dark ? DARK_COLORS : LIGHT_COLORS
  // 深色模式下点缀色调亮：文字用色提亮 0.38，按钮填充色仅提 0.15 保住白字对比度
  const textAccent = dark ? mixWithWhite(accent, 0.38) : accent
  const fillAccent = dark ? mixWithWhite(accent, 0.15) : accent

  const css = `
    :root {
      color-scheme: ${dark ? "dark" : "light"};
    }
    html, body {
      background: ${palette.paper};
    }
    .scu-popup {
      width: 320px;
      background: ${palette.paper};
      color: ${palette.ink};
      font-family: ${palette.sans};
      border-top: 3px solid ${textAccent};
      padding: 0;
    }
    .scu-popup .masthead {
      background: ${palette.surface};
      border-bottom: 1px solid ${palette.ink};
      padding: 14px 18px 12px;
    }
    .scu-popup .masthead .brand {
      font-family: ${palette.serif};
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.12em;
    }
    .scu-popup .masthead .brand em {
      color: ${textAccent};
      font-style: normal;
    }
    .scu-popup .masthead .tagline {
      margin-top: 2px;
      font-size: 11px;
      letter-spacing: 0.08em;
      color: ${palette.inkFaint};
    }
    .scu-popup .body {
      padding: 4px 18px 14px;
    }
    .scu-popup .section-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 14px 0 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.18em;
      color: ${palette.inkSoft};
    }
    .scu-popup .section-label::after {
      content: "";
      flex: 1;
      border-top: 1px solid ${palette.line};
    }
    .scu-popup .btn {
      display: block;
      width: 100%;
      padding: 9px 0;
      margin: 6px 0;
      font-size: 13px;
      letter-spacing: 0.06em;
      cursor: pointer;
      border-radius: 2px;
      border: 1px solid ${palette.ink};
      background: ${palette.surface};
      color: ${palette.ink};
      transition: background .15s ease, color .15s ease, border-color .15s ease;
    }
    .scu-popup .btn:hover {
      background: ${palette.ink};
      color: ${palette.surface};
    }
    .scu-popup .btn.primary {
      background: ${fillAccent};
      border-color: ${fillAccent};
      color: #fff;
    }
    .scu-popup .btn.primary:hover {
      filter: brightness(1.12);
    }
    .scu-popup .btn-row {
      display: flex;
      gap: 8px;
    }
    .scu-popup .btn-row .btn {
      margin: 6px 0;
    }
    .scu-popup .seg {
      display: flex;
      margin: 6px 0;
      border: 1px solid ${palette.ink};
      border-radius: 2px;
      overflow: hidden;
    }
    .scu-popup .seg button {
      flex: 1;
      padding: 7px 0;
      font-size: 12px;
      letter-spacing: 0.06em;
      cursor: pointer;
      border: none;
      background: ${palette.surface};
      color: ${palette.inkSoft};
      transition: background .15s ease, color .15s ease;
    }
    .scu-popup .seg button + button {
      border-left: 1px solid ${palette.line};
    }
    .scu-popup .seg button:hover {
      color: ${palette.ink};
    }
    .scu-popup .seg button.active {
      background: ${fillAccent};
      color: #fff;
    }
    .scu-popup .footer {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid ${palette.line};
      font-size: 11px;
      color: ${palette.inkFaint};
      letter-spacing: 0.04em;
    }
    .scu-popup .footer a {
      color: ${palette.inkSoft};
      text-decoration: none;
      border-bottom: 1px solid ${palette.line};
    }
    .scu-popup .footer a:hover {
      color: ${textAccent};
      border-bottom-color: ${textAccent};
    }
  `

  return (
    <div className="scu-popup">
      <style>{css}</style>
      <div className="masthead">
        <div className="brand">SCU<em>+</em> 教务助手</div>
        <div className="tagline">纸 · 墨 · 朱 —— 欢迎使用 😘</div>
      </div>
      <div className="body">
        <div className="section-label">便捷操作</div>
        <button className="btn primary" onClick={() => openLink(login_link)}>
          登录教务系统（统一身份验证）
        </button>
        <button className="btn" onClick={() => openLink("http://192.168.2.135")}>
          校园网快捷登录
        </button>

        <div className="section-label">设置</div>
        <div className="seg">
          {([["auto", "跟随系统"], ["light", "浅色"], ["dark", "深色"]] as [DarkModeSetting, string][]).map(([mode, label]) => (
            <button
              key={mode}
              className={darkMode === mode ? "active" : ""}
              onClick={() => changeDarkMode(mode)}>
              {label}
            </button>
          ))}
        </div>
        <div className="btn-row">
          <button className="btn" onClick={gotoSettingPage}>插件设置</button>
          <MainButton accent={textAccent} dark={dark} inkSoft={palette.inkSoft} />
        </div>

        <div className="footer">
          <span>当前版本 v{packagejson.version}</span>
          <a href={project_link} target="_blank">项目主页</a>
        </div>
      </div>
    </div>
  )
}

function MainButton({ accent, dark, inkSoft }: { accent: string; dark: boolean; inkSoft: string }) {
  const [updateCheckState, setUpdateCheckState] = useState(UpdateCheckResult.UNKNOWN)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const gotoDownloadPage = () => {
    window.open(downloadUrl ?? packagejson.download)
  }
  //根据updateCheckState状态决定调用的函数
  const mainButtonFunctionManager = async () => {
    if (updateCheckState == UpdateCheckResult.CHECKING) {
      return
    } else if (updateCheckState === UpdateCheckResult.NEW_VERSION_AVAILABLE) {
      gotoDownloadPage();
    } else {
      setUpdateCheckState(UpdateCheckResult.CHECKING);
      const info = await checkVersion();
      setUpdateCheckState(info.result);
      setDownloadUrl(info.downloadUrl ?? null);
    }
  }
  //根据updateCheckState状态决定显示的文本
  const updateCheckStateText: { [key in UpdateCheckResult]: string } = {
    [UpdateCheckResult.NEW_VERSION_AVAILABLE]: "新版本可用",
    [UpdateCheckResult.UP_TO_DATE]: "已是最新",
    [UpdateCheckResult.UNKNOWN]: "检查更新",
    [UpdateCheckResult.CHECKING]: "正在检查…",
    [UpdateCheckResult.NETWORK_ERROR]: "检查失败"
  };
  // 状态语义色：新版本用主题点缀色，其余沿用杂志配色盘（深色模式用调亮版）
  const updateCheckStateColor: { [key in UpdateCheckResult]: string } = {
    [UpdateCheckResult.NEW_VERSION_AVAILABLE]: accent,
    [UpdateCheckResult.UP_TO_DATE]: dark ? "#71a382" : "#3f6b4f",
    [UpdateCheckResult.UNKNOWN]: inkSoft,
    [UpdateCheckResult.CHECKING]: dark ? "#cf9261" : "#a5673f",
    [UpdateCheckResult.NETWORK_ERROR]: dark ? accent : "#9e1b32"
  };
  const color = updateCheckStateColor[updateCheckState]
  // 深色模式下悬停填充的是调亮后的浅色，文字需用深色保证可读
  const hoverTextColor = dark ? DARK_COLORS.paper : "#fff"
  return (
    <button
      className="btn"
      onClick={mainButtonFunctionManager}
      style={{ borderColor: color, color }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = color
        e.currentTarget.style.color = hoverTextColor
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = ""
        e.currentTarget.style.color = ""
      }}>
      {updateCheckStateText[updateCheckState]}
    </button>
  )
}


export default IndexPopup;