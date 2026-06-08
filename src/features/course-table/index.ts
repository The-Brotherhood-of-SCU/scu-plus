import { $, downloadCanvas } from "~script/utils";
import { message } from "antd";

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

function sleep(ms: number) {
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
    show_elememt.querySelector("span")!.innerText += " \u{1f3af}by SCU+";
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

    // helper: copy text to clipboard, fallback for non-HTTPS pages
    function copyToClipboard(text: string) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            (document as any).execCommand('copy');
        } finally {
            document.body.removeChild(ta);
        }
        return Promise.resolve();
    }

    // helper: fetch schedule json and copy to clipboard
    async function exportScheduleJson() {
        try {
            const res = await fetch('http://zhjw.scu.edu.cn/student/courseSelect/thisSemesterCurriculum/ajaxStudentSchedule/callback');
            const text = await res.text();
            await copyToClipboard(text);
            message.info('课表 JSON 已复制到剪切板');
        } catch (e) {
            message.info('导出失败: ' + e);
        }
    }

    // ics export helpers

    const TIME_TABLE_JIANGAN: Record<number, [string, string]> = {
        1: ["08:15", "09:00"],
        2: ["09:10", "09:55"],
        3: ["10:15", "11:00"],
        4: ["11:10", "11:55"],
        5: ["13:50", "14:35"],
        6: ["14:45", "15:30"],
        7: ["15:40", "16:25"],
        8: ["16:45", "17:30"],
        9: ["17:40", "18:25"],
        10: ["19:20", "20:05"],
        11: ["20:15", "21:00"],
        12: ["21:10", "21:55"],
    };

    const TIME_TABLE_HUAXI: Record<number, [string, string]> = {
        1: ["08:00", "08:45"],
        2: ["08:55", "09:40"],
        3: ["10:00", "10:45"],
        4: ["10:55", "11:40"],
        5: ["14:00", "14:45"],
        6: ["14:55", "15:40"],
        7: ["15:50", "16:35"],
        8: ["16:55", "17:40"],
        9: ["17:50", "18:35"],
        10: ["19:30", "20:15"],
        11: ["20:25", "21:10"],
        12: ["21:20", "22:05"],
    };

    function parseCurrentWeek(): number | null {
        console.log('[SCU+ ICS] parseCurrentWeek start');
        let spans: NodeListOf<Element> | null = null;
        // 优先从顶层 frame 查找 (all_frames: true 下可能运行在 iframe 中)
        try { spans = top?.document?.querySelectorAll('.span_bbzx'); console.log('[SCU+ ICS] top.document spans count:', spans?.length); } catch (e) { console.log('[SCU+ ICS] top.document error:', e); }
        if (!spans?.length) try { spans = parent?.document?.querySelectorAll('.span_bbzx'); console.log('[SCU+ ICS] parent.document spans count:', spans?.length); } catch (e) { console.log('[SCU+ ICS] parent.document error:', e); }
        if (!spans?.length) { spans = document.querySelectorAll('.span_bbzx'); console.log('[SCU+ ICS] document spans count:', spans?.length); }
        if (!spans?.length) { console.log('[SCU+ ICS] no .span_bbzx found in any frame'); return null; }
        for (const span of spans) {
            const text = span.textContent || '';
            console.log('[SCU+ ICS] span text:', text);
            const match = text.match(/第(\d+)周/);
            if (match) {
                console.log('[SCU+ ICS] match:', match);
                return parseInt(match[1], 10);
            }
        }
        console.log('[SCU+ ICS] no 第X周 found in any span');
        return null;
    }

    function calcFirstMonday(currentWeek: number): Date {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const mondayOfThisWeek = new Date(today);
        mondayOfThisWeek.setHours(0, 0, 0, 0);
        mondayOfThisWeek.setDate(today.getDate() - daysSinceMonday);
        const firstMonday = new Date(mondayOfThisWeek);
        firstMonday.setDate(mondayOfThisWeek.getDate() - (currentWeek - 1) * 7);
        return firstMonday;
    }

    function escapeIcsText(text: string): string {
        return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }

    function formatIcsDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${y}${m}${d}T${hh}${mm}${ss}`;
    }

    function buildCourseDescription(course: any, tapl: any, week: number, idx: number, total: number): string {
        const lines: string[] = [];
        const noSchedule = !tapl.teachingBuildingName && !tapl.classroomName;
        if (noSchedule) {
            lines.push('（本课程没有安排时间）');
        } else {
            lines.push(`本周是第 ${week} 周 | 课程进度 ${idx + 1}/${total} 节`);
        }
        lines.push(`课程号_课序号: ${tapl.coureNumber}_${tapl.coureSequenceNumber}`);
        lines.push(`课程名称: ${tapl.coureName}`);
        if (course.englishCourseName) lines.push(course.englishCourseName);
        lines.push(`教师: ${course.attendClassTeacher || ''}`);
        lines.push(`学分: ${course.unit}`);
        lines.push(`课程属性: ${tapl.coursePropertiesName || course.coursePropertiesName || ''}`);
        if (course.courseCategoryName) lines.push(`课程类别: ${course.courseCategoryName}`);
        lines.push(`选课状态: ${course.selectCourseStatusName || ''}`);
        lines.push(`上课地点: ${tapl.campusName || ''} / ${tapl.teachingBuildingName || ''} / ${tapl.classroomName || ''}`);
        lines.push(`上课周数: ${tapl.weekDescription || ''}`);
        lines.push(`上课星期: ${tapl.classDay}`);
        const sessionEnd = tapl.classSessions + tapl.continuingSession - 1;
        lines.push(`上课节数: ${tapl.classSessions}-${sessionEnd}`);
        if (course.restrictedCondition) lines.push(`选课限制: ${course.restrictedCondition}`);
        if (course.pkbz) lines.push(`排课备注: ${course.pkbz}`);
        return lines.join('\\n');
    }

    function generateIcs(rawData: any, firstMonday: Date): string {
        const lines: string[] = [];
        lines.push('BEGIN:VCALENDAR');
        lines.push('VERSION:2.0');
        lines.push('PRODID:-//SCU Plus//CN');

        const coursesIndex = rawData.xkxx[0];
        console.log('[SCU+ ICS] generating events for', Object.keys(coursesIndex).length, 'courses');
        let eventCount = 0;
        let skippedCount = 0;
        for (const key of Object.keys(coursesIndex)) {
            const course = coursesIndex[key];
            const taplList = course.timeAndPlaceList || [];
            for (let ti = 0; ti < taplList.length; ti++) {
                const tapl = taplList[ti];
                const classWeek: string = tapl.classWeek || '';
                const classDay: number = tapl.classDay || 1;
                const classSessions: number = tapl.classSessions || 1;
                const continuingSession: number = tapl.continuingSession || 1;
                const campusName: string = tapl.campusName || '';

                const timeTable = campusName === '江安' ? TIME_TABLE_JIANGAN : TIME_TABLE_HUAXI;
                const startSection = classSessions;
                const endSection = classSessions + continuingSession - 1;
                const startTime = timeTable[startSection]?.[0];
                const endTime = timeTable[endSection]?.[1];
                if (!startTime || !endTime) {
                    skippedCount++;
                    console.log('[SCU+ ICS] skip course (no timetable for section):', tapl.coureName, 'campus:', campusName, 'session:', startSection, '-', endSection);
                    continue;
                }

                const weeks: number[] = [];
                for (let i = 0; i < classWeek.length; i++) {
                    if (classWeek[i] === '1') weeks.push(i + 1);
                }
                console.log('[SCU+ ICS] course:', tapl.coureName, 'campus:', campusName, 'day:', classDay, 'sessions:', startSection, '-', endSection, 'weeks:', weeks.length, 'classWeek:', classWeek);

                for (let wi = 0; wi < weeks.length; wi++) {
                    const week = weeks[wi];
                    const eventDate = new Date(firstMonday);
                    eventDate.setDate(firstMonday.getDate() + (week - 1) * 7 + (classDay - 1));

                    const [startH, startM] = startTime.split(':').map(Number);
                    const [endH, endM] = endTime.split(':').map(Number);

                    const dtStart = new Date(eventDate);
                    dtStart.setHours(startH, startM, 0, 0);
                    const dtEnd = new Date(eventDate);
                    dtEnd.setHours(endH, endM, 0, 0);

                    const summary = escapeIcsText(tapl.coureName || course.courseName || '未知课程');
                    const location = escapeIcsText(`${campusName} ${tapl.teachingBuildingName || ''} ${tapl.classroomName || ''}`.trim());
                    const description = buildCourseDescription(course, tapl, week, wi, weeks.length);

                    lines.push('BEGIN:VEVENT');
                    lines.push(`SUMMARY:${summary}`);
                    lines.push(`LOCATION:${location}`);
                    lines.push(`DESCRIPTION:${description}`);
                    lines.push(`DTSTART;TZID=Asia/Shanghai:${formatIcsDate(dtStart)}`);
                    lines.push(`DTEND;TZID=Asia/Shanghai:${formatIcsDate(dtEnd)}`);
                    lines.push('END:VEVENT');
                    eventCount++;
                }
            }
        }

        console.log('[SCU+ ICS] total events:', eventCount, 'skipped:', skippedCount);        lines.push('END:VCALENDAR');
        return lines.join('\r\n');
    }

    function downloadIcsFile(content: string) {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'schedule.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function exportScheduleIcs() {
        try {
            console.log('[SCU+ ICS] exportScheduleIcs start');
            console.log('[SCU+ ICS] window.location.href:', window.location.href);
            console.log('[SCU+ ICS] is top:', window === top);
            const currentWeek = parseCurrentWeek();
            console.log('[SCU+ ICS] currentWeek:', currentWeek);
            if (!currentWeek) {
                message.info('无法获取当前周数，请确认页面已加载学期信息');
                return;
            }
            const res = await fetch('http://zhjw.scu.edu.cn/student/courseSelect/thisSemesterCurriculum/ajaxStudentSchedule/callback');
            console.log('[SCU+ ICS] fetch status:', res.status);
            const text = await res.text();
            console.log('[SCU+ ICS] response text length:', text.length, 'first 200 chars:', text.substring(0, 200));
            const rawData = JSON.parse(text);
            console.log('[SCU+ ICS] parsed OK, xkxx keys count:', Object.keys(rawData.xkxx[0]).length);
            const firstMonday = calcFirstMonday(currentWeek);
            console.log('[SCU+ ICS] firstMonday:', firstMonday.toISOString());
            const icsContent = generateIcs(rawData, firstMonday);
            console.log('[SCU+ ICS] icsContent length:', icsContent.length, 'first 500 chars:', icsContent.substring(0, 500));
            downloadIcsFile(icsContent);
            message.info('课表 ICS 已下载');
        } catch (e) {
            console.error('[SCU+ ICS] error:', e);
            message.info('导出 ICS 失败: ' + e);
        }
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
        let jsonBtn = document.createElement("button");
        jsonBtn.setAttribute('class', 'btn btn-success btn-xs btn-round');
        jsonBtn.innerHTML = `<i class="fa fa-copy bigger-120"></i>导出JSON\u{1f3af}`;
        e.appendChild(jsonBtn);
        jsonBtn.addEventListener('click', exportScheduleJson);
        let icsBtn = document.createElement("button");
        icsBtn.setAttribute('class', 'btn btn-warning btn-xs btn-round');
        icsBtn.innerHTML = `<i class="fa fa-calendar bigger-120"></i>导出ICS\u{1f3af}`;
        e.appendChild(icsBtn);
        icsBtn.addEventListener('click', exportScheduleIcs);
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
        let jsonBtn = document.createElement("button");
        jsonBtn.setAttribute('class', 'btn btn-success btn-xs btn-round');
        jsonBtn.innerHTML = `<i class="fa fa-copy bigger-120"></i>导出JSON\u{1f3af}`;
        e.appendChild(jsonBtn);
        jsonBtn.addEventListener('click', exportScheduleJson);
        let icsBtn = document.createElement("button");
        icsBtn.setAttribute('class', 'btn btn-warning btn-xs btn-round');
        icsBtn.innerHTML = `<i class="fa fa-calendar bigger-120"></i>导出ICS\u{1f3af}`;
        e.appendChild(icsBtn);
        icsBtn.addEventListener('click', exportScheduleIcs);
    })
}

export function initCourseTable(): void {
    inject();
    injectExportFunc();
    hideKbtAndObserve();
}
