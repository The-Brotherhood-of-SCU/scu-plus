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
                let span_credit_comp = document.createElement('span')
                span_credit_comp.style.marginLeft='5px';
                span_credit_comp.innerHTML=`<span class="label label-purple" style="border-radius: 10px;"><font style="color:black;">必修学分:${result[i].credit_comp}</font></span>`
                let span_credit_elec = document.createElement('span')
                span_credit_elec.style.marginLeft='5px';
                span_credit_elec.innerHTML=`<span class="label label-purple" style="border-radius: 10px;"><font style="color:black;">选修学分:${result[i].credit_elective}</font></span>`
                let span_credit_opt = document.createElement('span')
                span_credit_opt.style.marginLeft='5px';
                span_credit_opt.innerHTML=`<span class="label label-purple" style="border-radius: 10px;"><font style="color:black;">任选学分:${result[i].credit_opt}</font></span>`

                let container = document.createElement('div')
                container.innerHTML += `\u{1f3af}<span class="label label-green" style="border-radius: 10px;"><font style="color:black;">平均成绩:${result[i].score.average.toFixed(2)}</font></span>`
                container.innerHTML += `<span class="label label-grey" style="border-radius: 10px;"><font style="color:black;">必修成绩:${result[i].score.average_comp.toFixed(2)}</font></span>`

                e.append(span_credit_comp,span_credit_elec,span_credit_opt,container)
            })
        }
    }).catch(e => {
        // 会话过期返回登录页 HTML、接口结构变更等，静默降级
        console.warn("SCU+: 学期成绩统计失败", e);
    })
}
