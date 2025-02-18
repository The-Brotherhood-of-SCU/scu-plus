import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["http://zhjw.scu.edu.cn/student/integratedQuery/scoreQuery/schemeScores/*"],
  all_frames: true,
};

const $ = (css: string) => {
  return document.querySelector(css) as HTMLElement;
};

// 绩点转换函数
function getGPA(score: number): number {
  if (score >= 90 && score <= 100) return 4.0;
  if (score >= 85 && score <= 89) return 3.7;
  if (score >= 80 && score <= 84) return 3.3;
  if (score >= 76 && score <= 79) return 3.0;
  if (score >= 73 && score <= 75) return 2.7;
  if (score >= 70 && score <= 72) return 2.3;
  if (score >= 66 && score <= 69) return 2.0;
  if (score >= 63 && score <= 65) return 1.7;
  if (score >= 62 && score <= 61) return 1.3;
  if (score === 60) return 1.0;
  return 0.0; // 不及格
}

// 提取数据
function extractData(): { attribute: string; credit: number; score: number }[] {
  const rows = document.querySelectorAll("#page-content-template > div > div table tbody tr");
  const data: { attribute: string; credit: number; score: number }[] = [];

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 6) {
      const attribute = cells[3].textContent?.trim() || ""; // 第4列：课程属性
      const creditText = cells[4].textContent?.trim(); // 第5列：学分
      const scoreText = cells[5].textContent?.trim(); // 第6列：成绩

      const credit = parseFloat(creditText || "0");
      const score = parseInt(scoreText || "0", 10);

      if (!isNaN(credit) && !isNaN(score)) {
        data.push({ attribute, credit, score });
      }
    }
  });

  return data;
}

// 计算加权平均值
function calculateWeightedAverage(
  data: { credit: number; value: number }[]
): number {
  const totalWeight = data.reduce((sum, item) => sum + item.credit, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = data.reduce((sum, item) => sum + item.credit * item.value, 0);
  return weightedSum / totalWeight;
}

window.addEventListener("load", () => {
  let container = $("#page-content-template > div > div");
  if (container) {
    let div_new = document.createElement("div");
    div_new.innerHTML = `
      <div class="scorearea" style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; font-family: Arial, sans-serif;">
        <button id="calculate-stats" style="padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.3s;">
          计算统计信息
        </button>
        <span>by SCU+</span>
        <p id="stats-result" style="margin-top: 15px; font-size: 14px; color: #333; line-height: 1.5;"></p>
      </div>
    `;
    container.insertBefore(div_new, container.children[0]);

    // 绑定按钮点击事件
    const button = div_new.querySelector("#calculate-stats") as HTMLButtonElement;
    const resultParagraph = div_new.querySelector("#stats-result") as HTMLParagraphElement;

    button.addEventListener("click", () => {
      const data = extractData();

      if (data.length === 0) {
        resultParagraph.textContent = "未找到有效成绩数据";
        resultParagraph.style.color = "#e74c3c"; // 错误提示颜色
        return;
      }

      // 过滤掉不及格的科目
      const passedData = data.filter((item) => item.score >= 60);

      // 总学分
      const totalCredits = passedData.reduce((sum, item) => sum + item.credit, 0);

      // 必修学分
      const requiredCredits = data
        .filter((item) => item.attribute === "必修")
        .reduce((sum, item) => sum + item.credit, 0);

      // 平均绩点
      const gpaData = passedData.map((item) => ({
        credit: item.credit,
        value: getGPA(item.score),
      }));
      const averageGPA = calculateWeightedAverage(gpaData);

      // 必修平均绩点
      const requiredGPAData = data
        .filter((item) => item.attribute === "必修")
        .map((item) => ({
          credit: item.credit,
          value: getGPA(item.score),
        }));
      const requiredGPA = calculateWeightedAverage(requiredGPAData);

      // 平均成绩
      const scoreData = passedData.map((item) => ({
        credit: item.credit,
        value: item.score,
      }));
      const averageScore = calculateWeightedAverage(scoreData);

      // 必修平均成绩
      const requiredScoreData = data
        .filter((item) => item.attribute === "必修")
        .map((item) => ({
          credit: item.credit,
          value: item.score,
        }));
      const requiredAverageScore = calculateWeightedAverage(requiredScoreData);

      // 显示结果
      resultParagraph.innerHTML = `
      <span>注：过滤不及格科目</span><br>
        <strong>总学分:</strong> ${totalCredits.toFixed(2)}<br>
        <strong>平均绩点:</strong> ${averageGPA.toFixed(2)}<br>
        <strong>平均成绩:</strong> ${averageScore.toFixed(2)}<br>
        <br>
        <span>注：包含不及格必修科目</span><br>
        <strong>必修学分:</strong> ${requiredCredits.toFixed(2)}<br>
        <strong>必修平均绩点:</strong> ${requiredGPA.toFixed(2)}<br>
        <strong>必修平均成绩:</strong> ${requiredAverageScore.toFixed(2)}
      `;
      resultParagraph.style.color = "#2ecc71"; // 成功提示颜色
    });

    // 鼠标悬停效果
    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#0056b3";
    });
    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#007bff";
    });
  } else {
    console.log("找不到元素");
  }
});