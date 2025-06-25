import { useState } from "react"
import { checkVersion, UpdateCheckResult } from "src/script/utils"
import packagejson from "package.json"
import { Button } from 'antd';
import "style.css"

const login_link = "https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index"
const project_link = packagejson.projectLink
const gotoSettingPage = () => {
  openLink(`chrome-extension://${chrome.runtime.id}/tabs/setting.html`)
}
const openLink = (link: string) => {
  window.open(link)
}
function IndexPopup() {


  return (
    <div className="darkmode"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "10px",
        width: "300px",
      }}>
      <h2>
        欢迎使用SCU+插件😘
      </h2>
      <HorizontalLine text="便捷操作" />
      <Button onClick={() => openLink(login_link)} type="primary"> 登陆教务系统 (统一身份验证)</Button>

      <HorizontalLine text="设置" />

      <div style={{ display: 'flex', justifyContent: 'space-between',paddingBottom:"10px" }}>
        <Button onClick={gotoSettingPage} style={{ width: '50%', marginRight: '5px' }}> 插件设置</Button>
        <div style={{ width: '50%', marginLeft: '5px' }}><MainButton /></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>当前版本{packagejson.version}</div>
        <a style={{color:"DodgerBlue"}} href={project_link} target="_blank">项目主页</a>
      </div>

    </div>
  )
}
function HorizontalLine(props) {
  return <div style={{ display: 'flex', alignItems: 'center', paddingTop: '10px', paddingBottom: '10px' }}>
    <span style={{ marginRight: '10px', whiteSpace: 'nowrap' }}>{props.text}</span>
    <hr style={{ border: '1px solid #ccc', width: '100%' }} />
  </div>
}
function MainButton() {
  const [updateCheckState, setUpdateCheckState] = useState(UpdateCheckResult.UNKNOWN)

  const gotoDownloadPage = () => {
    window.open(packagejson.download)
  }
  //根据updateCheckState状态决定调用的函数
  const mainButtonFunctionManager = async () => {
    if (updateCheckState == UpdateCheckResult.CHECKING) {
      return
    } else if (updateCheckState === UpdateCheckResult.NEW_VERSION_AVAILABLE) {
      gotoDownloadPage();
    } else {
      setUpdateCheckState(UpdateCheckResult.CHECKING);
      setUpdateCheckState(await checkVersion())
    }
  }
  //根据updateCheckState状态决定显示的文本
  const updateCheckStateText: { [key in UpdateCheckResult]: string } = {
    [UpdateCheckResult.NEW_VERSION_AVAILABLE]: "新版本可用，点击下载",
    [UpdateCheckResult.UP_TP_DATE]: "已是最新版本",
    [UpdateCheckResult.UNKNOWN]: "检查更新",
    [UpdateCheckResult.CHECKING]: "正在检查...",
    [UpdateCheckResult.NETWORK_ERROR]: "检查失败，请重试"
  };
  const updateCheckStateColor: { [key in UpdateCheckResult]: string } = {
    [UpdateCheckResult.NEW_VERSION_AVAILABLE]: "DodgerBlue",
    [UpdateCheckResult.UP_TP_DATE]: "green",
    [UpdateCheckResult.UNKNOWN]: "gray",
    [UpdateCheckResult.CHECKING]: "DarkOrange",
    [UpdateCheckResult.NETWORK_ERROR]: "red"
  };
  const mainButtonStyleManger = () => {
    return {
      color: 'white',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease',
      backgroundColor: updateCheckStateColor[updateCheckState],
      width: "100%"
    };
  }
  return <Button style={mainButtonStyleManger()} onClick={mainButtonFunctionManager}>{updateCheckStateText[updateCheckState]}</Button>
}


export default IndexPopup;