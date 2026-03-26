import { snapdom } from '@zumer/snapdom';
import pkgMessage from '../../package.json';
import { UpdateCheckResult } from '../common/types';
import { Actions } from '../constants/actions';

export { $, $all, dailySentence, xpath_query, createSecondPageElement, downloadCanvas, sleep, randomInt, checkVersion, UpdateCheckResult }

/**
 * 检查插件是否有新版本可用
 * @returns Promise<UpdateCheckResult> 版本检查结果
 */
async function checkVersion () : Promise<UpdateCheckResult>{
    let newest_config = await chrome.runtime.sendMessage({ action: Actions.REQUEST, url: pkgMessage.checkForUpdatePkgLink,accept:'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' });
    if (!newest_config.success) {
        // alert("无法获取更新，请检查网络问题！");
        return UpdateCheckResult.NETWORK_ERROR;
    }
    const json = JSON.parse(newest_config.data);
    if (pkgMessage.version != json.version && json.version != null) {
        return UpdateCheckResult.NEW_VERSION_AVAILABLE;
    }
    else {
        // alert("🎯SCU+已是最新版本!");
        return UpdateCheckResult.UP_TP_DATE;
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
            console.warn(he);
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
 * 获取每日一句
 * @returns 每日一句内容，失败返回 null
 */
const dailySentence = async () => {
    const response = await chrome.runtime.sendMessage({ action: Actions.REQUEST, url: pkgMessage.dailySentence.link });
    if (response.success) {
        return pkgMessage.dailySentence.keys.reduce((obj:any,key)=>obj?.[key],JSON.parse(response.data));
    }
    return null;
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
 * @returns div元素
 */
function createSecondPageElement(innerHTML:string=""):HTMLElement{
    
    const container = document.querySelector("#page-content-template > div > div");
    if (!container) return;
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
    return Math.floor(Math.random() * 100 % (max +1 - min)) + min;
  }