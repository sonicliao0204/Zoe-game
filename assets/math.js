/* =========================================================================
 * 數學遊戲：四則運算闖關
 *  - 依年級動態生成題目（來自 data.js 的 GAME_DATA）
 *  - 每回合 10 題，四選一，3 條生命，答錯扣生命
 *  - 難度：簡單/普通＝本年級；困難＝偶爾混入高一年級題型
 *  - 模式：休閒（無限時）/ 計時（每題倒數，困難較短）
 *  - 連擊分級倍率（combo 3→1.2x / 5→1.5x / 10→2x）；連擊>=2 掉落道具
 *  - 生命歸零「復活機制」：訂正一題補回 1 顆心
 *  - 錯題記錄 + 結算「今日錯題回顧」；草稿紙 Canvas（觸控可用）
 *  - 計分、星星、徽章統計、錯題本、打卡，進度與統計皆存 localStorage
 * ========================================================================= */
(function () {
  const D = window.GAME_DATA;
  const E = window.ENGINE;
  const TOTAL = 10;
  const LIVES = 3;
  const BASE = 10;

  let state = null;
  let scratch = null;

  function start(grade, difficulty, mode) {
    difficulty = difficulty || "normal";
    mode = mode || "casual";
    E.resetCombo();
    E.resetItems();
    state = {
      grade, difficulty, mode,
      idx: 0, correct: 0, points: 0, maxCombo: 0, lives: LIVES,
      answered: false, current: null, timerId: null, reviving: false,
      questions: buildQuestions(grade, difficulty), wrongList: []
    };
    renderQuestion();
  }

  /* ---------- 題目建構（含年級內坡度） ---------- */
  function levelForIdx(i) { return i < 3 ? 1 : i < 7 ? 2 : 3; }

  function makeOneQuestion(grade, difficulty, i) {
    let g = grade;
    if (difficulty === "hard" && D.MATH[grade + 1] && Math.random() < 0.3) g = grade + 1;
    const p = D.makeMathProblem(g, levelForIdx(i));
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
      if (s.includes(".")) return w.toFixed(1);
      return String(w);
    };
    const options = D.buildOptions(answer, makeWrong);
    return { q: p.q, a: String(answer), ex: p.ex, options };
  }

  function buildQuestions(grade, difficulty) {
    const qs = [];
    for (let i = 0; i < TOTAL; i++) qs.push(makeOneQuestion(grade, difficulty, i));
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

  /* ---------- 題目渲染 ---------- */
  function renderQuestion() {
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    state.answered = false; state.reviving = false;
    const q = state.questions[state.idx];
    state.current = q;
    const root = document.getElementById("game-content");
    const optsHtml = q.options.map(o => `<button class="option" data-a="${o}">${o}</button>`).join("");
    root.innerHTML = `
      <div class="q-area">
        <div class="q-text">${q.q}</div>
      </div>
      <button class="scratch-toggle" id="scratch-toggle">✏️ 草稿紙</button>
      ${state.mode === "timed" ? '<div class="timer"><div class="timer-bar" id="tbar"></div></div>' : ''}
      <div class="options" id="opts">${optsHtml}</div>
      <div class="items" id="items"></div>
      <div class="feedback" id="fb"></div>
    `;
    document.querySelectorAll("#opts .option").forEach(btn => { btn.onclick = () => choose(btn); });
    bindScratchToggle();
    renderItems();
    if (state.mode === "timed") state.timerId = E.startTimer(questionMs(), () => onTimeout());
    updateHud();
  }

  /* ---------- 復活（訂正）模式 ---------- */
  function renderRevive() {
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    state.answered = false; state.reviving = true;
    const q = makeOneQuestion(state.grade, state.difficulty, state.idx);
    state.current = q;
    const root = document.getElementById("game-content");
    root.innerHTML = `
      <div class="revive-box">
        <div class="revive-title">💡 別放棄！訂正成功就補回 1 顆心 ❤️</div>
        <div class="q-area"><div class="q-text">${q.q}</div></div>
        <button class="scratch-toggle" id="scratch-toggle">✏️ 草稿紙</button>
        <div class="options" id="opts">${q.options.map(o => `<button class="option" data-a="${o}">${o}</button>`).join("")}</div>
        <div class="feedback" id="fb"></div>
      </div>`;
    document.querySelectorAll("#opts .option").forEach(btn => { btn.onclick = () => chooseRevive(btn); });
    bindScratchToggle();
    updateHud();
  }

  function chooseRevive(btn) {
    if (state.answered) return;
    state.answered = true;
    const q = state.current;
    const buttons = document.querySelectorAll("#opts .option");
    buttons.forEach(b => b.disabled = true);
    const fb = document.getElementById("fb");
    if (btn.dataset.a === q.a) {
      btn.classList.add("correct");
      state.lives = 1; // 補回 1 顆心
      E.Sound.revive();
      E.toast("💡 愛心補回來了！繼續加油！");
      fb.className = "feedback ok";
      fb.textContent = "✅ 太棒了！愛心補回來了，繼續加油！";
      updateHud();
      setTimeout(() => {
        state.idx++;
        if (state.idx >= state.questions.length) finish(true);
        else renderQuestion();
      }, 1500);
    } else {
      buttons.forEach(b => { if (b.dataset.a === q.a) b.classList.add("correct"); });
      E.breakCombo();
      E.Sound.wrong();
      fb.className = "feedback no";
      fb.textContent = `❌ 正確是 ${q.a}。這次真的結束囉，再挑戰一次！`;
      updateHud();
      setTimeout(() => finish(false), 1600);
    }
  }

  /* ---------- 作答 ---------- */
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
      E.Sound.correct();
      if (combo >= 3) E.Sound.combo();
      fb.className = "feedback ok";
      const mult = E.comboMultiplier(combo);
      fb.textContent = `✅ 答對了！+${gain}⭐${mult > 1 ? `（連擊 ${mult}x）` : ""}　${q.ex}`;
      if (combo >= 3) E.comboBanner(combo);
      const dropped = E.maybeDropItem({ canHeal: true });
      if (dropped) { E.toast(`🎁 獲得道具：${E.ITEMS[dropped].name}！`); renderItems(); }
    } else {
      btn.classList.add("wrong");
      buttons.forEach(b => { if (b.dataset.a === q.a) b.classList.add("correct"); });
      state.lives--;
      E.breakCombo();
      E.Sound.wrong();
      fb.className = "feedback no";
      fb.textContent = `❌ 正確是 ${q.a}。${q.ex}`;
      state.wrongList.push({ q: q.q, a: q.a, ex: q.ex });
    }
    updateHud();
    const dwell = btn.dataset.a === q.a ? 1200 : 2800; // 答錯多停留，讓孩子看解析
    setTimeout(() => {
      if (state.lives <= 0) return renderRevive();
      state.idx++;
      if (state.idx >= state.questions.length) finish(true);
      else renderQuestion();
    }, dwell);
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
    E.Sound.wrong();
    fb.className = "feedback no";
    fb.textContent = `⏰ 時間到！正確是 ${q.a}　${q.ex}`;
    state.wrongList.push({ q: q.q, a: q.a, ex: q.ex });
    updateHud();
    setTimeout(() => {
      if (state.lives <= 0) return renderRevive();
      state.idx++;
      if (state.idx >= state.questions.length) finish(true);
      else renderQuestion();
    }, 2900);
  }

  function updateHud() {
    document.getElementById("hud-score").textContent = `⭐ ${state.points}`;
    document.getElementById("hud-lives").textContent = `❤️ ${"❤".repeat(state.lives)}${"·".repeat(Math.max(0, LIVES - state.lives))}`;
    document.getElementById("hud-prog").textContent = `第 ${Math.min(state.idx + 1, TOTAL)} / ${TOTAL} 題`;
    const combo = E.getCombo();
    const cc = document.getElementById("hud-combo");
    if (combo >= 2) {
      const m = E.comboMultiplier(combo);
      cc.style.display = "inline-block";
      cc.textContent = `🔥 x${combo}${m > 1 ? ` · ${m}x分` : ""}`;
    } else cc.style.display = "none";
  }

  /* ---------- 道具欄 ---------- */
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

  /* ---------- 草稿紙 Canvas（觸控＋滑鼠） ---------- */
  function ensureScratch() {
    if (scratch) return scratch;
    const ov = document.createElement("div");
    ov.className = "scratch-overlay";
    ov.innerHTML = `
      <div class="scratch-panel">
        <div class="scratch-head"><span>✏️ 我的草稿紙</span><button class="scratch-x" id="scratch-x">✕</button></div>
        <canvas id="scratch-c" class="scratch-c"></canvas>
        <div class="scratch-actions">
          <button class="scratch-btn" id="scratch-clear">🧹 清除</button>
          <button class="scratch-btn" id="scratch-close">關閉</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const canvas = ov.querySelector("#scratch-c");
    const ctx = canvas.getContext("2d");
    let drawing = false, last = null;
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    function start(e) { drawing = true; last = pos(e); if (e.cancelable) e.preventDefault(); }
    function move(e) {
      if (!drawing) return;
      const p = pos(e);
      ctx.strokeStyle = "#1E293B"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; if (e.cancelable) e.preventDefault();
    }
    function end() { drawing = false; }
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
    ov.querySelector("#scratch-clear").onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
    ov.querySelector("#scratch-x").onclick = closeScratch;
    ov.querySelector("#scratch-close").onclick = closeScratch;
    scratch = { ov, canvas, resize() { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; } };
    return scratch;
  }
  function openScratch() {
    const s = ensureScratch();
    s.ov.style.display = "flex";
    requestAnimationFrame(() => s.resize());
  }
  function closeScratch() { if (scratch) scratch.ov.style.display = "none"; }
  function bindScratchToggle() {
    const t = document.getElementById("scratch-toggle");
    if (t) t.onclick = () => { E.Sound.click(); openScratch(); };
  }

  /* ---------- 結算 ---------- */
  function finish(survived) {
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    closeScratch();
    const score = state.correct;
    const pct = score / TOTAL;
    const stars = !survived ? 0 : pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
    const perfect = survived && score === TOTAL && TOTAL > 0;
    const res = E.recordRound("ma", {
      correct: score, total: TOTAL, points: state.points,
      bestCombo: state.maxCombo, perfect, stars
    });
    if (state.wrongList.length) {
      E.recordWrong(state.wrongList.map(w => ({ grade: state.grade, subject: "ma", q: w.q, a: w.a, ex: w.ex })));
    }
    const msg = !survived ? "生命用完了，再挑戰一次吧！" :
                stars === 3 ? "數學高手！全部答對！" :
                stars === 2 ? "很棒！再加快一點！" :
                stars === 1 ? "不錯，繼續練習！" : "加油，多算幾次就會了！";
    saveProgress(state.grade, "ma", stars);
    if (survived && stars > 0) { E.confetti(); E.Sound.win(); }
    const badgeHtml = res.newlyUnlocked.length
      ? `<div class="badge-pop">🎉 解鎖新徽章：${res.newlyUnlocked.map(b => `${b.emoji} ${b.name}`).join("　")}</div>`
      : "";
    const reviewHtml = state.wrongList.length
      ? `<div class="review-box">
           <div class="review-title">📒 今日錯題回顧（${state.wrongList.length} 題）</div>
           ${state.wrongList.map(w => `<div class="review-item"><div class="rq">${w.q}</div><div class="ra">正解：${w.a}</div><div class="rex">${w.ex}</div></div>`).join("")}
         </div>`
      : "";
    const root = document.getElementById("game-content");
    root.innerHTML = `
      <div class="card result-card">
        <div class="big-emoji">${!survived ? "💡" : stars === 3 ? "🏆" : stars >= 1 ? "🌟" : "💪"}</div>
        <h2>${msg}</h2>
        <div class="score">答對 ${score} / ${TOTAL}　得分 ⭐ ${state.points}　最高連擊 x${state.maxCombo}</div>
        <div class="score">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
        ${badgeHtml}
        ${reviewHtml}
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
