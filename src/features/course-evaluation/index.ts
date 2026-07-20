import { message } from "antd"
import { xpath_query, randomInt } from "~script/utils"

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

function updateEvalButtonText(running: boolean) {
    const btn = document.querySelector('.scu-plus-button') as HTMLButtonElement;
    if (btn) {
        btn.innerHTML = running ? '<span style="color:var(--scu-accent,#9e1b32)">✦</span>暂停评教' : '<span style="color:var(--scu-accent,#9e1b32)">✦</span>一键评教';
    }
}

function RunningEvaluation(run: boolean, notify: boolean = true) {
    updateEvalButtonText(run);
    if (run) {
        localStorage.setItem("isRunningEvaluation", "true")

        // 加载或构建评教队列（按表格序号顺序）
        let queue: string[][] = null;
        try {
            const parsed = JSON.parse(localStorage.getItem("evalQueue") || "null");
            if (Array.isArray(parsed)) queue = parsed;
        } catch (e) {
            // localStorage 中数据损坏时重置队列，避免整个评教功能崩溃
            console.warn("evalQueue 数据损坏，已重置", e);
            localStorage.removeItem("evalQueue");
        }
        if (!queue || queue.length === 0) {
            // 首次启动或队列已耗尽：从页面表格扫描所有带"评估"按钮的课程
            queue = [];
            const table = document.querySelector('#codeTable') as HTMLTableElement;
            if (table) {
                const rows = Array.from(table.rows);
                for (const row of rows) {
                    const btn = row.querySelector('button');
                    if (!btn || btn.innerText.trim() !== '评估') continue;
                    const cells = row.querySelectorAll('td');
                    if (cells.length < 7) continue;
                    const kch = cells[5]?.textContent?.trim() || '';
                    const kxh = cells[6]?.textContent?.trim() || '';
                    if (kch && kxh) queue.push([kch, kxh]);
                }
            }
            localStorage.setItem("evalQueue", JSON.stringify(queue));
            message.info(`开始自动评教，共 ${queue.length} 个任务`);
        } else {
            // 继续执行：移除刚完成的第一个任务
            queue.shift();
            localStorage.setItem("evalQueue", JSON.stringify(queue));
        }

        if (queue.length === 0) {
            message.success("已经全部评教完成！");
            RunningEvaluation(false, false);
            return;
        }

        message.info(`正在进行自动评教，剩余 ${queue.length} 个`);
        setTimeout(() => {
            if (localStorage.getItem("isRunningEvaluation") !== "true") {
                return;
            }

            // 找到队列中第一个课程的按钮并点击
            const [targetKch, targetKxh] = queue[0];
            const table = document.querySelector('#codeTable') as HTMLTableElement;
            if (table) {
                const rows = Array.from(table.rows);
                for (const row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length < 7) continue;
                    const kch = cells[5]?.textContent?.trim() || '';
                    const kxh = cells[6]?.textContent?.trim() || '';
                    if (kch === targetKch && kxh === targetKxh) {
                        const btn = row.querySelector('button');
                        if (btn && btn.innerText.trim() === '评估') {
                            btn.click();
                            return;
                        }
                    }
                }
            }

            // 没找到对应的行（可能已被手动处理或页面变化了），重新构建队列重试
            localStorage.removeItem("evalQueue");
            RunningEvaluation(true);
        }, 3000);
    } else {
        localStorage.setItem("isRunningEvaluation", "false")
        localStorage.removeItem("evalQueue")
        if (notify) message.info("已暂停自动评教")
    }
}



function do_it(min: number, max: number, bestOnly: boolean) {
    const form = document.querySelector("#saveEvaluation");
    if (!form) return;

    // 1. 分数输入框
    const allInputs = Array.from(form.querySelectorAll('input'));
    for (let inp of allInputs) {
        if (inp.placeholder === '请输入1-100的整数') {
            inp.value = bestOnly ? "100" : randomInt(min, max).toString();
        }
    }

    // 2. 表格行（使用后代选择器，兼容中间有包装层的情况）
    const table = form.querySelector('table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.rows);

    // 准备主观题答案
    const answers: string[] = [
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

    for (let row of rows) {
        const inputs = Array.from(row.querySelectorAll('input'));

        // === 单选题（radio）===
        const radios = inputs.filter(inp => inp.type === "radio");
        if (bestOnly && radios.length > 0) {
            radios[0].checked = true; // 选中第一个（A/完全符合）
        } else if (radios.length > 0) {
            // 非最佳模式，随机选一个（跳过最后一个通常为负面选项）
            const maxIndex = Math.max(0, radios.length - 2);
            const score = ["A_", "B_", "C_", "D_"][randomInt(0, maxIndex)];
            for (const radio of radios) {
                if (radio.value.startsWith(score)) {
                    radio.checked = true;
                }
            }
        }

        // === 多选题（checkbox）===
        const checkboxes = inputs.filter(inp => inp.type === "checkbox");
        if (checkboxes.length > 0) {
            // 先全部取消选中
            checkboxes.forEach(cb => cb.checked = false);
            if (bestOnly) {
                for (const cb of checkboxes) {
                    const label = cb.closest('label')?.textContent?.trim() || "";
                    if (!label.includes("以上皆无") && !label.includes("以上均无") && !label.includes("均无") && !label.includes("没有")) {
                        cb.checked = true;
                    }
                }
            } else {
                for (let i = 0; i < checkboxes.length - 1; i++) {
                    if (randomInt(1, 100) < 30) {
                        checkboxes[i].checked = true;
                    }
                }
            }
        }
    }

    // === 主观题（textarea）——放到行循环外，避免重复设置 ===
    const textareas = Array.from(form.querySelectorAll("textarea"));
    for (const ta of textareas) {
        ta.value = answers[randomInt(0, answers.length - 1)];
    }
}

/**
 * 判断当前页面是否为异常评教页（已过期/关闭）
 */
function isAbnormalEvalPage(): boolean {
    if (!window.location.href.includes('/evaluation2')) return false;
    if (document.querySelector('#saveEvaluation')) return false;
    const body = document.body;
    if (!body) return false;
    const content = body.textContent || '';
    return content.includes('过程评估开关未打开') || content.includes('不在可评估范围内');
}

/**
 * 处理异常评教：返回评教列表（队列 shift 会在列表页自动移除该项）
 */
function handleAbnormalEval(): void {
    message.info("检测到异常评教（已过期/关闭），已自动跳过");
    setTimeout(() => {
        window.location.href = '/student/teachingEvaluation/newEvaluation/index';
    }, 500);
}

export function initCourseEvaluation(): void {
    let isRunningEvaluation = localStorage.getItem("isRunningEvaluation") === "true";

    // 自动评教模式下，检测到异常评教页则跳过并返回列表
    if (isRunningEvaluation && isAbnormalEvalPage()) {
        handleAbnormalEval();
        return;
    }

    xpath_query('//*[@id="home"]/div/div/h4/span', (e) => {
        injectBtnStyle()
        let btn = document.createElement("button");
        btn.className = 'scu-plus-button';
        btn.innerHTML = isRunningEvaluation ? '<span style="color:var(--scu-accent,#9e1b32)">✦</span>暂停评教' : '<span style="color:var(--scu-accent,#9e1b32)">✦</span>一键评教';
        btn.onclick = () => RunningEvaluation(localStorage.getItem("isRunningEvaluation") !== "true");
        e.appendChild(btn);
        // 仅在评教进行中才恢复执行；未在评教时按钮文案已正确设置，无需调用（否则会误弹"已暂停"提示）
        if (isRunningEvaluation) {
            RunningEvaluation(true);
        }
    })
    xpath_query(`//*[@id="saveEvaluation"]`, () => {
        // 默认最佳选项填表（单选题选A，多选题全选，主观题给满分），用户可在倒计时内修改
        do_it(80, 100, true)
        if(isRunningEvaluation){
            let popupHandled = false;
            const evalTimer = setInterval(() => {
            // 如果用户暂停了评教，停止轮询
            if (localStorage.getItem("isRunningEvaluation") !== "true") {
                clearInterval(evalTimer);
                return;
            }
            // 优先检测"打分选项"弹窗 (layer.confirm)
            const dfxxRadios = document.querySelectorAll('input[name="dfxx"]');
            if (dfxxRadios.length > 0) {
                if (!popupHandled) {
                    popupHandled = true;
                    // 随机选择一个打分选项
                    const randomIndex = randomInt(0, dfxxRadios.length - 1);
                    (dfxxRadios[randomIndex] as HTMLInputElement).checked = true;
                    // 使用 jQuery 触发点击以兼容 layer.js 事件绑定
                    const $ = (window as any).jQuery || (window as any).$;
                    if ($) {
                        $('.layui-layer-btn0').trigger('click');
                    } else {
                        const confirmBtn = document.querySelector('.layui-layer-btn0') as HTMLElement;
                        if (confirmBtn) confirmBtn.click();
                    }
                    // 队列已在 RunningEvaluation 中管理，无需额外处理
                }
                // 弹窗还在显示时跳过保存按钮点击（等待 AJAX 完成页面跳转）
                return;
            }
            let commitBtn = document.querySelector('#savebutton') as HTMLButtonElement;
            if (commitBtn && commitBtn.disabled === false) {
                commitBtn.click();
            }
        }, 1000);
        }
    });
}
