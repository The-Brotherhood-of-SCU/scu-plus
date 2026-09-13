export { }

import { Actions } from './constants/actions';
import { getSetting } from './script/config';
import { resolveAvatarRedirectUrl } from './common/avatar';

// REQUEST 代理的显式白名单（与 manifest host_permissions 的实际用途对应：
// 教务/校历请求、更新检查、QQ 头像），不依赖 manifest 的隐含约束
const PROXY_ALLOWED_HOSTS = ['scu.edu.cn', 'api.github.com', 'q1.qlogo.cn'];

function isProxyAllowedUrl(rawUrl: unknown): boolean {
    if (typeof rawUrl !== 'string') return false;
    try {
        const url = new URL(rawUrl);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
        const host = url.hostname;
        return PROXY_ALLOWED_HOSTS.some(allowed =>
            host === allowed || host.endsWith(`.${allowed}`)
        );
    } catch {
        return false;
    }
}

interface RuntimeMessage {
    action?: string;
    url?: unknown;
    accept?: unknown;
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
    switch (message?.action) {
        case Actions.REQUEST: {
            // 抽象写法，主要是chrome的api设计太狗屎了
            (async () => {
                if (!isProxyAllowedUrl(message.url)) {
                    sendResponse({ success: false, error: 'URL not allowed' });
                    return;
                }
                try {
                    // 加超时，避免请求挂起导致 MV3 service worker 回收后消息通道静默断开
                    const response = await fetch(message.url as string, {
                        redirect: "follow",
                        signal: AbortSignal.timeout(15000),
                        headers: {
                            "accept": typeof message.accept === 'string' ? message.accept : '*/*'
                        }
                    });
                    if (response.ok) {
                        const text = await response.text();
                        sendResponse({ success: true, data: text });
                    } else {
                        sendResponse({ success: false, error: `HTTP Error: ${response.status}` });
                    }
                } catch (error) {
                    sendResponse({ success: false, error: (error as Error).message });
                }
            })();
            return true;
        }
        case Actions.UPDATE_AVATAR: {
            // 头像重定向仅接受 http(s) 目标（DNR 会把教务头像请求改写到该地址）
            if (typeof message.url === 'string' && /^https?:\/\//.test(message.url)) {
                updateAvatarRedirectRules(message.url)
                    .catch((e) => console.warn("更新头像重定向规则失败:", e));
            } else {
                console.warn("SCU+: 忽略非法的头像重定向地址");
            }
            return false;
        }
        case Actions.REMOVE_AVATAR_REDIRECTION: {
            removeAvatarRedirectRules().catch((e) => console.warn("移除头像重定向规则失败:", e));
            return false;
        }
        case Actions.OPEN_SETTINGS: {
            const url = chrome.runtime.getURL("options.html");
            chrome.tabs.create({ url: url });
            return false;
        }
        default: {
            console.warn("SCU+: 收到未知消息", message);
            return false;
        }
    }
});

// DNR 动态规则持久存在，但设置随时可能被修改，或上次规则更新时 SW 被回收而失败。
// 启动 / 扩展更新时按当前设置重放一次，保证规则与设置一致。
async function syncAvatarRedirectRules(): Promise<void> {
    try {
        const setting = await getSetting();
        const url = setting.avatarSwitch
            ? resolveAvatarRedirectUrl(setting.avatarSource, setting.avatarInfo)
            : null;
        if (url) {
            await updateAvatarRedirectRules(url);
        } else {
            await removeAvatarRedirectRules();
        }
    } catch (e) {
        console.warn("SCU+: 同步头像重定向规则失败", e);
    }
}
chrome.runtime.onStartup.addListener(syncAvatarRedirectRules);
chrome.runtime.onInstalled.addListener(syncAvatarRedirectRules);

// 头像重定向的 5 个目标都是教务系统的默认头像接口，仅 urlFilter 不同
const AVATAR_RULE_IDS = [1, 2, 3, 4, 5];
const AVATAR_URL_FILTERS = [
    '*://zhjw.scu.edu.cn/*main/queryStudent/img',
    '*://zhjw.scu.edu.cn/*img/head/man.png',
    '*://zhjw.scu.edu.cn/*img/head/woman.png',
    '*://zhjw.scu.edu.cn/*student/rollInfo/img',
    '*://zhjw.scu.edu.cn/img/icon/default_photo.png',
];

async function updateAvatarRedirectRules(redirectUrl: string) {
    const addRules = AVATAR_URL_FILTERS.map((urlFilter, i) => ({
        id: AVATAR_RULE_IDS[i],
        priority: 1,
        action: {
            type: 'redirect' as const,
            redirect: { url: redirectUrl }
        },
        condition: {
            urlFilter,
            resourceTypes: ['image' as const]
        }
    }));
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: AVATAR_RULE_IDS,
        addRules
    });
}

function removeAvatarRedirectRules() {
    return chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: AVATAR_RULE_IDS,
    });
}
