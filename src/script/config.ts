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
    delete migratedConfig.scuUnifiedLoginSwitch

    const config = new SettingItem()
    for (const key of Object.keys(config) as Array<keyof SettingItem>) {
      if (key in migratedConfig) {
        (config as any)[key] = (migratedConfig as any)[key]
      }
    }
    const shouldPersist = (Object.keys(new SettingItem()) as Array<keyof SettingItem>)
      .some((key) => (config as any)[key] !== (rawConfig as any)[key])
      || "scuUnifiedLoginSwitch" in (rawConfig as any)

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
