/* =========================================================================
 * 主程式：首頁、年級選擇、科目導覽、進度顯示、畫面切換
 * ========================================================================= */
(function () {
  const GRADES = [
    { g: 3, label: "三年級", sub: "中年級" },
    { g: 4, label: "四年級", sub: "中年級" },
    { g: 5, label: "五年級", sub: "高年級" },
    { g: 6, label: "六年級", sub: "高年級" }
  ];
  let selectedGrade = 3;

  const el = (id) => document.getElementById(id);

  function renderHome() {
    const prog = loadProgress();
    const gradeHtml = GRADES.map(g => `
      <button class="grade-pill ${g.g === selectedGrade ? "active" : ""}" data-g="${g.g}">
        ${g.label}<span class="sub">${g.sub}</span>
      </button>`).join("");

    const subjectHtml = `
      <div class="subject-grid">
        <button class="subject-card en" data-sub="en">
          <span class="emoji">🔤</span>
          <span>英文單字</span>
          <span class="desc">看圖選字 · 聽發音</span>
        </button>
        <button class="subject-card ma" data-sub="ma">
          <span class="emoji">➗</span>
          <span>數學闖關</span>
          <span class="desc">四則運算 · 挑戰關卡</span>
        </button>
      </div>`;

    // 進度總覽
    const totalStars = Object.values(prog).reduce((s, v) => s + (v || 0), 0);
    const progressHtml = `
      <div class="card progress-box">
        <div class="section-title">🏅 我的星星</div>
        <div class="stars-line">目前共收集 <span class="star">⭐</span> ${totalStars} 顆星星</div>
        <div class="stars-line" style="margin-top:10px;font-size:14px;color:var(--muted)">
          ${GRADES.map(g => {
            const en = prog[`${g.g}-en`] || 0;
            const ma = prog[`${g.g}-ma`] || 0;
            return `<div>${g.label}：英 ${"⭐".repeat(en)}${"☆".repeat(3 - en)} ｜ 數 ${"⭐".repeat(ma)}${"☆".repeat(3 - ma)}</div>`;
          }).join("")}
        </div>
      </div>`;

    // 徽章牆（來自 engine 的累積統計）
    const stats = window.ENGINE.getStats();
    const unlocked = window.ENGINE.getUnlocked().map(b => b.id);
    const badgeHtml = `
      <div class="card badge-box">
        <div class="section-title">🏅 徽章牆（收集圖鑑）</div>
        <div class="badge-grid">
          ${window.ENGINE.BADGES.map(b => {
            const on = unlocked.includes(b.id);
            return `<div class="badge ${on ? "on" : "off"}" title="${b.desc}">
              <div class="badge-emoji">${on ? b.emoji : "🔒"}</div>
              <div class="badge-name">${b.name}</div>
              <div class="badge-desc">${b.desc}</div>
            </div>`;
          }).join("")}
        </div>
        <div class="stats-line">
          💎 歷史最高分 ${stats.bestScore}　｜　✅ 累積答對 ${stats.totalCorrect} 題　｜　🔥 最高連擊 x${stats.bestCombo}　｜　🎮 完成 ${stats.rounds} 回合
        </div>
      </div>`;

    el("home-content").innerHTML = `
      <div class="card hero">
        <span class="deco d1">⭐</span>
        <span class="deco d2">🎈</span>
        <span class="deco d3">✨</span>
        <div class="mascot">🦉</div>
        <h2>哈囉！我是學習小博士</h2>
        <p>選好年級和科目，我們一起來玩英文和數學吧！</p>
      </div>
      <div class="card">
        <div class="section-title">① 選擇年級</div>
        <div class="grade-row">${gradeHtml}</div>
      </div>
      <div class="card">
        <div class="section-title">② 選擇科目開始遊戲</div>
        ${subjectHtml}
      </div>
      ${progressHtml}
      ${badgeHtml}
      <div class="note">
        <b>內容依據：</b>本網站單字主題與數學題型參考教育部《108 課程綱要》國小階段（三~六年級）之學習重點設計，
        為<b>代表性示例</b>。正式教學使用前，請以教育部官方課綱字表與學校教材逐項核對、替換。
      </div>
    `;

    // 綁定年級
    el("home-content").querySelectorAll(".grade-pill").forEach(b => {
      b.onclick = () => { selectedGrade = Number(b.dataset.g); renderHome(); };
    });
    // 綁定科目
    el("home-content").querySelectorAll(".subject-card").forEach(b => {
      b.onclick = () => launch(b.dataset.sub);
    });
  }

  function launch(subject) {
    showScreen("game");
    const isEn = subject === "en";
    el("game-title").textContent = isEn ? "🔤 英文單字" : "➗ 數學闖關";
    el("hud-score").textContent = "⭐ 0";
    el("hud-lives").textContent = "❤️ ❤❤❤";
    el("hud-lives").style.display = isEn ? "none" : "inline-block";
    el("hud-combo").style.display = "none";
    el("hud-prog").textContent = "選難度";
    let diff = "normal";
    let mode = "casual";
    el("game-content").innerHTML = `
      <div class="card" style="text-align:center">
        <div class="section-title" style="justify-content:center">① 選擇難度</div>
        <div class="grade-row" id="diff-row">
          <button class="grade-pill" data-d="easy"><span>😀 簡單</span><span class="sub">${isEn ? "4 選 1" : "無限時"}</span></button>
          <button class="grade-pill active" data-d="normal"><span>🙂 普通</span><span class="sub">${isEn ? "4 選 1·近似干擾" : "本年級"}</span></button>
          <button class="grade-pill" data-d="hard"><span>😎 困難</span><span class="sub">${isEn ? "6 選 1" : "升級題"}</span></button>
        </div>
        <div class="section-title" style="justify-content:center;margin-top:18px">② 遊戲模式</div>
        <div class="grade-row" id="mode-row">
          <button class="grade-pill active" data-m="casual"><span>🧘 休閒模式</span><span class="sub">無限時 · 適合練習</span></button>
          <button class="grade-pill" data-m="timed"><span>⏱️ 計時模式</span><span class="sub">每題倒數 · 更刺激</span></button>
        </div>
        <button class="btn primary" id="start-game" style="margin-top:20px;font-size:20px">▶ 開始遊戲</button>
      </div>`;
    el("game-content").querySelectorAll("#diff-row .grade-pill").forEach(b => {
      b.onclick = () => {
        diff = b.dataset.d;
        el("game-content").querySelectorAll("#diff-row .grade-pill").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
      };
    });
    el("game-content").querySelectorAll("#mode-row .grade-pill").forEach(b => {
      b.onclick = () => {
        mode = b.dataset.m;
        el("game-content").querySelectorAll("#mode-row .grade-pill").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
      };
    });
    el("start-game").onclick = () => startGame(subject, diff, mode);
  }

  function startGame(subject, difficulty, mode) {
    el("hud-lives").style.display = subject === "en" ? "none" : "inline-block";
    if (subject === "en") window.EN_GAME.start(selectedGrade, difficulty, mode);
    else window.MA_GAME.start(selectedGrade, difficulty, mode);
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    el("screen-" + name).classList.add("active");
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { /* 部分環境不支援 scrollTo */ }
  }

  function goHome() { renderHome(); showScreen("home"); }

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem("learnGameProgress") || "{}"); }
    catch (e) { return {}; }
  }

  // 初始化
  document.addEventListener("DOMContentLoaded", () => {
    el("back-btn").onclick = goHome;
    renderHome();
    showScreen("home");
  });

  window.APP = { goHome, launch };
})();
