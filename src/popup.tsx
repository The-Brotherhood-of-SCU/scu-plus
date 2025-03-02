import { useState } from "react"
import { checkVersion } from "src/script/utils"
import packagejson from "package.json"

function IndexPopup() {
  const [data, setData] = useState("")
  const login_link="https://id.scu.edu.cn/frontend/login#/login?sp_code=bDBhREE1WDMzK3llSzZyVFZNeE81czRDd1hESTI4NWxGaFdsTnlvcGt3eVdTb2cxSjN5a1FJTDVMWTBEQkFFd2k1bWZRMy82OXN6V21ZYzFLd2NlSDl1ekZ4bSt4Q0kzSWJYRG5UZkRzQ002ek10cUlNVGE4V2JmQXJqdnF0NFJNM3J3ZTl6TCtOTzV2TVN5eGJtYUVmMmw3ek8xckozQWFHNWxZcEtRM3EzbHZGeDc4MzV3Mm9CRllSbm4rTXMvc3dHTGd4ZTJwbEJwTHJaUnNIeUhOKzd2N2J4UitQWGcyZkxiVllBSlZ3QWNvcXRrSVlhWmVnU3R3dVloL2I4SncyQ0JpMEhKS0tRU3pnRzZIMDhoNUplQ2ozcHJ3b20zZlJTek1qL0hkN1FpdkE0a1NvN05VdmNYeXJsK0NJWGc%3D&application_key=scdxplugin_jwt23&application_disabled=false&redirect_uri=aHR0cHM6Ly9pZC5zY3UuZWR1LmNuL2VuZHVzZXIvc3Avc3NvL3NjZHhwbHVnaW5fand0MjM%2FZW50ZXJwcmlzZUlkPXNjZHgmdGFyZ2V0X3VybD1pbmRleA%3D%3D"
  const project_link="https://github.com/The-Brotherhood-of-SCU/scu-plus"

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
      <p>项目主页:<a href={project_link} target="_blank">{project_link}</a></p>
      <span>当前版本{packagejson.version}</span>
      <button onClick={checkVersion}>检查更新</button>
    </div>
  )
}

export default IndexPopup;