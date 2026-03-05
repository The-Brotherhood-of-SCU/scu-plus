export { checkVersion, $, $all, dailySentence, xpath_query as xpathQuery, createSecondPageElement, downloadCanvas, sleep, randomInt, UpdateCheckResult } from '../script/utils';

export function waitForElement(selector: string, timeout = 10000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      resolve(element);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const el = document.querySelector(selector) as HTMLElement;
      if (el || Date.now() - startTime > timeout) {
        clearInterval(interval);
        resolve(el);
      }
    }, 100);
  });
}
