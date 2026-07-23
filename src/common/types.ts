export enum UpdateCheckResult {
  NEW_VERSION_AVAILABLE,
  UP_TO_DATE,
  NETWORK_ERROR,
  UNKNOWN,
  CHECKING
}

export interface UpdateCheckInfo {
  result: UpdateCheckResult;
  /** 最新版本号（不含 v 前缀），仅在有新版本时存在 */
  latestVersion?: string;
  /** 新版本下载地址（已加 gh-proxy 前缀），仅在有新版本且 release 包含 zip 附件时存在 */
  downloadUrl?: string;
}

export class SettingItem {
  beautifySwitch: boolean;
  beautifyColor: string;
  /** 深色模式："auto" 跟随系统 | "light" 浅色 | "dark" 深色 */
  beautifyDarkMode: string;
  avatarSwitch: boolean;
  avatarSource: string;
  avatarInfo: string;
  failSwitch: boolean;
  passwordPopupSwitch: boolean;
  nameHideSwitch: boolean;
  nameHideText: string;
  ocrSwitch: boolean;
  gpaCustomText: string;
  failedCourseCustomText: string;
  redirectLoginSwitch: boolean;
  skip2FASwitch: boolean;
  autoUpdateCheckSwitch: boolean;
  constructor() {
    this.beautifySwitch = true;
    this.beautifyColor = "#9e1b32";
    this.beautifyDarkMode = "auto";
    this.avatarSwitch = false;
    this.avatarSource = "qq";
    this.avatarInfo = "";
    this.failSwitch = true;
    this.passwordPopupSwitch = true;
    this.nameHideSwitch = false;
    this.nameHideText = "";
    this.ocrSwitch = true;
    this.gpaCustomText = "";
    this.failedCourseCustomText = "";
    this.redirectLoginSwitch = false;
    this.skip2FASwitch = false;
    this.autoUpdateCheckSwitch = true;
  }
  static equals(a: SettingItem | null | undefined, b: SettingItem | null | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    const keys = Object.keys(new SettingItem()) as Array<keyof SettingItem>;
    return keys.every(key => a[key] === b[key]);
  }
}

export interface CourseData {
  attribute: string;
  credit: number;
  score: number;
}

export interface ScoreData {
  attribute: string;
  credit: number;
  value: number;
}