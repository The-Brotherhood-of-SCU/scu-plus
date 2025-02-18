import { useState } from "react"

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
      
    </div>
  )
}

export default IndexPopup
