import { useEffect, useState } from "react"
import { checkVersion, UpdateCheckResult } from "~/script/utils"
import { getSetting } from "~/script/config"
import packagejson from "package.json"
import "style.css"

const login_link = "https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index"
const project_link = packagejson.projectLink
const DEFAULT_ACCENT = "#9e1b32"

const gotoSettingPage = () => {
  const url = chrome.runtime.getURL("options.html");
  openLink(url)
}
const openLink = (link: string) => {
  window.open(link)
}

/** 校验 hex 颜色，非法值回退为锦绣红（与 beautify 主题一致） */
const normalizeAccent = (color: string | undefined | null): string =>
  color && /^#[0-9a-f]{6}$/i.test(color.trim()) ? color.trim() : DEFAULT_ACCENT

/* 杂志风调色板 —— 与 features/beautify/theme.ts 保持一致 */
const palette = {
  paper: "#f4f2ec",
  surface: "#fffdf8",
  ink: "#1d1c1a",
  inkSoft: "#57564f",
  inkFaint: "#8f8e85",
  line: "#e4e0d4",
  serif: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif',
}

function IndexPopup() {
  const [accent, setAccent] = useState(DEFAULT_ACCENT)

  useEffect(() => {
    getSetting().then((s) => setAccent(normalizeAccent(s.beautifyColor)))
  }, [])

  const css = `
    .scu-popup {
      width: 320px;
      background: ${palette.paper};
      color: ${palette.ink};
      font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      border-top: 3px solid ${accent};
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
      color: ${accent};
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
      background: ${accent};
      border-color: ${accent};
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
      color: ${accent};
      border-bottom-color: ${accent};
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
        <div className="btn-row">
          <button className="btn" onClick={gotoSettingPage}>插件设置</button>
          <MainButton accent={accent} />
        </div>

        <div className="footer">
          <span>当前版本 v{packagejson.version}</span>
          <a href={project_link} target="_blank">项目主页</a>
        </div>
      </div>
    </div>
  )
}

function MainButton({ accent }: { accent: string }) {
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
    [UpdateCheckResult.UP_TP_DATE]: "已是最新",
    [UpdateCheckResult.UNKNOWN]: "检查更新",
    [UpdateCheckResult.CHECKING]: "正在检查…",
    [UpdateCheckResult.NETWORK_ERROR]: "检查失败"
  };
  // 状态语义色：新版本用主题点缀色，其余沿用杂志配色盘
  const updateCheckStateColor: { [key in UpdateCheckResult]: string } = {
    [UpdateCheckResult.NEW_VERSION_AVAILABLE]: accent,
    [UpdateCheckResult.UP_TP_DATE]: "#3f6b4f",
    [UpdateCheckResult.UNKNOWN]: palette.inkSoft,
    [UpdateCheckResult.CHECKING]: "#a5673f",
    [UpdateCheckResult.NETWORK_ERROR]: "#9e1b32"
  };
  const color = updateCheckStateColor[updateCheckState]
  return (
    <button
      className="btn"
      onClick={mainButtonFunctionManager}
      style={{ borderColor: color, color }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = color
        e.currentTarget.style.color = "#fff"
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
