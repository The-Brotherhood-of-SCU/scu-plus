export { }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == "request") {
        // 抽象写法，主要是chrome的api设计太狗屎了
        (async () => {
            try {
                const response = await fetch(message.url);
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
    }
});


async function updateAvatarRedirectRules(redirectUrl) {
    // 构建动态规则
    const newRule = {
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
    };
    // 更新规则
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: [newRule as any]
    });
}

function removeAvatarRedirectRules(){
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
    });
}