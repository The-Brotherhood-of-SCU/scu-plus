import type { PlasmoCSConfig } from "plasmo"
import { xpath_query } from "~script/utils";
import studentPost from '../vueComponent/studentPost.vue'
import { createApp } from "vue";
export const config: PlasmoCSConfig = {
    matches: ["http://zhjw.scu.edu.cn/", "http://zhjw.scu.edu.cn/index", "http://zhjw.scu.edu.cn/index.*"],
    all_frames: true,
};

const app = createApp(studentPost);
window.addEventListener('load',()=>{
    xpath_query('//*[@id="page-content-template"]/div[1]/div/div[3]/div[1]',(e)=>{
        xpath_query('//*[@id="page-content-template"]/div[1]/div/div[3]/div[1]/div[4]',(e)=>{
            e.style.display = 'none';
        })
        const div = document.createElement('div')
        div.setAttribute('id','studentPost')
        div.setAttribute('class','widget-box');
        //div.style.marginTop = '130px';
        e.appendChild(div);
        app.mount(div);
    })
})