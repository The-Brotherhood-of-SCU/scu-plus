import pkgMessage from '../../package.json';
export{checkVersion,$,$all,dailySentence}

const checkVersion = async () => {
    const newest_config = await fetch("https://raw.githubusercontent.com/jeanhua/scu-plus/refs/heads/main/package.json");
    const json = await newest_config.json();
    if (pkgMessage.version != json.version) {
        let confrim = window.confirm("🎯SCU+有新版更新!，是否跳转github？");
        if (confrim) {
            window.open("https://github.com/jeanhua/scu-plus");
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
    const response = await chrome.runtime.sendMessage({action:"request",url:"http://zj.v.api.aa1.cn/api/wenan-zl/?type=json"});
    console.log(response);
    if(response.success){
        return JSON.parse(response.data)['msg'];
    }
    return null;
}
