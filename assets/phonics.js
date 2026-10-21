/* =========================================================================
 * 自然發音（Phonics）專屬關卡：聽音選字 / 字首音辨識 / 押韻辨識
 *  - 題庫來自 data.js 的 GAME_DATA.PHONICS（CVC 基礎字）
 *  - 每回合 10 題，三種題型輪替；選項 3~4 個（依難度）
 *  - 全程 Web Speech API 英文發音（TTS）；連擊分級倍率、道具、音效、錯題回顧
 *  - 對齊 108 課綱中年級（三~四年級）自然發音素養
 * ========================================================================= */
(function () {
  const D = window.GAME_DATA;
  const E = window.ENGINE;
  const TOTAL = 10;
  const BASE = 10;

  let state = null;

  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 發音失敗不影響遊戲 */ }
  }

  function start(grade, difficulty, mode) {
    difficulty = difficulty || "normal";
    mode = mode || "casual";
    E.resetCombo();
    E.resetItems();
    state = {
      grade, difficulty, mode,
      idx: 0, correct: 0, points: 0, maxCombo: 0,
      answered: false, current: null, timerId: null,
      questions: buildQuestions(difficulty), wrongList: []
    };
    renderQuestion();
  }

  function buildQuestions(difficulty) {
    const opts = difficulty === "easy" ? 3 : 4;
    const P = D.PHONICS;
    const types = ["spell", "first", "rhyme"];
    const qs = [];
    for (let i = 0; i < TOTAL; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      if (t === "spell") {
        const target = D.pick(P);
        const others = D.shuffle(P.filter(x => x.w !== target.w)).slice(0, opts - 1).map(x => x.w);
        qs.push({ type: "spell", e: target.e, a: target.w, options: D.shuffle([target.w, ...others]) });
      } else if (t === "first") {
        const target = D.pick(P);
        const others = D.shuffle(P.filter(x => x.first !== target.first)).slice(0, opts - 1).map(x => x.first);
        qs.push({ type: "first", e: target.e, w: target.w, a: target.first, options: D.shuffle([target.first, ...others]) });
      } else { // rhyme
        const target = D.pick(P);
        const sameGrp = P.filter(x => x.grp === target.grp && x.w !== target.w);
        const correct = sameGrp.length ? D.pick(sameGrp) : target;
        const others = D.shuffle(P.filter(x => x.grp !== target.grp)).slice(0, opts - 1).map(x => x.w);
        qs.push({ type: "rhyme", e: target.e, w: target.w, a: correct.w, options: D.shuffle([correct.w, ...others]) });
      }
    }
    return qs;
  }

  function questionMs() {
    if (state.difficulty === "hard") return 13000;
    if (state.difficulty === "easy") return 18000;
    return 15000;
  }

  function optsHtml(q) {
    const speakable = (q.type === "spell" || q.type === "rhyme");
    return `<div class="options" id="opts">${q.options.map(o =>
      `<button class="option" data-a="${o}">${o}${speakable ? `<span class="opt-speak" data-sp="${o}">🔊</span>` : ""}</button>`
    ).join("")}</div>`;
  }

  function bindOptSpeak() {
    document.querySelectorAll("#opts .opt-speak").forEach(s => {
      s.onclick = (e) => { e.stopPropagation(); E.Sound.click(); speak(s.dataset.sp); };
    });
  }

  function renderQuestion() {
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    state.answered = false;
    const q = state.questions[state.idx];
    state.current = q;
    const root = document.getElementById("game-content");
    const timerHtml = state.mode === "timed" ? '<div class="timer"><div class="timer-bar" id="tbar"></div></div>' : "";
    const opts = optsHtml(q);

    let promptHtml = "";
    if (q.type === "spell") {
      promptHtml = `
        <div class="q-area">
          <div class="q-text">🔊 聽發音，選出正確的拼法</div>
          <button class="speak-btn" id="speak">🔊 再聽一次</button>
        </div>`;
      speak(q.a);
    } else if (q.type === "first") {
      promptHtml = `
        <div class="q-area">
          <div class="q-pic" id="qp">${q.e}</div>
          <div class="q-text">🔊 聽發音，選出這個字「字首的聲音（字母）」</div>
          <div class="q-text small">${q.w}</div>
          <button class="speak-btn" id="speak">🔊 聽發音</button>
        </div>`;
      speak(q.w);
    } else { // rhyme
      promptHtml = `
        <div class="q-area">
          <div class="q-pic" id="qp">${q.e}</div>
          <div class="q-text">🔊 聽發音，選出和這個字「押韻」的字</div>
          <div class="q-text small">${q.w}</div>
          <button class="speak-btn" id="speak">🔊 聽發音</button>
        </div>`;
      speak(q.w);
    }

    root.innerHTML = promptHtml + timerHtml + opts +
      `<div class="items" id="items"></div><div class="feedback" id="fb"></div>`;

    const speakBtn = document.getElementById("speak");
    if (speakBtn) {
      if (q.type === "spell") speakBtn.onclick = () => speak(q.a);
      else speakBtn.onclick = () => speak(q.w);
    }
    document.querySelectorAll("#opts .option").forEach(btn => { btn.onclick = () => choose(btn); });
    bindOptSpeak();
    renderItems();
    if (state.mode === "timed") state.timerId = E.startTimer(questionMs(), () => onTimeout());
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
      E.Sound.correct();
      if (combo >= 3) E.Sound.combo();
      fb.className = "feedback ok";
      const mult = E.comboMultiplier(combo);
      fb.textContent = `✅ 答對了！+${gain}⭐${mult > 1 ? `（連擊 ${mult}x）` : ""}`;
      if (q.type === "spell" || q.type === "rhyme") speak(q.a);
      if (combo >= 3) E.comboBanner(combo);
      const dropped = E.maybeDropItem({ canHeal: false });
      if (dropped) { E.toast(`🎁 獲得道具：${E.ITEMS[dropped].name}！`); renderItems(); }
    } else {
      btn.classList.add("wrong");
      buttons.forEach(b => { if (b.dataset.a === q.a) b.classList.add("correct"); });
      E.breakCombo();
      E.Sound.wrong();
      fb.className = "feedback no";
      fb.textContent = `❌ 正確是 ${q.a}`;
      state.wrongList.push({ q: (q.e ? q.e + " " : "") + (q.w || q.a), a: q.a, ex: "" });
    }
    updateHud();
    const dwell = btn.dataset.a === q.a ? 1100 : 2800;
    setTimeout(() => {
      state.idx++;
      if (state.idx >= state.questions.length) finish();
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
    E.breakCombo();
    E.Sound.wrong();
    fb.className = "feedback no";
    fb.textContent = `⏰ 時間到！正確是 ${q.a}`;
    state.wrongList.push({ q: (q.e ? q.e + " " : "") + (q.w || q.a), a: q.a, ex: "" });
    updateHud();
    setTimeout(() => {
      state.idx++;
      if (state.idx >= state.questions.length) finish();
      else renderQuestion();
    }, 2900);
  }

  function updateHud() {
    document.getElementById("hud-score").textContent = `⭐ ${state.points}`;
    document.getElementById("hud-prog").textContent = `第 ${Math.min(state.idx + 1, TOTAL)} / ${TOTAL} 題`;
    const combo = E.getCombo();
    const cc = document.getElementById("hud-combo");
    if (combo >= 2) {
      const m = E.comboMultiplier(combo);
      cc.style.display = "inline-block";
      cc.textContent = `🔥 x${combo}${m > 1 ? ` · ${m}x分` : ""}`;
    } else cc.style.display = "none";
  }

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
    }
  }

  function finish() {
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    const score = state.correct;
    const pct = score / TOTAL;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
    const perfect = score === TOTAL && TOTAL > 0;
    const res = E.recordRound("ph", {
      correct: score, total: TOTAL, points: state.points,
      bestCombo: state.maxCombo, perfect, stars
    });
    if (state.wrongList.length) {
      E.recordWrong(state.wrongList.map(w => ({ grade: state.grade, subject: "ph", q: w.q, a: w.a, ex: w.ex })));
    }
    const msg = stars === 3 ? "發音小高手！全部都會！" :
                stars === 2 ? "很棒！多聽多練更厲害！" :
                stars === 1 ? "不錯喔，繼續加油！" : "多聽多讀，你一定可以的！";
    saveProgress(state.grade, "ph", stars);
    E.confetti();
    E.Sound.win();
    const badgeHtml = res.newlyUnlocked.length
      ? `<div class="badge-pop">🎉 解鎖新徽章：${res.newlyUnlocked.map(b => `${b.emoji} ${b.name}`).join("　")}</div>`
      : "";
    const reviewHtml = state.wrongList.length
      ? `<div class="review-box">
           <div class="review-title">📒 今日錯題回顧（${state.wrongList.length} 題）</div>
           ${state.wrongList.map(w => `<div class="review-item"><div class="rq">${w.q}</div><div class="ra">正解：${w.a}</div></div>`).join("")}
         </div>`
      : "";
    const root = document.getElementById("game-content");
    root.innerHTML = `
      <div class="card result-card">
        <div class="big-emoji">${stars === 3 ? "🏆" : stars >= 1 ? "🌟" : "💪"}</div>
        <h2>${msg}</h2>
        <div class="score">答對 ${score} / ${TOTAL}　得分 ⭐ ${state.points}　最高連擊 x${state.maxCombo}</div>
        <div class="score">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
        ${badgeHtml}
        ${reviewHtml}
        <div class="result-actions">
          <button class="btn primary" id="again">再玩一次</button>
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

  window.PHONICS_GAME = { start };
})();
