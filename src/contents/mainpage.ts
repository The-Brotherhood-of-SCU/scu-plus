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
  opacity: "0.85",
  backgroundUrl:"https://pic1.imgdb.cn/item/66936000d9c307b7e952512b.jpg"
}


window.addEventListener("load", () => {
  console.log("SCU+插件加载成功🎯");
  // 导航栏
  let navBar = $("#navbar");
  if (navBar) {
    navBar.style.backgroundImage = "linear-gradient(to top, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)";
    let title = $("a small");
    title.style.color = "black";
    title.innerText = "四川大学教务管理系统(SCU+)🎯";
    let avatar = $(".nav-user-photo");
    avatar.setAttribute("src", "https://q1.qlogo.cn/g?b=qq&nk=2207739460&src_uin=www.jlwz.cn&s=0");
  }

  // 去掉不及格显示
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
  notpass.onclick = ()=>{notpass.style.display = "None";notice_text.style.display=""}
  // 美化
  beautify();
})


let beautify = () => {

  // 主窗口圆角
  let widgetBoxes = $all(".page-content");
  widgetBoxes.forEach((widgetBox) => {
    widgetBox.style.borderRadius = "20px";
    widgetBox.style.border = "2px solid #96e6a1";
    widgetBox.style.overflow = "hidden";
  });
  // 背景
  let pageContent = $all(".page-content");
  for(let child of pageContent){
    let element = child as HTMLElement;
    element.style.backgroundImage = "url(https://pic1.imgdb.cn/item/66936000d9c307b7e952512b.jpg)";
  }
  
}