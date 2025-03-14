import type { PlasmoCSConfig } from "plasmo";
import { xpath_query } from "~script/utils";
export const config: PlasmoCSConfig = {
    matches: ["https://u.xiaouni.com/mobile/pages/pd/*"],
    all_frames: true,
};

window.addEventListener('load',(e)=>{
    xpath_query('/html/body/uni-app/uni-page/uni-page-wrapper/uni-page-body/uni-view/uni-view[4]',(e)=>{
        e.style.display = 'none';
        console.log("遮罩关闭成功")
    })
    xpath_query('/html/body',(e)=>{
        e.style.justifyItems = 'center';
    })
    xpath_query('/html/body/uni-app',(e)=>{
        e.style.width='600px';
        console.log('窗口大小调整完成')
    })
    xpath_query('/html/body/uni-app',(e)=>{
        const scuPlusWarm = document.createElement('div');
        scuPlusWarm.innerHTML = `
        SCU PLUS
        `
        scuPlusWarm.style.fontSize = '2rem'
        e.parentNode.insertBefore(scuPlusWarm,e);
    })
})