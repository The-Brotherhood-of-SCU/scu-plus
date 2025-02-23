import pkgMessage from '../../package.json';
export { checkVersion, $, $all, dailySentence }

const checkVersion = async () => {
    let newest_config = await chrome.runtime.sendMessage({ action: "request", url: "https://gitee.com/jeanhua/scu-plus/raw/main/package.json" });
    if (!newest_config.success) {
        newest_config = await chrome.runtime.sendMessage({ action: "request", url: "https://raw.githubusercontent.com/jeanhua/scu-plus/refs/heads/main/package.json" });
        if (!newest_config.success) {
            alert("无法获取更新，请检查网络问题！");
            return;
        }
    }
    const json = JSON.parse(newest_config.data);
    if (pkgMessage.version != json.version && json.version != null) {
        if (window.confirm("🎯" + `SCU+有新版(${json.version})更新! 是否跳转下载?`)) {
            if (json.download != null) {
                window.open(json.download);
            } else {
                alert("未找到下载地址!");
            }
        }
    }
    else {
        alert("🎯SCU+已是最新版本!");
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
