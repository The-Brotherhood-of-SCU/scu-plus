import { Actions } from "../../constants/actions"

export async function injectSchoolSchedule(): Promise<void> {
  const scheduleHtml = await chrome.runtime.sendMessage({
    action: Actions.REQUEST,
    url: "https://jwc.scu.edu.cn/cdxl.htm"
  });

  if (!scheduleHtml.success) return;

  const _text = scheduleHtml.data as string;
  const listDivText = _text.substring(
    _text.indexOf("<div class=\"list\">"),
    _text.indexOf("</div>", _text.indexOf("<div class=\"list\">")) + "</div>".length
  );

  const listDiv = document.createElement("div");
  listDiv.innerHTML = listDivText;

  const scheduleList: { name: string; link: string }[] = [];
  const lis = listDiv.querySelectorAll("li");

  for (const li of lis) {
    const a = li.querySelector("a");
    if (a) {
      scheduleList.push({
        name: a.innerText,
        link: "https://jwc.scu.edu.cn/" + a.getAttribute("href")
      });
    }
  }

  let injectHtml = "";
  for (const schedule of scheduleList) {
    injectHtml += `<li><a href="${schedule.link}" target="_blank" style="color:#333;padding:8px 20px;">${schedule.name}</a></li>`;
  }

  const fullHtml = `
    <li class="dropdown">
      <a href="#" class="dropdown-toggle" data-toggle="dropdown">
        <i class="icon-calendar"></i>
        <span>校历查看\u{1f3af}</span>
      </a>
      <ul class="dropdown-menu" style="min-width:200px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        ${injectHtml}
      </ul>
    </li>
  `;

  const injectPosition = document.querySelector("#navbar-container > div.navbar-buttons.navbar-header.pull-right > ul > li.green.cdsj");
  if (injectPosition) {
    injectPosition.outerHTML = fullHtml;
  }
}
