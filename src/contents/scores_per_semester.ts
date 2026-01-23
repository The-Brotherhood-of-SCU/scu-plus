import type { PlasmoCSConfig } from "plasmo"
import { $ } from "~script/utils"

export const config: PlasmoCSConfig = {
    matches: [
        "*://zhjw.scu.edu.cn/student/integratedQuery/scoreQuery/allPassingScores/*",
    ],
    all_frames: true
}

console.log("全部及格成绩页面")

window.addEventListener("load", () => {
    countForScore(getCallback()).then(result => {
        for(let i=0;i<=result.length;i++){
            $(`#tab${i+1} > h4`,e=>{
                let container = document.createElement('div')
                container.innerHTML += "emoji"+`<span class="label label-green" style="border-radius: 10px;"><font style="color:black;">平均成绩:${result[i].score.average.toFixed(2)}</font></span>`
                container.innerHTML += `<span class="label label-grey" style="border-radius: 10px;"><font style="color:black;">必修成绩:${result[i].score.average_comp.toFixed(2)}</font></span>`
                container.innerHTML = container.innerHTML.replace("emoji","🎯")
                e.appendChild(container)
            })
        }
    })
})

function getCallback(): string {
    const scripts = document.head.querySelectorAll('script');
    let match = ""
    for (const i of scripts) {
        if (i.type !== "text/javascript") {
            continue
        }
        const result = i.innerHTML.match(/\/student\/integratedQuery\/scoreQuery\/([^/]+)\/allPassingScores\/callback/);
        if (result) {
            match = result[1];
            break
        }
    }
    if (match != "") {
        console.log("callback:", match)
    }
    return match
}

interface scoreMap {
    s_name: string
    score: {
        average: number
        average_comp: number
    }
}

async function countForScore(callback: string): Promise<scoreMap[]> {
    let data = await (await fetch(`/student/integratedQuery/scoreQuery/${callback}/allPassingScores/callback`)).json();
    let scoresMap: scoreMap[] = [];

    for (let term of data["lnList"]) {
        let totalWeightedScore = 0.0;
        let totalCredits = 0.0;

        let compWeightedScore = 0.0;
        let compCredits = 0.0;

        term["cjList"].forEach(e => {
            let cj = parseFloat(e["cj"]);
            let credit = parseFloat(e["credit"]);

            if (isNaN(cj) || isNaN(credit)) return;

            if (e["courseAttributeName"] === "必修") {
                totalWeightedScore += cj * credit;
                totalCredits += credit;

                compWeightedScore += cj * credit;
                compCredits += credit;
            } else {
                if (cj >= 60) {
                    totalWeightedScore += cj * credit;
                    totalCredits += credit;
                }
            }
        });

        let average = totalCredits === 0 ? 0 : totalWeightedScore / totalCredits;
        let average_comp = compCredits === 0 ? 0 : compWeightedScore / compCredits;

        console.log(`学期: ${term["cjbh"] || "未知学期"}`);
        console.log("加权平均分: ", average.toFixed(2));
        console.log("必修加权分: ", average_comp.toFixed(2));

        scoresMap.push({
            s_name: term["cjbh"],
            score: {
                average: average,
                average_comp: average_comp
            }
        });
    }
    return scoresMap;
}