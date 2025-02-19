import type { PlasmoCSConfig } from "plasmo"
import { $,$all } from "../background"

export const config: PlasmoCSConfig = {
  matches: [
    "http://zhjw.scu.edu.cn/*",
  ],
  all_frames: true
}


let styleconfig = {
  avatarUrl: "https://q1.qlogo.cn/g?b=qq&nk=2207739460&src_uin=www.jlwz.cn&s=0",
  nickname: "jeanhua"
}


window.addEventListener("load", () => {
  console.log("SCU+插件加载成功🎯");
  // 去掉修改密码
  $("#view-table > div > div > div > h4 > span > button.btn.btn-default.btn-xs.btn-round",(e)=>e.click());
  // 导航栏
  navBarinject();
  // 去掉不及格显示
  notpass();
  // 注入培养方案按钮
  injectMenu();
  // 美化
  beautify();
  // 关闭打开通知时的黑屏
  closeFadeModal();
})

const navBarinject = ()=>{
  $("#navbar",(navBar)=>{
    navBar.style.backgroundImage = "linear-gradient(to top, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)";
    $("#navbar-container > div.navbar-header.pull-left > a > small",(title)=>{
      title.style.color = "black";
      title.innerText = "四川大学教务管理系统(SCU+)🎯";
    });
    $(".nav-user-photo",(avatar)=>{
      avatar.setAttribute("src", styleconfig.avatarUrl);
    });
    $("#navbar-container > div.navbar-buttons.navbar-header.pull-right > ul > li.light-blue > a > span",(e)=>e.innerHTML = `
    <small>欢迎您，</small>
      ${styleconfig.nickname}
`)
  })
}

const notpass = () => {
  try {
    $("#coursePas",(notpass)=>{
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
  catch (e) {
    console.warn(e);
  }
}

const beautify = () => {
  // 主窗口圆角
  $all(".page-content",(widgetBox)=>{
    widgetBox.style.borderRadius = "20px";
    widgetBox.style.border = "2px solid #96e6a1";
    widgetBox.style.overflow = "hidden";
    widgetBox.style.backdropFilter = "blur(50px)";
    widgetBox.style.backgroundColor = "#caeae3";
    widgetBox.style.minHeight = "80vh";
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
  // 插入培养方案查看 #sidebar > div:nth-child(2) > div.nav-wrap > div
  let menus = document.querySelector("#sidebar > div:nth-child(2) > div.nav-wrap > div") as HTMLElement;
  let peiyang = document.createElement("div");
  peiyang.innerHTML = `
  <button style="width:100%;height:40px">培养方案查看</button>
  `
  menus.appendChild(peiyang);
  $("#sidebar > div:nth-child(2) > div.nav-wrap > div > div > button",(e)=>e.innerText += "🎯");
  $("#sidebar > div:nth-child(2) > div.nav-wrap > div > div > button",(e)=>e.onclick = () => {
    window.open("/student/comprehensiveQuery/search/trainProgram/index");
  })
  console.log("注入培养方案按钮成功");
}

const closeFadeModal =async ()=>{
  while(true){
    $("body > div.modal-backdrop.fade.in",(e)=>{e.style.display = "None";});
    await sleep(1000);
  }
}