import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "http://zhjw.scu.edu.cn/*",
  ],
  all_frames: true
}

const $ = (css: string) => {
  return document.querySelector(css) as HTMLElement;
}
const $all = (css: string) => {
  return document.querySelectorAll(css) as NodeListOf<HTMLElement>;
}
// 配置
let styleconfig = {
  avatarUrl: "https://q1.qlogo.cn/g?b=qq&nk=2207739460&src_uin=www.jlwz.cn&s=0",
  nickname: "jeanhua"
}


window.addEventListener("load", () => {
  console.log("SCU+插件加载成功🎯");
  // 去掉修改密码
  $("#view-table > div").style.display = "None";
  // 导航栏
  let navBar = $("#navbar");
  if (navBar) {
    navBar.style.backgroundImage = "linear-gradient(to top, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)";
    let title = $("a small");
    title.style.color = "black";
    title.innerText = "四川大学教务管理系统(SCU+)🎯";
    let avatar = $(".nav-user-photo");
    avatar.setAttribute("src", styleconfig.avatarUrl);
    $("#navbar-container > div.navbar-buttons.navbar-header.pull-right > ul > li.light-blue > a > span").innerHTML = `
							<small>欢迎您，</small>
                ${styleconfig.nickname}
    `
  }
  // 去掉不及格显示
  notpass();
  injectMenu();
  // 美化
  beautify();
})

const notpass = () => {
  try {
    let notpass = $("#coursePas");
    if (notpass) {
      notpass.style.display = "None";
    }
    let notice_text = document.createElement("div");
    notice_text.innerText = "点击显示";
    notice_text.style.color = "black";
    notpass.parentNode.appendChild(notice_text);
    notice_text.onclick = () => {
      notpass.style.display = "";
      notice_text.style.display = "None";
    }
    notpass.onclick = () => { notpass.style.display = "None"; notice_text.style.display = "" }
  }
  catch (e) {
    console.warn(e);
  }
}

const beautify = () => {
  // 主窗口圆角
  let widgetBoxes = $all(".page-content");
  widgetBoxes.forEach((widgetBox) => {
    widgetBox.style.borderRadius = "20px";
    widgetBox.style.border = "2px solid #96e6a1";
    widgetBox.style.overflow = "hidden";
  });
  // 背景
  let mainContent = $(".page-content");
  if (mainContent) {
    mainContent.style.backdropFilter = "blur(50px)";
    mainContent.style.backgroundColor = "#caeae3"
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const injectMenu = async () => {
  while (true) {
    let menus = $("#sidebar > div:nth-child(2) > div.nav-wrap > div");
    if (menus) {
      break;
    } else {
      console.log("查考menus")
    }
    await sleep(1000);
  }
  // 插入培养方案查看 #sidebar > div:nth-child(2) > div.nav-wrap > div
  let menus = $("#sidebar > div:nth-child(2) > div.nav-wrap > div");
  let peiyang = document.createElement("div");
  peiyang.innerHTML = `
  <button style="width:100%;height:40px">培养方案查看</button>
  `
  menus.appendChild(peiyang);
  $("#sidebar > div:nth-child(2) > div.nav-wrap > div > div > button").innerText += "🎯";
  $("#sidebar > div:nth-child(2) > div.nav-wrap > div > div > button").onclick = () => {
    window.open("/student/comprehensiveQuery/search/trainProgram/index");
  }
  console.log("注入培养方案按钮成功");
}