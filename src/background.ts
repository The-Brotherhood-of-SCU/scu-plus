export { }

import { Actions } from './constants/actions';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == Actions.REQUEST) {
        // 抽象写法，主要是chrome的api设计太狗屎了
        (async () => {
            try {
                // 加超时，避免请求挂起导致 MV3 service worker 回收后消息通道静默断开
                const response = await fetch(message.url,{redirect:"follow",signal:AbortSignal.timeout(15000),headers:{
                    "accept":message.accept?message.accept:'*/*'
                }});
                if (response.ok) {
                    const text = await response.text();
                    sendResponse({ success: true, data: text });
                } else {
                    sendResponse({ success: false, error: `HTTP Error: ${response.status}` });
                }
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }
    else if(message.action==Actions.UPDATE_AVATAR){
        updateAvatarRedirectRules(message.url).catch((e) => console.warn("更新头像重定向规则失败:", e))
        return false;
    }
    else if(message.action==Actions.REMOVE_AVATAR_REDIRECTION){
        removeAvatarRedirectRules().catch((e) => console.warn("移除头像重定向规则失败:", e))
        return false;
    }else if(message.action==Actions.OPEN_SETTINGS){
        const url = chrome.runtime.getURL("options.html");
        chrome.tabs.create({ url: url });
        return false;
    }
});


async function updateAvatarRedirectRules(redirectUrl) {
    // 构建动态规则
    const newRules = [{
        id: 1,
        priority: 1,
        action: {
            type: 'redirect',
            redirect: {
                url: redirectUrl
            }
        },
        condition: {
            urlFilter: '*://zhjw.scu.edu.cn/*main/queryStudent/img',
            resourceTypes: ['image']
        }
    },
    {
        id: 2,
        priority: 1,
        action: {
            type: 'redirect',
            redirect: {
                url: redirectUrl
            }
        },
        condition: {
            urlFilter: '*://zhjw.scu.edu.cn/*img/head/man.png',
            resourceTypes: ['image']
        }
    },
    {
        id: 3,
        priority: 1,
        action: {
            type: 'redirect',
            redirect: {
                url: redirectUrl
            }
        },
        condition: {
            urlFilter: '*://zhjw.scu.edu.cn/*img/head/woman.png',
            resourceTypes: ['image']
        }
    },
    {
        id: 4,
        priority: 1,
        action: {
            type: 'redirect',
            redirect: {
                url: redirectUrl
            }
        },
        condition: {
            urlFilter: '*://zhjw.scu.edu.cn/*student/rollInfo/img',
            resourceTypes: ['image']
        }
    },
    {
        id: 5,
        priority: 1,
        action: {
            type: 'redirect',
            redirect: {
                url: redirectUrl
            }
        },
        condition: {
            urlFilter: '*://zhjw.scu.edu.cn/img/icon/default_photo.png',
            resourceTypes: ['image']
        }
    },
];
    // 更新规则
    await (chrome.declarativeNetRequest as any).updateDynamicRules({
        removeRuleIds: [1,2,3,4,5],
        addRules: newRules as any
    });
}

function removeAvatarRedirectRules(){
    return chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1,2,3,4,5],
    });
}
