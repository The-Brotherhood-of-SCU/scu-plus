import type { PlasmoCSConfig } from "plasmo"
import { initHomePage } from "~features/homepage"
import { initCourseFilter } from "~features/course-filter"
import { initScoreAnalysis } from "~features/score-analysis"
import { initCourseTable } from "~features/course-table"
import { initCourseEvaluation } from "~features/course-evaluation"
import { initCourseScore } from "~features/course-score"
import { initScoresPerSemester } from "~features/scores-per-semester"
import { initEnhanceQuitCourse } from "~features/enhance-quit-course"
import { initGetHiddenScore } from "~features/get-hidden-score"

export const config: PlasmoCSConfig = {
  matches: [
    "*://zhjw.scu.edu.cn/*",
  ],
  all_frames: true
}

// 让每个特性独立初始化，单个特性异常不影响其他特性注入
const safeInit = (name: string, init: () => void | Promise<void>) => {
  try {
    const result = init();
    if (result instanceof Promise) {
      result.catch((e) => console.warn(`SCU+ 特性 [${name}] 初始化失败:`, e));
    }
  } catch (e) {
    console.warn(`SCU+ 特性 [${name}] 初始化失败:`, e);
  }
}

const main = async () => {
  const url = window.location.href;

  // 1. 全局加载的特性 (如导航栏、美化等)
  safeInit("homepage", initHomePage);

  // 3. 选课通 (全局菜单注入)
  safeInit("courseScore", initCourseScore);

  // 4. 特定页面的特性
  if (url.includes("/student/courseSelect/")) {
    // 选课相关
    safeInit("courseTable", initCourseTable);
    if (url.includes("/index?")) {
        safeInit("courseFilter", initCourseFilter);
    }
    if (url.includes("/quitCourse/")) {
        safeInit("enhanceQuitCourse", initEnhanceQuitCourse);
    }
  }

  if (url.includes("/student/integratedQuery/scoreQuery/schemeScores/")) {
    // 成绩分析
    safeInit("scoreAnalysis", initScoreAnalysis);
  }

  if (url.includes("/student/integratedQuery/scoreQuery/allPassingScores/")) {
    // 全部及格成绩
    safeInit("scoresPerSemester", initScoresPerSemester);
  }

  if (url.includes("/student/integratedQuery/scoreQuery/thisTermScores/")) {
    // 本学期成绩 (含隐藏成绩)
    safeInit("getHiddenScore", initGetHiddenScore);
  }

  if (url.includes("/student/teachingEvaluation/newEvaluation/")) {
    // 评教
    safeInit("courseEvaluation", initCourseEvaluation);
  }
}

// 确保在页面加载后执行
if (document.readyState === "complete") {
  main();
} else {
  window.addEventListener("load", main);
}
