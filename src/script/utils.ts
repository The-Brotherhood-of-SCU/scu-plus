import pkgMessage from '../../package.json';
export { checkVersion, $, $all, dailySentence,xpath_query,UpdateCheckResult ,createSecondPageElement,downloadCanvas}

enum UpdateCheckResult{
    NEW_VERSION_AVAILABLE,
    UP_TP_DATE,
    NETWORK_ERROR,
    UNKNOWN,
    CHECKING
}

async function checkVersion () : Promise<UpdateCheckResult>{
    let newest_config = await chrome.runtime.sendMessage({ action: "request", url: "https://raw.githubusercontent.com/The-Brotherhood-of-SCU/scu-plus/refs/heads/main/package.json" });
    if (!newest_config.success) {
        // alert("无法获取更新，请检查网络问题！");
        return UpdateCheckResult.NETWORK_ERROR;
    }
    const json = JSON.parse(newest_config.data);
    if (pkgMessage.version != json.version && json.version != null) {
        // if (window.confirm("🎯" + `SCU+有新版(${json.version})更新! 是否跳转下载?`)) {
        //     if (json.download != null) {
        //         window.open(json.download);
        //     } else {
        //         alert("未找到下载地址!");
        //     }
        // }
        return UpdateCheckResult.NEW_VERSION_AVAILABLE;
    }
    else {
        // alert("🎯SCU+已是最新版本!");
        return UpdateCheckResult.UP_TP_DATE;
    }
}

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

const dailySentence = async () => {
    const response = await chrome.runtime.sendMessage({ action: "request", url: "http://zj.v.api.aa1.cn/api/wenan-zl/?type=json" });
    if (response.success) {
        return JSON.parse(response.data)['msg'];
    }
    return null;
}

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

function downloadCanvas(canvas, fileName, mimeType = 'image/png', quality) {
    try {
      const getExtension = (mime) => {
        switch (mime) {
          case 'image/jpeg': return 'jpg';
          case 'image/png': return 'png';
          case 'image/webp': return 'webp';
          default: return mime.split('/')[1]?.split('+')[0] || 'png';
        }
      };
      const ext = getExtension(mimeType);
      const name = fileName || `canvas.${ext}`;
      const dataUrl = canvas.toDataURL(mimeType, quality);
  
      const link = document.createElement('a');
      link.download = name;
      link.href = dataUrl;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Canvas下载失败:', error);
      throw new Error('无法导出Canvas数据');
    }
  }