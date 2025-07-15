import type { PlasmoCSConfig, PlasmoGetOverlayAnchor } from "plasmo";
import ReactDOM from "react-dom/client";
import { $, createSecondPageElement } from "~script/utils";
import { Alert } from 'antd';
import React from "react";

export const config: PlasmoCSConfig = {
    matches: [
        "https://zhjw.scu.edu.cn/student/integratedQuery/scoreQuery/thisTermScores/*",
    ],
    all_frames: true,
}

// 使用tsx好像必须返回一个ReactNode，不然控制台会报错.(for plasmo)
export default () => <></>
const pattern = /student\/integratedQuery\/scoreQuery\/.{10}\/thisTermScores\/data/;
get_hidden_score();
async function get_hidden_score() {
    //get scripts
    const scripts = document.head.querySelectorAll('script');
    let match:string=null;
    // 遍历所有 script 标签
    for(const i of scripts){
        if(i.type!=="text/javascript"){
            continue
        }
        if(!i.innerHTML.startsWith(`\n\t\t$(function ()`)){
            continue
        }
        const result=i.innerHTML.match(pattern);
        if(result){
            match=result[0];
            break
        }
    }
    if (match) {
        const firstMatch = `https://zhjw.scu.edu.cn/${match.toString()}`;
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
const scoreMapper = ["90~100", "85~89", "80~84", "76~79", "73~75", "70~72", "66~69", "63~65", "61~62", "60", "成绩未全部录入/不及格"];
function getScoreRange(scoreValue: string) {
    if (scoreValue === "") return "暂无"
    if (scoreValue === "-999.999") return "未评教"
    try {
        let score = parseInt(scoreValue)
        return scoreMapper[-20 - score]
    } catch (e) {
        console.log(e)
        return `RAW:${scoreValue}`
    }

}
function WarnUi() {
    const warningContent = (
        <>
            <p style={{ textIndent: '2em' }}>该页面展示的'成绩估计'使用了综合教务系统返回的<span style={{ color: 'red' }}>【冗余】信息</span>，如果综合教务系统删除了这些冗余信息，那么这个功能就报废了，我们将无法再获取到这些信息！</p>
            <p style={{ textIndent: '2em' }}>并且，此处显示的成绩<span style={{ color: 'red' }}>并不是最终成绩</span>。因此，请<span style={{ color: 'red' }}>不要</span>使用本页面展示的这些'成绩估计'和您的任课老师沟通</p>
            <p style={{ textIndent: '2em' }}>否则，老师一旦和教务处反映，这些冗余信息就有<span style={{ color: 'red' }}>被移除</span>的风险！</p>
        </>
    );

    return <Alert
        message="SCU+ 警告"
        description={warningContent}
        type="warning"
        showIcon
        closable />;
}
function doReplace(data: any) {
    const root = ReactDOM.createRoot(createSecondPageElement());
    root.render(<WarnUi />);
    $("#timeline-1 > div > div > div > div > table > thead", (header) => {
        header.innerHTML = "<tr><th>课程号</th><th>课序号</th><th>课程名</th><th>学分</th><th>课程属性</th><th>成绩</th><th>未通过原因</th><th>英文课程名</th><th>成绩估计emoji</th><th>成绩状态emoji</th></tr>".replaceAll('emoji', "🎯");
    })
    const body = document.getElementById("scoretbody")
    body.setAttribute("id", "scoretbody_changed");
    const scoreList = data[0]["list"]
    let contentHtml = generateInnerHtml(scoreList);
    body.innerHTML = contentHtml;
}

function generateInnerHtml(list: any[]): string {
    let tContent = "";
    list.forEach(function (v) {
        tContent += "<tr>";
        tContent += `<td>${v.id.courseNumber}</td>`;
        tContent += "<td >" + (v.coureSequenceNumber == null ? "" : (v.coureSequenceNumber == 'NONE' ? "" : v.coureSequenceNumber)) + "</td>";
        tContent += `<td >${v.courseName}</td>`;
        tContent += `<td >${v.credit}</td>`;
        tContent += `<td >${v.coursePropertyName}</td>`;
        if (v.inputStatusCode == "05") {
            if (v.courseScore == "-999.999") {
                tContent += "<td>未评估</td>";
            } else {
                if (v.inputMethodCode == "002") {
                    tContent += `<td ${v.courseScore < 60 ? "class='red_background'" : "green_background"}>${v.levelName}</td>`;
                } else {
                    tContent += `<td ${v.courseScore < 60 ? "class='red_background'" : "class='green_background'"}>${v.courseScore}</td>`;
                }
            }
            if (v.courseScore == "-999.999") {
                tContent += "<td>未评估</td>";
            } else {
                tContent += `<td>${v.unpassedReasonExplain}</td>`;
            }
        } else {
            tContent += "<td></td><td></td>";
        }
        tContent += `<td>${v.englishCourseName}</td>`;
        let range_text = getScoreRange(v.levlePoint)
        if(v.levlePoint==="-30"&&v.inputStatusExplain==="确定"){
            range_text="不及格"
        }else if(v.inputStatusExplain==="确定"){
            range_text = v.courseScore
        }
        tContent += `<td>${range_text}</td><td>${v.inputStatusExplain}</td>`;
        tContent += "</tr>";
    });
    return tContent;
}