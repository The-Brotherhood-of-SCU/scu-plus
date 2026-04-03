import { sleep, xpath_query } from "~script/utils";

async function closeAd(){
    while(true){
        const ads = document.querySelectorAll('.advert');
        if(ads.length > 0){
            ads.forEach(e => {
                e.remove();
                console.log("成功关闭一个广告")
            });
        }
        console.log("广告检测中……");
        await sleep(1000)
    }
}

export function initMarketEnhance(): void {
    xpath_query('/html/body/uni-app/uni-page/uni-page-wrapper/uni-page-body/uni-view/uni-view[4]', (e) => {
        (e as HTMLElement).style.display = 'none';
        console.log("遮罩关闭成功")
    })
    xpath_query('/html/body', (e) => {
        (e as HTMLElement).style.justifyItems = 'center';
    })
    xpath_query('/html/body/uni-app', (e) => {
        (e as HTMLElement).style.width = '600px';
        console.log('窗口大小调整完成')
    })
    xpath_query('/html/body/uni-app', (e) => {
        const scuPlusWarm = document.createElement('div');
        scuPlusWarm.innerHTML = `SCU PLUS`
        scuPlusWarm.style.fontSize = '2rem'
        e.parentNode?.insertBefore(scuPlusWarm, e);
    })
    closeAd();    
}
