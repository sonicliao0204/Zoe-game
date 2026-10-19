/* =========================================================================
 * 數學遊戲：四則運算闖關
 *  - 依年級動態生成題目（來自 data.js 的 GAME_DATA）
 *  - 每回合 10 題，四選一，3 條生命，答錯扣生命
 *  - 計分、星星、關卡進度，進度存 localStorage
 * ========================================================================= */
(function () {
  const D = window.GAME_DATA;
  const TOTAL = 10;
  const LIVES = 3;

  let state = null;

  function start(grade) {
    state = {
      grade,
      idx: 0,
      score: 0,
      lives: LIVES,
      questions: buildQuestions(grade)
    };
    renderQuestion();
  }

  function buildQuestions(grade) {
    const qs = [];
    for (let i = 0; i < TOTAL; i++) {
      const p = D.makeMathProblem(grade);            // { q, a, ex }
      const answer = p.a;
      const makeWrong = (ans) => {
        const s = String(ans);
        // 分數題：隨機改分子或分母，產生相近分數
        if (s.includes("/")) {
          const m = s.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
          if (m) {
            const whole = m[1] ? parseInt(m[1], 10) : 0;
            const num = parseInt(m[2], 10);
            const den = parseInt(m[3], 10);
            if (Math.random() < 0.5) return whole + " " + Math.max(1, num + (Math.random() < 0.5 ? 1 : -1)) + "/" + den;
            return whole + " " + num + "/" + (den + (Math.random() < 0.5 ? 1 : -1));
          }
          return null;
        }
        const n = Number(ans);
        if (isNaN(n)) return null;
        const delta = ri(1, Math.max(2, Math.round(Math.abs(n) * 0.2) + 2));
        const mode = ri(0, 2);
        let w = mode === 0 ? n + delta : mode === 1 ? n - delta : n + delta * 2;
        if (w < 0) w = n + delta;
        if (s.includes(".")) return w.toFixed(1);   // 小數題保持一位小數
        return String(w);
      };
      const options = D.buildOptions(answer, makeWrong);
      qs.push({ q: p.q, a: String(answer), ex: p.ex, options });
    }
    return qs;
  }

  function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function renderQuestion() {
    const q = state.questions[state.idx];
    const root = document.getElementById("game-content");
    root.innerHTML = `
      <div class="q-area">
        <div class="q-text">${q.q}</div>
      </div>
      <div class="options" id="opts">
        ${q.options.map(o => `<button class="option" data-a="${o}">${o}</button>`).join("")}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    document.querySelectorAll("#opts .option").forEach(btn => {
      btn.onclick = () => choose(btn, q);
    });
    updateHud();
  }

  function choose(btn, q) {
    const buttons = document.querySelectorAll("#opts .option");
    buttons.forEach(b => b.disabled = true);
    const fb = document.getElementById("fb");
    if (btn.dataset.a === q.a) {
      btn.classList.add("correct");
      state.score++;
      fb.className = "feedback ok";
      fb.textContent = `✅ 答對了！${q.ex}`;
    } else {
      btn.classList.add("wrong");
      buttons.forEach(b => { if (b.dataset.a === q.a) b.classList.add("correct"); });
      state.lives--;
      fb.className = "feedback no";
      fb.textContent = `❌ 正確是 ${q.a}。${q.ex}`;
    }
    updateHud();

    setTimeout(() => {
      if (state.lives <= 0) return finish(false);
      state.idx++;
      if (state.idx >= state.questions.length) finish(true);
      else renderQuestion();
    }, 1200);
  }

  function updateHud() {
    document.getElementById("hud-score").textContent = `⭐ ${state.score}`;
    document.getElementById("hud-lives").textContent = `❤️ ${"❤".repeat(state.lives)}${"·".repeat(Math.max(0, LIVES - state.lives))}`;
    document.getElementById("hud-prog").textContent = `第 ${Math.min(state.idx + 1, TOTAL)} / ${TOTAL} 題`;
  }

  function finish(survived) {
    const score = state.score;
    const pct = score / TOTAL;
    const stars = !survived ? 0 : pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
    const msg = !survived ? "生命用完了，再挑戰一次吧！" :
                stars === 3 ? "數學高手！全部答對！" :
                stars === 2 ? "很棒！再加快一點！" :
                stars === 1 ? "不錯，繼續練習！" : "加油，多算幾次就會了！";
    saveProgress(state.grade, "ma", stars);
    if (survived && stars > 0) confetti();
    const root = document.getElementById("game-content");
    root.innerHTML = `
      <div class="card result-card">
        <div class="big-emoji">${!survived ? "💡" : stars === 3 ? "🏆" : stars >= 1 ? "🌟" : "💪"}</div>
        <h2>${msg}</h2>
        <div class="score">得分 ${score} / ${TOTAL}　${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
        <div class="result-actions">
          <button class="btn green" id="again">再玩一次</button>
          <button class="btn ghost" id="home">回到首頁</button>
        </div>
      </div>`;
    document.getElementById("again").onclick = () => start(state.grade);
    document.getElementById("home").onclick = () => window.APP.goHome();
    document.getElementById("hud-score").textContent = `⭐ ${score}`;
  }

  function confetti() {
    const colors = ["#2563EB", "#16A34A", "#FACC15", "#EA580C", "#DC2626"];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (2 + Math.random() * 2) + "s";
      c.style.animationDelay = (Math.random() * 0.6) + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  function saveProgress(grade, subject, stars) {
    try {
      const key = "learnGameProgress";
      const cur = JSON.parse(localStorage.getItem(key) || "{}");
      const id = `${grade}-${subject}`;
      cur[id] = Math.max(cur[id] || 0, stars);
      localStorage.setItem(key, JSON.stringify(cur));
    } catch (e) { /* localStorage 不可用時略過 */ }
  }

  window.MA_GAME = { start };
})();
