import { initIdCaptchaOcr } from "~features/ocr/id-captcha"
import { getSetting } from "~script/config"

async function initChangePasswd() {
  // 同步记录进入统一认证时的原始 URL（document_start 时），用于判断登录来源
  // （如 flylatex 等第三方系统经 shibboleth 进入，URL 会带 redirect_uri/sp_code）
  const entryUrl = window.location.href;
  try {
    const setting = await getSetting();

    // 跳过2FA：设置 dataset 标记，由 id-scu-skip2fa.ts（MAIN world）读取
    if (setting?.skip2FASwitch) {
      document.documentElement.dataset.__scu_skip2fa = "true";
      console.log("[SCU+] 跳过2FA 已启用");
    }

    // 仅在用户开启"禁用修改密码弹窗"开关时注入拦截逻辑
    const enabled = setting && setting.passwordPopupSwitch;
    if (enabled) {
      const redirectToZhjw = 'https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index';
      let stopped = false;

      // 是否从插件的 zhjw 重定向 / popup 登录进入（这类"跳过修改密码"后应回到教务处）
      function isZhjwOrigin(): boolean {
        return /scdxplugin_jwt23/.test(entryUrl) && /target_url=index/.test(entryUrl);
      }

      // 解析第三方系统（如 flylatex shibboleth）登录页 URL 中的 redirect_uri（base64 编码）
      function getThirdPartyRedirect(): string | null {
        try {
          const hash = entryUrl.split('#')[1] || '';
          const query = hash.split('?')[1] || entryUrl.split('?')[1] || '';
          const uri = new URLSearchParams(query).get('redirect_uri');
          if (!uri) return null;
          try {
            return window.atob(decodeURIComponent(uri));
          } catch (e) {
            return decodeURIComponent(uri);
          }
        } catch (e) {
          return null;
        }
      }

      // 计算"跳过修改密码"后的跳转目标：
      // 仅插件的 zhjw 重定向（或 popup 登录）才跳回教务处；第三方系统跳回其 redirect_uri
      function computeRedirectTarget(): string {
        if (isZhjwOrigin()) return redirectToZhjw;
        const thirdParty = getThirdPartyRedirect();
        if (thirdParty) return thirdParty;
        return redirectToZhjw;
      }

      function removeAllListeners(){
        try{
          stopped = true;
          // restore history methods
          if (origPush) history.pushState = origPush;
          if (origReplace) history.replaceState = origReplace;
          window.removeEventListener('popstate', checkAndRedirect);
          window.removeEventListener('hashchange', checkAndRedirect);
          if (mo) mo.disconnect();
        }catch(e){}
      }

      function doRedirect(){
        try{
          // stop monitoring before redirecting
          removeAllListeners();
          const target = computeRedirectTarget();
          try{ window.location.replace(target); }catch(e){ window.location.href = target; }
        }catch(e){}
      }

      function checkAndRedirect(){
        if (stopped) return;
        try{
          const href = location.href || '';
          if (href.indexOf('id.scu.edu.cn') === -1) return;
          // when entering zhjw.scu.edu.cn stop monitoring
          if (href.indexOf('zhjw.scu.edu.cn') !== -1){ removeAllListeners(); return; }
          if (/modifyPassword/.test(href) && /needModifyPasswordOfPwdExpire/.test(href)){
            doRedirect();
          }
        }catch(e){}
      }

      // SPA navigation listeners
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function(){
        const res = origPush.apply(this, arguments);
        try{ setTimeout(checkAndRedirect, 50); }catch(e){}
        return res;
      };
      history.replaceState = function(){
        const res = origReplace.apply(this, arguments);
        try{ setTimeout(checkAndRedirect, 50); }catch(e){}
        return res;
      };
      window.addEventListener('popstate', checkAndRedirect);
      window.addEventListener('hashchange', checkAndRedirect);

      // mutation observer fallback
      let mo: MutationObserver | null = null;
      try{
        mo = new MutationObserver(checkAndRedirect);
        mo.observe(document, {subtree:true, childList:true});
      }catch(e){}

      // initial（必须在 origPush/origReplace/mo 声明之后调用，
      // 否则命中跳转时 removeAllListeners 会触发 TDZ ReferenceError）
      checkAndRedirect();
    }
  } catch (e) {
    console.warn('id-scu init failed', e);
  }

  initIdCaptchaOcr().catch((e) => console.warn('id-scu captcha ocr init failed', e));
}

export { initChangePasswd };
