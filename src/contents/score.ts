import type { PlasmoCSConfig } from "plasmo";
import {
  Chart,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
Chart.register(
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const config: PlasmoCSConfig = {
  matches: ["http://zhjw.scu.edu.cn/student/integratedQuery/scoreQuery/schemeScores/*"],
  all_frames: true
};

function getGPA(score: number): number {
  if (score >= 90) return 4.0;
  if (score >= 85) return 3.7;
  if (score >= 80) return 3.3;
  if (score >= 76) return 3.0;
  if (score >= 73) return 2.7;
  if (score >= 70) return 2.3;
  if (score >= 66) return 2.0;
  if (score >= 63) return 1.7;
  if (score >= 61) return 1.3;
  if (score === 60) return 1.0;
  return 0.0;
}

function extractData() {
  const rows = document.querySelectorAll("#page-content-template > div > div table tbody tr");
  return Array.from(rows).map(row => {
    const cells = row.querySelectorAll("td");
    return {
      attribute: cells[3]?.textContent?.trim() || "",
      credit: parseFloat(cells[4]?.textContent?.trim() || "0"),
      score: parseInt(cells[5]?.textContent?.trim() || "0", 10)
    };
  }).filter(item => !isNaN(item.credit) && !isNaN(item.score));
}

function calculateWeightedAverage(data: { credit: number; value: number }[]) {
  const total = data.reduce((acc, cur) => acc + cur.credit * cur.value, 0);
  const totalCredit = data.reduce((acc, cur) => acc + cur.credit, 0);
  return totalCredit ? total / totalCredit : 0;
}

window.addEventListener("load", () => {
  const container = document.querySelector("#page-content-template > div > div");
  if (!container) return;

  const style = document.createElement("style");
  style.textContent = `
    .scu-plus-container {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .analysis-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    #calculate-btn {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #calculate-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }
    .stat-card {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #1e293b;
    }
    .stat-label {
      color: #64748b;
      font-size: 0.9rem;
    }
    .chart-container {
      margin: 2rem 0;
      position: relative;
      height: 300px;
    }
    .disclaimer {
      color: #94a3b8;
      font-size: 0.85rem;
      margin-top: 1rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
    }
  `;

  const template = `
    <div class="scu-plus-container">
      <div class="analysis-header">
        <button id="calculate-btn">emoji 生成学业报告</button>
        <span style="color: #6366f1; font-weight: 600;">SCU+ 学业分析系统</span>
      </div>
      <div id="charts-section" style="display: none;">
        <div class="chart-container">
          <canvas id="gpaChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="creditChart"></canvas>
        </div>
      </div>
      <div id="stats-grid" class="stats-grid"></div>
      <div class="disclaimer">
        * 数据仅供参考，准确信息请以教务系统为准
        <br>
        * 平均计算已自动过滤不及格科目
      </div>
    </div>
  `.replace('emoji', "📊");

  const wrapper = document.createElement("div");
  wrapper.innerHTML = template;
  container.insertBefore(wrapper, container.firstChild);
  container.insertBefore(style, container.firstChild);

  const loadChartJS = () => {
    initApp();
  };

  const initApp = () => {
    const btn = document.getElementById('calculate-btn');
    btn.addEventListener('click', analyzeGrades);
  };

  const analyzeGrades = () => {
    const data = extractData();
    const passed = data.filter(item => item.score >= 60);

    // GPA 计算
    const gpaData = passed.map(item => ({
      credit: item.credit,
      value: getGPA(item.score)
    }));
    const averageGPA = calculateWeightedAverage(gpaData);

    // 必修课统计
    const required = data.filter(item => item.attribute === '必修');
    const requiredGPA = calculateWeightedAverage(
      required.map(item => ({ credit: item.credit, value: getGPA(item.score) }))
    );

    // 学分统计
    const totalCredits = passed.reduce((sum, item) => sum + item.credit, 0);
    const requiredCredits = required.reduce((sum, item) => sum + item.credit, 0);

    // 更新界面
    updateStatsDisplay({
      averageGPA,
      totalCredits,
      requiredGPA,
      requiredCredits
    });

    renderCharts({
      passed,
      requiredCredits,
      totalCredits
    });

    document.getElementById('charts-section').style.display = 'block';
  };

  const updateStatsDisplay = ({ averageGPA, totalCredits, requiredGPA, requiredCredits }) => {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${averageGPA.toFixed(2)}</div>
        <div class="stat-label">平均绩点</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalCredits.toFixed(1)}</div>
        <div class="stat-label">总学分</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${requiredGPA.toFixed(2)}</div>
        <div class="stat-label">必修绩点</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${requiredCredits.toFixed(1)}</div>
        <div class="stat-label">必修学分</div>
      </div>
    `;
  };

  const renderCharts = ({ passed, requiredCredits, totalCredits }) => {
    // GPA 分布图表
    const gpaCtx = (document.getElementById('gpaChart') as HTMLCanvasElement).getContext('2d');
    new Chart(gpaCtx, {
      type: 'bar',
      data: {
        labels: ['4.0', '3.7', '3.3', '3.0', '2.7', '2.3', '2.0', '1.7', '1.3', '1.0'],
        datasets: [{
          label: '课程数量',
          data: getGradeDistribution(passed),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '成绩分布统计'
          }
        },
        scales: {
          y: {
            type: 'linear',
            beginAtZero: true
          },
          x: {
            type: 'category'
          }
        }
      }
    });

    // 学分构成图表
    const creditCtx = (document.getElementById('creditChart') as HTMLCanvasElement).getContext('2d');
    new Chart(creditCtx, {
      type: 'doughnut',
      data: {
        labels: ['必修学分', '选修学分'],
        datasets: [{
          data: [requiredCredits, totalCredits - requiredCredits],
          backgroundColor: ['#6366f1', '#c7d2fe'],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            enabled: true
          }
        }
      }
    });
  };

  const getGradeDistribution = (data) => {
    const ranges = [[90, 100], [85, 89], [80, 84], [76, 79], [73, 75], [70, 72], [66, 69], [63, 65], [61, 62], [60, 60]];
    return ranges.map(([min, max]) =>
      data.filter(item => item.score >= min && item.score <= max).length
    );
  };

  loadChartJS();
});