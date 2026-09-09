<div align="center">

# ✦ SCU-Plus

**四川大学教务系统增强插件**

高颜值设计 × 实用功能，让你的教务系统焕然一新

[![License](https://img.shields.io/badge/license-GPL--3.0-green?style=flat-square)](./LICENSE)
[![Plasmo](https://img.shields.io/badge/built%20with-Plasmo-orange?style=flat-square)](https://www.plasmo.com/)
[![Stars](https://img.shields.io/github/stars/The-Brotherhood-of-SCU/scu-plus?style=flat-square)](https://github.com/The-Brotherhood-of-SCU/scu-plus/stargazers)

[🧩 安装指南](#-安装指南) · [✨ 功能亮点](#-核心功能) · [💡 常见问题](#-常见问题faq) · [📖 Wiki](https://github.com/The-Brotherhood-of-SCU/scu-plus/wiki)

</div>

---

## 🖼 界面预览

<div align="center">
全新杂志风主题，教务系统也能优雅


<img src="./README/new_theme.png" alt="新主题主页预览" width="90%" />
<img src="./README/score.png" alt="分数看板" width="90%" />

</div>

## Safari（macOS / iOS / iPadOS）

Safari 安装包由 [Visio-Vanitas/scu-plus 分发仓库](https://github.com/Visio-Vanitas/scu-plus/releases)提供，跟随本仓库发布的版本 tag 构建，使用 Developer ID 签名并经 Apple 公证。下载对应版本的 DMG，将 SCU Plus 拖到“应用程序”，再在 Safari 设置 → 扩展中启用并授予所需网站权限。

> **不建议任何不了解 IPA 的同学下载或尝试安装。** 普通测试者请使用下方 TestFlight 入口。

iOS/iPadOS：同一 Release 提供 `scu-plus-safari-ios-unsigned.ipa`，供有技术背景的同学自行重签后测试。它不能直接安装；必须使用自己的签名身份和匹配的描述文件同时重签主 App 与 Safari 扩展，再安装并在 Safari 设置中启用。该包是 Release 构建，原生断点调试需从源码使用 Xcode 构建。普通测试者可使用 [TestFlight 邀请链接](https://testflight.apple.com/join/VfB4puVJ)，能否安装取决于 Apple 审核和当前测试状态。

上游新版本发布后，Safari 安装包需要等待构建、公证完成；进度见[分发构建](https://github.com/Visio-Vanitas/scu-plus/actions/workflows/safari-release-sync.yml)。本仓库不保存 Apple 签名凭据，也不需要配置跨仓库 Secret。

开发者可使用 `pnpm build:safari` 生成未签名的 `build/safari-mv3-prod.zip`；该 ZIP 用于开发测试，不能替代上述 macOS 安装包。开发运行方式见 [Apple 官方说明](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)。

## ✨ 核心功能

### 🛡️ 隐私与安全

- 🔒 **智能隐私保护** — 自动隐藏姓名、学号、证件照，一键切换
- 🔑 **登录简化** — 内置本地 OCR 验证码识别（零配置、离线可用，覆盖统一认证与教务处登录页）+ 统一认证重定向登录
- 🚫 **跳过两步验证** — 自动跳过 2FA 二次验证，绕过强制修改密码页面
- ⚠️ **退课提醒** — 退课前展示课程名称，避免误操作

### 📈 学业数据可视化

| 模块 | 功能亮点 |
| --- | --- |
| **成绩看板** | GPA 自动计算 / 挂科过滤 / 自定义统计维度 |
| **课程统计** | 课时总量分析 / 学分进度追踪 |
| **数据导出** | 课表导出为图片 / JSON / ICS 日历文件 |

### ⚡ 效率增强

- 📅 顶部导航栏集成校历，一键查看最新校历
- 🔄 自动检查更新 — 在设置中开启，基于 GitHub Releases 检测新版本
- ✔️ 一键教学评估 — 队列式自动评教，支持自定义评分范围
- 🎯 自定义选课筛选器 — 按上课时间等条件筛选课程
- 🧭 通知栏异常修复

### 🌈 界面优化

- 🧩 **杂志风主题** — 全新设计的现代化教务系统界面
- 🌙 **深色模式** — 支持浅色 / 深色 / 跟随系统三种模式，即时切换
- 🖼 **隐私美化** — 头像自定义替换、姓名学号隐藏，保护隐私同时保持界面整洁
- 🎨 **个性化设置** — 主题点缀色、布局随心调整，配置支持导入导出

---

## 🛠️ 安装指南

### Chromium 系浏览器（Chrome、Edge 等）

| 步骤 | 操作说明 |
| --- | --- |
| 1️⃣ **下载插件** | [前往 Releases](https://github.com/The-Brotherhood-of-SCU/scu-plus/releases/latest) 下载 `chrome-mv3-prod-*.zip` |
| 2️⃣ **访问扩展页面** | 地址栏输入 `chrome://extensions` |
| 3️⃣ **启用开发者模式** | 打开右上角「开发者模式」开关，刷新页面 |
| 4️⃣ **加载插件** | 将下载的 ZIP 包拖入扩展页面，确认安装 |

### Firefox 浏览器（测试中，稳定性未知）

| 步骤 | 操作说明 |
| --- | --- |
| 1️⃣ **下载插件** | [前往 Releases](https://github.com/The-Brotherhood-of-SCU/scu-plus/releases/latest) 下载 `firefox-mv3-prod-*.zip` |
| 2️⃣ **访问扩展页面** | 地址栏输入 `about:debugging#/runtime/this-firefox` |
| 3️⃣ **加载插件** | 点击「临时载入附加组件」，选择 ZIP 文件 |

> 💡 **提示**：支持 Chrome、Edge 等 Chromium 系浏览器及 Firefox，Safari 安装方式见上方专节。
> 📘 详细图文版请参考 [小白安装教程](https://github.com/The-Brotherhood-of-SCU/scu-plus/wiki/安装)。

---

## 🌟 辅助功能

| 功能 | 使用场景 | 操作说明 |
| --- | --- | --- |
| 配置同步 | 多设备切换使用 | 设置页 → 导入 / 导出配置 |
| 版本检查 | 手动检查更新 | 侧边栏菜单 → 设置 → 检查版本更新 |

---

## 💡 常见问题（FAQ）

<details>
<summary><b>Q1：验证码识别需要联网吗？</b></summary>

不需要。统一认证与教务处登录页的验证码均由插件在本地识别：统一认证使用轻量级模板匹配模型，教务处登录页使用独立的本地 OCR 包，二者均不发起任何网络请求。

</details>

<details>
<summary><b>Q2：插件会上传个人数据吗？</b></summary>

不会。所有数据处理均在本地完成。

</details>

<details>
<summary><b>Q3：如何解决「关闭开发者模式扩展」弹窗？</b></summary>

可使用 [remove-edge-extension-notice](https://github.com/The-Brotherhood-of-SCU/remove-edge-extension-notice)，或参考此教程：[Bilibili 专栏](https://www.bilibili.com/opus/1003408122502447108)

</details>

---

## 🤝 贡献指南

💬 我们欢迎任何形式的贡献！

| 类型 | 操作 |
| --- | --- |
| 💡 功能建议 | [创建 Issue](https://github.com/The-Brotherhood-of-SCU/scu-plus/issues) |
| 🧩 新功能开发 | 参考 [贡献手册](https://github.com/The-Brotherhood-of-SCU/scu-plus/wiki/贡献) |
| 📝 文档改进 | 直接编辑 `README.md` |

---

## 📜 开源协议

本项目基于 **[GPL-3.0 License](./LICENSE)** 开源，请在二次开发中保持开源并注明原始出处。

---

## 📞 联系我们

- 📧 QQ群：1102483776
- 💬 GitHub Issues：https://github.com/The-Brotherhood-of-SCU/scu-plus/issues

---

## 💖 致谢

感谢所有为 **SCU-Plus** 做出贡献的开发者与社区成员！

[![contributors](https://contrib.rocks/image?repo=The-Brotherhood-of-SCU/scu-plus)](https://github.com/The-Brotherhood-of-SCU/scu-plus/graphs/contributors)