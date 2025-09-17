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
    let data = await (await fetch(`/student/integratedQuery/scoreQuery/${callback}/allPassingScores/callback`)).json()
    let scoresMap: scoreMap[] = []
    for (let a of data["lnList"]) {
        let average = 0.0
        let scoreCount = 0
        let average_comp = 0.0
        let comp_scoreCount = 0
        a["cjList"].forEach(e => {
            let cj = parseFloat(e["cj"])

            if (e["courseAttributeName"] == "必修") {
                average += cj
                average_comp += cj

                scoreCount += 1
                comp_scoreCount += 1
            } else {
                if (cj >= 60) {
                    average += cj
                    scoreCount += 1
                }
            }
        });
        average /= scoreCount
        average_comp /= comp_scoreCount
        console.log(a["cjbh"])
        console.log("平均成绩: ", average.toFixed(2))
        console.log("必修成绩: ", average_comp.toFixed(2))
        scoresMap.push({
            s_name: a["cjbh"],
            score: {
                average: average,
                average_comp: average_comp
            }
        })
    }
    return scoresMap
}