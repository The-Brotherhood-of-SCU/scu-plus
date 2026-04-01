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

const main = async () => {
  const url = window.location.href;

  // 1. 全局加载的特性 (如导航栏、美化等)
  await initHomePage();

  // 3. 选课通 (全局菜单注入)
  initCourseScore();

  // 4. 特定页面的特性
  if (url.includes("/student/courseSelect/")) {
    // 选课相关
    initCourseTable();
    if (url.includes("/index?")) {
        initCourseFilter();
    }
    if (url.includes("/quitCourse/")) {
        initEnhanceQuitCourse();
    }
  }

  if (url.includes("/student/integratedQuery/scoreQuery/schemeScores/")) {
    // 成绩分析
    initScoreAnalysis();
  }

  if (url.includes("/student/integratedQuery/scoreQuery/allPassingScores/")) {
    // 全部及格成绩
    initScoresPerSemester();
  }

  if (url.includes("/student/integratedQuery/scoreQuery/thisTermScores/")) {
    // 本学期成绩 (含隐藏成绩)
    initGetHiddenScore();
  }

  if (url.includes("/student/teachingEvaluation/newEvaluation/")) {
    // 评教
    initCourseEvaluation();
  }
}

// 确保在页面加载后执行
if (document.readyState === "complete") {
  main();
} else {
  window.addEventListener("load", main);
}
