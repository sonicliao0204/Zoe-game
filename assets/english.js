/* =========================================================================
 * 英文遊戲：看圖選字（Emoji 圖示 → 選正確英文單字）
 *  - 依年級載入單字庫（來自 data.js 的 GAME_DATA.EN_WORDS）
 *  - 每回合 10 題，四選一，含 Web Speech API 英文發音
 *  - 計分、星星、鼓勵回饋，進度存 localStorage
 * ========================================================================= */
(function () {
  const D = window.GAME_DATA;
  const TOTAL = 10;

  let state = null;

  function speak(word) {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 發音失敗不影響遊戲 */ }
  }

  function start(grade) {
    const bank = D.EN_WORDS[grade];
    state = {
      grade,
      bank,
      idx: 0,
      score: 0,
      questions: buildQuestions(bank)
    };
    renderQuestion();
  }

  function buildQuestions(bank) {
    const qs = [];
    const pool = bank.slice();
    for (let i = 0; i < TOTAL && pool.length; i++) {
      const correct = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      // 干擾項：從同字庫隨抽 3 個不同單字
      const others = bank.filter(w => w.w !== correct.w);
      const wrongs = [];
      const tmp = others.slice();
      for (let j = 0; j < 3 && tmp.length; j++) {
        wrongs.push(tmp.splice(Math.floor(Math.random() * tmp.length), 1)[0].w);
      }
      const options = shuffle([correct.w, ...wrongs]).slice(0, 4);
      qs.push({ pic: correct.e, word: correct.w, zh: correct.z, options });
    }
    return qs;
  }

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
        <div class="q-pic" id="qp">${q.pic}</div>
        <button class="speak-btn" id="speak">🔊 聽發音</button>
        <div class="q-text">這個圖案是什麼英文？</div>
      </div>
      <div class="options" id="opts">
        ${q.options.map((o, i) => `<button class="option" data-w="${o}">${o}</button>`).join("")}
      </div>
      <div class="feedback" id="fb"></div>
    `;
    document.getElementById("speak").onclick = () => speak(q.word);
    speak(q.word); // 自動發音一次

    document.querySelectorAll("#opts .option").forEach(btn => {
      btn.onclick = () => choose(btn, q);
    });
    updateHud();
  }

  function choose(btn, q) {
    const buttons = document.querySelectorAll("#opts .option");
    buttons.forEach(b => b.disabled = true);
    const fb = document.getElementById("fb");
    if (btn.dataset.w === q.word) {
      btn.classList.add("correct");
      state.score++;
      fb.className = "feedback ok";
      fb.textContent = `✅ 答對了！${q.z} = ${q.word}`;
      speak(q.word);
    } else {
      btn.classList.add("wrong");
      buttons.forEach(b => { if (b.dataset.w === q.word) b.classList.add("correct"); });
      fb.className = "feedback no";
      fb.textContent = `❌ 正確是 ${q.word}（${q.z}）`;
    }
    updateHud();
    setTimeout(() => {
      state.idx++;
      if (state.idx >= state.questions.length) finish();
      else renderQuestion();
    }, 1100);
  }

  function updateHud() {
    document.getElementById("hud-score").textContent = `⭐ ${state.score}/${TOTAL}`;
    document.getElementById("hud-prog").textContent = `第 ${Math.min(state.idx + 1, TOTAL)} / ${TOTAL} 題`;
  }

  function finish() {
    const score = state.score;
    const pct = score / TOTAL;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
    const msg = stars === 3 ? "太厲害了！全部都會！" :
                stars === 2 ? "很棒！再練一下更厲害！" :
                stars === 1 ? "不錯喔，繼續加油！" : "多聽多練，你一定可以的！";
    saveProgress(state.grade, "en", stars);
    confetti();
    const root = document.getElementById("game-content");
    root.innerHTML = `
      <div class="card result-card">
        <div class="big-emoji">${stars === 3 ? "🏆" : stars >= 1 ? "🌟" : "💪"}</div>
        <h2>${msg}</h2>
        <div class="score">得分 ${score} / ${TOTAL}　${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
        <div class="result-actions">
          <button class="btn primary" id="again">再玩一次</button>
          <button class="btn ghost" id="home">回到首頁</button>
        </div>
      </div>`;
    document.getElementById("again").onclick = () => start(state.grade);
    document.getElementById("home").onclick = () => window.APP.goHome();
    document.getElementById("hud-score").textContent = `⭐ ${score}/${TOTAL}`;
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

  window.EN_GAME = { start };
})();
