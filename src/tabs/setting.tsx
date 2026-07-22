import { useEffect, useState, useRef } from "react"
import { getSetting, saveSetting } from "~script/config";
import { SettingItem } from "../common/types";
import { message, notification, confirm } from "~script/notice";
import React from "react";
import { Actions } from "../constants/actions";
import { LIGHT_COLORS, DARK_COLORS, mixWithWhite, normalizeDarkMode, type DarkModeSetting } from "~features/beautify/palette";
import packagejson from "package.json"

const DEFAULT_ACCENT = "#9e1b32"

/** 校验 hex 颜色，非法值回退为锦绣红（与 beautify 主题一致） */
const normalizeAccent = (color: string | undefined | null): string =>
  color && /^#[0-9a-f]{6}$/i.test(color.trim()) ? color.trim() : DEFAULT_ACCENT

const SERIF = LIGHT_COLORS.serif
const SANS = LIGHT_COLORS.sans

/** 杂志风全局样式 —— 与 features/beautify/theme.ts 同源的纸墨朱配色，支持深色模式 */
const MAGAZINE_CSS = `
  :root {
    --scu-page-bg: ${LIGHT_COLORS.paper};
    --scu-surface: ${LIGHT_COLORS.surface};
    --scu-ink: ${LIGHT_COLORS.ink};
    --scu-ink-soft: ${LIGHT_COLORS.inkSoft};
    --scu-ink-faint: ${LIGHT_COLORS.inkFaint};
    --scu-line: ${LIGHT_COLORS.line};
    --scu-line-strong: ${LIGHT_COLORS.lineStrong};
  }
  :root[data-scu-theme="dark"] {
    color-scheme: dark;
    --scu-page-bg: ${DARK_COLORS.paper};
    --scu-surface: ${DARK_COLORS.surface};
    --scu-ink: ${DARK_COLORS.ink};
    --scu-ink-soft: ${DARK_COLORS.inkSoft};
    --scu-ink-faint: ${DARK_COLORS.inkFaint};
    --scu-line: ${DARK_COLORS.line};
    --scu-line-strong: ${DARK_COLORS.lineStrong};
  }
  html, body {
    background: var(--scu-page-bg);
  }
  body {
    font-family: ${SANS};
    color: var(--scu-ink);
    -webkit-font-smoothing: antialiased;
  }
  ::selection {
    background: rgba(158, 27, 50, 0.16);
  }
  .scu-setting-masthead {
    background: var(--scu-surface);
    border-top: 3px solid var(--scu-accent, ${DEFAULT_ACCENT});
    border-bottom: 1px solid var(--scu-ink);
    padding: 18px 24px 14px;
  }
  .scu-setting-masthead-inner {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .scu-setting-masthead .brand {
    font-family: ${SERIF};
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--scu-ink);
  }
  .scu-setting-masthead .brand em {
    color: var(--scu-accent, ${DEFAULT_ACCENT});
    font-style: normal;
  }
  .scu-setting-masthead .dirty-mark {
    font-size: 13px;
    color: var(--scu-accent, ${DEFAULT_ACCENT});
    margin-left: 10px;
    letter-spacing: 0.05em;
  }
  .scu-setting-masthead .version {
    font-size: 12px;
    color: var(--scu-ink-faint);
    letter-spacing: 0.08em;
  }
  .scu-setting-body {
    max-width: 860px;
    margin: 0 auto;
    padding: 8px 24px 48px;
  }
  .scu-setting-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 28px 0 4px;
    font-family: ${SERIF};
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--scu-ink);
  }
  .scu-setting-section::before {
    content: "";
    width: 8px;
    height: 8px;
    background: var(--scu-accent, ${DEFAULT_ACCENT});
    flex: none;
  }
  .scu-setting-section::after {
    content: "";
    flex: 1;
    border-top: 1px solid var(--scu-line);
  }
  .scu-setting-card {
    background: var(--scu-surface);
    border: 1px solid var(--scu-line);
    padding: 8px 22px;
  }
  /* ── 表单行 ── */
  .scu-field {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px dashed var(--scu-line);
  }
  .scu-field:last-child {
    border-bottom: none;
  }
  .scu-field-label {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--scu-ink-soft);
    font-size: 14px;
    letter-spacing: 0.02em;
  }
  .scu-field-control {
    flex: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  /* ── 问号 tooltip ── */
  .scu-tip {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border: 1px solid var(--scu-ink-faint);
    border-radius: 50%;
    color: var(--scu-ink-faint);
    font-size: 10px;
    cursor: help;
  }
  .scu-tip-text {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    bottom: calc(100% + 8px);
    left: -10px;
    width: 280px;
    box-sizing: border-box;
    background: var(--scu-ink);
    color: var(--scu-surface);
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.6;
    letter-spacing: 0;
    z-index: 1000;
    pointer-events: none;
    transition: opacity .15s ease;
  }
  .scu-tip:hover .scu-tip-text {
    visibility: visible;
    opacity: 1;
  }
  /* ── 开关 ── */
  .scu-switch {
    position: relative;
    width: 40px;
    height: 22px;
    margin: 0;
    padding: 0;
    appearance: none;
    -webkit-appearance: none;
    background: var(--scu-line-strong);
    border: none;
    border-radius: 22px;
    cursor: pointer;
    transition: background .2s ease;
  }
  .scu-switch:checked {
    background: var(--scu-accent-fill, var(--scu-accent, ${DEFAULT_ACCENT}));
  }
  .scu-switch::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: left .2s ease;
  }
  .scu-switch:checked::after {
    left: 20px;
  }
  /* ── 输入框 / 下拉框 ── */
  .scu-input, .scu-select {
    width: 240px;
    box-sizing: border-box;
    padding: 6px 10px;
    background: var(--scu-surface);
    color: var(--scu-ink);
    border: 1px solid var(--scu-line-strong);
    border-radius: 2px;
    font: inherit;
    font-size: 13px;
  }
  .scu-input:focus, .scu-select:focus {
    outline: none;
    border-color: var(--scu-accent, ${DEFAULT_ACCENT});
  }
  .scu-select {
    width: 140px;
    cursor: pointer;
  }
  /* ── 取色器 ── */
  .scu-color {
    width: 36px;
    height: 24px;
    padding: 1px;
    background: var(--scu-surface);
    border: 1px solid var(--scu-line-strong);
    border-radius: 2px;
    cursor: pointer;
  }
  .scu-setting-accent-picker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--scu-ink-soft);
    font-size: 13px;
  }
  .scu-setting-accent-picker .hex {
    font-family: ${SERIF};
    color: var(--scu-ink);
  }
  /* ── 按钮 ── */
  .scu-setting-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .scu-btn {
    padding: 7px 18px;
    font: inherit;
    font-size: 13px;
    letter-spacing: 0.06em;
    cursor: pointer;
    border-radius: 2px;
    border: 1px solid var(--scu-ink);
    background: var(--scu-surface);
    color: var(--scu-ink);
    transition: background .15s ease, color .15s ease, border-color .15s ease, filter .15s ease;
  }
  .scu-btn:hover {
    background: var(--scu-ink);
    color: var(--scu-surface);
  }
  .scu-btn.primary {
    background: var(--scu-accent-fill, var(--scu-accent, ${DEFAULT_ACCENT}));
    border-color: var(--scu-accent-fill, var(--scu-accent, ${DEFAULT_ACCENT}));
    color: #fff;
  }
  .scu-btn.primary:hover {
    background: var(--scu-accent-fill, var(--scu-accent, ${DEFAULT_ACCENT}));
    color: #fff;
    filter: brightness(1.12);
  }
  /* ── 加载动画 ── */
  .scu-spin {
    width: 32px;
    height: 32px;
    border: 3px solid var(--scu-line);
    border-top-color: var(--scu-accent, ${DEFAULT_ACCENT});
    border-radius: 50%;
    animation: scu-spin-rotate .8s linear infinite;
  }
  @keyframes scu-spin-rotate {
    to { transform: rotate(360deg); }
  }
`

function SettingPage() {
  const [isDirty, setIsDirty] = useState(false);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [darkMode, setDarkMode] = useState<DarkModeSetting>("auto");
  const [systemDark, setSystemDark] = useState(() => {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  // "auto" 模式下跟踪系统深浅色变化，实时切换设置页
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedDark = darkMode === "dark" || (darkMode === "auto" && systemDark);

  // 通过 <html> 属性切换 MAGAZINE_CSS 的深浅色变量（与教务页面主题同一机制）
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedDark) {
      root.setAttribute("data-scu-theme", "dark");
    } else {
      root.removeAttribute("data-scu-theme");
    }
    return () => root.removeAttribute("data-scu-theme");
  }, [resolvedDark]);

  // 深色模式下点缀色调亮：文字用色提亮 0.38，按钮填充色仅提 0.15 保住白字对比度
  const textAccent = resolvedDark ? mixWithWhite(accent, 0.38) : accent;
  const fillAccent = resolvedDark ? mixWithWhite(accent, 0.15) : accent;

  return (
    <>
      <style>{MAGAZINE_CSS}</style>
      <div style={{ ["--scu-accent" as any]: textAccent, ["--scu-accent-fill" as any]: fillAccent }}>
        <TitleFragment isDirty={isDirty} />
        <div className="scu-setting-body">
          <DataSettingFragment isDirty={isDirty} setIsDirty={setIsDirty} setAccent={setAccent} setDarkMode={setDarkMode} />
        </div>
      </div>
    </>
  )
}
function saveSettingWithUpdates(data: SettingItem) {
  saveSetting(data);
  UpdateRedirect(data);
}
function UpdateRedirect(newConfig: SettingItem) {
  if (newConfig.avatarSwitch) {
    if (newConfig.avatarSource === 'qq') {
      chrome.runtime.sendMessage({ action: Actions.UPDATE_AVATAR, url: `https://q1.qlogo.cn/g?b=qq&nk=${newConfig.avatarInfo}&src_uin=www.jlwz.cn&s=0` });
    }
    else {
      chrome.runtime.sendMessage({ action: Actions.UPDATE_AVATAR, url: newConfig.avatarInfo });
    }
  }
  else {
    chrome.runtime.sendMessage({ action: Actions.REMOVE_AVATAR_REDIRECTION })
  }
}

/** 栏目标题 —— 杂志栏目的方块标记 + 细线 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="scu-setting-section">{children}</div>
}

/** 表单行 —— 左侧标签（可带问号 tooltip），右侧控件 */
function Field({ label, tip, children }: { label: React.ReactNode; tip?: string; children: React.ReactNode }) {
  return (
    <div className="scu-field">
      <div className="scu-field-label">
        <span>{label}</span>
        {tip && (
          <span className="scu-tip">?
            <span className="scu-tip-text">{tip}</span>
          </span>
        )}
      </div>
      <div className="scu-field-control">{children}</div>
    </div>
  );
}

/** 开关（受控 checkbox，样式见 .scu-switch） */
function ScuSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <input
      type="checkbox"
      className="scu-switch"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function DataSettingFragment({ isDirty, setIsDirty, setAccent, setDarkMode }: { isDirty: boolean; setIsDirty: (dirty: boolean) => void; setAccent: (color: string) => void; setDarkMode: (mode: DarkModeSetting) => void }) {
  const [setting, setSetting] = useState<SettingItem>();
  const [loading, setLoading] = useState(true);
  const initialSettingRef = useRef<SettingItem | null>(null);

  const openNotification = (title: string, content: string) => {
    notification.info({
      message: title,
      description: content,
      placement: "topRight",
    });
  };

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getSetting();
      setSetting(savedSettings);
      setLoading(false);
      setAccent(normalizeAccent(savedSettings.beautifyColor));
      setDarkMode(normalizeDarkMode(savedSettings.beautifyDarkMode));
      initialSettingRef.current = savedSettings;
    };

    loadSettings();
  }, []);

  // 处理页面关闭时的提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleFormChange = (changedValues: Partial<SettingItem>) => {
    // 直接基于当前 state 计算，避免依赖 setState updater 的立即执行（React 不保证）
    const newConfig = { ...setting, ...changedValues } as SettingItem;
    setSetting(newConfig);
    if (changedValues.beautifyColor !== undefined) {
      setAccent(normalizeAccent(changedValues.beautifyColor));
    }
    if (changedValues.beautifyDarkMode !== undefined) {
      setDarkMode(normalizeDarkMode(changedValues.beautifyDarkMode));
    }
    // 外观类设置即时持久化：设置页本身会实时预览，若还要点“保存”，
    // 教务页面就会停留在旧设置上（看起来像是“不生效/仍跟随系统”）。
    // 只落盘 beautify 三件套并同步基准值，其余字段仍走“保存”按钮，
    // 未保存标记（isDirty）的判断不受影响。
    const initialSetting = initialSettingRef.current;
    if (initialSetting &&
      (changedValues.beautifySwitch !== undefined ||
        changedValues.beautifyColor !== undefined ||
        changedValues.beautifyDarkMode !== undefined)) {
      const persisted = {
        ...initialSetting,
        beautifySwitch: newConfig.beautifySwitch,
        beautifyColor: newConfig.beautifyColor,
        beautifyDarkMode: newConfig.beautifyDarkMode
      } as SettingItem;
      saveSetting(persisted);
      initialSettingRef.current = persisted;
    }
    if (SettingItem.equals(initialSettingRef.current, newConfig)) {
      //unchanged logically
      setIsDirty(false);
    } else {
      //changed
      setIsDirty(true);
    }
  };

  if (loading || !setting) {
    return <LoadingFragment />;
  }
  const handleReset = () => {
    confirm({
      title: '确认恢复默认设置？',
      content: '这将重置所有设置为默认值，且无法撤销。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const data = new SettingItem();
        saveSettingWithUpdates(data);
        setSetting(data);
        setAccent(normalizeAccent(data.beautifyColor));
        setDarkMode(normalizeDarkMode(data.beautifyDarkMode));
        initialSettingRef.current = data;
        setIsDirty(false);
        message.success('已恢复默认设置');
      }
    });
  };
  return (
    <div onDragOver={(e) => {
      e.preventDefault();
    }}
      onDrop={(e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          // 部分系统（如某些 Windows 环境）对 .json 文件返回空 MIME 类型，用扩展名兜底
          if (file.type === 'application/json' || /\.json$/i.test(file.name)) {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const parsed = JSON.parse(event.target?.result as string);
                if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
                  throw new Error('not a settings object');
                }
                const jsonData = { ...setting, ...parsed };
                saveSettingWithUpdates(jsonData);
                setSetting(jsonData);
                setAccent(normalizeAccent(jsonData.beautifyColor));
                setDarkMode(normalizeDarkMode(jsonData.beautifyDarkMode));
                initialSettingRef.current = jsonData;
                setIsDirty(false);
                message.success('配置文件导入成功（已保存）');
              } catch (error) {
                message.error('配置文件格式错误');
              }
            };
            reader.readAsText(file);
          } else {
            message.error('请导入JSON格式的配置文件');
          }
        }
      }}>

      <SectionTitle>界面美化</SectionTitle>
      <div className="scu-setting-card">
        <Field
          label="美化开关（杂志风主题）"
          tip="开启后将教务系统整体替换为现代杂志风主题：纸墨配色、衬线标题、三线表。外观类设置修改后立即生效，无需点击保存"
        >
          <ScuSwitch checked={setting.beautifySwitch} onChange={(v) => handleFormChange({ beautifySwitch: v })} />
        </Field>
        {setting.beautifySwitch && (<>
          <Field
            label="深色模式"
            tip="杂志风主题的深色模式，修改后立即生效。「跟随系统」将在系统处于深色模式时自动切换，教务页面与插件界面同时生效"
          >
            <select
              className="scu-select"
              value={normalizeDarkMode(setting.beautifyDarkMode)}
              onChange={(e) => handleFormChange({ beautifyDarkMode: e.target.value })}
            >
              <option value="auto">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </Field>
          <Field
            label="主题点缀色"
            tip="杂志风主题的点缀色，用于报头、栏目标记、链接等，默认锦绣红 #9e1b32"
          >
            <input
              className="scu-input"
              placeholder="eg. #9e1b32"
              value={setting.beautifyColor}
              onChange={(e) => handleFormChange({ beautifyColor: e.target.value })}
            />
          </Field>
          <Field label="　">
            <div className="scu-setting-accent-picker">
              快捷取色：
              <input
                type="color"
                className="scu-color"
                value={normalizeAccent(setting.beautifyColor)}
                onChange={(e) => handleFormChange({ beautifyColor: e.target.value })}
              />
              <span className="hex">{normalizeAccent(setting.beautifyColor)}</span>
            </div>
          </Field>
        </>)}
      </div>

      <SectionTitle>隐私与显示</SectionTitle>
      <div className="scu-setting-card">
        <Field label="头像隐藏开关（开启后会用如下的设置替换）">
          <ScuSwitch checked={setting.avatarSwitch} onChange={(v) => handleFormChange({ avatarSwitch: v })} />
        </Field>
        {setting.avatarSwitch && (<>
          <Field label="头像来源类型">
            <select
              className="scu-select"
              value={setting.avatarSource}
              onChange={(e) => handleFormChange({ avatarSource: e.target.value })}
            >
              <option value="url">URL</option>
              <option value="qq">QQ</option>
            </select>
          </Field>
          <Field
            label="头像来源"
            tip="如果选择URL,则在此输入头像链接; 如果选择QQ, 则在此输入QQ号"
          >
            <input
              className="scu-input"
              placeholder={setting.avatarSource == "qq" ? "输入QQ号" : "头像URL地址"}
              value={setting.avatarInfo}
              onChange={(e) => handleFormChange({ avatarInfo: e.target.value })}
            />
          </Field>
        </>)}
        <Field label="挂科隐藏开关" tip="开启后将隐藏首页的不及格课程数">
          <ScuSwitch checked={setting.failSwitch} onChange={(v) => handleFormChange({ failSwitch: v })} />
        </Field>
        <Field label="姓名隐藏开关">
          <ScuSwitch checked={setting.nameHideSwitch} onChange={(v) => handleFormChange({ nameHideSwitch: v })} />
        </Field>
        {setting.nameHideSwitch && (
          <Field label="输入隐藏名字的替代文字">
            <input
              className="scu-input"
              value={setting.nameHideText}
              onChange={(e) => handleFormChange({ nameHideText: e.target.value })}
            />
          </Field>
        )}
        <Field label="自定义首页GPA处显示的值（为空则忽略）">
          <input
            className="scu-input"
            placeholder="eg. 3.98"
            value={setting.gpaCustomText}
            onChange={(e) => handleFormChange({ gpaCustomText: e.target.value })}
          />
        </Field>
        <Field label="自定义首页'不及格课程门数'处显示的值（为空则忽略）">
          <input
            className="scu-input"
            placeholder="eg. 114514"
            value={setting.failedCourseCustomText}
            onChange={(e) => handleFormChange({ failedCourseCustomText: e.target.value })}
          />
        </Field>
      </div>

      <SectionTitle>登录与安全</SectionTitle>
      <div className="scu-setting-card">
        <Field
          label="自动识别并填写验证码（内置本地 OCR）"
          tip="开启后将在统一身份认证登录页自动识别并填写验证码。识别由内置模型在本地完成，无需联网、无需配置第三方服务"
        >
          <ScuSwitch checked={setting.ocrSwitch} onChange={(v) => handleFormChange({ ocrSwitch: v })} />
        </Field>
        <Field label="将 '四川大学教务管理系统登录' 重定向到 '统一登陆'" tip="统一登陆的有效期更长，建议开启">
          <ScuSwitch checked={setting.redirectLoginSwitch} onChange={(v) => handleFormChange({ redirectLoginSwitch: v })} />
        </Field>
        <Field label="跳过两步验证（2FA）" tip="开启后将自动跳过统一认证的两步验证（短信/邮件验证码）">
          <ScuSwitch checked={setting.skip2FASwitch} onChange={(v) => handleFormChange({ skip2FASwitch: v })} />
        </Field>
        <Field label="禁止修改密码弹窗开关" tip="开启后将自动关闭讨厌的修改密码弹窗">
          <ScuSwitch checked={setting.passwordPopupSwitch} onChange={(v) => handleFormChange({ passwordPopupSwitch: v })} />
        </Field>
      </div>

      <SectionTitle>其他</SectionTitle>
      <div className="scu-setting-card">
        <Field label="进入教务主页时自动检查更新" tip="检测到新版本时会在页面右下角弹出提示，可直接跳转加速下载">
          <ScuSwitch checked={setting.autoUpdateCheckSwitch} onChange={(v) => handleFormChange({ autoUpdateCheckSwitch: v })} />
        </Field>
      </div>

      <SectionTitle>操作</SectionTitle>
      <div className="scu-setting-card scu-setting-actions">
        <button className="scu-btn primary" onClick={async () => {
          saveSettingWithUpdates(setting);
          initialSettingRef.current = setting;
          message.success('保存成功', 1);
          setIsDirty(false);
        }}>
          保存
        </button>
        <button className="scu-btn" onClick={handleReset}>
          恢复默认
        </button>
        <button className="scu-btn" onClick={() => {
          const jsonData = JSON.stringify(setting, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'scu-plus-config.json';
          a.click();
          URL.revokeObjectURL(url);
        }}>
          导出配置文件
        </button>
        <button className="scu-btn" onClick={() => openNotification('导入配置文件', '将配置文件拖入本窗口中，即可实现导入')}>
          导入配置文件
        </button>
      </div>
    </div>

  );
}
function LoadingFragment() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
      <div className="scu-spin" />
    </div>
  );
}
function TitleFragment({ isDirty }: { isDirty: boolean }) {
  return (
    <div className="scu-setting-masthead">
      <div className="scu-setting-masthead-inner">
        <div className="brand">
          SCU<em>+</em> 插件设置
          {isDirty && <span className="dirty-mark">● 未保存</span>}
        </div>
        <div className="version">v{packagejson.version}</div>
      </div>
    </div>
  );
}

export default SettingPage
