/* =========================================================================
 * 資料層：依據中華民國教育部「108 課程綱要」國民小學階段（三~六年級）
 * 的英語文與數學學習內容，整理為遊戲可用的資料結構。
 *
 * 內容依據說明（重要）：
 *  - 單字主題與數學單元參考 108 課綱「英語文」與「數學」領域之學習重點。
 *  - 本檔為「代表性示例字表／題型」，正式上線前應以教育部公布的
 *    官方課綱字表與學校教材逐項核對、替換，避免遺漏或偏差。
 *  - 來源框架：教育部《國民小學暨普通型高中課程綱要》（108 課綱）。
 * ========================================================================= */

/* ---------------------- 英文單字庫（看圖選字用） ----------------------
 * 每筆：{ e: emoji 圖示, w: 英文單字, z: 中文意思 }
 * 分年級依 108 課綱常見主題分類。
 */
const EN_WORDS = {
  3: [
    { e: "🐱", w: "cat", z: "貓" },
    { e: "🐶", w: "dog", z: "狗" },
    { e: "🐰", w: "rabbit", z: "兔子" },
    { e: "🐻", w: "bear", z: "熊" },
    { e: "🐭", w: "mouse", z: "老鼠" },
    { e: "🍎", w: "apple", z: "蘋果" },
    { e: "🍌", w: "banana", z: "香蕉" },
    { e: "🍞", w: "bread", z: "麵包" },
    { e: "🥛", w: "milk", z: "牛奶" },
    { e: "🍪", w: "cookie", z: "餅乾" },
    { e: "🔴", w: "red", z: "紅色" },
    { e: "🔵", w: "blue", z: "藍色" },
    { e: "🟡", w: "yellow", z: "黃色" },
    { e: "🟢", w: "green", z: "綠色" },
    { e: "👁️", w: "eye", z: "眼睛" },
    { e: "👃", w: "nose", z: "鼻子" },
    { e: "👄", w: "mouth", z: "嘴巴" },
    { e: "✋", w: "hand", z: "手" },
    { e: "👨", w: "father", z: "爸爸" },
    { e: "👩", w: "mother", z: "媽媽" },
    { e: "👦", w: "brother", z: "兄弟" },
    { e: "👧", w: "sister", z: "姐妹" },
    { e: "✏️", w: "pencil", z: "鉛筆" },
    { e: "📕", w: "book", z: "書" },
    { e: "🎒", w: "bag", z: "書包" },
    { e: "✂️", w: "scissors", z: "剪刀" },
    { e: "⚽", w: "ball", z: "球" },
    { e: "🎈", w: "balloon", z: "氣球" }
  ],
  4: [
    { e: "👕", w: "shirt", z: "襯衫" },
    { e: "👖", w: "pants", z: "褲子" },
    { e: "👟", w: "shoes", z: "鞋子" },
    { e: "🧥", w: "coat", z: "外套" },
    { e: "🧦", w: "socks", z: "襪子" },
    { e: "☀️", w: "sun", z: "太陽" },
    { e: "☔", w: "rain", z: "雨" },
    { e: "❄️", w: "snow", z: "雪" },
    { e: "🌬️", w: "wind", z: "風" },
    { e: "📅", w: "Monday", z: "星期一" },
    { e: "📅", w: "Tuesday", z: "星期二" },
    { e: "📅", w: "Wednesday", z: "星期三" },
    { e: "📅", w: "Friday", z: "星期五" },
    { e: "⚽", w: "soccer", z: "足球" },
    { e: "🏀", w: "basketball", z: "籃球" },
    { e: "🏊", w: "swim", z: "游泳" },
    { e: "🎨", w: "art", z: "美術" },
    { e: "🎵", w: "music", z: "音樂" },
    { e: "📖", w: "reading", z: "閱讀" },
    { e: "🏫", w: "school", z: "學校" },
    { e: "🏠", w: "home", z: "家" },
    { e: "🏪", w: "store", z: "商店" },
    { e: "🌳", w: "tree", z: "樹" },
    { e: "🌸", w: "flower", z: "花" }
  ],
  5: [
    { e: "👩‍⚕️", w: "doctor", z: "醫生" },
    { e: "👨‍🏫", w: "teacher", z: "老師" },
    { e: "👨‍🚒", w: "firefighter", z: "消防員" },
    { e: "👮", w: "police", z: "警察" },
    { e: "🚗", w: "car", z: "汽車" },
    { e: "🚌", w: "bus", z: "公車" },
    { e: "🚲", w: "bike", z: "腳踏車" },
    { e: "✈️", w: "plane", z: "飛機" },
    { e: "🏥", w: "hospital", z: "醫院" },
    { e: "🏞️", w: "park", z: "公園" },
    { e: "🏖️", w: "beach", z: "海灘" },
    { e: "😀", w: "happy", z: "開心" },
    { e: "😢", w: "sad", z: "難過" },
    { e: "😴", w: "sleepy", z: "想睡" },
    { e: "😡", w: "angry", z: "生氣" },
    { e: "🍕", w: "pizza", z: "披薩" },
    { e: "🍔", w: "hamburger", z: "漢堡" },
    { e: "🍦", w: "ice cream", z: "冰淇淋" },
    { e: "🥤", w: "juice", z: "果汁" },
    { e: "📚", w: "books", z: "書本" },
    { e: "⌚", w: "clock", z: "時鐘" },
    { e: "🗺️", w: "map", z: "地圖" }
  ],
  6: [
    { e: "🇺🇸", w: "America", z: "美國" },
    { e: "🇬🇧", w: "England", z: "英國" },
    { e: "🇯🇵", w: "Japan", z: "日本" },
    { e: "🇰🇷", w: "Korea", z: "韓國" },
    { e: "🗣️", w: "English", z: "英文" },
    { e: "🗣️", w: "Chinese", z: "中文" },
    { e: "🗣️", w: "Japanese", z: "日文" },
    { e: "🏃", w: "run", z: "跑" },
    { e: "🚶", w: "walk", z: "走" },
    { e: "🍳", w: "cook", z: "煮飯" },
    { e: "📚", w: "study", z: "讀書" },
    { e: "⭐", w: "big", z: "大的" },
    { e: "🔹", w: "small", z: "小的" },
    { e: "📏", w: "long", z: "長的" },
    { e: "✂️", w: "short", z: "短的" },
    { e: "💪", w: "strong", z: "強壯的" },
    { e: "🌞", w: "hot", z: "熱的" },
    { e: "🧊", w: "cold", z: "冷的" },
    { e: "⛰️", w: "mountain", z: "山" },
    { e: "🌊", w: "ocean", z: "海洋" },
    { e: "🎂", w: "birthday", z: "生日" },
    { e: "🎁", w: "gift", z: "禮物" }
  ]
};

/* ---------------------- 數學題型生成器（四則闖關用） ----------------------
 * 依 108 課綱各年級數學學習重點設計題型與難度。
 * 每個生成器回傳：{ q: 題目字串, a: 正確答案(字串), ex: 簡短說明 }
 * 選項（含干擾項）由通用函式 buildOptions 產生。
 */

function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// 分數干擾項：對 "a b/c" 或 "b/c" 產生相近分數字串
function fractionDistractor(ans, k) {
  const m = String(ans).trim().match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (!m) return String(ans) + k;            // 兜底（不應發生）
  const whole = m[1] ? parseInt(m[1], 10) : 0;
  const num = parseInt(m[2], 10);
  const den = parseInt(m[3], 10);
  const step = Math.ceil(k / 3);
  const mode = k % 3;
  if (mode === 0) return (whole + step) + " " + num + "/" + den;
  if (mode === 1) {
    let nn = num + step;
    if (nn >= den) return (whole + 1) + " " + (nn - den) + "/" + den;
    return whole + " " + nn + "/" + den;
  }
  return whole + " " + num + "/" + (den + step);
}

// 由正確答案產生 4 個選項（含 3 個相近干擾項），保證終止
function buildOptions(answer, makeWrong) {
  const set = new Set([String(answer)]);
  let guard = 0;
  while (set.size < 4 && guard < 60) {
    let w = (typeof makeWrong === "function") ? makeWrong(answer) : null;
    if (w !== null && w !== undefined && String(w) !== "" && !set.has(String(w))) set.add(String(w));
    guard++;
  }
  // 補足：依答案型態產生相近干擾項（含非數值/分數/負數）
  let k = 1;
  while (set.size < 4 && k <= 60) {
    const s = String(answer);
    let cand = null;
    if (/^\s*-?\d+(\.\d+)?\s*$/.test(s)) {
      const n = Number(s);
      let c = n + k;
      if (c < 0) c = n - k;
      cand = String(c);
    } else if (s.includes("/")) {
      cand = fractionDistractor(s, k);
    } else {
      cand = s + k;                          // 極端兜底
    }
    if (cand !== null && cand !== "" && !set.has(cand)) set.add(cand);
    k++;
  }
  return shuffle(Array.from(set)).slice(0, 4);
}

const MATH = {
  // 三年級：兩/三位數加減、九九乘法、表內除法
  3: [
    () => { const a = ri(10, 99), b = ri(10, 99); const s = a + b; return { q: `${a} + ${b} = ?`, a: String(s), ex: `把兩個數字相加。` }; },
    () => { let a = ri(20, 99), b = ri(10, a); const s = a - b; return { q: `${a} - ${b} = ?`, a: String(s), ex: `從大的數減去小的數。` }; },
    () => { const a = ri(2, 9), b = ri(2, 9); const s = a * b; return { q: `${a} × ${b} = ?`, a: String(s), ex: `乘法是連加，記熟九九乘法。` }; },
    () => { const b = ri(2, 9), s = ri(2, 9) * b; return { q: `${s} ÷ ${b} = ?`, a: String(s / b), ex: `想：幾乘以 ${b} 等於 ${s}。` }; }
  ],
  // 四年級：三位數加減、兩位×一位、兩位÷一位、一位小數加減
  4: [
    () => { const a = ri(100, 999), b = ri(100, 999); const s = a + b; return { q: `${a} + ${b} = ?`, a: String(s), ex: `對齊位數再相加。` }; },
    () => { let a = ri(200, 999), b = ri(100, a); const s = a - b; return { q: `${a} - ${b} = ?`, a: String(s), ex: `對齊位數再相減。` }; },
    () => { const a = ri(11, 99), b = ri(2, 9); const s = a * b; return { q: `${a} × ${b} = ?`, a: String(s), ex: `兩位數乘一位數。` }; },
    () => { const b = ri(2, 9), q = ri(11, 99); const s = b * q; return { q: `${s} ÷ ${b} = ?`, a: String(q), ex: `被除數 ÷ 除數 = 商。` }; },
    () => { const a = ri(1, 9), b = ri(1, 9); const s = a + b; return { q: `0.${a} + 0.${b} = ?`, a: (s / 10).toFixed(1), ex: `小數點對齊再相加。` }; }
  ],
  // 五年級：同分母分數加減、小數乘除、兩位×兩位、因數倍數概念
  5: [
    () => { const den = pick([2, 3, 4, 5, 6, 8, 10]); let a = ri(1, den - 1), b = ri(1, den - 1); const num = a + b; const ans = num >= den ? (num === den ? "1" : `${Math.floor(num / den)} ${num % den}/${den}`) : `${num}/${den}`; return { q: `${a}/${den} + ${b}/${den} = ?`, a: ans, ex: `分母相同，分子相加。` }; },
    () => { const a = ri(1, 9), b = ri(2, 9); const s = a * b / 10; return { q: `0.${a} × ${b} = ?`, a: s.toFixed(1), ex: `小數乘整數，看小數位數。` }; },
    () => { const b = ri(2, 9), q = ri(1, 9); const dividend = (b * q) / 10; return { q: `${dividend.toFixed(1)} ÷ ${b} = ?`, a: (q / 10).toFixed(1), ex: `小數除以整數。` }; },
    () => { const a = ri(11, 99), b = ri(11, 99); const s = a * b; return { q: `${a} × ${b} = ?`, a: String(s), ex: `兩位數乘法，注意進位。` }; },
    () => { const base = ri(2, 9), n = ri(2, 5); const m = base * n; return { q: `${base} 的 ${n} 倍是幾？（倍數）`, a: String(m), ex: `倍數 = 底數 × 倍。` }; }
  ],
  // 六年級：比與比例、百分率、正負數加減、簡易方程式、圓面積
  6: [
    () => { const r = pick([2, 3, 4]); const ans = (3.14 * r * r).toFixed(2); return { q: `半徑 ${r} 的圓面積（π取3.14）= ?`, a: ans, ex: `圓面積 = 3.14 × 半徑²。` }; },
    () => { const p = pick([10, 20, 25, 50]); const n = pick([40, 60, 80, 100]); const ans = n * p / 100; return { q: `${n} 的 ${p}% 是幾？`, a: String(ans), ex: `百分率 = 總數 × 百分比。` }; },
    () => { const x = ri(1, 12); const ans = 12 - x; return { q: `x + ${x} = 12，x = ?`, a: String(ans), ex: `把 ${x} 移過去：x = 12 - ${x}。` }; },
    () => { let a = ri(-5, 5), b = ri(-5, 5); if (a === 0) a = 3; if (b === 0) b = -2; const s = a + b; const bq = b < 0 ? `(${b})` : `${b}`; return { q: `${a} + ${bq} = ?`, a: String(s), ex: `正負數相加，看符號。` }; },
    () => { const k = ri(2, 4); const ans = 2 * k; return { q: `若 2 : 4 = ${k} : ?，? 是幾？`, a: String(ans), ex: `比例相等：2×? = 4×${k}，故 ? = ${ans}。` }; }
  ]
};

/* 依年級與題號(0-based)挑題，題號越後難度略增（這裡以隨機題型呈現） */
function makeMathProblem(grade) {
  const gens = MATH[grade];
  const g = pick(gens);
  return g();
}

/* 匯出給其他腳本（以全域變數方式，因靜態站不使用模組以相容 file:// 雙擊開啟） */
window.GAME_DATA = { EN_WORDS, MATH, makeMathProblem, buildOptions };
