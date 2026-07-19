import { snapdom } from '@zumer/snapdom';
import pkgMessage from '../../package.json';
import { UpdateCheckResult } from '../common/types';
import type { UpdateCheckInfo } from '../common/types';
import { Actions } from '../constants/actions';

export { $, $all, xpath_query, createSecondPageElement, downloadCanvas, sleep, randomInt, checkVersion, UpdateCheckResult }
export type { UpdateCheckInfo }

// Plasmo 构建期注入的环境变量（chrome / firefox / ...），仅补充类型声明
declare const process: { env: { PLASMO_BROWSER?: string } };

/**
 * 通过 GitHub Releases API 检查插件是否有新版本可用
 * @returns Promise<UpdateCheckInfo> 版本检查结果，有新版本时附带下载地址（gh-proxy 加速）
 */
async function checkVersion () : Promise<UpdateCheckInfo>{
    try {
        let response = await chrome.runtime.sendMessage({ action: Actions.REQUEST, url: pkgMessage.checkForUpdateLink, accept: 'application/vnd.github+json' });
        if (!response?.success) {
            return { result: UpdateCheckResult.NETWORK_ERROR };
        }
        const release = JSON.parse(response.data);
        const latestVersion = (release.tag_name ?? "").replace(/^v/i, "");
        if (!latestVersion || latestVersion === pkgMessage.version) {
            return { result: UpdateCheckResult.UP_TP_DATE };
        }
        // 从 release 附件中找对应浏览器的 zip 包，下载链接加 gh-proxy 前缀加速；找不到附件则回退到 release 页面
        const assets: { name?: string; browser_download_url?: string }[] = Array.isArray(release.assets) ? release.assets : [];
        const zipAssets = assets.filter(a => a?.browser_download_url?.endsWith(".zip"));
        const zipAsset = zipAssets.find(a => a.name?.includes(process.env.PLASMO_BROWSER)) ?? zipAssets[0];
        const downloadUrl = zipAsset
            ? pkgMessage.downloadProxyPrefix + zipAsset.browser_download_url
            : release.html_url ?? pkgMessage.download;
        return { result: UpdateCheckResult.NEW_VERSION_AVAILABLE, latestVersion, downloadUrl };
    } catch (e) {
        // GitHub API 限流/网络异常时可能返回非 JSON 内容，或消息通道被回收
        console.warn("检查更新失败:", e);
        return { result: UpdateCheckResult.NETWORK_ERROR };
    }
}

/**
 * 选择第一个匹配 CSS 选择器的元素并执行回调
 * @param selector CSS 选择器字符串
 * @param callback 对匹配元素执行的回调函数
 */
const $ = (selector: string, callback = (element: HTMLElement) => { }) => {
    let e = document.querySelector(selector);;
    if (e) {
        const he = e as HTMLElement;
        try {
            callback(he);
        } catch (e) {
            console.warn(e);
        }
    }
}

/**
 * 选择所有匹配 CSS 选择器的元素并对每个元素执行回调
 * @param selector CSS 选择器字符串
 * @param callback 对每个匹配元素执行的回调函数
 */
const $all = (selector: string, callback = (element: HTMLElement) => { }) => {
    let children = document.querySelectorAll(selector);
    if (children) {
        children.forEach((_) => {
            try {
                let hElement = _ as HTMLElement;
                callback(hElement);
            } catch (e) {
                console.warn(e);
            }
        })
    }
}

/**
 * 使用 XPath 表达式查询 DOM 元素
 * @param xpath_expression XPath 表达式
 * @param resolve 对查询结果执行的回调函数
 */
const xpath_query = (xpath_expression:string,resolve = (element:HTMLElement)=>{})=>{
    const result = document.evaluate(xpath_expression,document).iterateNext() as HTMLElement;
    if(result){
        resolve(result);
    }
}
/**
 * 在子页面的顶部创建一个div元素，并返回该元素
 * @param innerHTML 元素的innerHTML 内容 (可选)
 * @returns div元素，找不到挂载点时返回 null
 */
function createSecondPageElement(innerHTML:string=""):HTMLElement | null {

    const container = document.querySelector("#page-content-template > div > div");
    if (!container) return null;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = innerHTML;
    container.insertBefore(wrapper, container.firstChild);
    return wrapper;
}

/**
 * 下载 canvas 元素为图片
 * @param canvas 要下载的 canvas 元素
 * @param name 下载文件名
 * @param scale 图片缩放比例
 */
async function downloadCanvas(canvas:HTMLElement,name:string,scale:number) {
    const result = await snapdom(canvas, { scale: scale, embedFonts: false });
    await result.download({ format: 'png', filename: name });
}

  /**
   * 延迟指定毫秒数
   * @param ms 延迟时间（毫秒）
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成指定范围内的随机整数
   * @param min 最小值（包含）
   * @param max 最大值（包含）
   * @returns 随机整数
   */
  function randomInt(min:number,max:number){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }