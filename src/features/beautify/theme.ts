export const MAGAZINE_THEME_CSS = `
/* ============================================================
   SCU+ 教务系统 · 杂志风主题 (Editorial / Magazine Theme)
   纸 · 墨 · 朱 —— 现代、简洁、高端
   ============================================================ */

:root {
  --scu-paper: #f4f2ec;
  --scu-surface: #fffdf8;
  --scu-ink: #1d1c1a;
  --scu-ink-soft: #57564f;
  --scu-ink-faint: #8f8e85;
  --scu-line: #e4e0d4;
  --scu-line-strong: #c9c4b4;
  --scu-accent: #9e1b32;            /* 锦绣红 — 可通过设置更改 */
  --scu-accent-soft: rgba(158, 27, 50, 0.06);
  --scu-accent-fill: #9e1b32;        /* 填充按钮底色（深色模式下由 JS 调亮） */
  --scu-accent-line: rgba(158, 27, 50, 0.22);
  --scu-serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif;
  --scu-sans: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  /* 杂志配色盘（课表色块等） */
  --scu-c1: #9e1b32;
  --scu-c2: #3f6b4f;
  --scu-c3: #2f5d7c;
  --scu-c4: #a5673f;
  --scu-c5: #6b4f7c;
  --scu-c6: #4f6366;
  /* 组件级配色（深色模式下由下方覆盖块替换） */
  --scu-sidebar-bg: #f8f6f0;
  --scu-rowhead-bg: #faf8f2;
  --scu-surface-dim: #f0ede5;
  --scu-row-hover: rgba(29, 28, 26, 0.028);
  --scu-tools-bg: rgba(255, 253, 248, 0.92);
  --scu-selection-bg: rgba(158, 27, 50, 0.16);
  --scu-shadow-rgb: 29, 28, 26;
  --scu-label-success-bg: #edf3ee;
  --scu-label-success-border: rgba(63, 107, 79, 0.25);
  --scu-label-warning-bg: #f7f0e3;
  --scu-label-warning-border: rgba(165, 103, 63, 0.25);
  --scu-label-info-bg: #edf3f6;
  --scu-label-info-border: rgba(47, 93, 124, 0.22);
  --scu-label-default-bg: #f1efe8;
  --scu-label-purple-bg: #f1edf5;
}

/* ============================================================
   深色模式 —— 暖炭纸 · 米白墨（beautifyDarkMode = dark / auto 且系统深色）
   JS 在 <html> 上设置 data-scu-theme="dark" 后生效；
   --scu-accent 系列由 JS 按模式写入调亮后的值。
   ============================================================ */
:root[data-scu-theme="dark"] {
  color-scheme: dark;
  --scu-paper: #171615;
  --scu-surface: #201f1d;
  --scu-ink: #e6e3da;
  --scu-ink-soft: #b5b2a8;
  --scu-ink-faint: #84827a;
  --scu-line: #35332e;
  --scu-line-strong: #4c4a43;
  /* 杂志配色盘 —— 同色系调亮 */
  --scu-c2: #71a382;
  --scu-c3: #6b9ec4;
  --scu-c4: #cf9261;
  --scu-c5: #a182b8;
  --scu-c6: #82a0a4;
  /* 组件级配色 */
  --scu-sidebar-bg: #1c1b19;
  --scu-rowhead-bg: #242320;
  --scu-surface-dim: #2a2925;
  --scu-row-hover: rgba(230, 227, 218, 0.05);
  --scu-tools-bg: rgba(32, 31, 29, 0.92);
  --scu-selection-bg: rgba(230, 227, 218, 0.18);
  --scu-shadow-rgb: 0, 0, 0;
  --scu-label-success-bg: rgba(113, 163, 130, 0.14);
  --scu-label-success-border: rgba(113, 163, 130, 0.32);
  --scu-label-warning-bg: rgba(207, 146, 97, 0.14);
  --scu-label-warning-border: rgba(207, 146, 97, 0.32);
  --scu-label-info-bg: rgba(107, 158, 196, 0.14);
  --scu-label-info-border: rgba(107, 158, 196, 0.32);
  --scu-label-default-bg: rgba(230, 227, 218, 0.08);
  --scu-label-purple-bg: rgba(161, 130, 184, 0.14);
}

/* ---------- 全局基调 ---------- */
html, body {
  background: var(--scu-paper) !important;
}
body {
  font-family: var(--scu-sans) !important;
  color: var(--scu-ink) !important;
  -webkit-font-smoothing: antialiased;
}
::selection {
  background: var(--scu-selection-bg);
}
a { color: inherit; }
a:hover, a:focus { color: var(--scu-accent); text-decoration: none; }

/* 细滚动条 */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--scu-line-strong);
  border: 3px solid var(--scu-paper);
  border-radius: 6px;
}
::-webkit-scrollbar-thumb:hover { background: var(--scu-ink-faint); }

/* ============================================================
   顶部导航 —— 报头 (Masthead)
   ============================================================ */
#navbar {
  background: var(--scu-surface) !important;
  background-image: none !important;
  border: none !important;
  border-top: 3px solid var(--scu-accent) !important;
  border-bottom: 1px solid var(--scu-ink) !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  min-height: 45px !important;
}
#navbar .navbar-container { padding: 0 18px; }
#navbar .navbar-header { margin-top: 0 !important; }
#navbar .navbar-header a.navbar-brand {
  line-height: 45px !important;
  height: 45px !important;
  padding: 0 !important;
}

/* 站点标题 —— 衬线大字 + 字距 */
#navbar .navbar-header a,
#navbar .navbar-header a small,
#navbar .navbar-header a.navbar-brand {
  color: var(--scu-ink) !important;
  font-family: var(--scu-serif) !important;
  font-size: 19px !important;
  font-weight: 700 !important;
  letter-spacing: 0.14em !important;
  text-shadow: none !important;
}

/* 右侧导航 —— 去色块，统一行高 */
#navbar .ace-nav { margin: 0 !important; }
#navbar .ace-nav > li {
  background: transparent !important;
  border: none !important;
  border-left: 1px solid var(--scu-line) !important;
  height: 45px !important;
  line-height: 45px !important;
  overflow: visible !important;
}
#navbar .ace-nav > li > a {
  background: transparent !important;
  color: var(--scu-ink-soft) !important;
  font-size: 12.5px !important;
  letter-spacing: 0.05em;
  padding: 0 12px !important;
  height: 45px !important;
  line-height: 45px !important;
  display: block !important;
  white-space: nowrap !important;
  transition: color .15s ease;
  overflow: visible !important;
}
#navbar .ace-nav > li > a:hover,
#navbar .ace-nav > li > a:focus,
#navbar .ace-nav > li.open > a {
  background: var(--scu-accent-soft) !important;
  color: var(--scu-ink) !important;
}
#navbar .ace-nav > li > a > .ace-icon { color: var(--scu-ink-faint) !important; }
#navbar .ace-nav > li > a:hover > .ace-icon { color: var(--scu-accent) !important; }
#navbar .ace-nav .badge { display: none; }

/* 智能搜索按钮 —— 复位为普通图标 */
#navbar .ace-nav > li:first-child { width: 40px !important; }
#navbar #intellegenceUDiv { position: static !important; width: 40px; height: 45px; }
#navbar #clickdiv {
  position: static !important;
  background: transparent !important;
  background-color: transparent !important;
  width: 40px !important;
  height: 45px !important;
  line-height: 45px !important;
  display: block !important;
  text-align: center;
}
#navbar #clickdiv #clicki,
#navbar #clickdiv .fa-search {
  color: var(--scu-ink-faint) !important;
  margin: 0 !important;
  font-size: 15px;
}
#navbar #clickdiv:hover #clicki { color: var(--scu-accent) !important; }
#navbar #form-search[style*="width: 0px"] { visibility: hidden !important; }
#navbar #form-search .nav-search-input {
  border: 1px solid var(--scu-line-strong) !important;
  background: var(--scu-paper) !important;
  color: var(--scu-ink) !important;
  border-radius: 2px !important;
  box-shadow: none !important;
}

/* 用户头像区 */
#navbar .ace-nav > li.light-blue > a,
#navbar .ace-nav > li.light-blue > a > span { color: var(--scu-ink) !important; }
#navbar .ace-nav img.nav-user-photo {
  border: 1px solid var(--scu-line-strong) !important;
  border-radius: 50% !important;
  width: 30px !important;
  height: 30px !important;
  margin-right: 6px;
}
/* 欢迎语小字 + 姓名大字 */
#navbar .ace-nav .user-info {
  display: inline-block !important;
  vertical-align: middle !important;
  line-height: 1.15 !important;
  text-align: left;
  font-family: var(--scu-serif) !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  color: var(--scu-ink) !important;
  letter-spacing: 0.04em;
  overflow: visible !important;
}
#navbar .ace-nav .user-info small {
  display: block !important;
  font-family: var(--scu-sans) !important;
  font-size: 10px !important;
  font-weight: 400 !important;
  color: var(--scu-ink-faint) !important;
  letter-spacing: 0.15em;
  margin-bottom: 1px;
}

/* ============================================================
   面包屑
   ============================================================ */
.breadcrumbs {
  background: transparent !important;
  border-bottom: 1px solid var(--scu-line) !important;
  min-height: 38px !important;
  padding-left: 20px !important;
}
.breadcrumbs .breadcrumb,
.breadcrumbs .breadcrumb a,
.breadcrumbs .breadcrumb i {
  color: var(--scu-ink-faint) !important;
  font-size: 12px !important;
  letter-spacing: 0.1em;
  background: transparent !important;
}
.breadcrumbs .breadcrumb .active { color: var(--scu-ink-soft) !important; }

/* ============================================================
   侧边栏 —— 目录栏
   ============================================================ */
#sidebar {
  background: var(--scu-sidebar-bg) !important;
  border-right: 1px solid var(--scu-line) !important;
}
#sidebar::before { display: none !important; }

#sidebar .nav-list { background: transparent !important; }
#sidebar .nav-list > li { background: transparent !important; border: none !important; }
#sidebar .nav-list > li > a {
  background: transparent !important;
  color: var(--scu-ink-soft) !important;
  font-size: 13px !important;
  letter-spacing: 0.04em;
  padding: 10px 14px !important;
  text-shadow: none !important;
  border: none !important;
  border-left: 3px solid transparent !important;
  transition: background .12s ease, color .12s ease;
}
#sidebar .nav-list > li > a:hover {
  background: var(--scu-accent-soft) !important;
  color: var(--scu-ink) !important;
}
#sidebar .nav-list > li.active > a,
#sidebar .nav-list > li.open > a {
  background: var(--scu-accent-soft) !important;
  color: var(--scu-ink) !important;
  font-weight: 600;
  border-left-color: var(--scu-accent) !important;
}
/* 顶层 li 的右侧竖条指示器（直连子代才生效） */
#sidebar .nav-list > li.active::after,
#sidebar.no-skin .nav-list > li.active::after {
  border-color: var(--scu-accent) !important;
  border-right-color: var(--scu-accent) !important;
}
/* 注意：不能使用 > 子代选择器，因为 li.active 可能在子菜单中（非 .nav-list 直接子代）
   li.active > a::after 是右侧小三角指示器，改为主题色；highlight 的大三角用 ::before 隐藏 */
#sidebar .nav-list li.active > a::after {
  border-right-color: var(--scu-accent) !important;
}
#sidebar .nav-list li.active > a::before {
  display: none !important;
}
#sidebar .nav-list .menu-icon { color: var(--scu-ink-faint) !important; }
#sidebar .nav-list > li.active > a .menu-icon,
#sidebar .nav-list > li > a:hover .menu-icon { color: var(--scu-accent) !important; }
#sidebar .nav-list .arrow { color: var(--scu-ink-faint) !important; }

/* 子菜单 */
#sidebar .submenu {
  background: transparent !important;
  border: none !important;
}
#sidebar .submenu::before,
#sidebar .submenu > li::before { border-color: var(--scu-line) !important; }
#sidebar .submenu > li > a {
  color: var(--scu-ink-soft) !important;
  font-size: 12.5px !important;
  background: transparent !important;
  border: none !important;
  padding: 8px 14px 8px 30px !important;
}
#sidebar .submenu > li > a:hover {
  color: var(--scu-accent) !important;
  background: var(--scu-accent-soft) !important;
}
#sidebar .submenu > li.active > a {
  color: var(--scu-accent) !important;
  font-weight: 600;
}
#sidebar .submenu .menu-icon { color: var(--scu-ink-faint) !important; }

/* 收起按钮 */
#sidebar .sidebar-collapse,
#sidebar .sidebar-collapse > [class*="fa-"] {
  background: transparent !important;
  color: var(--scu-ink-faint) !important;
  border-color: var(--scu-line-strong) !important;
}

/* ---- 收起状态 (menu-min) ---- */
/* 1) 图标居中 —— 使用 Ace Admin 原生行高，仅去除水平 padding */
#sidebar.menu-min .nav-list > li > a {
  padding: 6px 0 !important;
  text-align: center !important;
  line-height: 24px !important;
}
#sidebar.menu-min .nav-list > li > a .menu-icon {
  display: block !important;
  margin: 0 auto !important;
  float: none !important;
  width: auto !important;
  font-size: 13px !important;
}
/* 隐藏文字与箭头，仅保留图标 */
#sidebar.menu-min .nav-list > li > a .menu-text,
#sidebar.menu-min .nav-list > li > a .arrow {
  display: none !important;
}

/* 2) 鼠标悬停弹出菜单（flyout）—— 仅作用在 li 的直接 .submenu 子级，
      避免污染设置项内的嵌套子菜单。 */
#sidebar.menu-min .nav-list > li > .submenu {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  border-radius: 4px !important;
  box-shadow: 2px 2px 12px rgba(var(--scu-shadow-rgb), 0.12) !important;
  padding: 8px 0 !important;
  min-width: 160px !important;
  position: absolute;
  left: 100%;
  z-index: 999;
  /* 强制顶部对齐，覆盖 Ace Admin JS 可能设置的错误 inline top */
  top: -42px !important;
}
#sidebar.menu-min .nav-list > li > .submenu > li > a {
  padding: 8px 18px !important;
  background: transparent !important;
  color: var(--scu-ink-soft) !important;
  white-space: nowrap !important;
}
#sidebar.menu-min .nav-list > li > .submenu > li > a:hover {
  color: var(--scu-accent) !important;
  background: var(--scu-accent-soft) !important;
}
#sidebar.menu-min .nav-list > li > .submenu > li.active > a {
  border-left: 3px solid var(--scu-accent) !important;
  font-weight: 600;
}
/* 兼容 Ace Admin 可能生成的独立弹窗元素（非 .submenu 路径） */
#sidebar.menu-min [class*="popup"],
#sidebar.menu-min [class*="flyout"],
#sidebar.menu-min .popover,
#sidebar.menu-min .tooltip {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  border-radius: 4px !important;
  box-shadow: 2px 2px 12px rgba(var(--scu-shadow-rgb), 0.12) !important;
}

/* 3) 弹出式 tooltip（当菜单项无子菜单时，Ace Admin 可能生成独立 tooltip） */
#sidebar.menu-min .nav-list > li > .tooltip,
#sidebar.menu-min .nav-list > li > .popover {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  border-radius: 4px !important;
}
#sidebar.menu-min .nav-list > li > .tooltip .tooltip-inner {
  background: var(--scu-surface) !important;
  color: var(--scu-ink) !important;
  border-radius: 4px !important;
}

/* ============================================================
   页面主体
   ============================================================ */
.main-content, .main-content-inner, .page-content {
  background: var(--scu-paper) !important;
}
/* ACE 主容器背景伪元素（z-index:-2 铺满全高的白底）—— 内容不足一屏时露出的白块即源于此 */
.main-container::before {
  background: var(--scu-paper) !important;
}
#page-content-template {
  background: transparent !important;
  border: none !important;
}

/* 页面标题区 */
.page-header {
  border-bottom: 1px solid var(--scu-ink) !important;
  padding-bottom: 8px !important;
  margin: 12px 20px 18px !important;
}
.page-header h1, .page-header .h1,
.page-header h1 small {
  font-family: var(--scu-serif) !important;
  color: var(--scu-ink) !important;
  font-weight: 700 !important;
  letter-spacing: 0.06em;
}

/* ACE .header 区块标题 —— 衬线栏目题 */
h1.header, h2.header, h3.header, h4.header, h5.header, .header {
  font-family: var(--scu-serif) !important;
  color: var(--scu-ink) !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em;
  text-shadow: none !important;
  border-bottom: none !important;
}
.header .ace-icon, .header i { color: var(--scu-accent) !important; }
.header small, .header .smaller { color: var(--scu-ink-faint) !important; font-weight: 400 !important; }

/* ============================================================
   卡片 / Widget —— 杂志栏目块
   ============================================================ */
.widget-box {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  border-radius: 3px !important;
  box-shadow: 0 1px 3px rgba(var(--scu-shadow-rgb),0.05) !important;
  margin-bottom: 18px !important;
}
.widget-box > .widget-header,
.widget-box .widget-header {
  background: transparent !important;
  background-image: none !important;
  border-bottom: 1px solid var(--scu-line) !important;
  min-height: 42px !important;
  padding: 10px 16px !important;
  color: var(--scu-ink) !important;
}
.widget-box .widget-header .widget-title,
.widget-box .widget-header h5 {
  font-family: var(--scu-serif) !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  color: var(--scu-ink) !important;
  letter-spacing: 0.05em;
  text-shadow: none !important;
  line-height: 22px !important;
}
/* 栏目标记 —— 朱色小方块 */
.widget-box .widget-header .widget-title::before,
.widget-box .widget-header h5::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 9px;
  background: var(--scu-accent);
  vertical-align: 1px;
}
.widget-box .widget-toolbar,
.widget-box .widget-toolbar > a,
.widget-box .widget-toolbar [data-action] {
  color: var(--scu-ink-faint) !important;
  background: transparent !important;
  border: none !important;
}
.widget-box .widget-toolbar > a:hover { color: var(--scu-accent) !important; }
.widget-box .widget-toolbar::before { display: none !important; }
.widget-box .widget-body { background: transparent !important; }

/* ============================================================
   首页信息块 (infobox) —— 大数字编辑部风格
   ============================================================ */
.infobox {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid var(--scu-line) !important;
  box-shadow: none !important;
  width: 100% !important;
  padding: 10px 4px !important;
}
.infobox .infobox-icon .ace-icon,
.infobox > .infobox-icon > .ace-icon {
  background: transparent !important;
  color: var(--scu-accent) !important;
  border: none !important;
}
.infobox .infobox-icon .ace-icon::before { color: var(--scu-accent) !important; }
.infobox-data-number {
  font-family: var(--scu-serif) !important;
  font-size: 30px !important;
  font-weight: 700 !important;
  color: var(--scu-ink) !important;
}
.infobox-content {
  color: var(--scu-ink-faint) !important;
  font-size: 12px !important;
  letter-spacing: 0.08em;
}
.infobox-red .infobox-data-number, .infobox-red .infobox-icon .ace-icon::before { color: var(--scu-accent) !important; }

/* 通知列表 */
.tabContent h3.click-item,
#notices h3 {
  background: transparent !important;
  border-bottom: 1px solid var(--scu-line) !important;
  padding: 8px 0 !important;
  height: auto !important;
}
.tabContent h3.click-item a, #notices h3 a {
  color: var(--scu-ink) !important;
  font-size: 14px !important;
}
.tabContent h3.click-item a:hover { color: var(--scu-accent) !important; }
.tabContent h3.click-item label { color: var(--scu-ink-faint) !important; font-weight: 400 !important; font-size: 12px !important; }
.tabContent h3.click-item label.hide_note { color: var(--scu-ink) !important; font-size: 14px !important; }
/* 序号 —— 大号衬线数字 */
#notices h3.click-item::before,
.tabContent h3.click-item::before {
  background: transparent !important;
  color: var(--scu-accent) !important;
  font-family: var(--scu-serif) !important;
  font-size: 20px !important;
  font-weight: 700 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  width: 32px !important;
  text-align: left !important;
  padding: 0 !important;
}

/* ============================================================
   表格 —— 三线表（学术杂志）
   ============================================================ */
.table {
  background: transparent !important;
  border: none !important;
  margin-bottom: 20px !important;
}
.table > thead > tr > th,
.table > thead > tr > td {
  background: var(--scu-surface) !important;
  border: none !important;
  border-top: 1.5px solid var(--scu-ink) !important;
  border-bottom: 1px solid var(--scu-ink) !important;
  color: var(--scu-ink) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.08em;
  padding: 10px 12px !important;
  vertical-align: bottom !important;
}
.table > tbody > tr > td,
.table > tbody > tr > th,
.table > tfoot > tr > td {
  border: none !important;
  border-bottom: 1px solid var(--scu-line) !important;
  color: var(--scu-ink) !important;
  font-size: 13px !important;
  padding: 9px 12px !important;
  font-variant-numeric: tabular-nums;
}
.table > tbody > tr:last-child > td { border-bottom: 1.5px solid var(--scu-ink) !important; }
.table-striped > tbody > tr:nth-child(odd) > td,
.table-striped > tbody > tr:nth-child(odd) > th { background: transparent !important; }
.table-hover > tbody > tr:hover > td,
.table-hover > tbody > tr:hover > th { background: var(--scu-row-hover) !important; }
.table-bordered, .table-bordered > thead > tr > th, .table-bordered > tbody > tr > td {
  border: none !important;
}
/* 表头行灰渐变、斑马行底色一并抹除（Bootstrap/ACE 设在 tr 上） */
.table > thead > tr { background: transparent !important; background-image: none !important; }
.table-striped > tbody > tr, .table-striped > tbody > tr:nth-of-type(odd) { background: transparent !important; background-image: none !important; }
/* 选中/高亮行（评教列表等）—— 站点浅绿底 #E4EFC9 带 !important，深色模式下文字不可读 */
table .highlight td, table .highlight th {
  background: var(--scu-accent-soft) !important;
}

/* ============================================================
   档案信息栅格（ACE profile）—— 去蓝底，杂志标签栏
   ============================================================ */
.profile-user-info { border: none !important; }
.profile-info-row {
  border: none !important;
  border-bottom: 1px solid var(--scu-line) !important;
}
.profile-user-info .profile-info-row:first-child { border-top: none !important; }
.profile-user-info .profile-info-name {
  background: transparent !important;
  border: none !important;
  color: var(--scu-ink-faint) !important;
  font-size: 11px !important;
  font-weight: 400 !important;
  letter-spacing: 0.1em;
  padding: 9px 12px !important;
}
.profile-user-info .profile-info-value {
  background: transparent !important;
  border: none !important;
  color: var(--scu-ink) !important;
  font-size: 13px !important;
  padding: 9px 12px !important;
}
.profile-info-value span { color: var(--scu-ink) !important; }
.profile-info-value a { color: var(--scu-accent) !important; }

/* 内容区裸标题（奖惩信息、学籍异动信息等） */
.main-content h3:not(.header):not(.modal-title) {
  font-family: var(--scu-serif) !important;
  color: var(--scu-ink) !important;
  font-weight: 700 !important;
  font-size: 17px !important;
  margin: 22px 0 10px !important;
}

/* 标题栏蓝色图片图标 —— 去色融入纸墨 */
h4.header img, .page-header img { filter: grayscale(1) !important; opacity: .72 !important; }
.xc_02 { filter: grayscale(1) !important; opacity: .78 !important; }

/* 表格外容器 */
.table-header {
  background: transparent !important;
  color: var(--scu-ink-soft) !important;
  border: none !important;
  font-size: 13px !important;
}

/* 成绩色块 —— 去底色，红标不及格 */
.green_background { background: transparent !important; }
.red_background { background: transparent !important; }
td.red_background, td.red_background a, td.red_background span { color: var(--scu-accent) !important; font-weight: 700 !important; }
td.green_background, td.green_background a, td.green_background span { color: var(--scu-ink) !important; }

/* ============================================================
   按钮 —— 扁平墨色
   ============================================================ */
.btn, .btn.btn-default {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line-strong) !important;
  color: var(--scu-ink-soft) !important;
  border-radius: 2px !important;
  box-shadow: none !important;
  text-shadow: none !important;
  font-size: 12.5px !important;
  letter-spacing: 0.04em;
  transition: all .12s ease;
}
.btn:hover, .btn:focus {
  border-color: var(--scu-ink) !important;
  color: var(--scu-ink) !important;
  background: var(--scu-surface) !important;
}
.btn-primary, .btn.btn-primary {
  background: var(--scu-accent-fill) !important;
  border-color: var(--scu-accent-fill) !important;
  color: #fff !important;
}
.btn-primary:hover, .btn-primary:focus {
  opacity: .85 !important;
}
.btn-info, .btn.btn-info {
  background: var(--scu-surface) !important;
  border-color: var(--scu-line-strong) !important;
  color: var(--scu-ink-soft) !important;
}
.btn-info:hover, .btn-info:focus {
  border-color: var(--scu-accent) !important;
  color: var(--scu-accent) !important;
}
.btn-success, .btn.btn-success {
  background: var(--scu-accent-fill) !important;
  border-color: var(--scu-accent-fill) !important;
  color: #fff !important;
}
.btn-success:hover {
  opacity: .85 !important;
}
.btn-danger, .btn.btn-danger {
  background: var(--scu-surface) !important;
  border-color: var(--scu-accent) !important;
  color: var(--scu-accent) !important;
}
.btn-danger:hover { background: var(--scu-accent-fill) !important; color: #fff !important; }
.btn-warning, .btn.btn-warning {
  background: var(--scu-surface) !important;
  border-color: var(--scu-c4) !important;
  color: var(--scu-c4) !important;
}
.btn-warning:hover { background: var(--scu-c4) !important; color: #fff !important; }
.btn.btn-white { background: var(--scu-surface) !important; border-color: var(--scu-line-strong) !important; color: var(--scu-ink-soft) !important; }
.btn.btn-white:hover, .btn.btn-white:focus { color: var(--scu-ink) !important; }
.btn.btn-white.btn-primary:hover, .btn.btn-white.btn-primary:focus { color: #fff !important; }
.btn-link, .btn.btn-link { background: transparent !important; border: none !important; color: var(--scu-accent) !important; }
.btn.disabled, .btn[disabled] { opacity: .5 !important; }

/* 评教列表 —— 非 btn-info 的按钮（即"评估"）用主题色 */
#codeTable .btn:not(.btn-info) {
  background: var(--scu-accent-fill) !important;
  border-color: var(--scu-accent-fill) !important;
  color: #fff !important;
}

/* ============================================================
   标签 / 徽章 —— 低饱和杂志色
   body 前缀提高优先级：站点在 h4/.header 等上下文中用 (0,1,1) 级
   !important 规则把标签文字设成深色，深色模式下会压过本节规则。
   ============================================================ */
body .label, body .badge {
  border-radius: 2px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: 0.05em;
  padding: 3px 8px !important;
  text-shadow: none !important;
  border: 1px solid transparent !important;
}
body .label-success, body .badge-success { background: var(--scu-label-success-bg) !important; color: var(--scu-c2) !important; border-color: var(--scu-label-success-border) !important; }
body .label-danger, body .label-pink, body .badge-danger { background: var(--scu-accent-soft) !important; color: var(--scu-accent) !important; border-color: var(--scu-accent-line) !important; }
body .label-warning, body .badge-warning, body .label-yellow { background: var(--scu-label-warning-bg) !important; color: var(--scu-c4) !important; border-color: var(--scu-label-warning-border) !important; }
body .label-info, body .badge-info { background: var(--scu-label-info-bg) !important; color: var(--scu-c3) !important; border-color: var(--scu-label-info-border) !important; }
body .label-default { background: var(--scu-label-default-bg) !important; color: var(--scu-ink-soft) !important; border-color: var(--scu-line) !important; }
body .label-grey { background: var(--scu-label-default-bg) !important; color: var(--scu-ink-soft) !important; }
body .label-purple { background: var(--scu-label-purple-bg) !important; color: var(--scu-c5) !important; }
/* 站点在标签内嵌 <font style="color:black">，行内黑色在深色模式下不可读 —— 继承标签主题色 */
body .label font, body .badge font { color: inherit !important; }
/* 兜底：深色模式下任何内联黑色 <font> 一律提升为主题墨色（黑字暗底必然不可读） */
:root[data-scu-theme="dark"] font[style*="color:black"],
:root[data-scu-theme="dark"] font[style*="color: black"],
:root[data-scu-theme="dark"] font[color="black"] {
  color: var(--scu-ink) !important;
}

/* ============================================================
   选项卡
   ============================================================ */
.nav-tabs {
  border-bottom: 1px solid var(--scu-line) !important;
  background: transparent !important;
}
/* 容纳浮动选项卡，避免挤压后续 overflow 容器 */
.navbar-example::after { content: ""; display: table; clear: both; }
.scrollspy-example { clear: both !important; }
.nav-tabs > li > a {
  background: transparent !important;
  border: none !important;
  color: var(--scu-ink-soft) !important;
  font-size: 13px !important;
  letter-spacing: 0.06em;
  padding: 9px 18px !important;
  margin: 0 !important;
  border-radius: 0 !important;
}
.nav-tabs > li > a:hover { color: var(--scu-ink) !important; background: transparent !important; }
.nav-tabs > li.active > a,
.nav-tabs > li.active > a:hover,
.nav-tabs > li.active > a:focus {
  background: transparent !important;
  border: none !important;
  border-bottom: 2px solid var(--scu-accent) !important;
  color: var(--scu-ink) !important;
  font-weight: 600 !important;
  box-shadow: none !important;
}
.tab-content { background: transparent !important; border: none !important; }

/* 学期选项卡容器（全部及格成绩等页面）—— Bootstrap2 navbar-static 结构，
   #navbarExample 带行内 style="background:#ffffff"，需 !important 压制 */
#navbarExample, .navbar-static {
  background: var(--scu-surface) !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
}
.navbar-inner {
  background: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  min-height: 0 !important;
  padding: 0 !important;
}

/* ============================================================
   警告条
   ============================================================ */
.alert {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  border-left: 3px solid var(--scu-ink-faint) !important;
  border-radius: 2px !important;
  color: var(--scu-ink) !important;
  text-shadow: none !important;
  box-shadow: none !important;
}
.alert-danger, .alert-error { border-left-color: var(--scu-accent) !important; color: var(--scu-ink) !important; }
.alert-warning { border-left-color: var(--scu-c4) !important; }
.alert-success { border-left-color: var(--scu-c2) !important; }
.alert-info { border-left-color: var(--scu-c3) !important; }
.alert .close { color: var(--scu-ink-faint) !important; text-shadow: none !important; opacity: .6; }

/* ============================================================
   弹窗 (Bootstrap modal + layer.js)
   ============================================================ */
.modal-content {
  border: 1px solid var(--scu-line) !important;
  border-radius: 3px !important;
  box-shadow: 0 12px 40px rgba(var(--scu-shadow-rgb),0.16) !important;
  background: var(--scu-surface) !important;
}
.modal-header { border-bottom: 1px solid var(--scu-line) !important; background: transparent !important; }
.modal-header .modal-title, .modal-header h4 {
  font-family: var(--scu-serif) !important;
  color: var(--scu-ink) !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em;
}
.modal-footer { border-top: 1px solid var(--scu-line) !important; background: transparent !important; }
.modal-header .close { color: var(--scu-ink-faint) !important; text-shadow: none !important; opacity: .7; }

.layui-layer {
  border: 1px solid var(--scu-line) !important;
  border-radius: 3px !important;
  box-shadow: 0 12px 40px rgba(var(--scu-shadow-rgb),0.16) !important;
  background: var(--scu-surface) !important;
}
.layui-layer-title {
  background: var(--scu-surface) !important;
  color: var(--scu-ink) !important;
  border-bottom: 1px solid var(--scu-line) !important;
  font-family: var(--scu-serif) !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em;
}
.layui-layer-setwin a { color: var(--scu-ink-faint) !important; }
.layui-layer-content { color: var(--scu-ink) !important; }
.layui-layer-btn a {
  background: var(--scu-ink) !important;
  border: 1px solid var(--scu-ink) !important;
  color: var(--scu-surface) !important;
  border-radius: 2px !important;
}
.layui-layer-btn .layui-layer-btn1 {
  background: var(--scu-surface) !important;
  color: var(--scu-ink-soft) !important;
  border-color: var(--scu-line-strong) !important;
}

/* ============================================================
   SCU+ 品牌加载动画（替换 layer.js 的三点 GIF）
   ============================================================ */
.layui-layer-loading {
  border-radius: 8px !important;
}
.layui-layer-loading .layui-layer-content {
  background: none !important;
  width: 148px !important;
  height: 60px !important;
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  overflow: visible !important;
  color: var(--scu-accent) !important;
}
/* “SCU+”字标：锦绣红基底 + 流光扫过 */
.layui-layer-loading .layui-layer-content::before {
  content: "SCU+";
  font-family: var(--scu-serif);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1;
  background: linear-gradient(90deg,
    var(--scu-accent) 0%, var(--scu-accent) 35%,
    #e9b7c1 50%,
    var(--scu-accent) 65%, var(--scu-accent) 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: scu-plus-shine 1.6s linear infinite;
}
/* 三点依次点亮（单个元素 + box-shadow 画出三颗点） */
.layui-layer-loading .layui-layer-content::after {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 50%;
  animation: scu-plus-dots 1.2s ease-in-out infinite;
}
@keyframes scu-plus-shine {
  0% { background-position: 110% 0; }
  100% { background-position: -110% 0; }
}
@keyframes scu-plus-dots {
  0%, 100% { box-shadow: -11px 0 0 0 var(--scu-accent), 0 0 0 0 var(--scu-line), 11px 0 0 0 var(--scu-line); }
  33%      { box-shadow: -11px 0 0 0 var(--scu-line), 0 0 0 0 var(--scu-accent), 11px 0 0 0 var(--scu-line); }
  66%      { box-shadow: -11px 0 0 0 var(--scu-line), 0 0 0 0 var(--scu-line), 11px 0 0 0 var(--scu-accent); }
}

/* 视图内的行内加载占位（原 pageloading.gif）→ 锦绣红转圈 */
.view-pre-loading {
  background: none !important;
  width: 22px !important;
  height: 22px !important;
  border: 2.5px solid var(--scu-line);
  border-top-color: var(--scu-accent);
  border-radius: 50%;
  box-sizing: border-box;
  animation: scu-plus-spin 0.8s linear infinite;
}
@keyframes scu-plus-spin {
  to { transform: rotate(360deg); }
}

/* ============================================================
   下拉菜单
   ============================================================ */
.dropdown-menu {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  border-radius: 2px !important;
  box-shadow: 0 6px 24px rgba(var(--scu-shadow-rgb),0.10) !important;
  padding: 4px 0 !important;
}
.dropdown-menu > li > a {
  color: var(--scu-ink-soft) !important;
  font-size: 12.5px !important;
  padding: 7px 16px !important;
}
.dropdown-menu > li > a:hover,
.dropdown-menu > li > a:focus {
  background: var(--scu-accent-soft) !important;
  color: var(--scu-ink) !important;
}
.dropdown-menu .divider { background: var(--scu-line) !important; }

/* ============================================================
   表单
   ============================================================ */
input[type="text"], input[type="password"], input[type="email"],
input[type="number"], input:not([type]), select, textarea, .form-control {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line-strong) !important;
  border-radius: 2px !important;
  color: var(--scu-ink) !important;
  box-shadow: none !important;
  transition: border-color .12s ease;
}
input:focus, select:focus, textarea:focus, .form-control:focus {
  border-color: var(--scu-ink) !important;
  box-shadow: none !important;
  outline: none !important;
}
.chosen-single, .chosen-container-single .chosen-single {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line-strong) !important;
  border-radius: 2px !important;
  box-shadow: none !important;
  color: var(--scu-ink) !important;
}
.chosen-drop, .chosen-container .chosen-drop {
  border: 1px solid var(--scu-line) !important;
  box-shadow: 0 6px 24px rgba(var(--scu-shadow-rgb),0.10) !important;
  background: var(--scu-surface) !important;
}
.chosen-results li.highlighted {
  background: var(--scu-accent-soft) !important;
  color: var(--scu-ink) !important;
}

/* ============================================================
   分页
   ============================================================ */
.pagination > li > a, .pagination > li > span {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  color: var(--scu-ink-soft) !important;
  border-radius: 0 !important;
}
.pagination > li > a:hover { border-color: var(--scu-ink) !important; color: var(--scu-ink) !important; }
.pagination > li.active > a, .pagination > li.active > span {
  background: var(--scu-ink) !important;
  border-color: var(--scu-ink) !important;
  color: var(--scu-surface) !important;
}

/* ============================================================
   课表页 —— 网格与课程色块
   ============================================================ */
#courseTable {
  background: var(--scu-surface) !important;
}
/* 清除所有时段底色（薄荷绿/蜜桃粉/淡蓝） */
#courseTable td[style*="background"],
#courseTable th[style*="background"] {
  background-color: transparent !important;
}
/* 恢复细网格线 */
#courseTable > thead > tr > th,
#courseTable > thead > tr > td,
#courseTable > tbody > tr > td,
#courseTable > tbody > tr > th {
  border: 1px solid var(--scu-line) !important;
  border-bottom: 1px solid var(--scu-line) !important;
}
#courseTable > thead > tr > th,
#courseTable > thead > tr > td {
  border-top: 1.5px solid var(--scu-ink) !important;
  border-bottom: 1px solid var(--scu-ink) !important;
  font-family: var(--scu-serif) !important;
  font-size: 13px !important;
  letter-spacing: 0.1em;
}
/* 大节 / 节次 标签列 —— 纸色衬底 + 衬线 */
#courseTable > tbody > tr > th[rowspan],
#courseTable > tbody > tr > th {
  background: var(--scu-rowhead-bg) !important;
  font-family: var(--scu-serif) !important;
  color: var(--scu-ink-soft) !important;
  letter-spacing: 0.1em;
}

/* 课程块 —— 白卡 + 左侧朱条 */
.class_div.div_style, .class_div[class*="div-kcb"] {
  background: var(--scu-surface) !important;
  background-image: none !important;
  border: 1px solid var(--scu-line-strong) !important;
  border-left: 3px solid var(--scu-c1) !important;
  border-radius: 3px !important;
  box-shadow: 0 1px 4px rgba(var(--scu-shadow-rgb),0.08) !important;
  padding: 6px 8px !important;
  overflow: hidden;
}
.class_div.div-kcb-1 { border-left-color: var(--scu-c1) !important; }
.class_div.div-kcb-2 { border-left-color: var(--scu-c2) !important; }
.class_div.div-kcb-3 { border-left-color: var(--scu-c3) !important; }
.class_div.div-kcb-4 { border-left-color: var(--scu-c4) !important; }
.class_div.div-kcb-5 { border-left-color: var(--scu-c5) !important; }
.class_div.div-kcb-6 { border-left-color: var(--scu-c6) !important; }

.class_div p[class*="p-kcm"], .class_div .p-kcm-1, .class_div .p-kcm-2,
.class_div .p-kcm-3, .class_div .p-kcm-4, .class_div .p-kcm-5, .class_div .p-kcm-6 {
  font-family: var(--scu-serif) !important;
  color: var(--scu-ink) !important;
  font-size: 12.5px !important;
  font-weight: 700 !important;
  text-shadow: none !important;
  line-height: 1.35 !important;
}
.class_div .kcb_p_gray, .class_div p.kcb_p_gray {
  color: var(--scu-ink-faint) !important;
  font-size: 11px !important;
  text-shadow: none !important;
  line-height: 1.4 !important;
}
.class_div p[class*="p-jxl"] {
  color: var(--scu-ink-soft) !important;
  font-size: 11px !important;
  text-shadow: none !important;
}
.class_div .tools { background: var(--scu-tools-bg) !important; }
.class_div .tools a { color: var(--scu-ink-soft) !important; }
.class_div .tools a:hover { color: var(--scu-accent) !important; }

/* 课表头部按钮区 */
#kbPrint, .kb-toolbar { background: transparent !important; }

/* ============================================================
   FullCalendar 日程
   ============================================================ */
.fc-widget-header, .fc-widget-content { border-color: var(--scu-line) !important; }
.fc-day-header, .fc-widget-header { background: transparent !important; color: var(--scu-ink-soft) !important; font-size: 12px !important; letter-spacing: 0.06em; }
.fc-today, .fc-day.fc-today { background: var(--scu-accent-soft) !important; }
.fc-axis { color: var(--scu-ink-faint) !important; font-size: 11px !important; }
.fc-toolbar h2, .fc-toolbar .fc-center h2 {
  font-family: var(--scu-serif) !important;
  color: var(--scu-ink) !important;
  font-size: 18px !important;
  font-weight: 700 !important;
}
.fc-button {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line-strong) !important;
  color: var(--scu-ink-soft) !important;
  border-radius: 2px !important;
  box-shadow: none !important;
  text-shadow: none !important;
}
.fc-button:hover { border-color: var(--scu-ink) !important; color: var(--scu-ink) !important; }
.fc-state-active, .fc-button.fc-state-active {
  background: var(--scu-ink) !important;
  color: var(--scu-surface) !important;
  border-color: var(--scu-ink) !important;
}
.fc-event { background: var(--scu-accent-soft) !important; border-color: var(--scu-accent) !important; color: var(--scu-ink) !important; border-radius: 2px !important; }

/* ============================================================
   zTree 树控件（培养方案查看等）—— 节点 <a> 带行内 color:#333，
   控件自身链接色在深色模式下同样不可读，统一强制主题色
   ============================================================ */
.ztree li a, .ztree li a:visited, .ztree li a span {
  color: var(--scu-ink) !important;
  text-shadow: none !important;
}
.ztree li a:hover { color: var(--scu-accent) !important; background: transparent !important; }
.ztree li a.curSelectedNode {
  color: var(--scu-accent) !important;
  background: var(--scu-accent-soft) !important;
  border: none !important;
}

/* ============================================================
   其他 ACE 杂项
   ============================================================ */
.well {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  border-radius: 2px !important;
  box-shadow: none !important;
}
.panel-default > .panel-heading {
  background: var(--scu-surface) !important;
  border-bottom: 1px solid var(--scu-line) !important;
  color: var(--scu-ink) !important;
}
.panel { border-color: var(--scu-line) !important; box-shadow: none !important; border-radius: 3px !important; }
hr { border-top-color: var(--scu-line) !important; }
.progress { border-radius: 2px !important; box-shadow: none !important; background: var(--scu-line) !important; }
.progress-bar { background: var(--scu-ink) !important; box-shadow: none !important; }
.progress-bar-success { background: var(--scu-c2) !important; }
.progress-bar-danger { background: var(--scu-accent) !important; }
.list-group-item { border-color: var(--scu-line) !important; background: var(--scu-surface) !important; color: var(--scu-ink) !important; }
.badge-transparent { background: transparent !important; }

/* 开放申请业务方块 */
.apply-item, .ywsl-item {
  background: var(--scu-surface) !important;
  border: 1px solid var(--scu-line) !important;
  border-radius: 3px !important;
}
`;
