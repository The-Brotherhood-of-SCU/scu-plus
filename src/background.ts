export { checkVersion}

import pkgMessage from '../package.json';
const checkVersion = async () => {
    const newest_config = await fetch("https://raw.githubusercontent.com/jeanhua/scu-plus/refs/heads/main/package.json");
    const json = await newest_config.json();
    if (pkgMessage.version != json.version) {
        alert("🎯SCU+有新版更新!");
    }
    else {
        alert("🎯SCU+已是最新版本!");
    }
}
