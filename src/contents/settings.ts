import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
    matches: ["http://zhjw.scu.edu.cn/*"],
    all_frames: true,
};

interface Settings {
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
}

class SettingsPanel {
    private container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'settings-container';
        this.injectStyles();
        this.render();
        this.loadSettings();
    }

    private render(): void {
        this.container.innerHTML = `
        <h2>SCU+设置面板</h2>
        <div class="setting-item">
          <label>界面美化开关</label>
          <input type="checkbox" id="beautifySwitch">
        </div>
        <div class="setting-item" id="beautifyColorOptions" style="display: none;">
          <label>选择美化颜色：</label>
          <input type="color" id="beautifyColor">
        </div>
        <div class="setting-item">
          <label>头像隐藏开关</label>
          <input type="checkbox" id="avatarSwitch">
        </div>
        <div class="setting-item" id="avatarOptions" style="display: none;">
          <label>选择头像来源：</label>
          <select id="avatarSource">
            <option value="url">URL</option>
            <option value="qq">QQ头像</option>
          </select>
          <input type="text" id="avatarInfo" placeholder="">
        </div>
        <div class="setting-item">
          <label>每日一句开关</label>
          <input type="checkbox" id="dailyQuoteSwitch">
        </div>
        <div class="setting-item">
          <label>挂科隐藏开关</label>
          <input type="checkbox" id="failSwitch">
        </div>
        <div class="setting-item">
          <label>禁止修改密码弹窗开关</label>
          <input type="checkbox" id="passwordPopupSwitch">
        </div>
        <div class="setting-item">
          <label>名字隐藏开关</label>
          <input type="checkbox" id="nameHideSwitch">
        </div>
        <div class="setting-item" id="nameHideOptions" style="display: none;">
          <label>输入隐藏名字的替代文字：</label>
          <input type="text" id="nameHideText" placeholder="请输入替代文字">
        </div>
        <div class="setting-item" id="ocrProvider" style="display: block;">
          <label>输入OCR服务提供者：</label>
          <input type="text" id="ocrProviderText" placeholder="请输入API地址">
        </div>
        <button class="save-button">保存设置</button>
      `;

        const beautifySwitch = this.container.querySelector('#beautifySwitch') as HTMLInputElement;
        const beautifyColorOptions = this.container.querySelector('#beautifyColorOptions') as HTMLDivElement;
        const avatarSwitch = this.container.querySelector('#avatarSwitch') as HTMLInputElement;
        const avatarOptions = this.container.querySelector('#avatarOptions') as HTMLDivElement;
        const saveButton = this.container.querySelector('.save-button') as HTMLButtonElement;
        const avatarSource = this.container.querySelector('#avatarSource') as HTMLSelectElement;
        const avatarInfo = this.container.querySelector("#avatarInfo") as HTMLInputElement;
        const nameHideSwitch = this.container.querySelector('#nameHideSwitch') as HTMLInputElement;
        const nameHideOptions = this.container.querySelector('#nameHideOptions') as HTMLDivElement;

        beautifySwitch.addEventListener('change', () => {
            beautifyColorOptions.style.display = beautifySwitch.checked ? 'block' : 'none';
        });

        avatarSwitch.addEventListener('change', () => {
            avatarOptions.style.display = avatarSwitch.checked ? 'block' : 'none';
        });

        avatarSource.addEventListener("change", () => {
            if (avatarSource.selectedIndex === 0) {
                avatarInfo.placeholder = "输入图片url";
            } else {
                avatarInfo.placeholder = "输入QQ号";
            }
        });

        nameHideSwitch.addEventListener('change', () => {
            nameHideOptions.style.display = nameHideSwitch.checked ? 'block' : 'none';
        });

        saveButton.addEventListener('click', () => this.saveSettings());
    }

    private loadSettings(): void {
        const savedSettings = JSON.parse(localStorage.getItem('settings') || '{}') as Partial<Settings>;
        const beautifySwitch = this.container.querySelector('#beautifySwitch') as HTMLInputElement;
        const beautifyColor = this.container.querySelector('#beautifyColor') as HTMLInputElement;
        const avatarSwitch = this.container.querySelector('#avatarSwitch') as HTMLInputElement;
        const avatarSource = this.container.querySelector('#avatarSource') as HTMLSelectElement;
        const avatarInfo = this.container.querySelector('#avatarInfo') as HTMLInputElement;
        const dailyQuoteSwitch = this.container.querySelector('#dailyQuoteSwitch') as HTMLInputElement;
        const failSwitch = this.container.querySelector('#failSwitch') as HTMLInputElement;
        const passwordPopupSwitch = this.container.querySelector('#passwordPopupSwitch') as HTMLInputElement;
        const nameHideSwitch = this.container.querySelector('#nameHideSwitch') as HTMLInputElement;
        const nameHideText = this.container.querySelector('#nameHideText') as HTMLInputElement;
        const ocrProviderText = this.container.querySelector('#ocrProviderText') as HTMLInputElement;

        beautifySwitch.checked = savedSettings.beautifySwitch || false;
        beautifyColor.value = savedSettings.beautifyColor || '#caeae3';
        avatarSwitch.checked = savedSettings.avatarSwitch || false;
        avatarSource.value = savedSettings.avatarSource || 'url';
        avatarInfo.value = savedSettings.avatarInfo || '';
        dailyQuoteSwitch.checked = savedSettings.dailyQuoteSwitch || false;
        failSwitch.checked = savedSettings.failSwitch || false;
        passwordPopupSwitch.checked = savedSettings.passwordPopupSwitch || false;
        nameHideSwitch.checked = savedSettings.nameHideSwitch || false;
        nameHideText.value = savedSettings.nameHideText || '';
        chrome.storage.local.get(["ocrProvider"], (result)=> {
          if (result.ocrProvider) {
            ocrProviderText.value = result.ocrProvider;
          }
        })

        const beautifyColorOptions = this.container.querySelector('#beautifyColorOptions') as HTMLDivElement;
        const avatarOptions = this.container.querySelector('#avatarOptions') as HTMLDivElement;
        const nameHideOptions = this.container.querySelector('#nameHideOptions') as HTMLDivElement;

        beautifyColorOptions.style.display = beautifySwitch.checked ? 'block' : 'none';
        avatarOptions.style.display = avatarSwitch.checked ? 'block' : 'none';
        nameHideOptions.style.display = nameHideSwitch.checked ? 'block' : 'none';
    }

    private saveSettings(): void {
        const beautifySwitch = this.container.querySelector('#beautifySwitch') as HTMLInputElement;
        const beautifyColor = this.container.querySelector('#beautifyColor') as HTMLInputElement;
        const avatarSwitch = this.container.querySelector('#avatarSwitch') as HTMLInputElement;
        const avatarSource = this.container.querySelector('#avatarSource') as HTMLSelectElement;
        const avatarInfo = this.container.querySelector('#avatarInfo') as HTMLInputElement;
        const dailyQuoteSwitch = this.container.querySelector('#dailyQuoteSwitch') as HTMLInputElement;
        const failSwitch = this.container.querySelector('#failSwitch') as HTMLInputElement;
        const passwordPopupSwitch = this.container.querySelector('#passwordPopupSwitch') as HTMLInputElement;
        const nameHideSwitch = this.container.querySelector('#nameHideSwitch') as HTMLInputElement;
        const nameHideText = this.container.querySelector('#nameHideText') as HTMLInputElement;
        const ocrProviderText = this.container.querySelector('#ocrProviderText') as HTMLInputElement;

        const settings: Settings = {
            beautifySwitch: beautifySwitch.checked,
            beautifyColor: beautifyColor.value,
            avatarSwitch: avatarSwitch.checked,
            avatarSource: avatarSource.value,
            avatarInfo: avatarInfo.value,
            dailyQuoteSwitch: dailyQuoteSwitch.checked,
            failSwitch: failSwitch.checked,
            passwordPopupSwitch: passwordPopupSwitch.checked,
            nameHideSwitch: nameHideSwitch.checked,
            nameHideText: nameHideText.value,
        };
        chrome.storage.local.set({
            'ocrProvider': ocrProviderText.value, 
        })

        localStorage.setItem('settings', JSON.stringify(settings));
        alert('设置已保存！');
        window.location.href = "http://zhjw.scu.edu.cn/";
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.innerHTML = `
        .settings-container {
          margin: 50px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 8px 10px rgba(0, 0, 0, 0.1);
          width: 400px;
          padding: 20px;
          box-sizing: border-box;
        }
        .settings-container h2 {
          margin-top: 0;
          text-align: center;
          color: #333;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .setting-item label {
          font-size: 14px;
          color: #555;
        }
        .setting-item input[type="checkbox"] {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid #ccc;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .setting-item input[type="checkbox"]:checked {
          background-color: #4caf50;
          border-color: #4caf50;
        }
        .setting-item input[type="text"]{
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-top: 5px;
          box-sizing: border-box;
        }
        .setting-item input[type="color"]{
          width:100%;
          border: 1px solid #ccc;
          padding: 0;
          border-radius: 4px;
          margin-top: 5px;
          box-sizing: border-box;
        }
        .save-button {
          display: block;
          width: 100%;
          padding: 10px;
          background-color: #4caf50;
          color: white;
          font-size: 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .save-button:hover {
          background-color: #45a049;
        }
      `;
        document.head.appendChild(style); // 将样式注入到页面的 <head> 中
    }

    public injectToPage(): void {
        const targetElement = document.querySelector("#main-container > div.main-content");
        if (targetElement) {
            targetElement.innerHTML = "";
            targetElement.appendChild(this.container);
        }
    }
}

window.addEventListener("load", () => {
  const url = new URL(window.location.href);
    if (url.searchParams.get("redirectTo")==="scu settings") {
        const settingsPanel = new SettingsPanel();
        settingsPanel.injectToPage();
        console.log("设置注入成功!");
    }
});
