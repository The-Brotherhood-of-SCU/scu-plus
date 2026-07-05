import { initIdCaptchaOcr } from "~features/ocr/id-captcha"
import { getSetting } from "~script/config"

async function initChangePasswd() {
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
      const redirectTo = 'https://id.scu.edu.cn/enduser/sp/sso/scdxplugin_jwt23?enterpriseId=scdx&target_url=index';
      let stopped = false;

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
          try{ window.location.replace(redirectTo); }catch(e){ window.location.href = redirectTo; }
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

      // initial
      checkAndRedirect();

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
    }
  } catch (e) {
    console.warn('id-scu init failed', e);
  }

  initIdCaptchaOcr();
}

export { initChangePasswd };
