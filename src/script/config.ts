import { Storage } from "@plasmohq/storage"
import { sanitizeSettings, SettingItem } from "../common/types"

export {
 getSetting,
 saveSetting,
 SettingItem,
}

const storage = new Storage();
let cache:SettingItem=null;
async function getSetting(): Promise<SettingItem> {
    if(cache!=null){
     return cache;
    }
    const raw = await storage.get("setting");
    let config:SettingItem;
    if(raw==null){
      config=new SettingItem();
      await storage.set("setting",config);
    }else{
      // 旧版本存储的配置可能缺少后续新增的字段，用默认值回填，
      // 避免默认 true 的开关（如 failSwitch）因缺失变成 undefined 而被静默禁用
      config=sanitizeSettings(raw);
    }
    cache=config;
    return config;
}
function saveSetting(setting: SettingItem) {
  cache=setting;
  storage.set("setting", setting)
}
// 其他 context（popup / 设置页 / 其他标签页）写入时同步刷新本 context 的缓存，
// 避免长生命周期页面二次 getSetting 时拿陈旧值整体写回、覆盖别人的修改
storage.watch({
  setting: (change) => {
    if (change?.newValue == null) return
    cache = sanitizeSettings(change.newValue)
  }
})