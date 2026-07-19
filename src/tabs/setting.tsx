import { useEffect, useState, useRef } from "react"
import { Form, Switch, Input, Button, Spin, Select, message, notification, ColorPicker, ConfigProvider, } from 'antd';
import { getSetting, saveSetting } from "~script/config";
import { SettingItem } from "../common/types";
import { Modal } from 'antd';
import type { NotificationPlacement } from "antd/es/notification/interface";
import React from "react";
import { Actions } from "../constants/actions";
import packagejson from "package.json"

const DEFAULT_ACCENT = "#9e1b32"

/** 校验 hex 颜色，非法值回退为锦绣红（与 beautify 主题一致） */
const normalizeAccent = (color: string | undefined | null): string =>
  color && /^#[0-9a-f]{6}$/i.test(color.trim()) ? color.trim() : DEFAULT_ACCENT

const SERIF = '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif'
const SANS = 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'

/** 杂志风全局样式 —— 与 features/beautify/theme.ts 同源的纸墨朱配色 */
const MAGAZINE_CSS = `
  html, body {
    background: #f4f2ec;
  }
  body {
    font-family: ${SANS};
    color: #1d1c1a;
    -webkit-font-smoothing: antialiased;
  }
  ::selection {
    background: rgba(158, 27, 50, 0.16);
  }
  .scu-setting-masthead {
    background: #fffdf8;
    border-top: 3px solid var(--scu-accent, ${DEFAULT_ACCENT});
    border-bottom: 1px solid #1d1c1a;
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
    color: #1d1c1a;
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
    color: #8f8e85;
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
    color: #1d1c1a;
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
    border-top: 1px solid #e4e0d4;
  }
  .scu-setting-card {
    background: #fffdf8;
    border: 1px solid #e4e0d4;
    padding: 18px 22px 6px;
  }
  /* antd 细节微调：贴合纸面风格 */
  .scu-setting-card .ant-form-item-label > label {
    color: #57564f;
    letter-spacing: 0.02em;
  }
  .scu-setting-card .ant-input,
  .scu-setting-card .ant-select .ant-select-selector,
  .scu-setting-card .ant-input-outlined {
    background: #fffdf8;
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
    color: #57564f;
    font-size: 13px;
  }
`

function SettingPage() {
  const [isDirty, setIsDirty] = useState(false);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: accent,
          colorInfo: accent,
          colorLink: accent,
          borderRadius: 2,
          fontFamily: SANS,
        },
      }}
    >
      <style>{MAGAZINE_CSS}</style>
      <div style={{ ["--scu-accent" as any]: accent }}>
        <TitleFragment isDirty={isDirty} />
        <div className="scu-setting-body">
          <DataSettingFragment isDirty={isDirty} setIsDirty={setIsDirty} setAccent={setAccent} />
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

function DataSettingFragment({ isDirty, setIsDirty, setAccent }: { isDirty: boolean; setIsDirty: (dirty: boolean) => void; setAccent: (color: string) => void }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, contextHolder2] = notification.useNotification();
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
  const testOcr = async () => {
    // 检查权限
    const hasPermission = await checkAndRequestPermission(setting.ocrProvider);
    if (!hasPermission) {
      notificationApi.warning({
        message: '权限不足',
        description: '请在弹窗中允许访问该 OCR 服务器，否则无法测试。',
        placement: 'topRight',
      });
      return;
    }

    if (await testOcrUrl(setting.ocrProvider)) {
      notificationApi.success({
        message: '测试成功',
        description: 'OCR服务可用',
        placement: 'topRight',
      });
    } else {
      notificationApi.error({
        message: '测试失败',
        description: 'OCR服务不可用',
        placement: 'topRight',
      });
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getSetting();
      setSetting(savedSettings);
      setLoading(false);
      setShowAvatarFields(!!savedSettings.avatarSwitch);
      setShowNameHideField(!!savedSettings.nameHideSwitch);
      setShowBeautifyField(!!savedSettings.beautifySwitch);
      setAccent(normalizeAccent(savedSettings.beautifyColor));
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
    const initialSetting = initialSettingRef.current;
    // 直接基于当前 state 计算，避免依赖 setState updater 的立即执行（React 不保证）
    const newConfig = { ...setting, ...changedValues } as SettingItem;
    setSetting(newConfig);
    setShowAvatarFields(form.getFieldValue('avatarSwitch'));
    setShowBeautifyField(form.getFieldValue('beautifySwitch'));
    setShowNameHideField(form.getFieldValue('nameHideSwitch'));
    if (changedValues.beautifyColor !== undefined) {
      setAccent(normalizeAccent(changedValues.beautifyColor));
    }
    if (SettingItem.equals(initialSetting, newConfig)) {
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
    Modal.confirm({
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
            tooltip="开启后将教务系统整体替换为现代杂志风主题：纸墨配色、衬线标题、三线表"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          {showBeautifyField && (<>
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
            label="输入OCR服务提供者"
            name="ocrProvider"
            tooltip="输入OCR接口后将用于在登陆时自动输入验证码，建议和下面将 '四川大学教务管理系统登录' 重定向到 '统一登陆' 功能一起使用"
          >
            <Input placeholder="eg. https://example.com/ocr" />
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
            const hasPermission = await checkAndRequestPermission(setting.ocrProvider);
            if (!hasPermission) {
              message.error("未获得 OCR 服务器访问权限，功能可能受限");
            }
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
          <Button onClick={testOcr}>
            测试OCR服务
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

async function checkAndRequestPermission(url: string): Promise<boolean> {
  if (!url || url.trim() === "") return true;
  try {
    const origin = new URL(url).origin + "/*";
    const hasPermission = await chrome.permissions.contains({
      origins: [origin]
    });
    if (hasPermission) return true;

    // 动态申请权限
    const granted = await chrome.permissions.request({
      origins: [origin]
    });
    return granted;
  } catch (e) {
    console.error("Permission request failed:", e);
    return false;
  }
}

async function testOcrUrl(url: string): Promise<boolean> {
  try {
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAFAAAAAaCAIAAACvsEzwAAABRklEQVR42uXY0QkCMQwG4IC+inP4pFu4jYhvzuAKTuJyWjgoJUnTv2k9Wq5UODws+S5tLkiP2/27pUHhsylzT/AUD476xjq+mboHOriZWKB2uOfnRZ1TgpGIEXAY+9dOznHBVVlqAR/fhzCL34dg5PSdsnBBjUdRaiO4uMICk+bcg2ivLK1gNb0OMOPlwNfPaZluswUGC5h6K+5he4WVwYUMIwUsdys9tMYKEcaEKjhSpRk/0mVwbjkjvWrR+iu4ykxVVQ5JrwNsXINg3ExVVQ5JL9vSRjS5xEowQ7aYVwKr0XQHx1LcARwjLmpzYKTxyNVtHJw2Kq3gZa31wfFtJGfRLNl1YHC4wWr75QCne5vJ/wIGB9hLqzakA2EZLndaIwwDhiRZFktPlZ4FnJo9W3rS//qYmRw/ntTsLFozmpvASDczsvkHRcX3dhTbFZ0AAAAASUVORK5CYII=";
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ img: base64 }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return !!data; // Return true if we get a valid response
  } catch (error) {
    console.error('OCR test failed:', error);
    return false;
  }
}
export default SettingPage
