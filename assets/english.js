/* =========================================================================
 * 英文遊戲：看圖選字 / 聽力拼字 / 句型選詞 / 閱讀理解
 * 依年級載入內容（來自 data.js 的 GAME_DATA）
 *  - 每回合 10 題，混合四種題型，四（或六）選一，含 Web Speech API 英文發音
 *  - 難度：簡單=4選1隨機干擾；普通/困難=4/6選1且用近似單字當干擾
 *  - 模式：休閒（無限時）/ 計時（每題倒數）
 *  - 連擊分級倍率（combo 3→1.2x / 5→1.5x / 10→2x）；選項可點擊單字發音
 *  - 錯題記錄 + 結算「今日錯題回顧」
 *  - 計分、星星、徽章統計、錯題本，進度與統計皆存 localStorage
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
      u.rate = 0.9;
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
      questions: buildQuestions(grade, difficulty), wrongList: []
    };
    renderQuestion();
  }

  /* ---------- 題目建構：混合四種題型 ---------- */
  function pickDistractors(bank, correct, count, difficulty) {
    const pool = bank.filter(w => w.w !== correct);
    let candidates;
    if (difficulty === "easy") {
      candidates = shuffle(pool);
    } else {
      const close = pool.filter(w =>
        Math.abs(w.w.length - correct.length) <= 1 || w.w[0] === correct[0]);
      candidates = close.length >= count ? shuffle(close) : shuffle(pool);
    }
    return candidates.slice(0, count).map(w => w.w);
  }

  function wrongSpell(word) {
    const idxs = [];
    for (let i = 0; i < word.length; i++) if (word[i] !== " ") idxs.push(i);
    if (idxs.length < 4) return null;
    const i = idxs[ri(0, idxs.length - 1)];
    const c = word[i];
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let nc = c; while (nc === c) nc = letters[ri(0, 25)];
    const arr = word.split(""); arr[i] = nc;
    const s = arr.join("");
    return s === word ? null : s;
  }

  function buildQuestions(grade, difficulty) {
    const optionsCount = difficulty === "hard" ? 6 : 4;
    const wordBank = D.EN_WORDS[grade];
    const sentBank = D.EN_SENTENCES[grade] || [];
    const readBank = D.EN_READING[grade] || [];
    const types = ["pic", "spell", "sentence", "reading"];
    const qs = [];
    for (let i = 0; i < TOTAL; i++) {
      let t = types[Math.floor(Math.random() * types.length)];
      if (t === "sentence" && !sentBank.length) t = "pic";
      if (t === "reading" && !readBank.length) t = "pic";

      if (t === "pic") {
        const correct = wordBank[Math.floor(Math.random() * wordBank.length)];
        const distractors = pickDistractors(wordBank, correct.w, optionsCount - 1, difficulty);
        const options = shuffle([correct.w, ...distractors]).slice(0, optionsCount);
        qs.push({ type: "pic", pic: correct.e, a: correct.w, zh: correct.z, options });
      } else if (t === "spell") {
        const correct = wordBank[Math.floor(Math.random() * wordBank.length)];
        const wrongs = [];
        let guard = 0;
        while (wrongs.length < optionsCount - 1 && guard < 30) {
          const w = wrongSpell(correct.w);
          if (w && !wrongs.includes(w) && w !== correct.w) wrongs.push(w);
          guard++;
        }
        const options = shuffle([correct.w, ...wrongs]).slice(0, optionsCount);
        qs.push({ type: "spell", a: correct.w, zh: correct.z, options });
      } else if (t === "sentence") {
        const s = sentBank[Math.floor(Math.random() * sentBank.length)];
        qs.push({ type: "sentence", s: s.s, a: s.a, options: shuffle(s.opts.slice()), ex: s.ex });
      } else {
        const r = readBank[Math.floor(Math.random() * readBank.length)];
        qs.push({ type: "reading", text: r.text, q: r.q, a: r.a, options: shuffle(r.opts.slice()) });
      }
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

  /* 選項 HTML：看圖/拼字題加上可點擊發音的小喇叭 */
  function optsHtml(q) {
    const speakable = (q.type === "pic" || q.type === "spell");
    return `<div class="options" id="opts">${q.options.map(o =>
      `<button class="option" data-w="${o}">${o}${speakable ? `<span class="opt-speak" data-sp="${o}">🔊</span>` : ""}</button>`
    ).join("")}</div>`;
  }

  function bindOptSpeak() {
    document.querySelectorAll("#opts .opt-speak").forEach(s => {
      s.onclick = (e) => { e.stopPropagation(); E.Sound.click(); speak(s.dataset.sp); };
    });
  }

  /* ---------- 題目渲染（依題型） ---------- */
  function renderQuestion() {
    if (state.timerId) { state.timerId.stop(); state.timerId = null; }
    state.answered = false;
    const q = state.questions[state.idx];
    state.current = q;
    const root = document.getElementById("game-content");
    const timerHtml = state.mode === "timed" ? '<div class="timer"><div class="timer-bar" id="tbar"></div></div>' : "";
    const opts = optsHtml(q);

    let promptHtml = "";
    if (q.type === "pic") {
      promptHtml = `
        <div class="q-area">
          <div class="q-pic" id="qp">${q.pic}</div>
          <button class="speak-btn" id="speak">🔊 聽發音</button>
          <div class="q-text">這個圖案是什麼英文？</div>
        </div>`;
      if (state.mode === "timed") speak(q.a);
    } else if (q.type === "spell") {
      promptHtml = `
        <div class="q-area">
          <div class="q-text">🔊 聽發音，選出正確拼法（${q.zh}）</div>
          <button class="speak-btn" id="speak">🔊 再聽一次</button>
        </div>`;
      speak(q.a);
    } else if (q.type === "sentence") {
      promptHtml = `
        <div class="q-area">
          <div class="q-text passage">${q.s.replace("___", "＿＿＿＿")}</div>
          <button class="speak-btn" id="speak">🔊 聽句子</button>
          <div class="q-text small">選出空白處正確的詞</div>
        </div>`;
      speak(q.s.replace("___", q.a));
    } else {
      promptHtml = `
        <div class="q-area">
          <div class="q-text passage">${q.text}</div>
          <div class="q-text">${q.q}</div>
        </div>`;
    }

    root.innerHTML = promptHtml + timerHtml + opts +
      `<div class="items" id="items"></div><div class="feedback" id="fb"></div>`;

    const speakBtn = document.getElementById("speak");
    if (speakBtn) {
      if (q.type === "pic" || q.type === "spell") speakBtn.onclick = () => speak(q.a);
      else if (q.type === "sentence") speakBtn.onclick = () => speak(q.s.replace("___", q.a));
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
    if (btn.dataset.w === q.a) {
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
      fb.textContent = (q.type === "reading" ? "✅ 答對了！" : `✅ 答對了！${q.a}`) +
        ` +${gain}⭐${mult > 1 ? `（連擊 ${mult}x）` : ""}`;
      if (q.type === "pic" || q.type === "spell") speak(q.a);
      if (combo >= 3) E.comboBanner(combo);
      const dropped = E.maybeDropItem({ canHeal: false });
      if (dropped) { E.toast(`🎁 獲得道具：${E.ITEMS[dropped].name}！`); renderItems(); }
    } else {
      btn.classList.add("wrong");
      buttons.forEach(b => { if (b.dataset.w === q.a) b.classList.add("correct"); });
      E.breakCombo();
      E.Sound.wrong();
      fb.className = "feedback no";
      fb.textContent = `❌ 正確是 ${q.a}`;
      state.wrongList.push({ q: q.type === "reading" ? q.text + " ｜ " + q.q : (q.pic ? q.pic + " " : "") + q.a, a: q.a, ex: "" });
    }
    updateHud();
    const dwell = btn.dataset.w === q.a ? 1100 : 2800;
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
    state.wrongList.push({ q: q.type === "reading" ? q.text + " ｜ " + q.q : (q.pic ? q.pic + " " : "") + q.a, a: q.a, ex: "" });
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
      const ok = E.useFifty(document.querySelectorAll("#opts .option"), state.current.a, "w");
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
    const res = E.recordRound("en", {
      correct: score, total: TOTAL, points: state.points,
      bestCombo: state.maxCombo, perfect, stars
    });
    if (state.wrongList.length) {
      E.recordWrong(state.wrongList.map(w => ({ grade: state.grade, subject: "en", q: w.q, a: w.a, ex: w.ex })));
    }
    const msg = stars === 3 ? "太厲害了！全部都會！" :
                stars === 2 ? "很棒！再練一下更厲害！" :
                stars === 1 ? "不錯喔，繼續加油！" : "多聽多練，你一定可以的！";
    saveProgress(state.grade, "en", stars);
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

  window.EN_GAME = { start };
})();
