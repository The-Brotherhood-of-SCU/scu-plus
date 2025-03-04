import { useEffect, useState } from "react"
import { Form, Switch, Input, Button, Spin, Select, } from 'antd';
import { Storage } from "@plasmohq/storage"

const storage = new Storage();

function saveSetting(setting: SettingItem) {
  storage.set("setting", setting)
}
async function getSetting(): Promise<SettingItem> {
  return (await storage.get("setting")) || new SettingItem();
}
function SettingPage() {
  return (
    <div>
      <TitleFragment />
      <div style={{ paddingLeft: '16px', paddingRight: '16px', maxWidth: '800px', margin: '0 auto' }}>
        <DataSettingFragment />
      </div>
    </div>
  )
}

function DataSettingFragment() {
  const [setting, setSetting] = useState<SettingItem>();
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getSetting();
      setSetting(savedSettings || new SettingItem());
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleFormChange = (changedValues: Partial<SettingItem>) => {
    setSetting(prev => ({ ...prev, ...changedValues }));
  };

  if (loading) {
    return <LoadingFragment />;
  }
  return (
    <Form
      form={form}
      initialValues={setting}
      onValuesChange={handleFormChange}
    >
      <Form.Item
        label="美化开关"
        name="beautifySwitch"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item
        label="头像隐藏开关"
        name="avatarSwitch"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item
        label="头像来源类型"
        name="avatarSource"
      >
        <Select defaultValue="qq">
          <Select.Option value="url">URL</Select.Option>
          <Select.Option value="qq">QQ</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label="头像来源"
        name="avatarInfo"
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="每日一句开关"
        name="dailyQuoteSwitch"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item
        label="挂科隐藏开关"
        name="failSwitch"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item
        label="禁止修改密码弹窗开关"
        name="passwordPopupSwitch"
        valuePropName="checked"
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
      <Form.Item
        label="输入隐藏名字的替代文字"
        name="nameHideText"
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="输入OCR服务提供者"
        name="ocrProvider"
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="美化颜色"
        name="beautifyColor"
      >
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={() => saveSetting(setting)} style={{ marginRight: '10px' }}>
          保存
        </Button>
        <Button onClick={() => {
          const data = new SettingItem();
          saveSetting(data);
          window.location.reload();
        }}>
          恢复默认
        </Button>
      </Form.Item>
    </Form>
  );
}
function LoadingFragment() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
      <Spin size="large" />
    </div>
  );
}
function TitleFragment() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#2196F3",
        color: "white",
        height: 64,
        padding: "0 16px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 500 }}>SCU PLUS 设置</div>
    </div>
  );
}
class SettingItem {
  beautifySwitch: boolean;
  beautifyColor: string;
  avatarSwitch: boolean;
  avatarSource: string;
  avatarInfo: string;
  dailyQuoteSwitch: boolean;
  failSwitch: boolean;
  passwordPopupSwitch: boolean;
  nameHideSwitch: boolean;
  nameHideText: string;
  ocrProvider: string;
  constructor() {
    this.beautifySwitch = true;
    this.beautifyColor = "#caeae3";
    this.avatarSwitch = false;
    this.avatarSource = "qq";
    this.avatarInfo = "";
    this.dailyQuoteSwitch = false;
    this.failSwitch = true;
    this.passwordPopupSwitch = false;
    this.nameHideSwitch = false;
    this.nameHideText = "";
    this.ocrProvider = "";
  }
}


export default SettingPage