import { useEffect, useState } from "react"
import { Form, Switch, Input, Button, Spin, Select, message, notification, ColorPicker, } from 'antd';
import { getSetting, saveSetting, SettingItem } from "~script/config";
import { Modal } from 'antd';
import type { NotificationPlacement } from "antd/es/notification/interface";
import React from "react";
import type { promises } from "dns";



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
function saveSettingWithUpdates(data: SettingItem) {
  saveSetting(data);
  UpdateRedirect(data);
}
function UpdateRedirect(newConfig: SettingItem) {
  if (newConfig.avatarSwitch) {
    if (newConfig.avatarSource === 'qq') {
      chrome.runtime.sendMessage({ action: 'updateAvatar', url: `https://q1.qlogo.cn/g?b=qq&nk=${newConfig.avatarInfo}&src_uin=www.jlwz.cn&s=0` });
    }
    else {
      chrome.runtime.sendMessage({ action: 'updateAvatar', url: newConfig.avatarInfo });
    }
  }
  else {
    chrome.runtime.sendMessage({ action: 'removeAvatarRedirection' })
  }
}
function DataSettingFragment() {
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, contextHolder2] = notification.useNotification();
  const [setting, setSetting] = useState<SettingItem>();
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
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
    };
    loadSettings();
  }, []);

  const handleFormChange = (changedValues: Partial<SettingItem>) => {
    let newConfig;
    setSetting(prev => {
      newConfig = { ...prev, ...changedValues };
      return newConfig;
    });


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
          if (file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const jsonData = {...setting,...JSON.parse(event.target?.result as string)};
                saveSettingWithUpdates(jsonData);
                setSetting(jsonData);
                form.setFieldsValue(jsonData);
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

        <Form.Item
          label="美化开关"
          name="beautifySwitch"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          label="头像隐藏开关（开启后会用如下的设置替换）"
          name="avatarSwitch"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
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
        >
          <Input placeholder={setting.avatarSource == "qq" ? "输入QQ号" : "头像URL地址"} />
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
          tooltip="开启后将隐藏首页的不及格课程数"
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
          <Input placeholder="eg. https://example.com/ocr" />
        </Form.Item>
        <Form.Item
          label="美化颜色"
          name="beautifyColor"
        >
          <Input placeholder="eg. #caeae3" />
        </Form.Item>
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
        <Form.Item
          label="将 '四川大学教务管理系统登录' 重定向到 '统一登陆'"
          name="redirectLoginSwitch"
          tooltip="统一登陆的有效期更长，建议开启"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          label="在首页显示校园集市热榜"
          name="showHotPostSwitch"
        >
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={() => { saveSettingWithUpdates(setting); success(); }} style={{ marginRight: '10px' }}>
            保存
          </Button>
          <Button onClick={handleReset} style={{ marginRight: '10px' }}>
            恢复默认
          </Button>
          <Button style={{ marginRight: '10px' }} onClick={testOcr}>
            测试OCR服务
          </Button>
          <Button style={{ marginRight: '10px' }} onClick={() => {
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
          <Button onClick={() => openNotification('导入配置文件', '将配置文件拖入本窗口中，即可实现导入', 'topRight')} style={{ marginRight: '10px' }}>
            导入配置文件
          </Button>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            美化颜色：
            <ColorPicker value={setting.beautifyColor} onChangeComplete={
              (color)=>{
                const newColor = color.toHexString();
                handleFormChange({beautifyColor:newColor})
                form.setFieldsValue({beautifyColor:newColor})
              }}
               showText />
          </div>
        </Form.Item>
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