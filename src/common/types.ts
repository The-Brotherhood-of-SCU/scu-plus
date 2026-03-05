export enum UpdateCheckResult {
  NEW_VERSION_AVAILABLE,
  UP_TP_DATE,
  NETWORK_ERROR,
  UNKNOWN,
  CHECKING
}

export class SettingItem {
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
  gpaCustomText: string;
  failedCourseCustomText: string;
  redirectLoginSwitch: boolean;
  constructor() {
    this.beautifySwitch = false;
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
    this.gpaCustomText = "";
    this.failedCourseCustomText = "";
    this.redirectLoginSwitch = false;
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