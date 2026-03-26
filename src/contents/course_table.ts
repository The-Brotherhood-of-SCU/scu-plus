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
    inject();
    injectExportFunc();
    hideKbtAndObserve();
})

// 注入学分统计
async function inject() {
    $('#h4_id1 > span.label.label-lg.label-danger.arrowed-in',e=>{
        if(e.innerText==='注：未安排具体时间的课程请在下方“全部课程清单”中查看，并联系开课院系获取上课时间地点'){
            e.remove()
        }
    })
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
    show_elememt.querySelector("span").innerText += " \u{1f3af}by SCU+";
    $("#myTab > li", (e) => e.appendChild(show_elememt));
}

const injectExportFunc = () => {
    // helper: copy computed styles from src element to dest element
    function copyComputedStyle(src: Element, dest: Element) {
        try {
            const cs = window.getComputedStyle(src as Element);
            const d = dest as HTMLElement;
            for (let i = 0; i < cs.length; i++) {
                const prop = cs[i];
                try { d.style.setProperty(prop, cs.getPropertyValue(prop), cs.getPropertyPriority(prop)); } catch (e) { }
            }
        } catch (e) { }
    }

    // helper: sanitize clone to avoid external fetches and data: url injections
    function sanitizeCloneResources(root: HTMLElement) {
        try {
            // remove external stylesheet links in the clone
            Array.from(root.querySelectorAll('link[rel="stylesheet"][href]')).forEach((ln) => {
                try { ln.parentElement?.removeChild(ln); } catch (e) { }
            });
            // remove style nodes that may contain @font-face or about:blank
            Array.from(root.querySelectorAll('style')).forEach((st) => {
                try {
                    const text = (st as HTMLStyleElement).textContent || '';
                    if (text.includes('@font-face') || text.includes('about:blank') || text.includes('font-face')) {
                        st.parentElement?.removeChild(st);
                    }
                } catch (e) { }
            });
            // remove inline background images and url(...) usages
            Array.from(root.querySelectorAll('*')).forEach((el) => {
                try {
                    const he = el as HTMLElement;
                    if (he.style && he.style.backgroundImage && he.style.backgroundImage !== 'none') he.style.backgroundImage = 'none';
                    if (he.getAttribute && he.getAttribute('style')) {
                        const s = he.getAttribute('style') || '';
                        if (s.includes('url(')) he.setAttribute('style', s.replace(/url\([^)]*\)/g, 'none'));
                    }
                } catch (e) { }
            });
            // for images, remove src and hide them instead of setting data: URLs
            Array.from(root.querySelectorAll('img')).forEach((img) => {
                try {
                    (img as HTMLImageElement).removeAttribute('src');
                    (img as HTMLElement).style.visibility = 'hidden';
                    (img as HTMLElement).style.backgroundImage = 'none';
                } catch (e) { }
            });
        } catch (e) { console.warn('[SCU+] sanitizeCloneResources failed', e); }
    }

    // helper: absolutize positions of .class_div children in the clone
    function absolutizeClonePositions(origRoot: HTMLElement, cloneRoot: HTMLElement, wrapperEl: HTMLElement) {
        try {
            const wrapperRect = wrapperEl.getBoundingClientRect();
            const origEls = Array.from(origRoot.getElementsByClassName('class_div')) as HTMLElement[];
            const cloneEls = Array.from(cloneRoot.getElementsByClassName('class_div')) as HTMLElement[];
            const n = Math.min(origEls.length, cloneEls.length);
            try { (cloneRoot as HTMLElement).style.position = 'relative'; } catch (e) { }
            for (let i = 0; i < n; i++) {
                try {
                    const o = origEls[i];
                    const c = cloneEls[i] as HTMLElement;
                    const r = o.getBoundingClientRect();
                    const left = r.left - wrapperRect.left;
                    const top = r.top - wrapperRect.top;
                    c.style.position = 'absolute';
                    c.style.left = Math.round(left) + 'px';
                    c.style.top = Math.round(top) + 'px';
                    c.style.width = Math.round(r.width) + 'px';
                    c.style.height = Math.round(r.height) + 'px';
                    c.style.margin = '0';
                    c.style.transform = 'none';
                } catch (e) { }
            }
        } catch (e) { console.warn('[SCU+] absolutizeClonePositions failed', e); }
    }

    // main: attach export buttons that perform a clone-based safe export
    $('.right_top_oper', (e) => {
        let btn = document.createElement("button");
        btn.setAttribute('class', 'btn btn-info btn-xs btn-round');
        btn.innerHTML = `<i class="fa fa-cloud-download bigger-120"></i>导出课表图片\u{1f3af}`;
        e.appendChild(btn);
        btn.addEventListener('click', async () => {
            const original = document.getElementById('courseTable') as HTMLElement;
            if (!original) return;
            const clonedTable = original.cloneNode(true) as HTMLElement;
            // copy computed styles recursively
            try {
                copyComputedStyle(original, clonedTable);
                const srcAll = Array.from(original.querySelectorAll('*')) as Element[];
                const dstAll = Array.from(clonedTable.querySelectorAll('*')) as Element[];
                const n = Math.min(srcAll.length, dstAll.length);
                for (let i = 0; i < n; i++) {
                    try { copyComputedStyle(srcAll[i], dstAll[i]); } catch (e) { }
                }
            } catch (e) { }

            // create wrapper positioned at the original location
            const wrapper = document.createElement('div');
            const rect = original.getBoundingClientRect();
            wrapper.style.position = 'absolute';
            wrapper.style.left = (rect.left + window.scrollX) + 'px';
            wrapper.style.top = (rect.top + window.scrollY) + 'px';
            wrapper.style.width = rect.width + 'px';
            wrapper.style.height = rect.height + 'px';
            wrapper.style.overflow = 'visible';
            wrapper.style.zIndex = '99999';
            wrapper.style.pointerEvents = 'none';
            wrapper.style.opacity = '1';
            wrapper.style.background = 'white';
            wrapper.appendChild(clonedTable);

            const sandboxId = 'scu-plus-export-sandbox';
            let sandbox = document.getElementById(sandboxId) as HTMLElement;
            if (!sandbox) {
                sandbox = document.createElement('div');
                sandbox.id = sandboxId;
                sandbox.style.position = 'absolute';
                sandbox.style.left = '0';
                sandbox.style.top = '0';
                sandbox.style.overflow = 'visible';
                sandbox.style.zIndex = '99998';
                sandbox.style.pointerEvents = 'none';
                document.body.appendChild(sandbox);
            }

            try {
                sanitizeCloneResources(clonedTable);
                // 先把 wrapper 插入 DOM，再计算并绝对化子项位置，避免未插入时 getBoundingClientRect 返回 0
                sandbox.appendChild(wrapper);
                absolutizeClonePositions(original, clonedTable, wrapper);
                await downloadCanvas(wrapper, '课程表', 1);
            } catch (e) {
                console.error('[SCU+] export failed', e);
            } finally {
                try { sandbox.removeChild(wrapper); } catch (e) { }
            }
        });
    });

    $("#mainDIV > h4:nth-child(3)", (e) => {
        let btn = document.createElement("button");
        btn.setAttribute('class', 'btn btn-info btn-xs btn-round');
        btn.innerHTML = `<i class="fa fa-cloud-download bigger-120"></i>导出课表图片\u{1f3af}`;
        e.appendChild(btn);
        btn.addEventListener('click', async () => {
            const original = document.getElementById('courseTable') as HTMLElement;
            if (!original) return;
            const clonedTable = original.cloneNode(true) as HTMLElement;
            try {
                copyComputedStyle(original, clonedTable);
                const srcAll = Array.from(original.querySelectorAll('*')) as Element[];
                const dstAll = Array.from(clonedTable.querySelectorAll('*')) as Element[];
                const n = Math.min(srcAll.length, dstAll.length);
                for (let i = 0; i < n; i++) {
                    try { copyComputedStyle(srcAll[i], dstAll[i]); } catch (e) { }
                }
            } catch (e) { }

            const wrapper = document.createElement('div');
            const rect = original.getBoundingClientRect();
            wrapper.style.position = 'absolute';
            wrapper.style.left = (rect.left + window.scrollX) + 'px';
            wrapper.style.top = (rect.top + window.scrollY) + 'px';
            wrapper.style.width = rect.width + 'px';
            wrapper.style.height = rect.height + 'px';
            wrapper.style.overflow = 'visible';
            wrapper.style.zIndex = '99999';
            wrapper.style.pointerEvents = 'none';
            wrapper.style.opacity = '1';
            wrapper.style.background = 'white';
            wrapper.appendChild(clonedTable);

            const sandboxId = 'scu-plus-export-sandbox';
            let sandbox = document.getElementById(sandboxId) as HTMLElement;
            if (!sandbox) {
                sandbox = document.createElement('div');
                sandbox.id = sandboxId;
                sandbox.style.position = 'absolute';
                sandbox.style.left = '0';
                sandbox.style.top = '0';
                sandbox.style.overflow = 'visible';
                sandbox.style.zIndex = '99998';
                sandbox.style.pointerEvents = 'none';
                document.body.appendChild(sandbox);
            }

            try {
                sanitizeCloneResources(clonedTable);
                // 先把 wrapper 插入 DOM，再计算并绝对化子项位置
                sandbox.appendChild(wrapper);
                absolutizeClonePositions(original, clonedTable, wrapper);
                await downloadCanvas(wrapper, '课程表', 1);
            } catch (e) {
                console.error('[SCU+] export failed', e);
            } finally {
                try { sandbox.removeChild(wrapper); } catch (e) { }
            }
        })
    })
}