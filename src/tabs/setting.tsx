import { useEffect, useState, useRef } from "react"
import { Form, Switch, Input, Button, Spin, Select, message, notification, ColorPicker, ConfigProvider, theme as antdTheme, } from 'antd';
import { getSetting, saveSetting } from "~script/config";
import { SettingItem } from "../common/types";
import { Modal } from 'antd';
import type { NotificationPlacement } from "antd/es/notification/interface";
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
  }
  :root[data-scu-theme="dark"] {
    color-scheme: dark;
    --scu-page-bg: ${DARK_COLORS.paper};
    --scu-surface: ${DARK_COLORS.surface};
    --scu-ink: ${DARK_COLORS.ink};
    --scu-ink-soft: ${DARK_COLORS.inkSoft};
    --scu-ink-faint: ${DARK_COLORS.inkFaint};
    --scu-line: ${DARK_COLORS.line};
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
    padding: 18px 22px 6px;
  }
  /* antd 细节微调：贴合纸面风格（深色模式交由 darkAlgorithm 处理） */
  .scu-setting-card .ant-form-item-label > label {
    color: var(--scu-ink-soft);
    letter-spacing: 0.02em;
  }
  :root:not([data-scu-theme="dark"]) .scu-setting-card .ant-input,
  :root:not([data-scu-theme="dark"]) .scu-setting-card .ant-select .ant-select-selector,
  :root:not([data-scu-theme="dark"]) .scu-setting-card .ant-input-outlined {
    background: ${LIGHT_COLORS.surface};
  }
  .scu-setting-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    padding: 16px 22px;
  }
  .scu-setting-actions .ant-btn {
    margin: 0 !important;
  }
  .scu-setting-accent-picker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--scu-ink-soft);
    font-size: 13px;
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

  // 深色模式下点缀色调亮：文字用色提亮 0.38，antd 主色（按钮底）仅提 0.15 保住白字对比度
  const textAccent = resolvedDark ? mixWithWhite(accent, 0.38) : accent;
  const fillAccent = resolvedDark ? mixWithWhite(accent, 0.15) : accent;

  return (
    <ConfigProvider
      theme={{
        algorithm: resolvedDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: fillAccent,
          colorInfo: fillAccent,
          colorLink: textAccent,
          borderRadius: 2,
          fontFamily: SANS,
        },
      }}
    >
      <style>{MAGAZINE_CSS}</style>
      <div style={{ ["--scu-accent" as any]: textAccent }}>
        <TitleFragment isDirty={isDirty} />
        <div className="scu-setting-body">
          <DataSettingFragment isDirty={isDirty} setIsDirty={setIsDirty} setAccent={setAccent} setDarkMode={setDarkMode} />
        </div>
      </div>
    </ConfigProvider>
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

function DataSettingFragment({ isDirty, setIsDirty, setAccent, setDarkMode }: { isDirty: boolean; setIsDirty: (dirty: boolean) => void; setAccent: (color: string) => void; setDarkMode: (mode: DarkModeSetting) => void }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, contextHolder2] = notification.useNotification();
  // hook 形式的 Modal 才能吃到 ConfigProvider 的深色主题（静态 Modal.confirm 不读 context）
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [setting, setSetting] = useState<SettingItem>();
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const initialSettingRef = useRef<SettingItem | null>(null);

  const [showAvatarFields, setShowAvatarFields] = useState(false);
  const [showNameHideField, setShowNameHideField] = useState(false);
  const [showBeautifyField, setShowBeautifyField] = useState(false);

  const success = () => {
    messageApi.open({
      type: 'success',
      content: '保存成功',
      duration: 1
    });
  };
  const openNotification = (title: string, content: string, location: NotificationPlacement) => {
    notificationApi.info({
      message: title,
      description: content,
      placement: location,
    });
  };

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getSetting();
      setSetting(savedSettings);
      setLoading(false);
      setShowAvatarFields(!!savedSettings.avatarSwitch);
      setShowNameHideField(!!savedSettings.nameHideSwitch);
      setShowBeautifyField(!!savedSettings.beautifySwitch);
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
    setShowAvatarFields(form.getFieldValue('avatarSwitch'));
    setShowBeautifyField(form.getFieldValue('beautifySwitch'));
    setShowNameHideField(form.getFieldValue('nameHideSwitch'));
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

  if (loading) {
    return <LoadingFragment />;
  }
  const handleReset = () => {
    modalApi.confirm({
      title: '确认恢复默认设置？',
      content: '这将重置所有设置为默认值，且无法撤销。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const data = new SettingItem();
        saveSettingWithUpdates(data);
        setSetting(data);
        form.setFieldsValue(data);
        setShowAvatarFields(!!data.avatarSwitch);
        setShowBeautifyField(!!data.beautifySwitch);
        setShowNameHideField(!!data.nameHideSwitch);
        setAccent(normalizeAccent(data.beautifyColor));
        setDarkMode(normalizeDarkMode(data.beautifyDarkMode));
        initialSettingRef.current = data;
        setIsDirty(false);
        messageApi.success('已恢复默认设置');
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
                form.setFieldsValue(jsonData);
                setShowAvatarFields(!!jsonData.avatarSwitch);
                setShowBeautifyField(!!jsonData.beautifySwitch);
                setShowNameHideField(!!jsonData.nameHideSwitch);
                setAccent(normalizeAccent(jsonData.beautifyColor));
                setDarkMode(normalizeDarkMode(jsonData.beautifyDarkMode));
                initialSettingRef.current = jsonData;
                setIsDirty(false);
                messageApi.success('配置文件导入成功（已保存）');
              } catch (error) {
                messageApi.error('配置文件格式错误');
              }
            };
            reader.readAsText(file);
          } else {
            messageApi.error('请导入JSON格式的配置文件');
          }
        }
      }}>
      {contextHolder}
      {contextHolder2}
      {modalContextHolder}
      <Form
        form={form}
        initialValues={setting}
        onValuesChange={handleFormChange}
      >

        <SectionTitle>界面美化</SectionTitle>
        <div className="scu-setting-card">
          <Form.Item
            label="美化开关（杂志风主题）"
            name="beautifySwitch"
            tooltip="开启后将教务系统整体替换为现代杂志风主题：纸墨配色、衬线标题、三线表。外观类设置修改后立即生效，无需点击保存"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          {showBeautifyField && (<>
            <Form.Item
              label="深色模式"
              name="beautifyDarkMode"
              tooltip="杂志风主题的深色模式，修改后立即生效。「跟随系统」将在系统处于深色模式时自动切换，教务页面与插件界面同时生效"
            >
              <Select>
                <Select.Option value="auto">跟随系统</Select.Option>
                <Select.Option value="light">浅色</Select.Option>
                <Select.Option value="dark">深色</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="主题点缀色"
              name="beautifyColor"
              tooltip="杂志风主题的点缀色，用于报头、栏目标记、链接等，默认锦绣红 #9e1b32"
            >
              <Input placeholder="eg. #9e1b32" />
            </Form.Item>
            <Form.Item label=" ">
              <div className="scu-setting-accent-picker">
                快捷取色：
                <ColorPicker value={setting.beautifyColor} onChangeComplete={
                  (color) => {
                    const newColor = color.toHexString();
                    handleFormChange({ beautifyColor: newColor })
                    form.setFieldsValue({ beautifyColor: newColor })
                  }}
                  showText />
              </div>
            </Form.Item>
          </>)}
        </div>

        <SectionTitle>隐私与显示</SectionTitle>
        <div className="scu-setting-card">
          <Form.Item
            label="头像隐藏开关（开启后会用如下的设置替换）"
            name="avatarSwitch"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          {showAvatarFields && (
            <>
              <Form.Item
                label="头像来源类型"
                name="avatarSource"
              >
                <Select >
                  <Select.Option value="url">URL</Select.Option>
                  <Select.Option value="qq">QQ</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="头像来源"
                name="avatarInfo"
                tooltip="如果选择URL,则在此输入头像链接; 如果选择QQ, 则在此输入QQ号"
              >
                <Input placeholder={setting.avatarSource == "qq" ? "输入QQ号" : "头像URL地址"} />
              </Form.Item>
            </>
          )}
          <Form.Item
            label="挂科隐藏开关"
            name="failSwitch"
            valuePropName="checked"
            tooltip="开启后将隐藏首页的不及格课程数"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="姓名隐藏开关"
            name="nameHideSwitch"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          {showNameHideField && (
            <>
              <Form.Item
                label="输入隐藏名字的替代文字"
                name="nameHideText"
              >
                <Input />
              </Form.Item>
            </>
          )}
          <Form.Item
            label="自定义首页GPA处显示的值（为空则忽略）"
            name="gpaCustomText"
          >
            <Input placeholder="eg. 3.98" />
          </Form.Item>
          <Form.Item
            label="自定义首页'不及格课程门数'处显示的值（为空则忽略）"
            name="failedCourseCustomText"
          >
            <Input placeholder="eg. 114514" />
          </Form.Item>
        </div>

        <SectionTitle>登录与安全</SectionTitle>
        <div className="scu-setting-card">
          <Form.Item
            label="自动识别并填写验证码（内置本地 OCR）"
            name="ocrSwitch"
            valuePropName="checked"
            tooltip="开启后将在统一身份认证登录页自动识别并填写验证码。识别由内置模型在本地完成，无需联网、无需配置第三方服务"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="将 '四川大学教务管理系统登录' 重定向到 '统一登陆'"
            name="redirectLoginSwitch"
            tooltip="统一登陆的有效期更长，建议开启"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="跳过两步验证（2FA）"
            name="skip2FASwitch"
            tooltip="开启后将自动跳过统一认证的两步验证（短信/邮件验证码）"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="禁止修改密码弹窗开关"
            name="passwordPopupSwitch"
            valuePropName="checked"
            tooltip="开启后将自动关闭讨厌的修改密码弹窗"
          >
            <Switch />
          </Form.Item>
        </div>

        <SectionTitle>其他</SectionTitle>
        <div className="scu-setting-card">
          <Form.Item
            label="进入教务主页时自动检查更新"
            name="autoUpdateCheckSwitch"
            tooltip="检测到新版本时会在页面右下角弹出提示，可直接跳转加速下载"
          >
            <Switch />
          </Form.Item>
        </div>

        <SectionTitle>操作</SectionTitle>
        <div className="scu-setting-card scu-setting-actions">
          <Button type="primary" onClick={async () => {
            saveSettingWithUpdates(setting);
            initialSettingRef.current = setting;
            success();
            setIsDirty(false);
          }}>
            保存
          </Button>
          <Button onClick={handleReset}>
            恢复默认
          </Button>
          <Button onClick={() => {
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
          </Button>
          <Button onClick={() => openNotification('导入配置文件', '将配置文件拖入本窗口中，即可实现导入', 'topRight')}>
            导入配置文件
          </Button>
        </div>
      </Form></div>

  );
}
function LoadingFragment() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
      <Spin size="large" />
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
