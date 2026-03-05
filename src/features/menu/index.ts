import { checkVersion, UpdateCheckResult } from "../../common"
import { message, Modal } from "antd"
import package_config from "../../../package.json"

export async function injectMenu(): Promise<void> {
  const xpathQuery = (xpathExpression: string, resolve: (element: HTMLElement) => void) => {
    const result = document.evaluate(xpathExpression, document).iterateNext() as HTMLElement;
    if (result) {
      resolve(result);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  while (true) {
    const menus = document.querySelector("#menus") as HTMLElement;
    if (menus) break;
    await sleep(1000);
  }

  const menus = document.querySelector("#menus") as HTMLElement;

  xpathQuery(`//*[@id="1007000000"]/a/span`, (e) => { e.innerText += "🎯"; });
  const el1007001003 = document.getElementById("1007001003");
  if (el1007001003?.children[0]) {
    el1007001003.children[0].innerHTML = el1007001003.children[0].innerHTML.replace("方案成绩", "方案成绩🎯");
  }
  xpathQuery('//*[@id="1007001001"]/a', e => e.innerHTML = e.innerHTML.replace('全部及格成绩', '全部及格成绩🎯'));
  xpathQuery('//*[@id="1002002001"]/a', (e) => e.innerHTML = e.innerHTML.replace('本学期课表', '本学期课表🎯'));
  xpathQuery('//*[@id="1002000000"]/a/span', (e) => e.innerText += '🎯');
  xpathQuery('//*[@id="1007001005"]/a', (e) => e.innerHTML = e.innerHTML.replace('本学期成绩', '本学期成绩🎯'));
  xpathQuery('//*[@id="1002001003"]/a', (e) => e.innerHTML = e.innerHTML.replace('选课结果', '选课结果🎯'));
  xpathQuery('//*[@id="1002001004"]/a', (e) => e.innerHTML = e.innerHTML.replace('退课', '退课🎯'));
  xpathQuery('//*[@id="1002001002"]/a', (e) => e.innerHTML = e.innerHTML.replace('选课', '选课🎯'));
  xpathQuery('//*[@id="1002002002"]/a', (e) => e.innerHTML = e.innerHTML.replace('历年学期课表', '历年学期课表🎯'));
  xpathQuery('//*[@id="1003000000"]/a/span', (e) => e.innerHTML = e.innerHTML.replace('教师课堂评价', '教师课堂评价🎯'));
  xpathQuery('//*[@id="1003001002"]/a', (e) => e.innerHTML = e.innerHTML.replace('教学评估', '教学评估🎯'));

  const peiyang = createMenuItem("1145140", "fa-picture-o", "培养方案🎯", [
    { text: "培养方案查看", href: "//zhjw.scu.edu.cn/student/comprehensiveQuery/search/trainProgram/index" }
  ]);
  menus.appendChild(peiyang);

  const courseScore = createMenuItem("1145143", "fa-check-square", "课程评分🎯", [
    { text: "选课通", href: "#" }
  ]);
  menus.appendChild(courseScore);

  const settingsBtn = createSettingsMenuItem();
  menus.appendChild(settingsBtn);

  console.log("菜单注入完成");
}

function createMenuItem(id: string, icon: string, title: string, items: { text: string; href: string; target?: string }[]): HTMLElement {
  const li = document.createElement("li");
  li.setAttribute('id', id);
  li.setAttribute('onclick', "rootMenuClick(this);");

  const itemsHtml = items.map(item =>
    `<li class="" onclick="toSelect(this);">
      <a href="${item.href}"${item.target ? ` target="${item.target}"` : ''}>&nbsp;&nbsp;${item.text}</a>
      <b class="arrow"></b>
    </li>`
  ).join('');

  li.innerHTML = `
    <a href="#" class="dropdown-toggle">
      <i class="menu-icon fa ${icon}"></i>
      <span class="menu-text"> ${title} </span>
      <b class="arrow fa fa-angle-down"></b>
    </a>
    <b class="arrow"></b>
    <ul class="submenu nav-hide" onclick="stopHere();" style="display: none;">
      <li class="hsub open">
        <a href="#" class="dropdown-toggle">
          <i class="menu-icon fa fa-caret-right"></i>
          ${title.replace('🎯', '')}
          <b class="arrow fa fa-angle-down"></b>
        </a>
        <b class="arrow"></b>
        <ul class="submenu" style="display: block;">
          ${itemsHtml}
        </ul>
      </li>
    </ul>
  `;

  return li;
}

function createSettingsMenuItem(): HTMLElement {
  const { confirm } = Modal;

  const li = document.createElement("li");
  li.setAttribute('id', '1145141');
  li.setAttribute('onclick', "rootMenuClick(this);");
  li.innerHTML = `
    <a href="#" class="dropdown-toggle">
      <i class="menu-icon fa fa-pencil-square-o"></i>
      <span class="menu-text"> 设置\u{1f3af} </span>
      <b class="arrow fa fa-angle-down"></b>
    </a>
    <b class="arrow"></b>
    <ul class="submenu nav-hide" onclick="stopHere();" style="display: none;">
      <li class="hsub open">
        <a href="#" class="dropdown-toggle">
          <i class="menu-icon fa fa-caret-right"></i>
          设置
          <b class="arrow fa fa-angle-down"></b>
        </a>
        <b class="arrow"></b>
        <ul class="submenu" style="display: block;">
          <li class="" onclick="toSelect(this);">
            <a href="#" id="settingsBtn">&nbsp;&nbsp;SCU+ 设置</a>
            <b class="arrow"></b>
          </li>
        </ul>
      </li>
      <li class="hsub open">
        <a href="#" class="dropdown-toggle">
          <i class="menu-icon fa fa-caret-right"></i>
          版本更新
          <b class="arrow fa fa-angle-down"></b>
        </a>
        <b class="arrow"></b>
        <ul class="submenu" style="display: block;">
          <li class="" onclick="toSelect(this);">
            <a href="#" id="checkVersionBtn">&nbsp;&nbsp;检查版本更新</a>
            <b class="arrow"></b>
          </li>
        </ul>
      </li>
    </ul>
  `;

  (li.querySelector("#settingsBtn") as HTMLElement).onclick = () => {
    chrome.runtime.sendMessage({ action: 'open-settings' });
  };

  (li.querySelector("#checkVersionBtn") as HTMLElement).onclick = () => {
    checkVersion().then(result => {
      if (result === UpdateCheckResult.NEW_VERSION_AVAILABLE) {
        confirm({
          title: "获取到新版本，是否调整下载？",
          okText: "确定",
          cancelText: "取消",
          onOk: () => window.open(package_config.download)
        });
      } else if (result === UpdateCheckResult.UP_TP_DATE) {
        message.info("已经是最新版本了");
      } else if (result === UpdateCheckResult.NETWORK_ERROR) {
        message.error("网络错误连接，请检查网络是否正常");
      } else {
        message.error("检查更新失败，请稍后再试");
      }
    });
  };

  return li;
}
