import type { PlasmoCSConfig } from "plasmo";
import { $, createSecondPageElement } from "~script/utils";

export const config: PlasmoCSConfig = {
    matches: [
        "http://zhjw.scu.edu.cn/student/integratedQuery/scoreQuery/thisTermScores/*",
    ],
    all_frames: true,
    run_at: "document_idle",
}

get_hidden_score();
async function get_hidden_score() {
    //get scripts
    const s1 = document.querySelector("head > script:nth-child(73)");
    const s2 = document.querySelector("head > script:nth-child(71)");
    const script = s1?.innerHTML + s2?.innerHTML;
    const pattern = /student\/integratedQuery\/scoreQuery\/.{10}\/thisTermScores\/data/;
    const match = script.match(pattern);
    if (match) {
        const firstMatch = `http://zhjw.scu.edu.cn/${match[0].toString()}`;
        console.log(`get score url: ${firstMatch}`);
        const data = await (await fetch(firstMatch)).json();
        console.log("获取成绩数据成功");
        //判断当前document是否加载完毕
        if (document.readyState === "complete") {
            doReplace(data);
        } else {
            window.addEventListener("load", () => {
              doReplace(data);  
            })
        }
        
    } else {
        console.log("no match data url");
    }
}
const scoreMapper = ["90~100", "85~89", "80~84", "76~79", "73~75", "70~72", "66~69", "63~65", "61~62", "60"];
function getScoreRange(scoreValue:string){
    if(scoreValue==="")return "暂无"
    if(scoreValue==="-999.999")return "未评教"
    try{
        let score=parseInt(scoreValue)
        return scoreMapper[20-score]
    }catch(e){
        console.log(e)
        return `RAW:${scoreValue}`
    }
    
}
function doReplace(data: any) {
    createSecondPageElement(`<p style="font-weight: 700; color: red;">警告：</p>
           <p style="text-indent: 2em;">该页面展示的'成绩估计'使用了综合教务系统返回的<span style="color: red;">【冗余】信息</span>，如果综合教务系统删除了这些冗余信息，那么这个功能就报废了，我们将无法再获取到这些教务系统屏蔽的数据！</p>
           <p style="text-indent: 2em;">因此，如果您要用本页面展示的这些'成绩估计'和您的任课老师沟通，我希望您可以<span style="color: red;">不要透露该插件的存在</span>，只是说这些敏感数据是您私下联系同学们询问成绩，从而获得的调查结果！</p>
           <p style="text-indent: 2em;">否则，老师一旦和教务处反映，这些冗余信息就有<span style="color: red;">被移除</span>的风险！</p>`)

    $("#timeline-1 > div > div > div > div > table > thead", (header) => {
        header.innerHTML ="<tr><th>课程号</th><th>课序号</th><th>课程名</th><th>学分</th><th>课程属性</th><th>成绩</th><th>未通过原因</th><th>英文课程名</th><th>成绩估计emoji</th><th>成绩状态emoji</th></tr>".replaceAll('emoji', "🎯");
    })
    const body=document.getElementById("scoretbody")
    body.setAttribute("id","scoretbody_changed");
    const scoreList=data[0]["list"]
    if(body){
        let children=body.childNodes; 
        for(let i=0;i<children.length;i++){
            const elem=(children[i] as HTMLElement)
            const courseData=scoreList[i]
            elem.innerHTML+=`<td>${getScoreRange(courseData.levlePoint)}</td><td>${courseData.inputStatusExplain}</td>`
        }
    }
}