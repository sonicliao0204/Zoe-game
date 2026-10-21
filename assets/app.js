/* =========================================================================
 * 主程式：首頁、年級選擇、科目導覽、進度顯示、收集冊、錯題本、靜音開關、畫面切換
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
        <button class="subject-card ph" data-sub="ph">
          <span class="emoji">🔡</span>
          <span>自然發音</span>
          <span class="desc">聽音拼讀 · 押韻</span>
        </button>
      </div>`;

    const totalStars = Object.values(prog).reduce((s, v) => s + (v || 0), 0);
    const progressHtml = `
      <div class="card progress-box">
        <div class="section-title">🏅 我的星星</div>
        <div class="stars-line">目前共收集 <span class="star">⭐</span> ${totalStars} 顆星星</div>
        <div class="stars-line" style="margin-top:10px;font-size:14px;color:var(--muted)">
          ${GRADES.map(g => {
            const sc = n => "⭐".repeat(n) + "☆".repeat(3 - n);
            const en = prog[`${g.g}-en`] || 0;
            const ma = prog[`${g.g}-ma`] || 0;
            const ph = prog[`${g.g}-ph`] || 0;
            return `<div>${g.label}：英 ${sc(en)} ｜ 數 ${sc(ma)} ｜ 音 ${sc(ph)}</div>`;
          }).join("")}
        </div>
      </div>`;

    // 徽章牆
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
          💎 歷史最高分 ${stats.bestScore}　｜　✅ 累積答對 ${stats.totalCorrect} 題　｜　🔥 最高連擊 x${stats.bestCombo}　｜　🎮 完成 ${stats.rounds} 回合　｜　📅 連續 ${stats.dayStreak} 天
        </div>
      </div>`;

    // 收集冊（虛擬寵物配件）
    const coll = window.ENGINE.getCollectibles();
    const earned = stats.totalStars;
    const collHtml = `
      <div class="card coll-box">
        <div class="section-title">🎒 我的收集冊（累積星星 ${earned} ⭐）</div>
        <div class="pet-row">🦉 ${coll.filter(c => c.unlocked).map(c => c.emoji).join(" ") || "<span class='muted'>（努力解鎖配件吧！）</span>"}</div>
        <div class="coll-grid">
          ${coll.map(c => {
            const on = c.unlocked;
            const pct = Math.min(100, Math.round(earned / c.need * 100));
            return `<div class="coll ${on ? "on" : "off"}">
              <div class="coll-emoji">${on ? c.emoji : "🔒"}</div>
              <div class="coll-name">${c.name}</div>
              <div class="coll-need">${on ? "已解鎖" : "需 " + c.need + "⭐"}</div>
              ${on ? "" : `<div class="coll-bar"><span style="width:${pct}%"></span></div>`}
            </div>`;
          }).join("")}
        </div>
      </div>`;

    // 錯題本
    const wrong = window.ENGINE.getWrongLog();
    const wrongHtml = wrong.length ? `
      <div class="card wrong-box">
        <div class="section-title">📒 錯題本（共 ${wrong.length} 題）</div>
        <div class="wrong-list">
          ${wrong.slice(-6).reverse().map(w => `<div class="wrong-item"><span class="wq">${escapeHtml(w.q)}</span><span class="wa">${escapeHtml(w.a)}</span></div>`).join("")}
        </div>
        <button class="btn ghost" id="clear-wrong" style="margin-top:10px">清除錯題本</button>
      </div>` : "";

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
      <div class="card report-entry">
        <div class="section-title">📊 家長後台</div>
        <p class="report-desc">查看孩子的學習報表：星星、答對率、連擊紀錄、錯題本與收集進度。</p>
        <button class="btn primary" id="open-report">查看學習報表</button>
      </div>
      ${progressHtml}
      ${badgeHtml}
      ${collHtml}
      ${wrongHtml}
      <div class="note">
        <b>內容依據：</b>本網站單字主題與數學題型參考教育部《108 課程綱要》國小階段（三~六年級）之學習重點設計，
        為<b>代表性示例</b>。正式教學使用前，請以教育部官方課綱字表與學校教材逐項核對、替換。
      </div>
    `;

    el("home-content").querySelectorAll(".grade-pill").forEach(b => {
      b.onclick = () => { selectedGrade = Number(b.dataset.g); renderHome(); };
    });
    el("home-content").querySelectorAll(".subject-card").forEach(b => {
      b.onclick = () => launch(b.dataset.sub);
    });
    const or = el("open-report");
    if (or) or.onclick = () => goReport();
    const cw = el("clear-wrong");
    if (cw) cw.onclick = () => { window.ENGINE.clearWrongLog(); renderHome(); };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function launch(subject) {
    showScreen("game");
    const isMa = subject === "ma";
    const isPh = subject === "ph";
    const title = subject === "en" ? "🔤 英文單字" : isMa ? "➗ 數學闖關" : "🔡 自然發音";
    el("game-title").textContent = title;
    el("hud-score").textContent = "⭐ 0";
    el("hud-lives").textContent = "❤️ ❤❤❤";
    el("hud-lives").style.display = isMa ? "inline-block" : "none";
    el("hud-combo").style.display = "none";
    el("hud-prog").textContent = "選難度";
    let diff = "normal";
    let mode = "casual";
    const dEasy = isMa ? "無限時" : isPh ? "3 選 1" : "4 選 1";
    const dNormal = isMa ? "本年級" : "4 選 1·相近干擾";
    const dHard = isMa ? "升級題" : "6 選 1";
    el("game-content").innerHTML = `
      <div class="card" style="text-align:center">
        <div class="section-title" style="justify-content:center">① 選擇難度</div>
        <div class="grade-row" id="diff-row">
          <button class="grade-pill" data-d="easy"><span>😀 簡單</span><span class="sub">${dEasy}</span></button>
          <button class="grade-pill active" data-d="normal"><span>🙂 普通</span><span class="sub">${dNormal}</span></button>
          <button class="grade-pill" data-d="hard"><span>😎 困難</span><span class="sub">${dHard}</span></button>
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
    el("hud-lives").style.display = subject === "ma" ? "inline-block" : "none";
    if (subject === "en") window.EN_GAME.start(selectedGrade, difficulty, mode);
    else if (subject === "ma") window.MA_GAME.start(selectedGrade, difficulty, mode);
    else window.PHONICS_GAME.start(selectedGrade, difficulty, mode);
  }

  /* ---------------------- 家長後台報表 ---------------------- */
  let clearArmed = false;
  function goReport() { renderReport(); showScreen("report"); }

  function renderReport() {
    const E = window.ENGINE;
    const stats = E.getStats();
    const prog = loadProgress();
    const unlocked = E.getUnlocked().map(b => b.id);
    const coll = E.getCollectibles();
    const wrong = E.getWrongLog();
    const sc = n => "⭐".repeat(n) + "☆".repeat(3 - n);
    // 每回合固定 10 題，故累積答對率 = 答對題數 / (回合數 × 10)
    const attempts = stats.rounds * 10;
    const acc = attempts > 0 ? Math.round(stats.totalCorrect / attempts * 100) : 0;

    const matRows = GRADES.map(g => {
      const en = prog[`${g.g}-en`] || 0, ma = prog[`${g.g}-ma`] || 0, ph = prog[`${g.g}-ph`] || 0;
      return `<tr><td>${g.label}</td><td>${sc(en)}</td><td>${sc(ma)}</td><td>${sc(ph)}</td></tr>`;
    }).join("");

    const badgeHtml = E.BADGES.map(b => {
      const on = unlocked.includes(b.id);
      return `<div class="badge ${on ? "on" : "off"}" title="${b.desc}">
        <div class="badge-emoji">${on ? b.emoji : "🔒"}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.desc}</div></div>`;
    }).join("");

    const collHtml = coll.map(c => {
      const on = c.unlocked;
      const pct = Math.min(100, Math.round(stats.totalStars / c.need * 100));
      return `<div class="coll ${on ? "on" : "off"}">
        <div class="coll-emoji">${on ? c.emoji : "🔒"}</div>
        <div class="coll-name">${c.name}</div>
        <div class="coll-need">${on ? "已解鎖" : "需 " + c.need + "⭐"}</div>
        ${on ? "" : `<div class="coll-bar"><span style="width:${pct}%"></span></div>`}
      </div>`;
    }).join("");

    const wrongHtml = wrong.length
      ? wrong.slice(-10).reverse().map(w =>
          `<div class="wrong-item"><span class="wq">${escapeHtml(w.q)}</span><span class="wa">${escapeHtml(w.a)}</span></div>`).join("")
      : `<div class="muted" style="color:var(--muted)">尚無錯題記錄，表現很棒！</div>`;

    if (clearArmed) clearArmed = false;

    el("report-content").innerHTML = `
      <div class="card">
        <div class="section-title">📈 學習總覽</div>
        <div class="stats-line">💎 累積星星 ${stats.totalStars}　｜　✅ 累積答對 ${stats.totalCorrect} 題（答對率約 ${acc}%）　｜　🔥 最高連擊 x${stats.bestCombo}</div>
        <div class="stats-line">🏆 歷史最高分 ${stats.bestScore}　｜　🎮 完成 ${stats.rounds} 回合　｜　📅 連續 ${stats.dayStreak} 天　｜　💯 滿分 ${stats.perfect} 次</div>
      </div>

      <div class="card">
        <div class="section-title">🏅 各年級星星（英 / 數 / 音）</div>
        <table class="report-table">
          <thead><tr><th>年級</th><th>英文</th><th>數學</th><th>自然發音</th></tr></thead>
          <tbody>${matRows}</tbody>
        </table>
      </div>

      <div class="card badge-box">
        <div class="section-title">🏅 徽章收集（${unlocked.length}/${E.BADGES.length}）</div>
        <div class="badge-grid">${badgeHtml}</div>
      </div>

      <div class="card coll-box">
        <div class="section-title">🎒 收集冊（累積星星 ${stats.totalStars} ⭐）</div>
        <div class="coll-grid">${collHtml}</div>
      </div>

      <div class="card wrong-box">
        <div class="section-title">📒 錯題本（共 ${wrong.length} 題，顯示最近 10 題）</div>
        <div class="wrong-list">${wrongHtml}</div>
      </div>

      <div class="card report-clear">
        <div class="section-title">⚠️ 資料管理</div>
        <p class="report-desc">清除後將刪除所有星星、徽章、連擊與錯題本紀錄（靜音設定會保留）。</p>
        <button class="btn ghost" id="clear-data">清除學習紀錄</button>
      </div>

      <div class="note">
        <b>內容依據：</b>本網站單字主題、數學題型與自然發音內容參考教育部《108 課程綱要》國小階段學習重點設計，為<b>代表性示例</b>。
        正式教學使用前，請以教育部官方課綱字表與學校教材逐項核對、替換。
      </div>
    `;

    const cd = el("clear-data");
    if (cd) cd.onclick = () => {
      if (!clearArmed) {
        clearArmed = true;
        cd.textContent = "再按一次確認清除（無法復原）";
        cd.classList.add("danger");
        return;
      }
      try {
        localStorage.removeItem("learnGameProgress");
        localStorage.removeItem("learnGameStats");
        localStorage.removeItem("learnGameWrongLog");
      } catch (e) {}
      clearArmed = false;
      renderReport();
    };
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

  function syncMute() {
    const b = el("mute-btn");
    if (!b) return;
    const m = window.ENGINE.Sound.isMuted();
    b.textContent = m ? "🔇" : "🔊";
    b.setAttribute("aria-label", m ? "音效已關閉" : "音效開啟");
    b.classList.toggle("off", m);
  }

  // 初始化
  document.addEventListener("DOMContentLoaded", () => {
    el("back-btn").onclick = goHome;
    const br = el("back-report");
    if (br) br.onclick = goHome;
    const mb = el("mute-btn");
    if (mb) {
      mb.onclick = () => { window.ENGINE.Sound.toggle(); syncMute(); };
      syncMute();
    }
    // 首次使用者互動時喚醒 AudioContext（瀏覽器要求）
    document.addEventListener("click", () => window.ENGINE.Sound.resume(), { once: true });
    renderHome();
    showScreen("home");
  });

  window.APP = { goHome, launch };
})();
