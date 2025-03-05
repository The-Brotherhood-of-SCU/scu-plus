import { useEffect, useState } from "react"
import { Form, Switch, Input, Button, Spin, Select, } from 'antd';
import { getSetting, saveSetting, SettingItem } from "~script/config";



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
      setSetting(savedSettings);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleFormChange = (changedValues: Partial<SettingItem>) => {
    let newConfig;
    setSetting(prev => {
      newConfig = { ...prev, ...changedValues };
      return newConfig;
    });

    if(newConfig.avatarSwitch){
      if(newConfig.avatarSource === 'qq'){
        chrome.runtime.sendMessage({action:'updateAvatar',url:`https://q1.qlogo.cn/g?b=qq&nk=${newConfig.avatarInfo}&src_uin=www.jlwz.cn&s=0`});
      }
      else{
        chrome.runtime.sendMessage({action:'updateAvatar',url:newConfig.avatarInfo});
      }
    }
    else{
      chrome.runtime.sendMessage({action:'removeAvatarRedirection'})
    }
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
        <Input placeholder={setting.avatarSource=="qq"?"输入QQ号":"头像URL地址"}/>
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



export default SettingPage