import type { PlasmoCSConfig } from "plasmo"
import { $, $all, xpath_query } from "../script/utils"
import { Children } from "react";
import { getSetting, type SettingItem } from "~script/config";

export const config: PlasmoCSConfig = {
  matches: [
    "http://zhjw.scu.edu.cn/*",
  ],
  all_frames: true
}

let savedSettings: SettingItem;
let savedSettingsAsync: Promise<SettingItem>;
(async () => {
  savedSettingsAsync = getSetting();
  savedSettings = await savedSettingsAsync;
})();
window.addEventListener("load", async () => {
  if (savedSettings == null) {
    savedSettings = await savedSettingsAsync
  }
  console.log("SCU+插件加载成功🎯");
  if (savedSettings.passwordPopupSwitch) {
    // 去掉修改密码
    $("#view-table > div > div > div > h4 > span > button.btn.btn-default.btn-xs.btn-round", (e) => e.click());
  }

  // 导航栏
  navBarinject();
  if (savedSettings.beautifySwitch) {
    // 美化
    beautify();
    // 注入css
    injectCss();
  }
  // 注入校历
  injectSchoolSchedule();
  // 注入培养方案和设置按钮
  injectMenu();
  const isHomePage = () => {
    const pathname = window.location.pathname;
    return pathname === '/' || /^\/index(\.[a-zA-Z]+)?$/.test(pathname);
  }

  if (!isHomePage) {
    console.log("不是主页，不注入主页特定内容");
    return;
  }
  //以下是主页特定内容
  // 去掉不及格显示
  notpass();

  if (savedSettings.gpaCustomText != "" && savedSettings.gpaCustomText) {
    console.log(savedSettings.gpaCustomText)
    customText("#gpa", savedSettings.gpaCustomText);
  }
  if (savedSettings.failedCourseCustomText != "" && savedSettings.failedCourseCustomText) {
    customText("#coursePas", savedSettings.failedCourseCustomText);
  }
})
const customText = (id: string, text: string) => {
  $(id, (e) => {
    e.innerText = text;
    console.log(`修改${id}文本成功`);
  })
}
const navBarinject = () => {
  $("#navbar", (navBar) => {
    // Updated the background image to a more vibrant and gradient-rich design
    navBar.style.backgroundImage = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    // Added a box shadow to give the navigation bar a more elevated look
    navBar.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    // Rounded the corners of the navigation bar for a softer appearance
    navBar.style.borderRadius = "4px";
    $("#navbar-container > div.navbar-header.pull-left > a > small", (title) => {
      title.style.color = "black";
      title.innerText = "四川大学教务管理系统(SCU+)🎯";
    });
    if (savedSettings.nameHideSwitch) {
      $("#navbar-container > div.navbar-buttons.navbar-header.pull-right > ul > li.light-blue > a > span", (e) => e.innerHTML = `
    <small>欢迎您，</small>
      ${savedSettings.nameHideText}
   `)
    }
  })
}

const notpass = () => {
  try {
    if (savedSettings.failSwitch != false) {
      $("#coursePas", (notpass) => {
        notpass.style.display = "None";
        let notice_text = document.createElement("div");
        notice_text.innerText = "点击显示";
        notice_text.style.color = "black";
        notpass.parentNode.appendChild(notice_text);
        notice_text.onclick = () => {
          notpass.style.display = "";
          notice_text.style.display = "None";
        }
        notpass.onclick = () => { notpass.style.display = "None"; notice_text.style.display = "" }
      });
    }
  }
  catch (e) {
    console.warn(e);
  }
}

const beautify = () => {
  $("#page-content-template", (widgetBox) => {
    widgetBox.style.borderRadius = "20px";
    widgetBox.style.border = `2px solid #96e6a1`;
    widgetBox.style.overflow = "hidden";
    widgetBox.style.backgroundColor = savedSettings.beautifyColor || '#caeae3';
    widgetBox.style.minHeight = "80vh";
    widgetBox.style.margin = "15px";
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const injectMenu = async () => {
  while (true) {
    let menus = document.querySelector("#menus") as HTMLElement;
    if (menus) {
      break;
    }
    await sleep(1000);
  }
  xpath_query(`//*[@id="1007000000"]/a/span`, (e) => { e.innerText += "🎯" })
  document.getElementById("1007001003").children[0].innerHTML = document.getElementById("1007001003").children[0].innerHTML.replace("方案成绩", "方案成绩🎯");

  // 插入培养方案查看
  let menus = document.querySelector("#menus") as HTMLElement;
  let peiyang = document.createElement("li");
  peiyang.setAttribute('id', '1145140');
  peiyang.setAttribute('onclick', "rootMenuClick(this);");
  peiyang.innerHTML = `<a href="#" class="dropdown-toggle">
                    <i class="menu-icon fa fa-picture-o"></i>
                    <span class="menu-text"> 培养方案emoji </span>
                    <b class="arrow fa fa-angle-down"></b>
                </a>
                <b class="arrow"></b>
                <ul class="submenu nav-hide" onclick="stopHere();" style="display: none;">   
                    <li class="hsub open">
                        <a href="#" class="dropdown-toggle">
                            <i class="menu-icon fa fa-caret-right"></i>
                            培养方案
                            <b class="arrow fa fa-angle-down"></b>
                        </a>
                        <b class="arrow"></b>
                        <ul class="submenu" style="display: block;">
                            <li class="" onclick="toSelect(this);">
                                <a href="http://zhjw.scu.edu.cn/student/comprehensiveQuery/search/trainProgram/index">&nbsp;&nbsp;
                                    培养方案查看
                                </a>
                                <b class="arrow"></b>
                            </li>
                        </ul>
                    </li>
                </ul>`.replace('emoji', "🎯");
  menus.appendChild(peiyang);
  console.log("注入培养方案按钮成功");

  // 注入设置按钮
  let settingsBtn = document.createElement("li");
  settingsBtn.setAttribute('id', '1145141');
  settingsBtn.setAttribute('onclick', "rootMenuClick(this);");
  settingsBtn.innerHTML = `<a href="#" class="dropdown-toggle">
                    <i class="menu-icon fa fa-pencil-square-o"></i>
                    <span class="menu-text"> 设置emoji </span>
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
                                <a href="#" id="settingsBtn">&nbsp;&nbsp;
                                    SCU+ 设置
                                </a>
                                <b class="arrow"></b>
                            </li>
                        </ul>
                    </li>
                </ul>`.replace('emoji', "🎯");
  (settingsBtn.querySelector("#settingsBtn") as HTMLElement).onclick = () => chrome.runtime.sendMessage({ action: 'open-settings' });
  menus.appendChild(settingsBtn);
  console.log("注入SCU+设置按钮成功");

  // 注入资源站
  let res = document.createElement("li");
  res.setAttribute('id', '1145142');
  settingsBtn.setAttribute('onclick', "rootMenuClick(this);");
  res.innerHTML = `<a href="#" class="dropdown-toggle">
                    <i class="menu-icon fa fa-calendar"></i>
                    <span class="menu-text"> 学习资料emoji </span>
                    <b class="arrow fa fa-angle-down"></b>
                </a>
                <b class="arrow"></b>
                <ul class="submenu nav-hide" onclick="stopHere();" style="display: none;">   
                    <li class="hsub open">
                        <a href="#" class="dropdown-toggle">
                            <i class="menu-icon fa fa-caret-right"></i>
                            学习资料
                            <b class="arrow fa fa-angle-down"></b>
                        </a>
                        <b class="arrow"></b>
                        <ul class="submenu" style="display: block;">
                            <li class="" onclick="toSelect(this);">
                                <a href="https://www.res.jeanhua.cn/" target="_blank">&nbsp;&nbsp;
                                    学习资料下载
                                </a>
                                <b class="arrow"></b>
                            </li>
                        </ul>
                    </li>
                </ul>`.replace('emoji', "🎯");
  menus.appendChild(res);
  console.log("注入资源站成功");
}


const injectSchoolSchedule = async () => {
  const scheduleHtml = await chrome.runtime.sendMessage({ action: "request", url: "https://jwc.scu.edu.cn/cdxl.htm" });
  const scheduleList = new Array();
  if (scheduleHtml.success) {
    const _text = scheduleHtml.data as string;
    const listDivText = _text.substring(_text.indexOf("<div class=\"list\">"), _text.indexOf("</div>", _text.indexOf("<div class=\"list\">")) + "</div>".length);
    const listDiv = document.createElement("div");
    listDiv.innerHTML = listDivText;
    const lis = listDiv.querySelectorAll("li");
    for (const li of lis) {
      const a = li.querySelector("a");
      scheduleList.push({ name: a.innerText, link: "https://jwc.scu.edu.cn/" + a.getAttribute("href") });
    }
    let injectHtml = "";
    for (const schedule of scheduleList) {
      injectHtml += `<li><a href="${schedule.link}" target="_blank" style="color:#333;padding:8px 20px;">${schedule.name}</a></li>`;
    }

    const fullHtml = `
      <li class="dropdown">
        <a href="#" class="dropdown-toggle" data-toggle="dropdown">
          <i class="icon-calendar"></i>
          <span>校历查看${"emoji"}</span>
        </a>
        <ul class="dropdown-menu" style="min-width:200px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          ${injectHtml}
        </ul>
      </li>
    `.replace("emoji", "🎯");
    const injectPosition = document.querySelector("#navbar-container > div.navbar-buttons.navbar-header.pull-right > ul > li.green.cdsj");
    if (injectPosition) {
      injectPosition.outerHTML = fullHtml;
    }

  }
}

const injectCss = () => {
  const css = document.createElement("style");
  css.setAttribute("type", "text/css");
  css.innerHTML = `
  .table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th {
    background-color: #00000000 !important;
}
    .table-hover>tbody>tr:hover>td,.table-hover>tbody>tr:hover>th {
    background-color: #00000000 !important;
}
  `;
  document.head.appendChild(css);
  if (window.location.href.match("/student/integratedQuery/scoreQuery/schemeScores/index")) {
    const styles = document.getElementsByTagName("style");
    for (const s of styles) {
      s.innerHTML = s.innerHTML.replaceAll("#d4f0c6", "#00000000");
    }
  }
}
