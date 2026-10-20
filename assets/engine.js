/* =========================================================================
 * 共享遊戲引擎：連擊(Combo) / 道具(Items) / 倒數計時(Timer) / 統計與徽章(Badges)
 *  - 設計為純邏輯＋輕量 DOM 操作，供英文與數學兩套遊戲共用，避免重複與不一致。
 *  - 所有狀態以「單局」為生命週期（start 時 reset），統計才寫入 localStorage。
 * ========================================================================= */
(function () {
  const LS_STATS = "learnGameStats";

  /* ---------------------- 徽章定義 ----------------------
   * 每個徽章有 emoji、名稱、說明，與一個判定函式（傳入累積統計 s）。
   * 統計欄位：rounds(完成回合數)、totalCorrect、enCorrect、maCorrect、
   *           bestScore(歷史最高分)、bestCombo(歷史最高連擊)、perfect(滿分回合數)。
   */
  const BADGES = [
    { id: "first",   emoji: "🌟", name: "初學者",     desc: "完成第一回合",      test: s => s.rounds >= 1 },
    { id: "word",    emoji: "📚", name: "單字小達人", desc: "英文累積答對 30 題", test: s => s.enCorrect >= 30 },
    { id: "math",    emoji: "⚡", name: "心算閃電俠", desc: "數學累積答對 30 題", test: s => s.maCorrect >= 30 },
    { id: "combo",   emoji: "🔥", name: "連擊大師",   desc: "單局連擊達到 5",     test: s => s.bestCombo >= 5 },
    { id: "perfect", emoji: "🏆", name: "滿分高手",   desc: "一回合拿滿 3 顆星",   test: s => s.perfect >= 1 },
    { id: "cent",    emoji: "💯", name: "百題斬",     desc: "累積答對 100 題",    test: s => s.totalCorrect >= 100 },
    { id: "king",    emoji: "👑", name: "學習之王",   desc: "累積完成 20 回合",   test: s => s.rounds >= 20 }
  ];

  function defaultStats() {
    return { rounds: 0, totalCorrect: 0, enCorrect: 0, maCorrect: 0, bestScore: 0, bestCombo: 0, perfect: 0 };
  }
  function loadStats() {
    try { return JSON.parse(localStorage.getItem(LS_STATS) || "{}"); }
    catch (e) { return {}; }
  }
  function saveStats(s) {
    try { localStorage.setItem(LS_STATS, JSON.stringify(s)); } catch (e) { /* 不可用時略過 */ }
  }
  function getStats() { return Object.assign(defaultStats(), loadStats()); }
  function getUnlocked() { const s = getStats(); return BADGES.filter(b => b.test(s)); }

  /* 紀錄一回合結束，回傳 { stats, newlyUnlocked:[徽章] } */
  function recordRound(subject, data) {
    const before = getUnlocked().map(b => b.id);
    const s = Object.assign(defaultStats(), loadStats());
    s.rounds += 1;
    s.totalCorrect += data.correct;
    if (subject === "en") s.enCorrect += data.correct; else s.maCorrect += data.correct;
    if (data.points > s.bestScore) s.bestScore = data.points;
    if (data.bestCombo > s.bestCombo) s.bestCombo = data.bestCombo;
    if (data.perfect) s.perfect += 1;
    saveStats(s);
    const after = BADGES.filter(b => b.test(s)).map(b => b.id);
    const newly = after.filter(id => !before.includes(id));
    return { stats: s, newlyUnlocked: BADGES.filter(b => newly.includes(b.id)) };
  }

  /* ---------------------- 連擊 Combo ---------------------- */
  let combo = 0;
  function resetCombo() { combo = 0; }
  function bumpCombo() { combo++; return combo; }
  function breakCombo() { combo = 0; }
  function getCombo() { return combo; }
  // combo >= 3 時，本題得分加倍
  function pointsForCorrect(base) { return combo >= 3 ? base * 2 : base; }

  /* ---------------------- 道具 Items ----------------------
   * fifty：刪去一個錯誤選項；heal：生命 +1（僅數學有意義）
   */
  const ITEMS = {
    fifty: { emoji: "🔆", name: "刪去一半", desc: "刪掉一個錯誤選項" },
    heal:  { emoji: "💊", name: "回血道具", desc: "生命 +1" }
  };
  let inventory = [];
  function resetItems() { inventory = []; }
  function grantItem(type) { if (ITEMS[type]) inventory.push(type); }
  function hasItem(type) { return inventory.includes(type); }
  function consumeItem(type) { const i = inventory.indexOf(type); if (i >= 0) inventory.splice(i, 1); }
  function getInventory() { return inventory.slice(); }

  // 連擊 >= 2 時，約 35% 機率掉落一個道具；canHeal=false 時只掉 fifty
  function maybeDropItem(opts) {
    if (combo < 2) return null;
    if (Math.random() > 0.35) return null;
    const pool = (opts && opts.canHeal) ? ["fifty", "heal"] : ["fifty"];
    const t = pool[Math.floor(Math.random() * pool.length)];
    grantItem(t);
    return t;
  }
  // 禁用一個錯誤選項；buttons 為 NodeList，correctVal 為正確值，attr 為 data 屬性名
  function useFifty(buttons, correctVal, attr) {
    const wrong = Array.from(buttons).filter(b => b.dataset[attr] !== correctVal && !b.disabled);
    if (wrong.length <= 1) return false;
    const pickOne = wrong[Math.floor(Math.random() * wrong.length)];
    pickOne.disabled = true;
    pickOne.classList.add("dimmed");
    return true;
  }

  /* ---------------------- 倒數計時 Timer ----------------------
   * durationMs 為總時長；每 100ms 更新 #tbar 寬度；歸零呼叫 onTimeout
   */
  function startTimer(durationMs, onTimeout) {
    const bar = document.getElementById("tbar");
    if (!bar) return null;
    const steps = Math.max(1, Math.round(durationMs / 100));
    let remain = steps;
    const id = setInterval(() => {
      remain--;
      if (bar) bar.style.width = Math.max(0, remain / steps * 100) + "%";
      if (remain <= 0) { clearInterval(id); onTimeout(); }
    }, 100);
    return { stop() { clearInterval(id); } };
  }

  /* ---------------------- 提示 Toast ---------------------- */
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast"; t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------------------- Combo 橫幅 ---------------------- */
  function comboBanner(n) {
    const b = document.createElement("div");
    b.className = "combo-banner";
    b.textContent = `🔥 Combo x${n}!`;
    document.body.appendChild(b);
    requestAnimationFrame(() => b.classList.add("show"));
    setTimeout(() => b.classList.add("pop-out"), 850);
    setTimeout(() => b.remove(), 1100);
  }

  /* ---------------------- 灑花 Confetti ---------------------- */
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

  window.ENGINE = {
    BADGES, ITEMS,
    recordRound, getStats, getUnlocked,
    resetCombo, bumpCombo, breakCombo, getCombo, pointsForCorrect,
    resetItems, grantItem, hasItem, consumeItem, getInventory, maybeDropItem, useFifty,
    startTimer, toast, comboBanner, confetti
  };
})();
