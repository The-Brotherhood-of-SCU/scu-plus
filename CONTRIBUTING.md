# 🎯 SCU+ 贡献指南

感谢你对 SCU+ 项目的兴趣！我们欢迎任何形式的贡献，包括但不限于代码提交、功能建议、问题反馈和文档改进。

---

## 📋 目录

- [🤝 如何贡献](#%E5%A6%82%E4%BD%95%E8%B4%A1%E9%8A%80)
- [🔧 开发环境搭建](#%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA)
- [📁 项目结构](#%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84)
- [🐛 提 Issue](#%E6%8F%90-issue)
- [📝 提交 PR](#%E6%8F%90%E4%BA%A4-pr)
- [📖 代码规范](#%E4%BB%A3%E7%A0%81%E8%A7%84%E8%8C%83)
- [🔐 注意事项](#%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)

---

## 🤝 如何贡献

1. **Fork** 本仓库
2. 创建你的特性分支 (`git checkout -b feature/awesome-feature`)
3. 进行开发并提交更改
4. 推送分支到你的 Fork 仓库
5. 提交 **Pull Request**

---

## 🔧 开发环境搭建

### 前置要求

- Node.js (推荐 v18+)
- pnpm

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/The-Brotherhood-of-SCU/scu-plus.git
cd scu-plus

# 安装依赖
pnpm install

# 启动开发模式
pnpm dev
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm package` | 打包扩展程序 |

---

## 📁 项目结构

```
scu-plus/
├── src/
│   ├── common/              # 公共模块
│   │   ├── types.ts         # 类型定义
│   │   └── index.ts         # 公共工具导出
│   ├── features/            # 功能模块
│   │   ├── navbar/          # 导航栏增强
│   │   ├── menu/            # 菜单注入
│   │   ├── schedule/        # 校历功能
│   │   └── homepage/        # 主页功能
│   ├── contents/            # Content Scripts
│   │   └── *.ts             # 页面注入脚本
│   ├── script/              # 工具脚本
│   │   ├── utils.ts         # 工具函数
│   │   └── config.ts        # 配置管理
│   ├── tabs/                # 设置页面
│   ├── background.ts        # Service Worker
│   └── popup.tsx            # 弹窗页面
├── package.json
└── tsconfig.json
```

---

## 🐛 提 Issue

请在提交 Issue 时包含以下信息：

- **问题描述**：清晰描述你遇到的问题
- **复现步骤**：详细的复现步骤
- **预期行为**：你期望的行为
- **实际行为**：实际发生的行为
- **环境信息**：浏览器版本、操作系统等

### Issue 模板

```markdown
## 问题描述
[详细描述问题]

## 复现步骤
1. 打开页面
2. 点击...
3. 出现错误

## 预期行为
[期望发生什么]

## 实际行为
[实际发生什么]

## 环境信息
- 浏览器：
- 操作系统：
- 插件版本：
```

---

## 📝 提交 PR

### PR 标题规范

使用以下前缀：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `refactor:` 代码重构
- `style:` 代码格式调整
- `chore:` 构建/工具链更新

示例：
- `feat: 添加成绩导出功能`
- `fix: 修复课表显示错位问题`

### PR 描述模板

```markdown
## 描述
[简述这个 PR 做了什么]

## 改动类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 代码重构

## 测试
- [ ] 已本地测试
- [ ] 需要人工测试

## 截图（如有）
[相关截图]
```

---

## 📖 代码规范

### TypeScript

- 使用 TypeScript 进行开发，优先定义类型
- 避免使用 `any`，使用具体类型或 `unknown`

### 函数设计

- 单一职责：每个函数只做一件事
- 语义化命名：函数名应清晰表达其功能
- 使用 async/await 处理异步操作

### 组件规范

```typescript
// 正确示例
export async function injectMenu(): Promise<void> {
  // 函数名清晰表达功能
  // 返回类型明确
}

// 避免
function doSomething() { // 名称模糊，无返回类型
  // ...
}
```

### 导入顺序

```typescript
// 1. 第三方库
import React from "react"

// 2. Plasmo 相关
import type { PlasmoCSConfig } from "plasmo"

// 3. 项目内部 - 公共模块
import { SettingItem } from "~common/types"

// 4. 项目内部 - 功能模块
import { injectNavbar } from "~features/navbar"

// 5. 项目内部 - 脚本工具
import { $ } from "~script/utils"
```

---

## 🔐 注意事项

### 隐私安全

- ❌ 禁止在代码中硬编码任何敏感信息（API 密钥、密码等）
- ❌ 禁止将用户数据上传到第三方服务器
- ✅ 所有用户数据存储在本地 Storage 中

### 兼容性

- 确保代码兼容 Chrome/Edge
- 注意教务系统的版本更新可能带来的页面结构变化

### 测试

- 提交 PR 前请确保 `pnpm build` 能够成功构建
- 尽量测试不同页面和场景

---

## 📞 联系我们

- 📧 QQ群：835747109
- 💬 GitHub Issues：https://github.com/The-Brotherhood-of-SCU/scu-plus/issues

---

感谢你的贡献！🎉
