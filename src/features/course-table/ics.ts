import { message } from "~script/notice";

// ── 节次-时间映射 ──────────────────────────────────────────────

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

// ── 课表 API 与 planCode 解析 ───────────────────────────────────

export const COURSE_SCHEDULE_API = 'http://zhjw.scu.edu.cn/student/courseSelect/thisSemesterCurriculum/ajaxStudentSchedule/callback';

export function parsePlanCode(): { planCode: string | null; isCurrentSemester: boolean } {
    if (!window.location.href.includes('calendarSemesterCurriculum')) {
        return { planCode: null, isCurrentSemester: true };
    }
    const select = document.querySelector('#planCode') as HTMLSelectElement | null;
    if (!select) return { planCode: null, isCurrentSemester: true };
    const selectedOption = select.selectedOptions[0];
    const planCode = select.value;
    const isCurrentSemester = selectedOption?.textContent?.includes('当前') ?? false;
    return { planCode, isCurrentSemester };
}

// ── 周数 / 日期推算 ─────────────────────────────────────────────

function parseCurrentWeek(): number | null {
    let spans: NodeListOf<Element> | null = null;
    try { spans = top?.document?.querySelectorAll('.span_bbzx'); } catch (e) { }
    if (!spans?.length) try { spans = parent?.document?.querySelectorAll('.span_bbzx'); } catch (e) { }
    if (!spans?.length) spans = document.querySelectorAll('.span_bbzx');
    if (!spans?.length) return null;
    for (const span of spans) {
        const text = span.textContent || '';
        const match = text.match(/第(\d+)周/);
        if (match) return parseInt(match[1], 10);
    }
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

function getDefaultFirstMonday(planCode: string): Date | null {
    const parts = planCode.split('-');
    if (parts.length < 3) return null;
    const startYear = parseInt(parts[0], 10);
    const endYear = parseInt(parts[1], 10);
    if (parts[2] === '1') {
        // 秋季：xxxx 年 9 月第一个周一
        const d = new Date(startYear, 8, 1);
        const offset = (8 - d.getDay()) % 7;
        d.setDate(1 + offset);
        d.setHours(0, 0, 0, 0);
        return d;
    } else if (parts[2] === '2') {
        // 春季：yyyy 年 2 月最后一个周一
        const d = new Date(endYear, 2, 0); // 2 月最后一天
        while (d.getDay() !== 1) {
            d.setDate(d.getDate() - 1);
        }
        d.setHours(0, 0, 0, 0);
        return d;
    }
    return null;
}

// ── ICS 文本工具 ────────────────────────────────────────────────

function escapeIcsText(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r/g, '').replace(/\n/g, '\\n');
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

// DTSTAMP 等需要 UTC 时间戳（带 Z 后缀）的场景使用
function formatIcsDateUtc(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function formatFilenameDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOff = Math.abs(offset);
    const offH = String(Math.floor(absOff / 60)).padStart(2, '0');
    const offM = String(absOff % 60).padStart(2, '0');
    return `${y}-${m}-${d}-${hh}-${mm}-${ss}-${sign}${offH}${offM}`;
}

// ── ICS 生成 ────────────────────────────────────────────────────

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
    // 逐行做 ICS TEXT 转义（反斜杠/分号/逗号/真实换行），再用字面 \n 连接
    return lines.map((l) => escapeIcsText(l)).join('\\n');
}

function generateIcs(rawData: any, firstMonday: Date): string {
    const lines: string[] = [];
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//SCU Plus//CN');
    lines.push('X-WR-CALNAME:SCU Plus 课表');
    lines.push('BEGIN:VTIMEZONE');
    lines.push('TZID:Asia/Shanghai');
    lines.push('BEGIN:STANDARD');
    lines.push('DTSTART:19700101T000000');
    lines.push('TZOFFSETFROM:+0800');
    lines.push('TZOFFSETTO:+0800');
    lines.push('TZNAME:CST');
    lines.push('END:STANDARD');
    lines.push('END:VTIMEZONE');

    const coursesIndex = rawData.xkxx?.[0];
    if (!coursesIndex) {
        throw new Error('课表数据为空');
    }
    const dtstamp = formatIcsDateUtc(new Date());
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
            if (!startTime || !endTime) continue;

            const weeks: number[] = [];
            for (let i = 0; i < classWeek.length; i++) {
                if (classWeek[i] === '1') weeks.push(i + 1);
            }

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
                lines.push(`UID:${key}-${ti}-${week}@scu.edu.cn`);
                lines.push(`DTSTAMP:${dtstamp}`);
                lines.push(`SUMMARY:${summary}`);
                lines.push(`LOCATION:${location}`);
                lines.push(`DESCRIPTION:${description}`);
                lines.push(`DTSTART;TZID=Asia/Shanghai:${formatIcsDate(dtStart)}`);
                lines.push(`DTEND;TZID=Asia/Shanghai:${formatIcsDate(dtEnd)}`);
                lines.push('END:VEVENT');
            }
        }
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}

// ── 学期名称 ────────────────────────────────────────────────────

function getSemesterName(rawData: any): string {
    const coursesIndex = rawData.xkxx?.[0];
    if (!coursesIndex) return '课表';
    for (const key of Object.keys(coursesIndex)) {
        const planNumber = coursesIndex[key]?.id?.executiveEducationPlanNumber;
        if (planNumber) {
            const parts = planNumber.split('-');
            if (parts.length >= 3) {
                const year = `${parts[0]}-${parts[1]}`;
                const season = parts[2] === '2' ? '春' : '秋';
                return `${year}${season}`;
            }
        }
    }
    return '课表';
}

// ── 弹窗：非当前学期选择第一周周一 ──────────────────────────────

function showFirstMondayModal(currentFirstMonday: Date, prefillDate: Date | null): Promise<Date | null> {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
        const cy = currentFirstMonday.getFullYear();
        const cm = String(currentFirstMonday.getMonth() + 1).padStart(2, '0');
        const cd = String(currentFirstMonday.getDate()).padStart(2, '0');
        const currentDateStr = `${cy}-${cm}-${cd}`;
        const prefill = prefillDate || currentFirstMonday;
        const py = prefill.getFullYear();
        const pm = String(prefill.getMonth() + 1).padStart(2, '0');
        const pd = String(prefill.getDate()).padStart(2, '0');
        const prefillDateStr = `${py}-${pm}-${pd}`;
        overlay.innerHTML = `
            <div style="background:#fff;border-radius:8px;padding:24px;min-width:380px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                <h5 style="margin:0 0 16px;font-size:16px;">非当前学期，请选择第一周周一日期</h5>
                <div style="margin-bottom:12px;">
                    <label style="display:flex;align-items:center;cursor:pointer;padding:8px 0;">
                        <input type="radio" name="firstMonday" value="manual" checked style="margin-right:8px;">
                        手动选择第一周周一
                    </label>
                    <input type="date" id="scu-plus-manual-date" value="${prefillDateStr}" style="margin-left:24px;margin-top:4px;margin-bottom:4px;padding:4px 8px;border:1px solid #ccc;border-radius:4px;">
                    <label style="display:flex;align-items:center;cursor:pointer;padding:8px 0;">
                        <input type="radio" name="firstMonday" value="default" style="margin-right:8px;">
                        使用当前学期第一周周一 (${currentDateStr})
                    </label>
                </div>
                <div style="text-align:right;margin-top:16px;">
                    <button id="scu-plus-modal-cancel" style="padding:6px 16px;margin-right:8px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;">取消</button>
                    <button id="scu-plus-modal-confirm" style="padding:6px 16px;border:none;border-radius:4px;background:#428bca;color:#fff;cursor:pointer;">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const manualRadio = overlay.querySelector('input[value="manual"]') as HTMLInputElement;
        const defaultRadio = overlay.querySelector('input[value="default"]') as HTMLInputElement;
        const dateInput = overlay.querySelector('#scu-plus-manual-date') as HTMLInputElement;
        const confirmBtn = overlay.querySelector('#scu-plus-modal-confirm') as HTMLButtonElement;
        const cancelBtn = overlay.querySelector('#scu-plus-modal-cancel') as HTMLButtonElement;

        manualRadio.addEventListener('change', () => { dateInput.style.display = 'inline-block'; });
        defaultRadio.addEventListener('change', () => { dateInput.style.display = 'none'; });

        const cleanup = () => {
            try { document.body.removeChild(overlay); } catch (e) { }
        };

        confirmBtn.addEventListener('click', () => {
            let result: Date;
            if (defaultRadio.checked) {
                result = currentFirstMonday;
            } else {
                const val = dateInput.value;
                if (!val) {
                    message.info('请选择日期');
                    return;
                }
                result = new Date(val + 'T00:00:00');
                if (isNaN(result.getTime())) {
                    message.info('日期格式无效');
                    return;
                }
            }
            cleanup();
            resolve(result);
        });

        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(null);
            }
        });
    });
}

// ── 下载 ────────────────────────────────────────────────────────

function downloadIcsFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── 导出入口 ────────────────────────────────────────────────────

export async function exportScheduleIcs() {
    try {
        const currentWeek = parseCurrentWeek();
        if (!currentWeek) {
            message.info('无法获取当前周数，请确认页面已加载学期信息');
            return;
        }

        const { planCode, isCurrentSemester } = parsePlanCode();

        let res: Response;
        if (planCode) {
            res = await fetch(COURSE_SCHEDULE_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ planCode }).toString()
            });
        } else {
            res = await fetch(COURSE_SCHEDULE_API);
        }

        const text = await res.text();
        const rawData = JSON.parse(text);

        let firstMonday: Date;
        if (!isCurrentSemester) {
            const currentFirstMonday = calcFirstMonday(currentWeek);
            const prefillDate = planCode ? getDefaultFirstMonday(planCode) : null;
            const chosen = await showFirstMondayModal(currentFirstMonday, prefillDate);
            if (!chosen) return;
            firstMonday = chosen;
        } else {
            firstMonday = calcFirstMonday(currentWeek);
        }

        const semesterName = getSemesterName(rawData);
        const icsContent = generateIcs(rawData, firstMonday);

        let filename: string;
        if (isCurrentSemester) {
            filename = `${semesterName}课表-${formatFilenameDate(new Date())}.ics`;
        } else {
            const year = firstMonday.getFullYear();
            const month = String(firstMonday.getMonth() + 1).padStart(2, '0');
            const day = String(firstMonday.getDate()).padStart(2, '0');
            filename = `${semesterName}课表-${year}-${month}-${day}.ics`;
        }
        downloadIcsFile(icsContent, filename);
        message.info('课表 ICS 已下载');
    } catch (e) {
        console.error('[SCU+] export ICS failed:', e);
        message.info('导出 ICS 失败: ' + e);
    }
}
