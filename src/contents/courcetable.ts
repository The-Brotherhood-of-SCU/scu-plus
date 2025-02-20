import type { PlasmoCSConfig } from "plasmo"
import { $ } from "~script/utils";

export const config: PlasmoCSConfig = {
    matches: [
        "http://zhjw.scu.edu.cn/student/courseSelect/thisSemesterCurriculum/*",
        "http://zhjw.scu.edu.cn/student/courseSelect/courseSelectResult/*"
    ],
    all_frames: true
}

function extractData(): { attribute: string; credit: number}[] {
    const rows = document.querySelectorAll("#tab10646 > table > tbody > tr");
    const data: { attribute: string; credit: number}[] = [];
    rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 6) {
            const attribute = cells[6].textContent?.trim() || ""; // 第7列：课程属性
            const creditText = cells[5].textContent?.trim(); // 第6列：学分
            const credit = parseFloat(creditText || "0");
            data.push({ attribute, credit});
        }
    });
    return data;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener("load", () => {
    inject();
})

// 注入学分统计
async function inject(){
    while(true){
        let table = document.querySelector("#tab10646 > table > tbody") as HTMLElement;
        if(table){
            break;
        }
        await sleep(1000);
    }
    let data = extractData();
    let requiredCredits = data.reduce((sum,cur)=>sum+(cur.attribute==="必修"?cur.credit:0),0);
    let n_requiredCredits = data.reduce((sum,cur)=>sum+(cur.attribute==="选修"?cur.credit:0),0);
    let any_requiredCredits = data.reduce((sum,cur)=>sum+(cur.attribute==="任选"?cur.credit:0),0);
    let show_elememt = document.createElement("div");
    show_elememt.innerHTML = `
    <span style="font-size:1.3rem;color:red;">必修学分: ${requiredCredits}&nbsp;&nbsp;选修学分: ${n_requiredCredits}&nbsp;&nbsp;任选学分: ${any_requiredCredits}</span>
    `;
    show_elememt.querySelector("span").innerText += " 🎯by SCU+";
    $("#myTab > li",(e)=>e.appendChild(show_elememt));
}