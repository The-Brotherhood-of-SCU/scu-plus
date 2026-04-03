import { getSetting } from "~script/config";

export async function initRedirectLogin(): Promise<void> {
    const setting = await getSetting();
    if (setting.redirectLoginSwitch) {
        window.location.href="https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index"
    }
}
