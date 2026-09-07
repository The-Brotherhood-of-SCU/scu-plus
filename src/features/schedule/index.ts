import { Actions } from "../../constants/actions"

export async function injectSchoolSchedule(): Promise<void> {
  // 校历只注入顶部导航栏，子 iframe 中没有注入点，直接跳过（也避免每个 frame 重复请求）
  if (window.top !== window.self) return;

  let scheduleHtml: any;
  try {
    scheduleHtml = await chrome.runtime.sendMessage({
      action: Actions.REQUEST,
      url: "https://jwc.scu.edu.cn/cdxl.htm"
    });
  } catch (e) {
    // 扩展上下文失效（如插件更新后旧页面未刷新）等情况，静默放弃
    console.warn("SCU+: 获取校历失败", e);
    return;
  }

  if (!scheduleHtml?.success) return;

  const _text = scheduleHtml.data as string;
  const listStart = _text.indexOf("<div class=\"list\">");
  // 页面结构变化时找不到目标节点，静默放弃而不是截取错误片段
  if (listStart === -1) return;
  const listEnd = _text.indexOf("</div>", listStart);
  if (listEnd === -1) return;
  const listDivText = _text.substring(listStart, listEnd + "</div>".length);

  const listDiv = document.createElement("div");
  listDiv.innerHTML = listDivText;

  const scheduleList: { name: string; link: string }[] = [];
  const lis = listDiv.querySelectorAll("li");

  for (const li of lis) {
    const a = li.querySelector("a");
    const href = a?.getAttribute("href");
    if (a && href) {
      scheduleList.push({
        name: a.innerText,
        // href 可能是绝对地址或相对路径，用 URL 正确拼接
        link: new URL(href, "https://jwc.scu.edu.cn/").href
      });
    }
  }

  // 远程页面抓来的 name/link 不可信，全部用 DOM API / textContent 构造，避免 HTML 注入
  const dropdown = document.createElement("li");
  dropdown.className = "dropdown";
  dropdown.innerHTML = `
    <a href="#" class="dropdown-toggle" data-toggle="dropdown">
      <i class="icon-calendar"></i>
      <span>校历查看<span style="color:var(--scu-accent,#9e1b32)">✦</span></span>
    </a>
  `;
  const menu = document.createElement("ul");
  menu.className = "dropdown-menu";
  menu.style.cssText = "min-width:200px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);";
  for (const schedule of scheduleList) {
    const url = new URL(schedule.link);
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = url.href;
    a.target = "_blank";
    a.style.color = "var(--scu-ink-soft,#333)";
    a.style.padding = "8px 20px";
    a.textContent = schedule.name;
    li.appendChild(a);
    menu.appendChild(li);
  }
  dropdown.appendChild(menu);

  const injectPosition = document.querySelector("#navbar-container > div.navbar-buttons.navbar-header.pull-right > ul > li.green.cdsj");
  if (injectPosition) {
    injectPosition.replaceWith(dropdown);
  }
}
