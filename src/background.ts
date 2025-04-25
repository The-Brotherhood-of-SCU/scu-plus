export { }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == "request") {
        // 抽象写法，主要是chrome的api设计太狗屎了
        (async () => {
            try {
                const response = await fetch(message.url,{redirect:"follow",headers:{
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
    else if(message.action=='updateAvatar'){
        updateAvatarRedirectRules(message.url)
        return false;
    }
    else if(message.action=='removeAvatarRedirection'){
        removeAvatarRedirectRules()
        return false;
    }else if(message.action=='open-settings'){
        chrome.tabs.create({ url: `chrome-extension://${chrome.runtime.id}/tabs/setting.html` });
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
            urlFilter: 'http://zhjw.scu.edu.cn/main/queryStudent/img',
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
            urlFilter: 'http://zhjw.scu.edu.cn/img/head/man.png',
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
            urlFilter: 'http://zhjw.scu.edu.cn/img/head/woman.png',
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
            urlFilter: 'http://zhjw.scu.edu.cn/student/rollInfo/img',
            resourceTypes: ['image']
        }
    }
];
    // 更新规则
    (chrome.declarativeNetRequest as any).updateDynamicRules({
        removeRuleIds: [1,2,3,4],
        addRules: newRules as any
    });
}

function removeAvatarRedirectRules(){
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1,2,3,4],
    });
}
