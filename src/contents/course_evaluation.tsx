import type { PlasmoCSConfig } from "plasmo"
import { Button, Input, message, notification, Checkbox } from "antd"
import { xpath_query, randomInt } from "~script/utils"
import ReactDOM from "react-dom/client"
import React, { useEffect, useState } from "react"
import type { NotificationArgsProps } from 'antd';



export const config: PlasmoCSConfig = {
    matches: [
        "*://zhjw.scu.edu.cn/*student/teachingEvaluation/newEvaluation/*"
    ],
    all_frames: true
}

window.addEventListener("load", () => {
    let isRunningEvaluation = localStorage.getItem("isRunningEvaluation") == "true";
    xpath_query('//*[@id="home"]/div/div/h4/span', (e) => {
        injectBtnStyle()
        let btn = document.createElement("button");
        btn.className = 'scu-plus-button';
        btn.innerText = isRunningEvaluation ? "🎯暂停评教" : "🎯一键评教";
        btn.onclick = () => RunningEvaluation(!isRunningEvaluation);
        e.appendChild(btn);
        RunningEvaluation(isRunningEvaluation);
    })
    xpath_query(`//*[@id="saveEvaluation"]`, (e) => {
        let div = document.createElement("div")
        e.appendChild(div)
        const root = ReactDOM.createRoot(div)
        root.render(<Controller />)
        do_it(80, 100, false)
        if(isRunningEvaluation){
            setInterval(() => {
            let commitBtn = document.querySelector('#savebutton') as HTMLButtonElement;
            if (commitBtn.disabled == false) {
                commitBtn.click();
            }
        }, 1000);
        }
    });
    
})

function injectBtnStyle() {
    let styleSheet = document.createElement("style");
    styleSheet.innerHTML = `
        .scu-plus-button {
            display: inline-block !important;
            padding: 6px 12px !important;
            font-family: 'Arial', sans-serif !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            line-height: 1.5 !important;
            color: #ffffff !important;
            text-align: center !important;
            text-decoration: none !important;
            text-transform: none !important;
            letter-spacing: 0.5px !important;
            background-color: #4a6bff !important;
            border: 2px solid transparent !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            position: relative !important;
            overflow: hidden !important;
        }

        .scu-plus-button:hover {
            background-color: #3a5bef !important;
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15) !important;
            transform: translateY(-2px) !important;
        }

        .scu-plus-button:active {
            background-color: #2a4bdf !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
            transform: translateY(0) !important;
        }

        .scu-plus-button:focus {
            outline: none !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
        }

        .scu-plus-button::after {
            content: "" !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            width: 5px !important;
            height: 5px !important;
            background: rgba(255, 255, 255, 0.5) !important;
            opacity: 0 !important;
            border-radius: 100% !important;
            transform: scale(1, 1) translate(-50%, -50%) !important;
            transform-origin: 50% 50% !important;
        }

        .scu-plus-button:focus:not(:active)::after {
            animation: ripple 1s ease-out !important;
        }

        @keyframes ripple {
            0% {
                transform: scale(0, 0) translate(-50%, -50%) !important;
                opacity: 0.5 !important;
            }
            100% {
                transform: scale(20, 20) translate(-50%, -50%) !important;
                opacity: 0 !important;
            }
        }
    `
    document.head.appendChild(styleSheet);
}


function RunningEvaluation(run: boolean) {
    if (run) {
        localStorage.setItem("isRunningEvaluation", "true")
        message.info("正在进行自动评教，3s后跳转")
        setTimeout(() => {
            if (localStorage.getItem("isRunningEvaluation") !== "true") {
                return;
            }
            let table = document.querySelector('#codeTable') as HTMLTableElement;
            let hasMore = false;
            
            // 将HTMLCollection转换为数组以支持for...of循环
            const rows = Array.from(table.rows);
            for (let row of rows) {
                let btn = row.querySelector('button') as HTMLButtonElement;
                if (btn == null) continue;
                if (btn.innerText == '评估') {
                    hasMore = true;
                    btn.click();
                }
            }
            if (hasMore == false) {
                message.info("已经全部评教完成！");
                RunningEvaluation(false)
            }
        }, 3000);
    } else {
        localStorage.setItem("isRunningEvaluation", "false")
        message.info("已暂停自动评教")
    }
}

function Controller() {
    const [minscore, set_minscore] = useState(80)
    const [maxscore, set_maxscore] = useState(100)
    const [bestOnly, setBestOnly] = useState(false)
    const [api, contextHolder] = notification.useNotification();
    useEffect(() => {
        let evaluation_score_range = localStorage.getItem("evaluation_score_range") ?? "80:100";
        let best_only = localStorage.getItem("evaluation_best_only") === "true";
        console.log(evaluation_score_range)
        let score1 = parseInt(evaluation_score_range.split(":")[0] ?? "80");
        let score2 = parseInt(evaluation_score_range.split(":")[1] ?? "100");
        if (score1 <= score2 && score1 >= 0 && score2 <= 100) {
            set_minscore(score1);
            set_maxscore(score2);
        }
        setBestOnly(best_only);
    }, [])
    const openNotification = (placement: NotificationPlacement) => {
        api.info({
            message: `提示`,
            description:
                '你再看看你输入的对不对呢!😡',
            placement,
        });
    };
    const check = () => {
        if (minscore > maxscore || minscore < 0 || minscore > 100 || maxscore < 0 || maxscore > 100) {
            openNotification('top')
        } else {
            localStorage.setItem("evaluation_score_range", minscore.toString() + ":" + maxscore.toString())
            localStorage.setItem("evaluation_best_only", bestOnly.toString())
            do_it(minscore, maxscore, bestOnly)
        }
    }
    return <>
        {contextHolder}
        <div className="parameter" style={{ margin: "30px", background: "linear-gradient(to right, #43e97b 0%, #38f9d7 100%)", padding: "20px", borderRadius: "10px" }}>
            <label>分数范围：</label>
            <Input style={{ width: "80px", borderRadius: '10px' }} value={minscore} placeholder="最小值" type="number" onChange={(e) => set_minscore(Number(e.target.value))}></Input>
            ~
            <Input style={{ width: "80px", marginRight: "30px" }} placeholder="最大值" value={maxscore} type="number" onChange={(e) => set_maxscore(Number(e.target.value))}></Input>
            <Button onClick={() => check()}>自动填充评估</Button>
            <br/>
            <Checkbox 
              checked={bestOnly} 
              onChange={(e) => setBestOnly(e.target.checked)}
              style={{ marginTop: "10px" }}
            >
              全部选择最佳选项（单选题选A，多选题全选，主观题给满分）
            </Checkbox>
        </div>

    </>
}

type NotificationPlacement = NotificationArgsProps['placement'];

function do_it(min: number, max: number, bestOnly: boolean) {
    // 分数填充
    // 将NodeList转换为数组以支持for...of循环
    const inputs = Array.from(document.querySelectorAll('input'));
    for (let inp of inputs) {
        if (inp.placeholder == '请输入1-100的整数') {
            if (bestOnly) {
                inp.value = "100"; // 如果选择了"全部最佳"，则给满分
            } else {
                inp.value = (randomInt(min, max)).toString()
            }
        }
    }

    // 选填题
    let table = document.querySelector("#saveEvaluation > table");
    let body = table.querySelector("tbody");
    // 将HTMLCollection转换为数组以支持for...of循环
    const rows = Array.from(body.rows);
    for (let row of rows) {
        // 单选
        let inputs = row.querySelectorAll("input");
        if (bestOnly) {
            // 如果选择了"全部最佳"，则始终选择第一个选项（通常为A选项，代表最佳答案）
            for (let input of Array.from(inputs)) {
                if (input.type == "radio") {
                    if (input.name.includes("questionOption")) {
                        input.checked = true;
                        break;
                    }
                } else {
                    break;
                }
            }
        } else {
            // 随机选择选项
            let randomScore = ["A_", "B_", "C_","D_"][randomInt(0, inputs.length-2)]; //排除最后一个选项
            for (let input of Array.from(inputs)) {
                if (input.type == "radio") {
                    if (input.value.startsWith(randomScore)) {
                        input.checked = true;
                    }
                } else {
                    break;
                }
            }
        }

        // 多选
        let checks: HTMLInputElement[] = []
        for (let input of Array.from(inputs)) {
            if (input.type == "checkbox") {
                input.checked = false
                checks.push(input)
            } else {
                break;
            }
        }
        if (bestOnly) {
            // 如果选择了"全部最佳"，则勾选所有选项（除了"以上均无"等否定选项）
            for (let i = 0; i < checks.length; i++) {
                // 尝试检测是否为否定性质的选项，如"以上均无"等
                const label = document.querySelector(`label[for="${checks[i].id}"]`)?.textContent || "";
                if (!label.includes("以上均无") && !label.includes("均无") && !label.includes("没有")) {
                    checks[i].checked = true;
                }
            }
        } else {
            for (let i = 0; i < checks.length - 1; i++) {
                if (randomInt(1, 100) < 30) {
                    checks[i].checked = true;
                }
            }
        }

        // 主观题
        let answers: string[] = [
            "课程内容丰富，讲解清晰易懂，老师授课非常有激情。",
            "教学节奏适中，重点突出，有助于理解和掌握知识点。",
            "老师备课认真，课堂互动良好，学习氛围积极向上。",
            "实践与理论结合紧密，提升了我的实际操作能力。",
            "作业布置合理，能够有效巩固课堂所学知识。",
            "课程结构安排科学，循序渐进，易于接受和理解。",
            "老师耐心解答问题，鼓励学生提问，课堂气氛活跃。",
            "授课方式灵活多样，能调动学生的学习积极性。",
            "对难点讲解细致，帮助我克服了学习上的障碍。",
            "教材选用恰当，内容紧跟学科发展前沿。",
            "老师责任心强，批改作业认真，反馈及时。",
            "课程进度安排合理，不紧不慢，适合大多数学生。",
            "鼓励学生思考和表达，培养了我们的独立思维能力。",
            "多媒体教学手段运用得当，增强了课堂的直观性。",
            "课程考核方式公平公正，能够真实反映学习情况。",
            "老师富有亲和力，沟通顺畅，深受学生欢迎。",
            "课程内容实用性强，对今后的学习和工作很有帮助。",
            "注重引导和启发，提高了我的学习兴趣和主动性。",
            "课堂纪律严明，教学秩序良好，有利于专注学习。",
            "感谢老师的辛勤付出，这是一门值得推荐的好课！",
            "老师专业水平高，课程设计合理，内容充实，受益匪浅。",
            "课程内容前沿，理论与实践结合，极大提升了我的专业能力。",
            "教师教学态度认真负责，关心学生学习状况，深得学生喜爱。",
            "课程设计新颖，注重培养学生的创新思维和实践技能。",
            "课程内容系统全面，难度适中，有助于学生深入理解专业知识。"
        ];
        // 将NodeList转换为数组以支持for...of循环
        const textInputs = Array.from(document.querySelectorAll("textarea"));
        for (let inp of textInputs) {
            inp.value = answers[randomInt(0, answers.length - 1)];
        }
    }

}

export default () => <></>