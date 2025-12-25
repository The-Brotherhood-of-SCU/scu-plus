import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "*://zhjw.scu.edu.cn/student/courseSelect/*Course/index?*",
  ],
  all_frames: true
}

;(function () {
  if ((window as any).scuCourseFilterLoaded) return
  ;(window as any).scuCourseFilterLoaded = true

  const CAMPUS_LIST = ["江安", "望江", "华西", "其他"]
  const gridDays = ['一', '二', '三', '四', '五', '六', '七']
  const gridSections = [
    { label: '1-2', start: 1, end: 2 },
    { label: '3-4', start: 3, end: 4 },
    { label: '5-6', start: 5, end: 6 },
    { label: '5-7', start: 5, end: 7 },
    { label: '8-9', start: 8, end: 9 },
    { label: '10-11', start: 10, end: 11 },
    { label: '10-12', start: 10, end: 12 }
  ]

  let selectedTimeGrid = Array(7).fill(null).map(() => Array(gridSections.length).fill(false))
  let campusFilterValue = ''
  let teacherWhiteList: string[] = []
  let teacherBlackList: string[] = []
  let allTeachersSet = new Set<string>()
  let restrictionFilterValue = ''
  let allRestrictionsSet = new Set<string>()
  let restrictionFilters: string[] = []
  let useFilter = false

  function groupRowsByCheckbox() {
    const tbody = document.getElementById('xirxkxkbody') || document.querySelector('tbody')
    const groups: Record<string, HTMLTableRowElement[]> = {}
    if (!tbody) return groups
    let currentId: string | null = null
    let currentRows: HTMLTableRowElement[] = []
    Array.from(tbody.children).forEach((tr) => {
      const row = tr as HTMLTableRowElement
      const checkbox = row.querySelector('input[type="checkbox"][name="kcId"]') as HTMLInputElement
      if (checkbox) {
        if (currentId && currentRows.length) groups[currentId] = currentRows
        currentId = checkbox.id
        currentRows = [row]
      } else if (currentId) {
        currentRows.push(row)
      }
    })
    if (currentId && currentRows.length) groups[currentId] = currentRows
    return groups
  }

  function getCourseTimesForGroup(rows: HTMLTableRowElement[]) {
    return rows.map(row => {
      const tds = row.querySelectorAll('td')
      if (tds.length >= 2) return (tds[tds.length - 2].textContent || '').trim()
      return ''
    })
  }

  function getCourseCampusForGroup(rows: HTMLTableRowElement[]) {
    const campusSet = new Set<string>()
    rows.forEach(row => {
      const tds = row.querySelectorAll('td')
      if (tds.length > 0) {
        const locationText = (tds[tds.length - 1].textContent || '').trim()
        CAMPUS_LIST.forEach(c => { if (locationText.includes(c)) campusSet.add(c) })
      }
    })
    return Array.from(campusSet)
  }

  function getCourseTeacherForGroup(rows: HTMLTableRowElement[]) {
    const teachers: string[] = []
    rows.forEach(row => {
      const tds = row.querySelectorAll('td')
      tds.forEach(td => {
        if (td.getAttribute('onmouseenter')) teachers.push((td.textContent || '').trim())
      })
    })
    return teachers
  }

  function getAllTeachersCurrentPage() {
    allTeachersSet.clear()
    const groups = groupRowsByCheckbox()
    Object.values(groups).forEach(rows => {
      getCourseTeacherForGroup(rows).forEach(teacher => {
        teacher.split(/[\s*，,、]/).forEach(t => { if (t.trim()) allTeachersSet.add(t.trim()) })
      })
    })
  }

  function getCourseRestrictionForGroup(rows: HTMLTableRowElement[]) {
    // Try to parse checkbox JSON value first
    try {
      const firstRow = rows[0]
      const checkbox = firstRow.querySelector('input[type="checkbox"][name="kcId"]') as HTMLInputElement
      if (checkbox && checkbox.value) {
        try {
          const data = JSON.parse(checkbox.value)
          const r = (data.xkxzsm || data.xkbz || '').trim()
          if (r) return r
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    for (const row of rows) {
      const spanWithTitle = row.querySelector('span[title]') as HTMLElement | null
      if (spanWithTitle) {
        const t = (spanWithTitle.getAttribute('title') || '').trim()
        if (t) return t
      }
    }
    return ''
  }

  function getAllRestrictionsCurrentPage() {
    allRestrictionsSet.clear()
    const groups = groupRowsByCheckbox()
    Object.values(groups).forEach(rows => {
      const r = getCourseRestrictionForGroup(rows)
      if (!r) {
        // represent empty restriction with special marker '；'
        allRestrictionsSet.add('；')
      } else {
        // If the restriction contains newline characters, keep it as a single item
        if (/[\n\r]/.test(r)) {
          allRestrictionsSet.add(r.trim())
        } else {
          // split by common single-line separators to collect tokens
          const parts = r.split(/[；;、,]+/).map(s => s.trim()).filter(Boolean)
          if (parts.length === 0) allRestrictionsSet.add('；')
          parts.forEach(p => allRestrictionsSet.add(p))
        }
        }
    })
  }

  function normalizeRestrictionText(s: string) {
    if (!s) return ''
    // replace fullwidth semicolon with normal, collapse whitespace/newlines to single space
    return s.replace(/；/g, ';').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
  }

  // Simplify for fuzzy comparison: remove punctuation and spaces, keep letters/numbers/Chinese
  function simplifyForCompare(s: string) {
    if (!s) return ''
    const norm = normalizeRestrictionText(s).toLowerCase()
    // remove anything that's not alphanumeric or CJK unified ideographs
    return norm.replace(/[^0-9a-zA-Z\u4e00-\u9fff\u3400-\u4dbf]/g, '')
  }

  // bigram-based Dice coefficient for fuzzy similarity (0..1)
  function getBigrams(str: string) {
    const s = str.toLowerCase()
    const bi: string[] = []
    for (let i = 0; i < s.length - 1; i++) {
      bi.push(s.slice(i, i + 2))
    }
    return bi
  }

  function diceCoefficient(a: string, b: string) {
    if (!a || !b) return 0
    const A = getBigrams(a)
    const B = getBigrams(b)
    if (A.length === 0 && B.length === 0) return a === b ? 1 : 0
    let intersection = 0
    const freq: Record<string, number> = {}
    for (const x of A) freq[x] = (freq[x] || 0) + 1
    for (const y of B) {
      if (freq[y]) { intersection++; freq[y]-- }
    }
    return (2 * intersection) / (A.length + B.length)
  }

  function isCourseRestrictionValid(restrictionStr: string) {
    if (!restrictionFilters || restrictionFilters.length === 0) return true
    const normCourse = normalizeRestrictionText(restrictionStr || '')
    const simpCourse = simplifyForCompare(normCourse)
    for (const rf of restrictionFilters) {
      if (rf === '；' || rf === ';') {
        if (normCourse === '') return true
        continue
      }
      const normRf = normalizeRestrictionText(rf)
      // direct substring match
      if (normRf && normCourse.includes(normRf)) return true
      // fuzzy compare on simplified forms: treat near-identical (few symbols different) as match
      const simpRf = simplifyForCompare(normRf)
      if (simpRf && simpCourse) {
        const sim = diceCoefficient(simpCourse, simpRf)
        if (sim >= 0.88) return true
      }
    }
    return false
  }

  function isCourseTimeInGrid(courseTimeStr: string) {
    const anySelected = selectedTimeGrid.some(row => row.some(cell => cell))
    if (!anySelected) return true
    const regex = /(?:周|星期)([一二三四五六七日])[^\d\n\r]*(\d{1,2})[^\d\n\r]*(\d{1,2})/g
    let m: RegExpExecArray | null
    let foundAny = false
    while ((m = regex.exec(courseTimeStr)) !== null) {
      foundAny = true
      const dayIdx = gridDays.indexOf(m[1])
      if (dayIdx < 0) continue
      const sectionStart = parseInt(m[2])
      const sectionEnd = parseInt(m[3])
      // check containment: selected grid cell must fully contain the course's section range
      for (let sIdx = 0; sIdx < gridSections.length; sIdx++) {
        const sect = gridSections[sIdx]
        const contained = (sect.start <= sectionStart) && (sectionEnd <= sect.end)
        if (contained && selectedTimeGrid[dayIdx][sIdx]) return true
      }
    }
    // if no explicit match found, be permissive (do not filter out)
    if (!foundAny) return true
    return false
  }

  function isCourseCampusValid(campusArr: string[]) {
    if (!campusFilterValue) return true
    return campusArr.some(c => c.includes(campusFilterValue))
  }

  function isCourseTeacherValid(teacherArr: string[]) {
    if (teacherBlackList.length > 0) {
      if (teacherArr.some(t => teacherBlackList.some(b => t.includes(b)))) return false
    }
    if (teacherWhiteList.length > 0) {
      return teacherArr.some(t => teacherWhiteList.some(w => t.includes(w)))
    }
    return true
  }

  function filterCoursesByAllFilters() {
    if (!useFilter) return
    const groups = groupRowsByCheckbox()
    Object.values(groups).forEach(rows => {
      const times = getCourseTimesForGroup(rows)
      const campusArr = getCourseCampusForGroup(rows)
      const teacherArr = getCourseTeacherForGroup(rows)
      const restrictionStr = getCourseRestrictionForGroup(rows)

      const allTimeFit = times.every(isCourseTimeInGrid)
      const campusFit = isCourseCampusValid(campusArr)
      const teacherFit = isCourseTeacherValid(teacherArr)
      const restrictionFit = isCourseRestrictionValid(restrictionStr)

      const allFit = allTimeFit && campusFit && teacherFit && restrictionFit
      rows.forEach(row => {
        (row as HTMLElement).style.display = allFit ? '' : 'none';
        (row as HTMLElement).style.background = allFit ? '#e3f7ff' : '';
      })
    })
  }

  // 创建简单面板（支持拖拽与折叠为悬浮球）
  function createPanel() {
    if (document.getElementById('scu-filter-panel')) return
    const panel = document.createElement('div')
    panel.id = 'scu-filter-panel'
    panel.style.cssText = 'position:fixed;right:20px;top:100px;z-index:10000;border:2px solid #1976d2;background:white;padding:0;border-radius:8px;min-width:240px;box-shadow:0 6px 18px rgba(0,0,0,0.12);'

    panel.innerHTML = `
      <div id="scu-filter-header" style="background:#1976d2;color:white;padding:8px 10px;border-radius:8px 8px 0 0;cursor:move;display:flex;justify-content:space-between;align-items:center;">
        <span id="scu-filter-title"></span>
        <button id="scu-filter-toggle" style="background:transparent;border:none;color:white;font-size:16px;cursor:pointer;">－</button>
      </div>
      <div id="scu-filter-body" style="padding:10px;">
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;">
            <button id="cf-time" style="width:100%;background:#2196F3;color:white;border:none;padding:8px;border-radius:4px;cursor:pointer;text-align:left;">时间</button>
            <button id="cf-campus" style="width:100%;background:#8bc34a;color:white;border:none;padding:8px;border-radius:4px;cursor:pointer;text-align:left;">校区</button>
            <button id="cf-restrict" style="width:100%;background:#9c27b0;color:white;border:none;padding:8px;border-radius:4px;cursor:pointer;text-align:left;">限制</button>
            <button id="cf-teacher" style="width:100%;background:#ffc107;color:#333;border:none;padding:8px;border-radius:4px;cursor:pointer;text-align:left;">老师</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="display:flex;align-items:center;gap:6px;">
              <input type="checkbox" id="cf-apply" style="width:16px;height:16px;"> 应用
            </label>
          </div>
      </div>
    `;

    document.body.appendChild(panel)

    // 悬浮球（折叠显示）
    let ball = document.getElementById('scu-filter-ball') as HTMLElement | null
    if (ball) ball.remove()
    ball = document.createElement('div')
    ball.id = 'scu-filter-ball'
    ball.style.cssText = 'position:fixed;right:30px;bottom:30px;width:56px;height:56px;background:#1976d2;border-radius:50%;display:none;align-items:center;justify-content:center;z-index:10001;box-shadow:0 6px 18px rgba(0,0,0,0.15);cursor:pointer;color:white;font-size:28px;'
    // 使用 Unicode 转义设置 emoji，避免编码导致的乱码
    ball.textContent = '\u{1F3AF}'
    document.body.appendChild(ball)

    // 事件绑定
    document.getElementById('cf-time')!.addEventListener('click', showTimeGridModal)
    document.getElementById('cf-campus')!.addEventListener('click', showCampusFilterModal)
    document.getElementById('cf-restrict')!.addEventListener('click', showRestrictionFilterModal)
    document.getElementById('cf-teacher')!.addEventListener('click', showTeacherFilterModal)
    const applyCheckbox = document.getElementById('cf-apply') as HTMLInputElement
    applyCheckbox.addEventListener('change', function (this: HTMLInputElement) {
      useFilter = this.checked
      if (useFilter) filterCoursesByAllFilters()
      else {
        const groups = groupRowsByCheckbox()
        Object.values(groups).forEach(rows => rows.forEach(r => { (r as HTMLElement).style.display = ''; (r as HTMLElement).style.background = '' }))
      }
    })

    // 折叠为球
    const toggleBtn = document.getElementById('scu-filter-toggle') as HTMLElement
    const body = document.getElementById('scu-filter-body') as HTMLElement
    let collapsed = false
    toggleBtn.addEventListener('click', () => {
      if (!collapsed) {
        panel.style.display = 'none'
        ball!.style.display = 'flex'
      }
      collapsed = true
    })
    ball.addEventListener('click', () => {
      panel.style.display = 'block'
      ball!.style.display = 'none'
      collapsed = false
    })

    // 程序化设置标题文本，使用 Unicode 转义确保不被构建过程破坏
    const titleEl = document.getElementById('scu-filter-title') as HTMLElement | null
    if (titleEl) titleEl.textContent = '\u{1F3AF} 选课筛选'

    // 拖拽功能
    const header = document.getElementById('scu-filter-header') as HTMLElement
    let dragging = false
    let offset = { x: 0, y: 0 }
    header.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).id === 'scu-filter-toggle') return
      dragging = true
      const rect = panel.getBoundingClientRect()
      offset.x = e.clientX - rect.left
      offset.y = e.clientY - rect.top
      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', stopDrag)
      panel.style.userSelect = 'none'
    })

    function onDrag(e: MouseEvent) {
      if (!dragging) return
      panel.style.left = (e.clientX - offset.x) + 'px'
      panel.style.top = (e.clientY - offset.y) + 'px'
      panel.style.right = 'auto'
    }
    function stopDrag() {
      dragging = false
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
      panel.style.userSelect = ''
    }
  }

  function showTimeGridModal() {
    let modal = document.getElementById('cf-time-modal')
    if (modal) modal.remove()
    modal = document.createElement('div')
    modal.id = 'cf-time-modal'
    modal.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20000;background:white;padding:14px;border-radius:8px;border:1px solid #ddd;'
    const gridDaysHeader = gridDays.map(d => `<th>周${d}</th>`).join('')
    const rowsHtml = gridSections.map((sec, sIdx) => `
      <tr>
        <td>${sec.label}</td>
        ${gridDays.map((_, dIdx) => `<td class="cf-cell" data-day="${dIdx}" data-sec="${sIdx}" style="min-width:34px;cursor:pointer;background:${selectedTimeGrid[dIdx][sIdx] ? '#4caf50' : '#f0f0f0'}">${selectedTimeGrid[dIdx][sIdx] ? '✔️' : ''}</td>`).join('')}
      </tr>`).join('')

    modal.innerHTML = `
      <div style="font-weight:bold;margin-bottom:8px;">选择时间格子（点击）</div>
      <table border="1" cellpadding="6" style="border-collapse:collapse;">
        <thead><tr><th>节/周</th>${gridDaysHeader}</tr></thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div style="text-align:right;margin-top:8px;"><button id="cf-time-ok" style="background:#1976d2;color:white;border:none;padding:6px 12px;border-radius:4px;">确定</button> <button id="cf-time-cancel" style="background:#ccc;color:#000;border:none;padding:6px 12px;border-radius:4px;margin-left:6px;">关闭</button></div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('.cf-cell').forEach(c => {
      c.addEventListener('click', function () {
        const day = parseInt((this as HTMLElement).getAttribute('data-day')!);
        const sec = parseInt((this as HTMLElement).getAttribute('data-sec')!);
        selectedTimeGrid[day][sec] = !selectedTimeGrid[day][sec];
        (this as HTMLElement).style.background = selectedTimeGrid[day][sec] ? '#4caf50' : '#f0f0f0';
        (this as HTMLElement).innerHTML = selectedTimeGrid[day][sec] ? '✔️' : '';
      });
    });
    ;(document.getElementById('cf-time-ok') as HTMLButtonElement).onclick = () => { 
      // 自动启用并应用筛选
      const apply = document.getElementById('cf-apply') as HTMLInputElement
      if (apply) { apply.checked = true; useFilter = true }
      filterCoursesByAllFilters(); modal!.remove() }
    ;(document.getElementById('cf-time-cancel') as HTMLButtonElement).onclick = () => modal!.remove()
  }

  function showCampusFilterModal() {
    let modal = document.getElementById('cf-campus-modal')
    if (modal) modal.remove()
    modal = document.createElement('div')
    modal.id = 'cf-campus-modal'
    modal.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20000;background:white;padding:12px;border-radius:8px;border:1px solid #ddd;min-width:220px;'
    modal.innerHTML = `
      <div style="font-weight:bold;margin-bottom:8px;">校区筛选</div>
      <select id="cf-campus-select" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;">${['<option value="">全部校区</option>'].concat(CAMPUS_LIST.map(c=>`<option value="${c}" ${campusFilterValue===c?'selected':''}>${c}</option>`)).join('')}</select>
      <div style="text-align:right;margin-top:8px;"><button id="cf-campus-ok" style="background:#1976d2;color:white;border:none;padding:6px 12px;border-radius:4px;">确定</button> <button id="cf-campus-cancel" style="background:#ccc;color:#000;border:none;padding:6px 12px;border-radius:4px;margin-left:6px;">取消</button></div>
    `
    document.body.appendChild(modal)
    ;(document.getElementById('cf-campus-ok') as HTMLButtonElement).onclick = () => {
      const sel = (document.getElementById('cf-campus-select') as HTMLSelectElement)
      campusFilterValue = sel.value
      // 自动启用并应用筛选
      const apply = document.getElementById('cf-apply') as HTMLInputElement
      if (apply) { apply.checked = true; useFilter = true }
      filterCoursesByAllFilters()
      modal!.remove()
    }
    ;(document.getElementById('cf-campus-cancel') as HTMLButtonElement).onclick = () => modal!.remove()
  }

  function showTeacherFilterModal() {
    getAllTeachersCurrentPage()
    let modal = document.getElementById('cf-teacher-modal')
    if (modal) modal.remove()
    modal = document.createElement('div')
    modal.id = 'cf-teacher-modal'
    modal.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20000;background:white;padding:12px;border-radius:8px;border:1px solid #ddd;min-width:320px;max-width:90vw;width:min(720px,90vw);max-height:80vh;overflow:auto;box-sizing:border-box;'
    const teacherOptions = Array.from(allTeachersSet).map(t=>`<option value="${t}">${t}</option>`).join('')
    modal.innerHTML = `
      <div style="font-weight:bold;margin-bottom:8px;">教师筛选（黑/白名单）</div>
      <div style="margin-bottom:6px;"><label><input type="radio" name="cf-t-mode" value="white" checked> 白名单</label> <label style="margin-left:12px;"><input type="radio" name="cf-t-mode" value="black"> 黑名单</label></div>
      <div style="display:flex;gap:8px;margin-bottom:6px;"><select id="cf-teacher-select" style="flex:1;padding:6px;">${teacherOptions}</select><button id="cf-teacher-add" style="background:#1976d2;color:white;border:none;padding:6px;border-radius:4px;">添加</button></div>
      <div id="cf-teacher-list" style="background:#f9f9f9;padding:8px;border-radius:4px;min-height:40px;margin-bottom:6px;"></div>
      <div style="text-align:right;"><button id="cf-teacher-ok" style="background:#1976d2;color:white;border:none;padding:6px 12px;border-radius:4px;">确定</button> <button id="cf-teacher-cancel" style="background:#ccc;color:#000;border:none;padding:6px 12px;border-radius:4px;margin-left:6px;">取消</button></div>
    `
    document.body.appendChild(modal)
    let mode: 'white'|'black' = 'white'
    let whiteCopy = [...teacherWhiteList]
    let blackCopy = [...teacherBlackList]
    const listDiv = document.getElementById('cf-teacher-list')!
    function renderList(){
      const arr = mode==='white'?whiteCopy:blackCopy
      listDiv.innerHTML = arr.length===0?'<span style="color:#999">暂无名单</span>':arr.map((t,idx)=>`<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>${t}</span><button data-idx="${idx}" class="cf-t-rem" style="background:#f44336;color:#fff;border:none;border-radius:3px;padding:2px 8px;">移除</button></div>`).join('')
      ;(listDiv.querySelectorAll('.cf-t-rem')||[]).forEach(b=>{ b.addEventListener('click', ()=>{ const i = parseInt((b as HTMLElement).getAttribute('data-idx')!); if(mode==='white') whiteCopy.splice(i,1); else blackCopy.splice(i,1); renderList() }) })
    }
    ;(modal.querySelectorAll('input[name="cf-t-mode"]')||[]).forEach(r=> r.addEventListener('change', function(this:HTMLInputElement){ mode = this.value as any; renderList() }))
    ;(document.getElementById('cf-teacher-add') as HTMLButtonElement).onclick = ()=>{
      const sel = document.getElementById('cf-teacher-select') as HTMLSelectElement
      const v = sel.value
      if(!v) return
      if(mode==='white'){ if(!whiteCopy.includes(v)) whiteCopy.push(v) } else { if(!blackCopy.includes(v)) blackCopy.push(v) }
      renderList()
    }
    ;(document.getElementById('cf-teacher-ok') as HTMLButtonElement).onclick = ()=>{ 
      teacherWhiteList = whiteCopy; teacherBlackList = blackCopy; 
      // 自动启用并应用筛选
      const apply = document.getElementById('cf-apply') as HTMLInputElement
      if (apply) { apply.checked = true; useFilter = true }
      filterCoursesByAllFilters(); modal!.remove() }
    ;(document.getElementById('cf-teacher-cancel') as HTMLButtonElement).onclick = ()=> modal!.remove()
    renderList()
  }

  function showRestrictionFilterModal() {
    getAllRestrictionsCurrentPage()
    let modal = document.getElementById('cf-restrict-modal')
    if (modal) modal.remove()
    modal = document.createElement('div')
    modal.id = 'cf-restrict-modal'
    modal.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20000;background:white;padding:12px;border-radius:8px;border:1px solid #ddd;min-width:280px;max-width:92vw;width:min(920px,92vw);max-height:86vh;overflow:auto;box-sizing:border-box;'

    // Build a teacher-like multi-item selector: dedupe similar restrictions using fuzzy matching
    const optionsArr: string[] = []
    optionsArr.push('全部')
    const raw = Array.from(allRestrictionsSet)
      .map(r => (r || '').toString().trim())
    // normalize: treat standalone '；' as marker, otherwise remove trailing semicolons
    const normalized: string[] = raw.map(r => {
      if (r === '；' || r === ';') return '；'
      return r.replace(/[；;]+$/g, '').trim()
    }).filter(Boolean)
    // dedupe/fuzzy-merge on simplified forms
    const merged: string[] = []
    for (const r of normalized) {
      if (r === '；') { if (!merged.includes('；')) merged.push('；'); continue }
      const simpR = simplifyForCompare(r)
      let found = false
      for (const m of merged) {
        if (m === '；') continue
        const sim = diceCoefficient(simpR, simplifyForCompare(m))
        if (sim >= 0.88) { found = true; break }
      }
      if (!found) merged.push(r)
    }
    // stable sort: shorter first
    merged.sort((a,b)=>a.length - b.length)
    merged.forEach(r => optionsArr.push(r))

    modal.innerHTML = `
      <div style="font-weight:bold;margin-bottom:8px;">选课限制筛选</div>
      <div style="margin-bottom:8px;display:flex;gap:8px;align-items:flex-start;">
        <div style="flex:1;position:relative;">
          <div id="cf-restrict-select-display" data-value="全部" style="padding:6px;border:1px solid #ddd;border-radius:4px;min-height:38px;cursor:pointer;white-space:normal;word-break:break-word;overflow:hidden;">全部</div>
          
        </div>
        <button id="cf-restrict-add" style="background:#1976d2;color:white;border:none;padding:8px 10px;border-radius:4px;white-space:nowrap;">添加</button>
      </div>
      <div id="cf-restrict-list" style="background:#f9f9f9;padding:8px;border-radius:4px;min-height:40px;margin-bottom:6px;white-space:normal;word-break:break-word;overflow-wrap:break-word;max-height:40vh;overflow:auto;"></div>
      <div style="text-align:right;"><button id="cf-restrict-ok" style="background:#1976d2;color:white;border:none;padding:6px 12px;border-radius:4px;">确定</button> <button id="cf-restrict-cancel" style="background:#ccc;color:#000;border:none;padding:6px 12px;border-radius:4px;margin-left:6px;">取消</button></div>
    `
    document.body.appendChild(modal)

    // create options container on body (fixed) to avoid being clipped by modal overflow
    const optionsDiv = document.createElement('div')
    optionsDiv.id = 'cf-restrict-options'
    optionsDiv.style.cssText = 'display:none;position:fixed;left:0;top:0;width:320px;background:white;border:1px solid #ddd;border-radius:4px;max-height:60vh;overflow:auto;z-index:20001;box-shadow:0 4px 12px rgba(0,0,0,0.08);'
    document.body.appendChild(optionsDiv)

    const listDiv = document.getElementById('cf-restrict-list') as HTMLElement
    const display = document.getElementById('cf-restrict-select-display') as HTMLElement
    let localRestrictions = [...restrictionFilters]

    function renderList() {
      if (!listDiv) return
      if (localRestrictions.length === 0) {
        listDiv.innerHTML = '<span style="color:#999">暂无筛选条件</span>'
        return
      }
      listDiv.innerHTML = localRestrictions.map((t, idx) => {
        let disp = (t||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        if (disp === '；' || disp === ';') disp = '无'
        else disp = disp.replace(/[；;]+$/g, '')
        return `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;gap:8px;">
          <div style="flex:1;white-space:normal;word-break:break-word;overflow-wrap:break-word;">${disp}</div>
          <button data-idx="${idx}" class="cf-r-rem" style="background:#f44336;color:#fff;border:none;border-radius:3px;padding:2px 8px;">移除</button>
        </div>`
      }).join('')
      ;(listDiv.querySelectorAll('.cf-r-rem')||[]).forEach(b=>{ b.addEventListener('click', ()=>{ const i = parseInt((b as HTMLElement).getAttribute('data-idx')!); localRestrictions.splice(i,1); renderList(); // auto apply
        restrictionFilters = [...localRestrictions]; const apply = document.getElementById('cf-apply') as HTMLInputElement; if (apply) { apply.checked = true; useFilter = true } ; filterCoursesByAllFilters(); }) })
    }

    // populate custom options into the body-fixed container
    function populateOptions(){
      if (!optionsDiv) return
      optionsDiv.innerHTML = ''
      optionsArr.forEach(o=>{
        const item = document.createElement('div')
        item.className = 'cf-restrict-option'
        item.style.cssText = 'padding:8px;border-bottom:1px solid #f0f0f0;cursor:pointer;white-space:normal;word-break:break-word;overflow-wrap:break-word;'
        // display text: standalone semicolon -> '无', otherwise show without trailing semicolons
        let displayText = o
        if (o === '；' || o === ';') displayText = '无'
        else displayText = o.replace(/[；;]+$/g, '').trim()
        item.setAttribute('data-value', o)
        item.innerText = displayText
        item.addEventListener('click', ()=>{
          if (!display) return
          display.innerText = displayText
          display.setAttribute('data-value', o)
          optionsDiv.style.display = 'none'
        })
        optionsDiv.appendChild(item)
      })
    }

    // toggle options: compute position relative to display and show fixed container
    display.onclick = (ev)=>{
      ev.stopPropagation()
      if (!optionsDiv) return
      if (optionsDiv.style.display === 'block') { optionsDiv.style.display = 'none'; return }
      // position the optionsDiv near the display element and set maxHeight based on available space
      const rect = display.getBoundingClientRect()
      const left = Math.max(8, rect.left)
      const width = Math.min(window.innerWidth - left - 8, Math.max(rect.width, 320))
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - 20)
      const spaceAbove = Math.max(0, rect.top - 20)
      let openAbove = false
      let maxH = Math.max(120, Math.floor(window.innerHeight * 0.6))
      let top = rect.bottom + 6
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        openAbove = true
      }
      if (openAbove) {
        maxH = Math.max(120, spaceAbove)
        top = Math.max(8, rect.top - maxH - 6)
      } else {
        maxH = Math.max(120, spaceBelow)
        top = rect.bottom + 6
      }
      optionsDiv.style.left = left + 'px'
      optionsDiv.style.top = top + 'px'
      optionsDiv.style.width = width + 'px'
      optionsDiv.style.maxHeight = Math.max(120, Math.min(maxH, window.innerHeight - 40)) + 'px'
      optionsDiv.style.display = 'block'
    }

    // click outside to close the options container
    document.addEventListener('click', (ev)=>{ const t = ev.target as Node; if (!modal!.contains(t) && !optionsDiv.contains(t)) { optionsDiv.style.display = 'none' } })

    ;(document.getElementById('cf-restrict-add') as HTMLButtonElement).onclick = ()=>{
      const v = display.getAttribute('data-value') || ''
      if (!v) return
      if (v === '全部') { localRestrictions = []; restrictionFilters = []; renderList(); if (document.getElementById('cf-apply')) { (document.getElementById('cf-apply') as HTMLInputElement).checked = true; useFilter = true }; filterCoursesByAllFilters(); return }
      if (v === '；') {
        if (!localRestrictions.includes('；')) localRestrictions.push('；')
      } else {
        if (!localRestrictions.includes(v)) localRestrictions.push(v)
      }
      restrictionFilters = [...localRestrictions]
      renderList()
      // 自动启用并应用筛选
      const apply = document.getElementById('cf-apply') as HTMLInputElement
      if (apply) { apply.checked = true; useFilter = true }
      filterCoursesByAllFilters()
    }

    populateOptions()

    renderList()
    ;(document.getElementById('cf-restrict-ok') as HTMLButtonElement).onclick = () => {
      restrictionFilters = [...localRestrictions]
      // 自动启用并应用筛选
      const apply = document.getElementById('cf-apply') as HTMLInputElement
      if (apply) { apply.checked = true; useFilter = true }
      filterCoursesByAllFilters()
      if (optionsDiv && optionsDiv.parentNode) optionsDiv.remove()
      modal!.remove()
    }
    ;(document.getElementById('cf-restrict-cancel') as HTMLButtonElement).onclick = () => { if (optionsDiv && optionsDiv.parentNode) optionsDiv.remove(); modal!.remove() }
  }

  // 监听页面，若有课程表则注入面板
  function waitForTableAndInject() {
    const tbody = document.getElementById('xirxkxkbody') || document.querySelector('tbody')
    if (tbody) {
      createPanel()
    } else {
      setTimeout(waitForTableAndInject, 800)
    }
  }

  waitForTableAndInject()
})()
