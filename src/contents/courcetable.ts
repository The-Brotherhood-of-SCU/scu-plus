import type { PlasmoCSConfig } from "plasmo"
import { $, downloadCanvas } from "~script/utils";

export const config: PlasmoCSConfig = {
    matches: [
        "*://zhjw.scu.edu.cn/*student/courseSelect/*",
        "*://zhjw.scu.edu.cn/*student/courseSelect/thisSemesterCurriculum/*",
        "*://zhjw.scu.edu.cn/*student/courseSelect/courseSelectResult/*",
        "*://zhjw.scu.edu.cn/*student/courseSelect/calendarSemesterCurriculum/*"
    ],
    all_frames: true
}

function extractData(): { attribute: string; credit: number }[] {
    const rows = document.querySelectorAll("#tab10646 > table > tbody > tr");
    const data: { attribute: string; credit: number }[] = [];
    rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 6) {
            const attribute = cells[6].textContent?.trim() || ""; // 第7列：课程属性
            const creditText = cells[5].textContent?.trim(); // 第6列：学分
            const credit = parseFloat(creditText || "0");
            data.push({ attribute, credit });
        }
    });
    return data;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 屏蔽选课页面原生的浮动时间筛选器容器（id 或 class）并监听动态插入
function hideKbtAndObserve() {
    const selectorList = [
        '#div_kbt',
        '.div-kbt',
        '#myselectTable',
        '#div_kb',
        '#div_cover',
        '#lal-sxl'
    ];

    function hideElement(el: Element) {
        try {
            // 优先用 inline style 强制隐藏，避免被后续脚本恢复
            const he = el as HTMLElement;
            he.setAttribute('data-scu-plus-hidden', '1');
            he.style.setProperty('display', 'none', 'important');
            he.style.setProperty('visibility', 'hidden', 'important');
            he.style.setProperty('pointer-events', 'none', 'important');
        } catch (e) { }
    }

    function hideExisting(root: Document | ParentNode = document) {
        try {
            for (const sel of selectorList) {
                const elems = root.querySelectorAll(sel as string);
                elems.forEach((el: Element) => hideElement(el));
            }
        } catch (e) { }
    }

    // 处理同源 iframe：尝试访问并隐藏其中的匹配元素
    function handleIframes() {
        const iframes = Array.from(document.getElementsByTagName('iframe')) as HTMLIFrameElement[];
        for (const fr of iframes) {
            try {
                const doc = fr.contentDocument || fr.contentWindow?.document;
                if (doc) {
                    hideExisting(doc);
                }
            } catch (e) {
                // 跨域 iframe 无法访问，跳过
            }
            // 监听 iframe load 以应对动态注入
            fr.addEventListener('load', () => {
                try {
                    const doc = fr.contentDocument || fr.contentWindow?.document;
                    if (doc) hideExisting(doc);
                } catch (e) { }
            });
        }
    }

    // 定期尝试隐藏（防止页面脚本反复插入或修改）——短时重试以降低开销
    let attempts = 0;
    const maxAttempts = 20; // 20 次，每 500ms -> 10s
    const interval = setInterval(() => {
        hideExisting(document);
        handleIframes();
        attempts++;
        if (attempts >= maxAttempts) clearInterval(interval);
    }, 500);

    // 初次执行并启用 MutationObserver
    hideExisting(document);
    handleIframes();

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length) {
                try {
                    // 对所有新增节点尝试匹配 selector 或查询其子树
                    m.addedNodes.forEach((node) => {
                        if (!(node instanceof Element)) return;
                        for (const sel of selectorList) {
                            if ((node as Element).matches && (node as Element).matches(sel as string)) {
                                hideElement(node as Element);
                            }
                        }
                        // 检查新增节点内部
                        hideExisting(node as ParentNode);
                        // 如果新增的是 iframe，处理它
                        if ((node as Element).tagName === 'IFRAME') {
                            const fr = node as HTMLIFrameElement;
                            try { const doc = fr.contentDocument || fr.contentWindow?.document; if (doc) hideExisting(doc); } catch (e) {}
                            fr.addEventListener('load', () => { try { const doc = fr.contentDocument || fr.contentWindow?.document; if (doc) hideExisting(doc); } catch (e) {} });
                        }
                    });
                } catch (e) { }
            }
        }
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
}

window.addEventListener("load", () => {
    setTimeout(() => {
        inject();
        injectExportFunc();
        hideKbtAndObserve();
        beautifyKbtStyle();
    }, 1000);
})

// 注入学分统计
async function inject() {
    while (true) {
        let table = document.querySelector("#tab10646 > table > tbody") as HTMLElement;
        if (table) {
            break;
        }
        await sleep(1000);
    }
    let data = extractData();
    let requiredCredits = data.reduce((sum, cur) => sum + (cur.attribute === "必修" ? cur.credit : 0), 0);
    let n_requiredCredits = data.reduce((sum, cur) => sum + (cur.attribute === "选修" ? cur.credit : 0), 0);
    let any_requiredCredits = data.reduce((sum, cur) => sum + (cur.attribute === "任选" ? cur.credit : 0), 0);
    let show_elememt = document.createElement("div");
    show_elememt.innerHTML = `
    <span style="font-size:1.3rem;color:red;">必修学分: ${requiredCredits}&nbsp;&nbsp;选修学分: ${n_requiredCredits}&nbsp;&nbsp;任选学分: ${any_requiredCredits}</span>
    `;
    show_elememt.querySelector("span").innerText += " 🎯by SCU+";
    $("#myTab > li", (e) => e.appendChild(show_elememt));
}

const injectExportFunc = () => {
    $('.right_top_oper', (e) => {
        let btn = document.createElement("button");
        btn.setAttribute('class', 'btn btn-info btn-xs btn-round');
        btn.innerHTML = `<i class="fa fa-cloud-download bigger-120"></i>导出课表图片emoji`.replace('emoji', "🎯");
        e.appendChild(btn);
        btn.addEventListener('click', () => {
            let cources = document.getElementsByClassName("class_div") as HTMLCollectionOf<HTMLElement>;
            for (let c of cources) {
                c.style.transform = `translate(-15px, 0px)`;
            }
            let canvas = document.getElementById('courseTable') as HTMLElement;
            downloadCanvas(canvas, '课程表', 1);
        });
    });

    $("#mainDIV > h4:nth-child(3)", (e) => {
        let btn = document.createElement("button");
        btn.setAttribute('class', 'btn btn-info btn-xs btn-round');
        btn.innerHTML = `<i class="fa fa-cloud-download bigger-120"></i>导出课表图片emoji`.replace('emoji', "🎯");
        e.appendChild(btn);
        btn.addEventListener('click', () => {
            let cources = document.getElementsByClassName("class_div") as HTMLCollectionOf<HTMLElement>;
            for (let c of cources) {
                c.style.transform = `translate(-15px, 20px)`;
            }
            let canvas = document.getElementById('courseTable') as HTMLElement;
            downloadCanvas(canvas, '课程表', 1);
        });
    })
}