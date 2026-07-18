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
    }else{
      // 旧版本存储的配置可能缺少后续新增的字段，用默认值回填，
      // 避免默认 true 的开关（如 failSwitch）因缺失变成 undefined 而被静默禁用
      config=Object.assign(new SettingItem(),config);
    }
    cache=config;
    return config;
}
function saveSetting(setting: SettingItem) {
  cache=setting;
  storage.set("setting", setting)
}