import { useState } from "react"
import { checkVersion } from "~background"
import packagejson from "package.json"

function IndexPopup() {
  const [data, setData] = useState("")

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
      <p>项目主页:<a href="https://github.com/jeanhua/scu-plus">https://github.com/jeanhua/scu-plus</a></p>
      <span>当前版本{packagejson.version}</span>
      <button onClick={checkVersion}>检查更新</button>
    </div>
  )
}

export default IndexPopup;