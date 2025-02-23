import type { PlasmoCSConfig } from "plasmo"
import { $, $all } from "../script/utils"

export const config: PlasmoCSConfig = {
  matches: [
    "http://zhjw.scu.edu.cn/*",
  ],
  all_frames: true
}

const savedSettings = JSON.parse(localStorage.getItem('settings') || '{}');

window.addEventListener("load", () => {
  console.log("SCU+插件加载成功🎯");
  initial();
  // 去掉修改密码
  $("#view-table > div > div > div > h4 > span > button.btn.btn-default.btn-xs.btn-round", (e) => e.click());
  // 导航栏
  navBarinject();
  // 去掉不及格显示
  notpass();
  // 注入培养方案和设置按钮
  injectMenu();
  if (savedSettings.beautifySwitch != false) {
    // 美化
    beautify();
    // 注入校历
    injectSchoolSchedule();
    // 注入css
    injectCss();
  }
})

const navBarinject = () => {
  $("#navbar", (navBar) => {
    navBar.style.backgroundImage = "linear-gradient(to top, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)";
    $("#navbar-container > div.navbar-header.pull-left > a > small", (title) => {
      title.style.color = "black";
      title.innerText = "四川大学教务管理系统(SCU+)🎯";
    });
    if (savedSettings.avatarSwitch === true) {
      if (savedSettings.avatarSource === "qq") {
        if (savedSettings.avatarInfo != null && savedSettings.avatarInfo != "") {
          $(".nav-user-photo", (avatar) => {
            avatar.setAttribute("src", `https://q1.qlogo.cn/g?b=qq&nk=${savedSettings.avatarInfo}&src_uin=www.jlwz.cn&s=0`);
          });
        }
      } else {
        if (savedSettings.avatarInfo != null && savedSettings.avatarInfo != "") {
          $(".nav-user-photo", (avatar) => {
            avatar.setAttribute("src", savedSettings.avatarInfo);
          });
        }
      }
    }
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
    let menus = document.querySelector("#sidebar > div:nth-child(2) > div.nav-wrap > div") as HTMLElement;
    if (menus) {
      break;
    }
    await sleep(1000);
  }
  // 插入培养方案查看
  document.getElementById("1007001003").children[0].innerHTML = document.getElementById("1007001003").children[0].innerHTML.replace("方案成绩", "方案成绩🎯");
  let menus = document.querySelector("#sidebar > div:nth-child(2) > div.nav-wrap > div") as HTMLElement;
  let peiyang = document.createElement("div");
  peiyang.innerHTML = `
  <button id="peiyangBtn" style="width:100%;height:40px">培养方案查看</button>
  `
  peiyang.querySelector("button").innerText += "🎯";
  peiyang.querySelector("button").onclick = () => {
    window.location.replace("http://zhjw.scu.edu.cn/student/comprehensiveQuery/search/trainProgram/index");
  }
  menus.appendChild(peiyang);
  console.log("注入培养方案按钮成功");
  // 注入设置按钮
  let settingsBtn = document.createElement("div");
  settingsBtn.innerHTML = `
  <button id="SCUplusSettingsBtn" style="width:100%;height:40px">SCU+设置</button>
  `;
  settingsBtn.querySelector("button").innerText += "🎯";
  settingsBtn.querySelector("button").onclick = () => {
    window.location.href = "http://zhjw.scu.edu.cn?redirectTo=scu+settings"
  }
  menus.appendChild(settingsBtn);
  console.log("注入SCU+设置按钮成功");
}



const initial = () => {
  if (localStorage.getItem('settings') == null) {
    const settings = {
      beautifySwitch: true,
      beautifyColor: "#caeae3",
      avatarSwitch: false,
      avatarSource: 'url',
      avatarInfo: '',
      dailyQuoteSwitch: true,
      failSwitch: true,
      passwordPopupSwitch: true,
      nameHideSwitch: false,
      nameHideText: '',
    };
    localStorage.setItem('settings', JSON.stringify(settings));
  }
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
          <span>校历查看${"🎯"}</span>
        </a>
        <ul class="dropdown-menu" style="min-width:200px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          ${injectHtml}
        </ul>
      </li>
    `;
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