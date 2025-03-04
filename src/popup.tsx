import { useState } from "react"
import { checkVersion,UpdateCheckResult } from "src/script/utils"
import packagejson from "package.json"

const login_link="https://id.scu.edu.cn/frontend/login#/login?sp_code=bDBhREE1WDMzK3llSzZyVFZNeE81czRDd1hESTI4NWxGaFdsTnlvcGt3eVdTb2cxSjN5a1FJTDVMWTBEQkFFd2k1bWZRMy82OXN6V21ZYzFLd2NlSDl1ekZ4bSt4Q0kzSWJYRG5UZkRzQ002ek10cUlNVGE4V2JmQXJqdnF0NFJNM3J3ZTl6TCtOTzV2TVN5eGJtYUVmMmw3ek8xckozQWFHNWxZcEtRM3EzbHZGeDc4MzV3Mm9CRllSbm4rTXMvc3dHTGd4ZTJwbEJwTHJaUnNIeUhOKzd2N2J4UitQWGcyZkxiVllBSlZ3QWNvcXRrSVlhWmVnU3R3dVloL2I4SncyQ0JpMEhKS0tRU3pnRzZIMDhoNUplQ2ozcHJ3b20zZlJTek1qL0hkN1FpdkE0a1NvN05VdmNYeXJsK0NJWGc%3D&application_key=scdxplugin_jwt23&application_disabled=false&redirect_uri=aHR0cHM6Ly9pZC5zY3UuZWR1LmNuL2VuZHVzZXIvc3Avc3NvL3NjZHhwbHVnaW5fand0MjM%2FZW50ZXJwcmlzZUlkPXNjZHgmdGFyZ2V0X3VybD1pbmRleA%3D%3D"
const project_link="https://github.com/The-Brotherhood-of-SCU/scu-plus"

function IndexPopup() {


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        width:"300px",
      }}>
      <h1>
        欢迎使用SCU+插件😘
      </h1>
      <a href={login_link} target="_blank">登陆教务处（统一登陆）</a>
      <hr style={{ border: '1px solid #ccc', width: '100%' }}/>
      <a href={`chrome-extension://${chrome.runtime.id}/tabs/setting.html`} target="_blank">插件设置</a>
      <p>项目主页:<a href={project_link} target="_blank">{project_link}</a></p>
      <span>当前版本{packagejson.version}</span>
      <MainButton/>
    </div>
  )
}
function MainButton(){
  const [updateCheckState, setUpdateCheckState] = useState(UpdateCheckResult.UNKNOWN)

  const gotoDownloadPage=()=>{
    window.open("https://github.com/The-Brotherhood-of-SCU/scu-plus/releases")
  }
  //根据updateCheckState状态决定调用的函数
  const mainButtonFunctionManager=async()=>{
    if(updateCheckState==UpdateCheckResult.CHECKING){
      return
    }else if(updateCheckState===UpdateCheckResult.NEW_VERSION_AVAILABLE){
      gotoDownloadPage();
    }else{
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
  const mainButtonStyleManger=()=>{
    return  {
      color: 'white',
      borderRadius: '4px',
      border: 'none',
      padding: '6px 16px',
      cursor: 'pointer',
      margin: "2px 0px 0px 0px",
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease',
      backgroundColor: updateCheckStateColor[updateCheckState]
    };
  }
  return <button style={mainButtonStyleManger()} onClick={mainButtonFunctionManager}>{updateCheckStateText[updateCheckState]}</button>
}


export default IndexPopup;