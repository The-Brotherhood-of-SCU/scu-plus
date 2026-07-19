import { $ } from "~script/utils"

interface scoreMap {
    s_name: string
    score: {
        average: number
        average_comp: number
    }
    total_credit: number
    credit_comp: number
    credit_opt: number
    credit_elective: number
}

function getCallback(): string {
    const scripts = document.head.querySelectorAll('script');
    let match = ""
    for (const i of scripts) {
        // 无 type 属性的经典脚本 type 为 ""，也应参与匹配
        if (i.type && i.type !== "text/javascript") {
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

async function countForScore(callback: string): Promise<scoreMap[]> {
    let response = await fetch(`/student/integratedQuery/scoreQuery/${callback}/allPassingScores/callback`);
    let data = await response.json();
    let scoresMap: scoreMap[] = [];

    for (let term of data?.lnList ?? []) {
        let totalWeightedScore = 0.0;
        let totalCredits = 0.0;

        let compWeightedScore = 0.0;
        let compCredits = 0.0;

        let credit_comp=0,credit_elective=0,credit_opt=0;

        (term["cjList"] ?? []).forEach((e: any) => {
            let cj = parseFloat(e["cj"]);
            let credit = parseFloat(e["credit"]);

            if (isNaN(cj) || isNaN(credit)) return;

            totalCredits += credit;
            if (e["courseAttributeName"] === "必修") {
                totalWeightedScore += cj * credit;
                compWeightedScore += cj * credit;
                compCredits += credit;
            } else {
                totalWeightedScore += cj * credit;
            }

            // 学分统计（与上方加权平均口径一致，使用 parseFloat 保留 0.5 档小数学分）
            switch(e["courseAttributeName"]){
                case "必修":
                    credit_comp += credit;
                    break;
                case "选修":
                    credit_elective += credit;
                    break;
                case "任选":
                    credit_opt += credit;
                    break;
            }
        });

        let average = totalCredits === 0 ? 0 : totalWeightedScore / totalCredits;
        let average_comp = compCredits === 0 ? 0 : compWeightedScore / compCredits;

        scoresMap.push({
            s_name: term["cjbh"],
            score: {
                average: average,
                average_comp: average_comp
            },
            total_credit: totalCredits,
            credit_comp: credit_comp,
            credit_elective: credit_elective,
            credit_opt: credit_opt
        });
    }
    return scoresMap;
}

export function initScoresPerSemester(): void {
    console.log("全部及格成绩页面")
    const callback = getCallback();
    if (!callback) return;

    countForScore(callback).then(result => {
        for(let i=0; i < result.length; i++){
            $(`#tab${i+1} > h4`, e => {
                // 一个边框容器圈住所有 SCU+ 注入的统计标签，🎯 只放在最左边
                const group = document.createElement('span')
                group.style.cssText = 'display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px;border:1px solid #d9534f;border-radius:8px;padding:2px 6px;margin-left:6px;vertical-align:middle;'

                const marker = document.createElement('span')
                marker.textContent = '\u{1f3af}'
                marker.title = 'by SCU+'
                group.appendChild(marker)

                // 统一用低饱和的浅色底，不再使用教务系统自带的彩色 label，避免突兀
                const badge = (text: string) => {
                    const s = document.createElement('span')
                    s.style.cssText = 'background:rgba(0,0,0,0.05);color:#333;border-radius:10px;padding:1px 8px;font-size:12px;'
                    s.textContent = text
                    return s
                }
                group.append(
                    badge(`必修学分:${result[i].credit_comp}`),
                    badge(`选修学分:${result[i].credit_elective}`),
                    badge(`任选学分:${result[i].credit_opt}`),
                    badge(`平均成绩:${result[i].score.average.toFixed(2)}`),
                    badge(`必修成绩:${result[i].score.average_comp.toFixed(2)}`)
                )

                e.appendChild(group)
            })
        }
    }).catch(e => {
        // 会话过期返回登录页 HTML、接口结构变更等，静默降级
        console.warn("SCU+: 学期成绩统计失败", e);
    })
}
