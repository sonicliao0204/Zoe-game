/* =========================================================================
 * 共享遊戲引擎：連擊(Combo) / 道具(Items) / 倒數計時(Timer) / 統計與徽章(Badges)
 *            / 音效(Sound) / 靜音(Mute) / 錯題本(WrongLog) / 收集冊(Collectibles)
 *  - 設計為純邏輯＋輕量 DOM 操作，供英文與數學兩套遊戲共用，避免重複與不一致。
 *  - 所有狀態以「單局」為生命週期（start 時 reset），統計才寫入 localStorage。
 * ========================================================================= */
(function () {
  const LS_STATS = "learnGameStats";
  const LS_MUTE = "learnGameMuted";
  const LS_WRONG = "learnGameWrongLog";

  /* ---------------------- 徽章定義 ----------------------
   * 每個徽章有 emoji、名稱、說明，與一個判定函式（傳入累積統計 s）。
   * 統計欄位：rounds / totalCorrect / enCorrect / maCorrect / bestScore /
   *           bestCombo / perfect / totalStars / dayStreak。
   */
  const BADGES = [
    { id: "first",   emoji: "🌟", name: "初學者",     desc: "完成第一回合",      test: s => s.rounds >= 1 },
    { id: "word",    emoji: "📚", name: "單字小達人", desc: "英文累積答對 30 題", test: s => s.enCorrect >= 30 },
    { id: "math",    emoji: "⚡", name: "心算閃電俠", desc: "數學累積答對 30 題", test: s => s.maCorrect >= 30 },
    { id: "combo",   emoji: "🔥", name: "連擊大師",   desc: "單局連擊達到 5",     test: s => s.bestCombo >= 5 },
    { id: "perfect", emoji: "🏆", name: "滿分高手",   desc: "一回合拿滿 3 顆星",   test: s => s.perfect >= 1 },
    { id: "cent",    emoji: "💯", name: "百題斬",     desc: "累積答對 100 題",    test: s => s.totalCorrect >= 100 },
    { id: "king",    emoji: "👑", name: "學習之王",   desc: "累積完成 20 回合",   test: s => s.rounds >= 20 },
    { id: "vocab",   emoji: "🧠", name: "單字記憶大師", desc: "英文累積答對 50 題", test: s => s.enCorrect >= 50 },
    { id: "mult",    emoji: "➗", name: "乘法小天才", desc: "數學累積答對 50 題", test: s => s.maCorrect >= 50 },
    { id: "streak3", emoji: "📅", name: "打卡達人",   desc: "連續 3 天來玩",      test: s => s.dayStreak >= 3 }
  ];

  /* 收集冊：用「累積星星（totalStars）」解鎖的虛擬寵物配件 */
  const COLLECTIBLES = [
    { id: "hat",     emoji: "🎩", name: "小博士帽",   need: 10 },
    { id: "glasses", emoji: "👓", name: "智慧眼鏡",   need: 30 },
    { id: "scarf",   emoji: "🧣", name: "溫暖圍巾",   need: 60 },
    { id: "cape",    emoji: "🦸", name: "超人披風",   need: 100 },
    { id: "crown",   emoji: "👑", name: "王者皇冠",   need: 180 },
    { id: "rocket",  emoji: "🚀", name: "升空火箭",   need: 280 }
  ];

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function defaultStats() {
    return { rounds: 0, totalCorrect: 0, enCorrect: 0, maCorrect: 0, phCorrect: 0, bestScore: 0, bestCombo: 0,
             perfect: 0, totalStars: 0, lastDay: "", dayStreak: 0 };
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
    if (subject === "en") s.enCorrect += data.correct;
    else if (subject === "ph") s.phCorrect += data.correct;
    else s.maCorrect += data.correct;
    if (data.points > s.bestScore) s.bestScore = data.points;
    if (data.bestCombo > s.bestCombo) s.bestCombo = data.bestCombo;
    if (data.perfect) s.perfect += 1;
    if (typeof data.stars === "number") s.totalStars += data.stars;
    // 打卡連續天數：與上次不同天才計；昨天 +1，更久則歸 1
    const t = todayStr();
    if (s.lastDay !== t) {
      if (s.lastDay) {
        const prev = new Date(s.lastDay), cur = new Date(t);
        const diff = Math.round((cur - prev) / 86400000);
        s.dayStreak = diff === 1 ? s.dayStreak + 1 : 1;
      } else {
        s.dayStreak = 1;
      }
      s.lastDay = t;
    }
    saveStats(s);
    const after = BADGES.filter(b => b.test(s)).map(b => b.id);
    const newly = after.filter(id => !before.includes(id));
    return { stats: s, newlyUnlocked: BADGES.filter(b => newly.includes(b.id)) };
  }

  function getCollectibles() {
    const s = getStats();
    return COLLECTIBLES.map(c => Object.assign({}, c, { unlocked: s.totalStars >= c.need }));
  }

  /* ---------------------- 錯題本 WrongLog ---------------------- */
  function recordWrong(items) {
    try {
      const arr = JSON.parse(localStorage.getItem(LS_WRONG) || "[]");
      const d = todayStr();
      (items || []).forEach(it => arr.push(Object.assign({ date: d }, it)));
      while (arr.length > 80) arr.shift();
      localStorage.setItem(LS_WRONG, JSON.stringify(arr));
    } catch (e) { /* 略過 */ }
  }
  function getWrongLog() {
    try { return JSON.parse(localStorage.getItem(LS_WRONG) || "[]"); } catch (e) { return []; }
  }
  function clearWrongLog() { try { localStorage.removeItem(LS_WRONG); } catch (e) {} }

  /* ---------------------- 連擊 Combo（分級倍率） ----------------------
   * 連對 3 題 1.2x、5 題 1.5x、10 題 2.0x；其餘 1.0x。
   */
  let combo = 0;
  function resetCombo() { combo = 0; }
  function bumpCombo() { combo++; return combo; }
  function breakCombo() { combo = 0; }
  function getCombo() { return combo; }
  function comboMultiplier(c) {
    if (c >= 10) return 2.0;
    if (c >= 5) return 1.5;
    if (c >= 3) return 1.2;
    return 1.0;
  }
  function comboPoints(base) { return Math.round(base * comboMultiplier(getCombo())); }
  // 舊名相容
  function pointsForCorrect(base) { return comboPoints(base); }

  function comboTier(c) {
    if (c >= 10) return { text: "🏆 神算手！", big: true };
    if (c >= 5) return { text: "⚡ Awesome!", big: true };
    if (c >= 3) return { text: "🔥 Nice!", big: false };
    return null;
  }

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
  function useFifty(buttons, correctVal, attr) {
    const wrong = Array.from(buttons).filter(b => b.dataset[attr] !== correctVal && !b.disabled);
    if (wrong.length <= 1) return false;
    const pickOne = wrong[Math.floor(Math.random() * wrong.length)];
    pickOne.disabled = true;
    pickOne.classList.add("dimmed");
    return true;
  }

  /* ---------------------- 倒數計時 Timer ---------------------- */
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

  /* ---------------------- Combo 橫幅（分級特效） ---------------------- */
  function comboBanner(n) {
    const tier = comboTier(n);
    const b = document.createElement("div");
    b.className = "combo-banner" + (tier && tier.big ? " big" : "");
    b.textContent = (tier ? tier.text + " " : "🔥 Combo ") + `x${n}!`;
    document.body.appendChild(b);
    requestAnimationFrame(() => b.classList.add("show"));
    setTimeout(() => b.classList.add("pop-out"), 850);
    setTimeout(() => b.remove(), 1100);
    // 高連擊額外灑花
    if (n >= 5) confetti();
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

  /* ---------------------- 音效 Sound（Web Audio 合成，免音檔） ---------------------- */
  const Sound = (function () {
    let ctx = null;
    let muted = false;
    try { muted = localStorage.getItem(LS_MUTE) === "1"; } catch (e) {}
    function ac() {
      if (!ctx) {
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { ctx = null; }
      }
      return ctx;
    }
    function tone(freq, dur, type, vol, when) {
      const c = ac(); if (!c) return;
      const t0 = c.currentTime + (when || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || "square"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }
    function seq(notes) { notes.forEach(n => tone(n[0], n[1], n[2], n[3], n[4])); }
    const api = {
      click()   { if (muted) return; tone(620, 0.05, "square", 0.10); },
      correct() { if (muted) return; seq([[880, 0.09, "sine", 0.18], [1320, 0.12, "sine", 0.18, 0.09]]); },
      wrong()   { if (muted) return; tone(190, 0.22, "sawtooth", 0.16); },
      combo()   { if (muted) return; seq([[988, 0.07, "square", 0.16], [1319, 0.09, "square", 0.16, 0.07], [1568, 0.11, "square", 0.16, 0.15]]); },
      win()     { if (muted) return; seq([[523, 0.12, "triangle", 0.2], [659, 0.12, "triangle", 0.2, 0.12], [784, 0.12, "triangle", 0.2, 0.24], [1047, 0.22, "triangle", 0.2, 0.36]]); },
      revive()  { if (muted) return; seq([[440, 0.12, "sine", 0.18], [660, 0.14, "sine", 0.18, 0.12], [880, 0.16, "sine", 0.18, 0.26]]); },
      setMuted(m) { muted = !!m; try { localStorage.setItem(LS_MUTE, muted ? "1" : "0"); } catch (e) {} },
      isMuted() { return muted; },
      toggle() { this.setMuted(!muted); return muted; },
      resume() { const c = ac(); if (c && c.state === "suspended") c.resume(); }
    };
    return api;
  })();

  window.ENGINE = {
    BADGES, COLLECTIBLES, ITEMS, Sound,
    recordRound, getStats, getUnlocked, getCollectibles,
    recordWrong, getWrongLog, clearWrongLog,
    resetCombo, bumpCombo, breakCombo, getCombo,
    comboMultiplier, comboPoints, pointsForCorrect, comboTier,
    resetItems, grantItem, hasItem, consumeItem, getInventory, maybeDropItem, useFifty,
    startTimer, toast, comboBanner, confetti
  };
})();
