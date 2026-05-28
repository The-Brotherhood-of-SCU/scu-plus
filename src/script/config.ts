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
    const rawConfig = await storage.get("setting") as Partial<SettingItem> & {
      scuUnifiedLoginSwitch?: boolean
    }

    if(rawConfig==null){
      const config = new SettingItem();
      storage.set("setting",config);
      cache=config;
      return config;
    }

    const migratedConfig: any = { ...rawConfig }
    if (
      typeof migratedConfig.skip2faSwitch !== "boolean" &&
      typeof migratedConfig.scuUnifiedLoginSwitch === "boolean"
    ) {
      migratedConfig.skip2faSwitch = migratedConfig.scuUnifiedLoginSwitch
    }

    const config = Object.assign(new SettingItem(), migratedConfig)
    const shouldPersist = (Object.keys(new SettingItem()) as Array<keyof SettingItem>)
      .some((key) => (config as any)[key] !== (rawConfig as any)[key])
      || "scuUnifiedLoginSwitch" in migratedConfig

    if (shouldPersist) {
      storage.set("setting", config)
    }

    cache=config;
    return config;
}
function saveSetting(setting: SettingItem) {
  cache=setting;
  storage.set("setting", setting)
}
