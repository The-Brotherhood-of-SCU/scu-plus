/**
 * 根据头像设置构造教务头像重定向的目标 URL。
 * 设置页发送消息和 background 启动时对账 DNR 规则共用此逻辑。
 * 非法输入（QQ 号非数字、自定义地址非 http(s)）返回 null，由调用方决定回退行为。
 */
export function resolveAvatarRedirectUrl(avatarSource: string, avatarInfo: string): string | null {
  if (avatarSource === "qq") {
    const qq = avatarInfo.trim();
    if (!/^\d{5,11}$/.test(qq)) return null;
    return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&src_uin=www.jlwz.cn&s=0`;
  }
  try {
    const url = new URL(avatarInfo);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
