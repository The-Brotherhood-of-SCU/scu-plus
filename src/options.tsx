import { useState } from "react"

function IndexOptions() {
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
      <p>项目主页:https://github.com/jeanhua/scu-plus</p>
    </div>
  )
}

export default IndexOptions
