import { Storage } from "@plasmohq/storage"

export {
 getSetting,
 saveSetting,
 SettingItem, 
}

const storage = new Storage();
var cache:SettingItem=null;
async function getSetting(): Promise<SettingItem> {
    if(cache!=null){
     return cache;
    }
    var config:SettingItem=await storage.get("setting");
    if(config==null){
      config=new SettingItem();
      storage.set("setting",config);
    }
    cache=config;
    return config;
}
function saveSetting(setting: SettingItem) {
  cache=setting;
  storage.set("setting", setting)
}
class SettingItem {
    beautifySwitch: boolean;
    beautifyColor: string;
    avatarSwitch: boolean;
    avatarSource: string;
    avatarInfo: string;
    dailyQuoteSwitch: boolean;
    failSwitch: boolean;
    passwordPopupSwitch: boolean;
    nameHideSwitch: boolean;
    nameHideText: string;
    ocrProvider: string;
    constructor() {
      this.beautifySwitch = true;
      this.beautifyColor = "#caeae3";
      this.avatarSwitch = false;
      this.avatarSource = "qq";
      this.avatarInfo = "";
      this.dailyQuoteSwitch = false;
      this.failSwitch = true;
      this.passwordPopupSwitch = true;
      this.nameHideSwitch = false;
      this.nameHideText = "";
      this.ocrProvider = "";
    }
  }