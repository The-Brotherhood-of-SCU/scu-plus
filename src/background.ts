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
});