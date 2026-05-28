export { }

import { Actions } from './constants/actions';
import encryptToBase6404C1C2C3 from './background/sm2-wrapper';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action == Actions.REQUEST) {
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
                    sendResponse({ success: false, error: error && error.message ? error.message : String(error) });
                }
            })();
            return true;
        }
        else if(message.action==Actions.UPDATE_AVATAR){
            updateAvatarRedirectRules(message.url)
            return false;
        }
        else if(message.action==Actions.SCU_AUTH_PREPARE){
            (async ()=>{
                try{
                    const { username, password } = message;
                    const BASE = 'https://id.scu.edu.cn';
                    const SM2_URL = BASE + '/api/public/bff/v1.2/sm2_key';
                    // headers mimic reference
                    const headers = {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json;charset=UTF-8',
                        'Origin': BASE,
                        'Referer': BASE + '/frontend/login'
                    };
                    // 1) fetch SM2 key (POST {}) with retry
                    let sm2Data = null;
                    let lastBody = null;
                    for(let attempt=0; attempt<3; attempt++){
                        const resp = await fetch(SM2_URL, { method: 'POST', headers, body: '{}' });
                        lastBody = await resp.text();
                        try{ const parsed = JSON.parse(lastBody); sm2Data = parsed && parsed.data ? parsed.data : null; }catch(e){ sm2Data = null; }
                        if(sm2Data && (sm2Data.publicKey || sm2Data.publickey) && (sm2Data.code || sm2Data.sm2_code)) break;
                        await new Promise(r=>setTimeout(r, 300));
                    }
                    if(!sm2Data){ sendResponse({ success:false, error: 'Failed to obtain SM2 key: ' + String(lastBody) }); return; }
                    const publicKey = sm2Data.publicKey || sm2Data.publickey || sm2Data.publicKeyBase64 || sm2Data.pubKey || sm2Data.pubkey;
                    const sm2Code = sm2Data.code || sm2Data.sm2_code || sm2Data.codeValue || sm2Data.code;
                    if(!publicKey || !sm2Code){ sendResponse({ success:false, error: 'SM2 key response missing fields' }); return; }
                    // encrypt password
                    const encryptedPassword = await encryptToBase6404C1C2C3(String(password||''), String(publicKey));
                    sendResponse({ success:true, encryptedPassword, sm2_code: sm2Code });
                }catch(e){ sendResponse({ success:false, error: String(e) }); }
            })();
            return true;
        }
        else if(message.action==Actions.SCU_AUTH_FINALIZE){
            (async ()=>{
                try{
                    const tokenJson = message.raw;
                    const accessToken = tokenJson && tokenJson.data ? (tokenJson.data.access_token || tokenJson.data.token || tokenJson.data.accessToken) : null;
                    if(!accessToken){
                        sendResponse({ success:false, error: 'Token missing in finalize payload' });
                        return;
                    }
                    const BASE = 'https://id.scu.edu.cn';
                    const SESSION_SAVE_URL = BASE + '/api/bff/v1.2/commons/session/save';
                    const headers = {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json;charset=UTF-8',
                        'Origin': BASE,
                        'Referer': BASE + '/frontend/login',
                        'Authorization': 'Bearer ' + accessToken
                    };
                    try{
                        await fetch(SESSION_SAVE_URL, { method: 'POST', headers, body: '{}' });
                    }catch(e){}
                    sendResponse({ success:true, data: { access_token: accessToken, raw: tokenJson } });
                }catch(e){ sendResponse({ success:false, error: String(e) }); }
            })();
            return true;
        }
        else if(message.action==Actions.REMOVE_AVATAR_REDIRECTION){
            removeAvatarRedirectRules()
            return false;
        }else if(message.action==Actions.OPEN_SETTINGS){
            const url = chrome.runtime.getURL("options.html");
            chrome.tabs.create({ url: url });
            return false;
        }
    } catch (e) {
        try { sendResponse && sendResponse({ success:false, error: e && e.message ? e.message : String(e) }); } catch(_) {}
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
    (chrome.declarativeNetRequest as any).updateDynamicRules({
        removeRuleIds: [1,2,3,4,5],
        addRules: newRules as any
    });
}

function removeAvatarRedirectRules(){
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1,2,3,4,5],
    });
}
