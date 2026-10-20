/* =========================================================================
 * 數學遊戲：四則運算闖關
 *  - 依年級動態生成題目（來自 data.js 的 GAME_DATA）
 *  - 每回合 10 題，四選一，3 條生命，答錯扣生命
 *  - 難度：簡單/普通＝本年級；困難＝偶爾混入高一年級題型
 *  - 模式：休閒（無限時）/ 計時（每題倒數，困難較短）
 *  - 連擊 combo>=3 得分加倍；連擊>=2 有機率掉落「刪去一半」或「回血 +1❤」
 *  - 計分、星星、徽章統計，進度與統計皆存 localStorage
 * ========================================================================= */
(function () {
  const D = window.GAME_DATA;
  const E = window.ENGINE;
  const TOTAL = 10;
  const LIVES = 3;
  const BASE = 10; // 每題基礎分數（combo 加倍後為 20）

  let state = null;

  function start(grade, difficulty, mode) {
    difficulty = difficulty || "normal";
    mode = mode || "casual";
    E.resetCombo();
    E.resetItems();
    state = {
      grade, difficulty, mode,
      idx: 0, correct: 0, points: 0, maxCombo: 0, lives: LIVES,
      answered: false, current: null, timerId: null,
      questions: buildQuestions(grade, difficulty)
    };
    renderQuestion();
  }

  function buildQuestions(grade, difficulty) {
    const qs = [];
    const grades = (difficulty === "hard" && D.MATH[grade + 1]) ? [grade, grade + 1] : [grade];
    for (let i = 0; i < TOTAL; i++) {
      let g = grade;
      if (grades.length > 1 && Math.random() < 0.3) g = grade + 1; // 困難：3 成機率升級題
      const maxLevel = i < 3 ? 1 : i < 7 ? 2 : 3; // 年級內先易後難坡度
      const p = D.makeMathProblem(g, maxLevel);
      const answer = p.a;
      const makeWrong = (ans) => {
        const s = String(ans);
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

  function questionMs() {
    if (state.difficulty === "hard") return 12000;
    if (state.difficulty === "easy") return 18000;
    return 15000;
  }

  function renderQuestion() {
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    state.answered = false;
    const q = state.questions[state.idx];
    state.current = q;
    const root = document.getElementById("game-content");
    root.innerHTML = `
      <div class="q-area">
        <div class="q-text">${q.q}</div>
      </div>
      ${state.mode === "timed" ? '<div class="timer"><div class="timer-bar" id="tbar"></div></div>' : ''}
      <div class="options" id="opts">
        ${q.options.map(o => `<button class="option" data-a="${o}">${o}</button>`).join("")}
      </div>
      <div class="items" id="items"></div>
      <div class="feedback" id="fb"></div>
    `;
    document.querySelectorAll("#opts .option").forEach(btn => {
      btn.onclick = () => choose(btn);
    });
    renderItems();
    if (state.mode === "timed") {
      state.timerId = E.startTimer(questionMs(), () => onTimeout());
    }
    updateHud();
  }

  function choose(btn) {
    if (state.answered) return;
    state.answered = true;
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    const q = state.current;
    const buttons = document.querySelectorAll("#opts .option");
    buttons.forEach(b => b.disabled = true);
    const fb = document.getElementById("fb");
    if (btn.dataset.a === q.a) {
      btn.classList.add("correct");
      state.correct++;
      const combo = E.bumpCombo();
      if (combo > state.maxCombo) state.maxCombo = combo;
      const gain = E.pointsForCorrect(BASE);
      state.points += gain;
      fb.className = "feedback ok";
      fb.textContent = `✅ 答對了！${q.ex}`;
      if (combo >= 3) E.comboBanner(combo); // 連擊特效
      const dropped = E.maybeDropItem({ canHeal: true }); // 數學可掉回血道具
      if (dropped) { E.toast(`🎁 獲得道具：${E.ITEMS[dropped].name}！`); renderItems(); }
    } else {
      btn.classList.add("wrong");
      buttons.forEach(b => { if (b.dataset.a === q.a) b.classList.add("correct"); });
      state.lives--;
      E.breakCombo();
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

  function onTimeout() {
    if (state.answered) return;
    state.answered = true;
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    const q = state.current;
    const buttons = document.querySelectorAll("#opts .option");
    buttons.forEach(b => b.disabled = true);
    const fb = document.getElementById("fb");
    state.lives--;
    E.breakCombo();
    fb.className = "feedback no";
    fb.textContent = `⏰ 時間到！正確是 ${q.a}`;
    updateHud();
    setTimeout(() => {
      if (state.lives <= 0) return finish(false);
      state.idx++;
      if (state.idx >= state.questions.length) finish(true);
      else renderQuestion();
    }, 1300);
  }

  function updateHud() {
    document.getElementById("hud-score").textContent = `⭐ ${state.points}`;
    document.getElementById("hud-lives").textContent = `❤️ ${"❤".repeat(state.lives)}${"·".repeat(Math.max(0, LIVES - state.lives))}`;
    document.getElementById("hud-prog").textContent = `第 ${Math.min(state.idx + 1, TOTAL)} / ${TOTAL} 題`;
    const combo = E.getCombo();
    const cc = document.getElementById("hud-combo");
    if (combo >= 2) { cc.style.display = "inline-block"; cc.textContent = `🔥 x${combo}`; }
    else cc.style.display = "none";
  }

  // 道具欄位渲染與使用
  function renderItems() {
    const box = document.getElementById("items");
    if (!box) return;
    const inv = E.getInventory();
    if (!inv.length) { box.innerHTML = ""; return; }
    box.innerHTML = `<div class="items-label">🎒 我的道具：</div>` +
      inv.map(t => `<button class="item-btn" data-t="${t}">${E.ITEMS[t].emoji} ${E.ITEMS[t].name}</button>`).join("");
    box.querySelectorAll(".item-btn").forEach(b => { b.onclick = () => useItem(b.dataset.t); });
  }

  function useItem(type) {
    if (!E.hasItem(type)) return;
    if (type === "fifty") {
      const ok = E.useFifty(document.querySelectorAll("#opts .option"), state.current.a, "a");
      if (!ok) { E.toast("沒有可刪除的選項"); return; }
      E.consumeItem(type);
      E.toast("🔆 已刪除一個錯誤選項！");
      renderItems();
    } else if (type === "heal") {
      if (state.lives >= 5) { E.toast("生命已經滿囉！"); return; }
      state.lives++;
      E.consumeItem(type);
      E.toast("💊 生命 +1！");
      renderItems();
      updateHud();
    }
  }

  function finish(survived) {
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    const score = state.correct;
    const pct = score / TOTAL;
    const stars = !survived ? 0 : pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
    const perfect = survived && score === TOTAL && TOTAL > 0;
    const res = E.recordRound("ma", {
      correct: score, total: TOTAL, points: state.points,
      bestCombo: state.maxCombo, perfect
    });
    const msg = !survived ? "生命用完了，再挑戰一次吧！" :
                stars === 3 ? "數學高手！全部答對！" :
                stars === 2 ? "很棒！再加快一點！" :
                stars === 1 ? "不錯，繼續練習！" : "加油，多算幾次就會了！";
    saveProgress(state.grade, "ma", stars);
    if (survived && stars > 0) E.confetti();
    const badgeHtml = res.newlyUnlocked.length
      ? `<div class="badge-pop">🎉 解鎖新徽章：${res.newlyUnlocked.map(b => `${b.emoji} ${b.name}`).join("　")}</div>`
      : "";
    const root = document.getElementById("game-content");
    root.innerHTML = `
      <div class="card result-card">
        <div class="big-emoji">${!survived ? "💡" : stars === 3 ? "🏆" : stars >= 1 ? "🌟" : "💪"}</div>
        <h2>${msg}</h2>
        <div class="score">答對 ${score} / ${TOTAL}　得分 ⭐ ${state.points}　最高連擊 x${state.maxCombo}</div>
        <div class="score">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
        ${badgeHtml}
        <div class="result-actions">
          <button class="btn green" id="again">再玩一次</button>
          <button class="btn ghost" id="home">回到首頁</button>
        </div>
      </div>`;
    document.getElementById("again").onclick = () => start(state.grade, state.difficulty, state.mode);
    document.getElementById("home").onclick = () => window.APP.goHome();
    document.getElementById("hud-score").textContent = `⭐ ${state.points}`;
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
