import { Storage } from "@plasmohq/storage"
import { SettingItem } from "../common/types"

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