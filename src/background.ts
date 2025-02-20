export {}

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    if(message.action=="request"){
        request(message.url,sendResponse);
    }
})

const request = async(url:string,sendResponse:(response?: any) => void)=>{
    try{
        let response = await fetch(url);
        if(response.status == 200){
            sendResponse(await response.text());
        }
    }
    catch(e){
        sendResponse(null);
    }
}