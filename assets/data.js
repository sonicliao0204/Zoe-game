/* =========================================================================
 * 資料層：依據中華民國教育部「108 課程綱要」國民小學階段（三~六年級）
 * 的英語文與數學學習內容，整理為遊戲可用的資料結構。
 *
 * 內容依據說明（重要）：
 *  - 單字主題、句型、數學題型參考 108 課綱「英語文」與「數學」領域之學習重點，
 *    數學並依五大主軸（數與計算、量與實測、幾何、代數、統計與機率）補齊。
 *  - 本檔為「課綱對齊之代表性示例」，正式教學使用前，請以康軒等各版本教科書
 *    與學校實際教學進度逐項核對、替換（出版社間單元順序略有差異，但皆符應課綱）。
 *  - 來源架構：教育部《十二年國民基本教育課程綱要》（108 課綱）；
 *    學習重點公布於國家教育研究院課程計畫入口網 courses.naer.edu.tw。
 * ========================================================================= */

/* ---------------------- 工具函式 ---------------------- */
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
  if (!m) return String(ans) + k;
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
      cand = s + k;
    }
    if (cand !== null && cand !== "" && !set.has(cand)) set.add(cand);
    k++;
  }
  return shuffle(Array.from(set)).slice(0, 4);
}

/* =========================================================================
 * 英文：單字庫（看圖選字 / 聽力拼字用）
 * 每筆：{ e: emoji, w: 英文, z: 中文 }
 * 主題依 108 課綱常見生活主題擴充（動物/食物/顏色/家人/衣物/天氣/場所/嗜好…）。
 * 注意：emoji 必須與單字直接對應，避免混淆。
 * ========================================================================= */
const EN_WORDS = {
  3: [
    { e: "🐱", w: "cat", z: "貓" }, { e: "🐶", w: "dog", z: "狗" },
    { e: "🐰", w: "rabbit", z: "兔子" }, { e: "🐻", w: "bear", z: "熊" },
    { e: "🐭", w: "mouse", z: "老鼠" }, { e: "🐘", w: "elephant", z: "大象" },
    { e: "🍎", w: "apple", z: "蘋果" }, { e: "🍌", w: "banana", z: "香蕉" },
    { e: "🍞", w: "bread", z: "麵包" }, { e: "🥛", w: "milk", z: "牛奶" },
    { e: "🍪", w: "cookie", z: "餅乾" }, { e: "🍕", w: "pizza", z: "披薩" },
    { e: "🔴", w: "red", z: "紅色" }, { e: "🔵", w: "blue", z: "藍色" },
    { e: "🟡", w: "yellow", z: "黃色" }, { e: "🟢", w: "green", z: "綠色" },
    { e: "👁️", w: "eye", z: "眼睛" }, { e: "👃", w: "nose", z: "鼻子" },
    { e: "👄", w: "mouth", z: "嘴巴" }, { e: "✋", w: "hand", z: "手" },
    { e: "👨", w: "father", z: "爸爸" }, { e: "👩", w: "mother", z: "媽媽" },
    { e: "👦", w: "brother", z: "兄弟" }, { e: "👧", w: "sister", z: "姐妹" },
    { e: "✏️", w: "pencil", z: "鉛筆" }, { e: "📕", w: "book", z: "書" },
    { e: "🎒", w: "bag", z: "書包" }, { e: "🎈", w: "balloon", z: "氣球" },
    { e: "🏠", w: "home", z: "家" }, { e: "🏫", w: "school", z: "學校" }
  ],
  4: [
    { e: "👕", w: "shirt", z: "襯衫" }, { e: "👖", w: "pants", z: "褲子" },
    { e: "👟", w: "shoes", z: "鞋子" }, { e: "🧥", w: "coat", z: "外套" },
    { e: "🧦", w: "socks", z: "襪子" }, { e: "🧢", w: "hat", z: "帽子" },
    { e: "☀️", w: "sun", z: "太陽" }, { e: "☔", w: "rain", z: "雨" },
    { e: "❄️", w: "snow", z: "雪" }, { e: "🌬️", w: "wind", z: "風" },
    { e: "⚽", w: "soccer", z: "足球" }, { e: "🏀", w: "basketball", z: "籃球" },
    { e: "🏊", w: "swim", z: "游泳" }, { e: "🎨", w: "art", z: "美術" },
    { e: "🎵", w: "music", z: "音樂" }, { e: "📖", w: "reading", z: "閱讀" },
    { e: "🏫", w: "school", z: "學校" }, { e: "🏠", w: "home", z: "家" },
    { e: "🏪", w: "store", z: "商店" }, { e: "🍔", w: "hamburger", z: "漢堡" },
    { e: "🍦", w: "ice cream", z: "冰淇淋" }, { e: "🥤", w: "juice", z: "果汁" },
    { e: "🌳", w: "tree", z: "樹" }, { e: "🌸", w: "flower", z: "花" },
    { e: "🐱", w: "cat", z: "貓" }, { e: "🐶", w: "dog", z: "狗" }
  ],
  5: [
    { e: "👩‍⚕️", w: "doctor", z: "醫生" }, { e: "👨‍🏫", w: "teacher", z: "老師" },
    { e: "👨‍🚒", w: "firefighter", z: "消防員" }, { e: "👮", w: "police", z: "警察" },
    { e: "🚗", w: "car", z: "汽車" }, { e: "🚌", w: "bus", z: "公車" },
    { e: "🚲", w: "bike", z: "腳踏車" }, { e: "✈️", w: "plane", z: "飛機" },
    { e: "🏥", w: "hospital", z: "醫院" }, { e: "🏞️", w: "park", z: "公園" },
    { e: "🏖️", w: "beach", z: "海灘" }, { e: "😀", w: "happy", z: "開心" },
    { e: "😢", w: "sad", z: "難過" }, { e: "😴", w: "sleepy", z: "想睡" },
    { e: "😡", w: "angry", z: "生氣" }, { e: "🍕", w: "pizza", z: "披薩" },
    { e: "🍔", w: "hamburger", z: "漢堡" }, { e: "🍦", w: "ice cream", z: "冰淇淋" },
    { e: "🥤", w: "juice", z: "果汁" }, { e: "📚", w: "books", z: "書本" },
    { e: "⌚", w: "clock", z: "時鐘" }, { e: "🗺️", w: "map", z: "地圖" },
    { e: "⚽", w: "soccer", z: "足球" }, { e: "🏀", w: "basketball", z: "籃球" },
    { e: "🎮", w: "game", z: "遊戲" }, { e: "🎵", w: "music", z: "音樂" }
  ],
  6: [
    { e: "🇺🇸", w: "America", z: "美國" }, { e: "🇬🇧", w: "England", z: "英國" },
    { e: "🇯🇵", w: "Japan", z: "日本" }, { e: "🇰🇷", w: "Korea", z: "韓國" },
    { e: "🏃", w: "run", z: "跑" }, { e: "🚶", w: "walk", z: "走" },
    { e: "🍳", w: "cook", z: "煮飯" }, { e: "📚", w: "study", z: "讀書" },
    { e: "💪", w: "strong", z: "強壯的" }, { e: "🌞", w: "hot", z: "熱的" },
    { e: "🧊", w: "cold", z: "冷的" }, { e: "⛰️", w: "mountain", z: "山" },
    { e: "🌊", w: "ocean", z: "海洋" }, { e: "🎂", w: "birthday", z: "生日" },
    { e: "🎁", w: "gift", z: "禮物" }, { e: "✈️", w: "plane", z: "飛機" },
    { e: "🏥", w: "hospital", z: "醫院" }, { e: "🏫", w: "school", z: "學校" },
    { e: "📖", w: "book", z: "書" }, { e: "💻", w: "computer", z: "電腦" },
    { e: "🎮", w: "game", z: "遊戲" }, { e: "🎵", w: "music", z: "音樂" }
  ]
};

/* =========================================================================
 * 英文：句型選詞（EN_SENTENCES）
 * 每筆：{ s: 句子(空白處用 ___ 表示), a: 正確詞, opts: 四選項, ex }
 * 依 108 課綱學習內容（句型/語用）設計，年級漸進。
 * ========================================================================= */
const EN_SENTENCES = {
  3: [
    { s: "I ___ a cat.", a: "have", opts: ["have", "has", "am", "is"], ex: "主詞 I 用 have。" },
    { s: "This ___ a dog.", a: "is", opts: ["is", "are", "am", "be"], ex: "單數用 is。" },
    { s: "What ___ this?", a: "is", opts: ["is", "are", "am", "it"], ex: "單數疑問用 is。" },
    { s: "He ___ tall.", a: "is", opts: ["is", "are", "am", "be"], ex: "He 是單數用 is。" },
    { s: "___ you happy?", a: "Are", opts: ["Are", "Is", "Am", "Do"], ex: "you 用 Are。" },
    { s: "I can ___.", a: "run", opts: ["run", "runs", "running", "ran"], ex: "can 後接原形動詞。" },
    { s: "My favorite ___ is blue.", a: "color", opts: ["color", "colors", "colar", "coulor"], ex: "favorite 後接名詞。" },
    { s: "I like ___.", a: "apples", opts: ["apples", "apple", "aple", "appels"], ex: "喜歡某物常用複數。" }
  ],
  4: [
    { s: "There ___ a book on the desk.", a: "is", opts: ["is", "are", "am", "be"], ex: "單數名詞用 is。" },
    { s: "Do you like ___?", a: "bananas", opts: ["bananas", "banana", "banan", "bananes"], ex: "喜歡類別用複數。" },
    { s: "Can you ___ English?", a: "speak", opts: ["speak", "speaks", "speaking", "spoke"], ex: "can 後接原形。" },
    { s: "She ___ TV every day.", a: "watches", opts: ["watches", "watch", "watching", "watched"], ex: "單數主詞 + s。" },
    { s: "What ___ do you like?", a: "sports", opts: ["sports", "sport", "sprots", "sporst"], ex: "what 後接名詞。" },
    { s: "I go to school ___ bus.", a: "by", opts: ["by", "on", "with", "in"], ex: "搭乘交通工具用 by。" },
    { s: "He ___ to the park.", a: "goes", opts: ["goes", "go", "going", "went"], ex: "單數主詞 + es。" },
    { s: "We ___ happy today.", a: "are", opts: ["are", "is", "am", "be"], ex: "we 用 are。" }
  ],
  5: [
    { s: "I ___ to the park yesterday.", a: "went", opts: ["went", "go", "goes", "going"], ex: "yesterday 用過去式 went。" },
    { s: "He is ___ than me.", a: "taller", opts: ["taller", "tall", "tallest", "tallor"], ex: "than 用比較級。" },
    { s: "She ___ a movie last night.", a: "watched", opts: ["watched", "watch", "watches", "watching"], ex: "last night 用過去式。" },
    { s: "I ___ breakfast every morning.", a: "eat", opts: ["eat", "eats", "ate", "eating"], ex: "every morning 用現在式。" },
    { s: "They ___ happy now.", a: "are", opts: ["are", "is", "am", "be"], ex: "they 用 are。" },
    { s: "She is the ___ student.", a: "best", opts: ["best", "better", "good", "well"], ex: "最高級用 best。" },
    { s: "I ___ read books.", a: "like to", opts: ["like to", "likes to", "liked", "liking"], ex: "I 用 like to。" }
  ],
  6: [
    { s: "I will ___ a book tomorrow.", a: "read", opts: ["read", "reads", "reading", "readed"], ex: "will 後接原形。" },
    { s: "He ___ play basketball after school.", a: "will", opts: ["will", "is", "are", "do"], ex: "未來式用 will。" },
    { s: "Because it rained, we ___ inside.", a: "stayed", opts: ["stayed", "stay", "stays", "staying"], ex: "過去式 stayed。" },
    { s: "She is the ___ student in class.", a: "best", opts: ["best", "better", "good", "well"], ex: "in class 用最高級。" },
    { s: "They ___ to the museum last week.", a: "went", opts: ["went", "go", "goes", "going"], ex: "last week 用過去式。" },
    { s: "I ___ like spicy food.", a: "don't", opts: ["don't", "doesn't", "didn't", "am not"], ex: "I 用 don't。" },
    { s: "We will ___ a test next Monday.", a: "have", opts: ["have", "has", "had", "having"], ex: "will 後接原形。" }
  ]
};

/* =========================================================================
 * 英文：閱讀理解（EN_READING）
 * 每筆：{ text: 短文, q: 問題, a: 正確選項, opts: 四選項 }
 * 短文主題貼近學童生活，問題可在文中找到答案。
 * ========================================================================= */
const EN_READING = {
  3: [
    { text: "Tom has a red apple. He gives it to his sister. His sister is happy.", q: "What does Tom have?", a: "A red apple", opts: ["A red apple", "A blue ball", "A green cat", "A yellow book"] },
    { text: "It is sunny today. Mary wants to play outside. She likes the sun.", q: "What is the weather like?", a: "Sunny", opts: ["Sunny", "Rainy", "Snowy", "Windy"] },
    { text: "A cat is on the desk. A dog is under the desk. The dog is sleepy.", q: "Where is the dog?", a: "Under the desk", opts: ["Under the desk", "On the desk", "In the bag", "On the book"] }
  ],
  4: [
    { text: "My school is big. There is a library and a playground. I read books in the library after class.", q: "Where does the writer read books?", a: "In the library", opts: ["In the library", "On the playground", "At home", "In the store"] },
    { text: "It is raining. Ben cannot go outside. He plays basketball inside the house.", q: "Why can't Ben go outside?", a: "It is raining", opts: ["It is raining", "He is sleepy", "He has no ball", "It is sunny"] },
    { text: "Lisa likes juice. She drinks orange juice every morning. Her brother drinks milk.", q: "What does Lisa drink every morning?", a: "Orange juice", opts: ["Orange juice", "Milk", "Water", "Tea"] }
  ],
  5: [
    { text: "We went to the park yesterday. The weather was sunny. We played soccer and ate pizza. We were happy.", q: "When did they go to the park?", a: "Yesterday", opts: ["Yesterday", "Tomorrow", "Today", "Last week"] },
    { text: "Tom is taller than May. May is shorter than Tom. But May runs faster than Tom.", q: "Who is taller?", a: "Tom", opts: ["Tom", "May", "Both the same", "The teacher"] },
    { text: "My favorite sport is basketball. I practice every day. I want to be a basketball player.", q: "What does the writer want to be?", a: "A basketball player", opts: ["A basketball player", "A doctor", "A teacher", "A policeman"] }
  ],
  6: [
    { text: "Last summer, we traveled to Japan. We ate sushi and visited a big museum. It was fun, but it rained on the last day.", q: "Where did they travel?", a: "Japan", opts: ["Japan", "Korea", "America", "England"] },
    { text: "I will study hard for the test next Monday. If I get a good grade, my mother will take me to the zoo.", q: "What will happen if he gets a good grade?", a: "Go to the zoo", opts: ["Go to the zoo", "Eat pizza", "Watch TV", "Stay home"] },
    { text: "The Earth is bigger than the Moon, but smaller than the Sun. The Sun is the biggest of the three.", q: "Which is the biggest?", a: "The Sun", opts: ["The Sun", "The Earth", "The Moon", "They are equal"] }
  ]
};

/* =========================================================================
 * 數學題型生成器：依 108 課綱五大主軸（數與計算/量與實測/幾何/代數/統計）
 * 每個生成器標註 level：1=基礎(年級前期) 2=中階 3=進階(年級後期)
 * 回傳 { q, a, ex }；選項由 buildOptions 產生（數值型答案）。
 * ========================================================================= */
const MATH = {
  // 三年級
  3: [
    // 數與計算
    { lv: 1, fn: () => { const a = ri(10, 99), b = ri(10, 99); return { q: `${a} + ${b} = ?`, a: String(a + b), ex: "把兩個數字相加。" }; } },
    { lv: 1, fn: () => { let a = ri(20, 99), b = ri(10, a); return { q: `${a} - ${b} = ?`, a: String(a - b), ex: "從大的數減去小的數。" }; } },
    { lv: 1, fn: () => { const a = ri(2, 9), b = ri(2, 9); return { q: `${a} × ${b} = ?`, a: String(a * b), ex: "乘法是連加，記熟九九乘法。" }; } },
    { lv: 1, fn: () => { const b = ri(2, 9), s = ri(2, 9) * b; return { q: `${s} ÷ ${b} = ?`, a: String(s / b), ex: `想：幾乘以 ${b} 等於 ${s}。` }; } },
    { lv: 2, fn: () => { const a = ri(100, 999), b = ri(100, 999); return { q: `${a} + ${b} = ?`, a: String(a + b), ex: "對齊位數再相加。" }; } },
    { lv: 2, fn: () => { let a = ri(200, 999), b = ri(100, a); return { q: `${a} - ${b} = ?`, a: String(a - b), ex: "對齊位數再相減。" }; } },
    { lv: 3, fn: () => { const a = ri(11, 99), b = ri(2, 9); return { q: `${a} × ${b} = ?`, a: String(a * b), ex: "兩位數乘一位數。" }; } },
    // 量與實測
    { lv: 2, fn: () => { const n = ri(2, 9); return { q: `${n} 公里 = ? 公尺`, a: String(n * 1000), ex: "1 公里 = 1000 公尺。" }; } },
    { lv: 2, fn: () => { const n = ri(2, 9); return { q: `${n} 公尺 = ? 公分`, a: String(n * 100), ex: "1 公尺 = 100 公分。" }; } },
    { lv: 2, fn: () => { const n = ri(2, 9); return { q: `${n} 公斤 = ? 公克`, a: String(n * 1000), ex: "1 公斤 = 1000 公克。" }; } },
    { lv: 2, fn: () => { const n = ri(2, 9); return { q: `${n} 公升 = ? 毫公升`, a: String(n * 1000), ex: "1 公升 = 1000 毫公升。" }; } },
    { lv: 3, fn: () => { const h = ri(1, 11), m = ri(1, 59); return { q: `從 ${h} 點到 ${h + 1} 點經過幾小時？`, a: "1", ex: "相鄰整點相差 1 小時。" }; } },
    { lv: 3, fn: () => { const a = ri(1, 11), b = ri(1, 11); return { q: `${a} 時 + ${b} 時 = ? 小時`, a: String(a + b), ex: "時間可以直接相加。" }; } },
    // 幾何
    { lv: 2, fn: () => { const l = ri(3, 12), w = ri(3, 12); return { q: `長方形長 ${l} 公分、寬 ${w} 公分，面積是幾平方公分？`, a: String(l * w), ex: "長方形面積 = 長 × 寬。" }; } },
    { lv: 2, fn: () => { const l = ri(3, 12), w = ri(3, 12); return { q: `長方形長 ${l}、寬 ${w}，周長是幾？`, a: String(2 * (l + w)), ex: "周長 = (長+寬) × 2。" }; } },
    { lv: 3, fn: () => { return { q: "直角是幾度？", a: "90", ex: "直角 = 90 度。" }; } },
    { lv: 3, fn: () => { return { q: "三角形內角和是幾度？", a: "180", ex: "任意三角形內角和 = 180 度。" }; } },
    // 代數（未知數）
    { lv: 3, fn: () => { const b = ri(2, 9); const s = b + ri(3, 12); return { q: `□ + ${b} = ${s}，□ = ?`, a: String(s - b), ex: `□ = ${s} - ${b}。` }; } },
    // 統計
    { lv: 3, fn: () => { const r = ri(5, 12), b = ri(2, r - 1); return { q: `長條圖：紅色 ${r} 票、藍色 ${b} 票，紅色比藍色多幾票？`, a: String(r - b), ex: "用多的減少的。" }; } }
  ],
  // 四年級
  4: [
    { lv: 1, fn: () => { const a = ri(1000, 9999), b = ri(1000, 9999); return { q: `${a} + ${b} = ?`, a: String(a + b), ex: "對齊位數再相加。" }; } },
    { lv: 1, fn: () => { let a = ri(5000, 9999), b = ri(1000, a); return { q: `${a} - ${b} = ?`, a: String(a - b), ex: "對齊位數再相減。" }; } },
    { lv: 1, fn: () => { const a = ri(11, 99), b = ri(11, 99); return { q: `${a} × ${b} = ?`, a: String(a * b), ex: "兩位數乘兩位數，注意進位。" }; } },
    { lv: 1, fn: () => { const b = ri(2, 9), q = ri(11, 99); return { q: `${b * q} ÷ ${b} = ?`, a: String(q), ex: "被除數 ÷ 除數 = 商。" }; } },
    { lv: 1, fn: () => { const a = ri(1, 9), b = ri(1, 9); return { q: `0.${a} + 0.${b} = ?`, a: ((a + b) / 10).toFixed(1), ex: "小數點對齊再相加。" }; } },
    // 分數
    { lv: 2, fn: () => { const den = pick([2, 3, 4, 5, 6, 8, 10]); let a = ri(1, den - 1), b = ri(1, den - 1); const num = a + b; const ans = num >= den ? (num === den ? "1" : `${Math.floor(num / den)} ${num % den}/${den}`) : `${num}/${den}`; return { q: `${a}/${den} + ${b}/${den} = ?`, a: ans, ex: "分母相同，分子相加。" }; } },
    { lv: 2, fn: () => { const den = pick([2, 3, 4, 6, 8]); const n = ri(1, 3); return { q: `${n} 個 1/${den} 是幾分之幾？`, a: `${n}/${den}`, ex: "幾個單位分數相加。" }; } },
    // 幾何
    { lv: 2, fn: () => { const b = ri(4, 12), h = ri(3, 10); return { q: `平行四邊形底 ${b}、高 ${h}，面積是幾？`, a: String(b * h), ex: "平行四邊形面積 = 底 × 高。" }; } },
    { lv: 3, fn: () => { const b = ri(4, 12), h = ri(3, 10); return { q: `三角形底 ${b}、高 ${h}，面積是幾？`, a: String(b * h / 2), ex: "三角形面積 = 底×高÷2。" }; } },
    { lv: 3, fn: () => { return { q: "正方形有幾條對稱軸？", a: "4", ex: "正方形有 4 條對稱軸。" }; } },
    // 量與實測
    { lv: 2, fn: () => { const h = ri(1, 12); return { q: `下午 ${h} 點用 24 小時制表示是幾時？`, a: String(h + 12), ex: "下午時刻 + 12。" }; } },
    { lv: 3, fn: () => { const s = ri(2, 9), e = s + ri(2, 8); return { q: `從 ${s} 時到 ${e} 時經過幾小時？`, a: String(e - s), ex: "結束減開始。" }; } },
    // 代數
    { lv: 3, fn: () => { const p = ri(2, 6); return { q: `3 × □ = ${3 * p}，□ = ?`, a: String(p), ex: `想：幾乘 3 等於 ${3 * p}。` }; } },
    // 統計
    { lv: 3, fn: () => { const a = ri(3, 10), b = ri(3, 10), c = ri(2, a + b); return { q: `三天分別得 ${a}、${b}、${c} 顆星星，平均一天幾顆？（四捨五入）`, a: String(Math.round((a + b + c) / 3)), ex: "平均 = 總和 ÷ 天數。" }; } }
  ],
  // 五年級
  5: [
    { lv: 1, fn: () => { const a = ri(1, 9), b = ri(2, 9); return { q: `0.${a} × ${b} = ?`, a: (a * b / 10).toFixed(1), ex: "小數乘整數，看小數位數。" }; } },
    { lv: 1, fn: () => { const b = ri(2, 9), q = ri(1, 9); const d = (b * q) / 10; return { q: `${d.toFixed(1)} ÷ ${b} = ?`, a: (q / 10).toFixed(1), ex: "小數除以整數。" }; } },
    { lv: 1, fn: () => { const den = pick([2, 3, 4, 5, 6, 8, 10]); let a = ri(1, den - 1), b = ri(1, den - 1); const num = a + b; const ans = num >= den ? (num === den ? "1" : `${Math.floor(num / den)} ${num % den}/${den}`) : `${num}/${den}`; return { q: `${a}/${den} + ${b}/${den} = ?`, a: ans, ex: "同分母分數相加。" }; } },
    { lv: 2, fn: () => { const a = ri(11, 99), b = ri(11, 99); return { q: `${a} × ${b} = ?`, a: String(a * b), ex: "兩位數乘法，注意進位。" }; } },
    { lv: 2, fn: () => { const base = ri(2, 9), n = ri(2, 5); return { q: `${base} 的 ${n} 倍是幾？`, a: String(base * n), ex: "倍數 = 底數 × 倍。" }; } },
    // 分數進階
    { lv: 2, fn: () => { const den = pick([2, 3, 4, 5, 6]); let a = ri(1, den - 1), b = ri(1, den - 1); if (a + b >= den) b = Math.max(1, den - 1 - a); const ans = (a + b) + "/" + den; return { q: `(${a}/${den}) + (${b}/${den}) = ?`, a: ans, ex: "同分母相加，保持分母。" }; } },
    { lv: 3, fn: () => { const w = ri(1, 4), n = ri(1, 3), d = pick([2, 3, 4]); const f = ri(1, 3); return { q: `${w} ${n}/${d} + ${f}/${d} = ?（帶分數）`, a: `${w} ${(n + f)}/${d}`, ex: "帶分數相加，先加分數部分。" }; } },
    // 量與實測（體積）
    { lv: 2, fn: () => { const l = ri(2, 9), w = ri(2, 9), h = ri(2, 9); return { q: `長方體長 ${l}、寬 ${w}、高 ${h}，體積是幾立方公分？`, a: String(l * w * h), ex: "體積 = 長×寬×高。" }; } },
    // 比與百分率
    { lv: 2, fn: () => { const p = pick([10, 20, 25, 50]); const n = pick([20, 40, 60, 80]); return { q: `${n} 的 ${p}% 是幾？`, a: String(n * p / 100), ex: "百分率 = 總數 × 百分比。" }; } },
    { lv: 3, fn: () => { const m = ri(2, 9), f = ri(2, 9); return { q: `男生 ${m} 人、女生 ${f} 人，男生人數是女生的幾分之幾？`, a: `${m}/${f}`, ex: "用男生÷女生。" }; } },
    // 幾何
    { lv: 3, fn: () => { return { q: "四邊形內角和是幾度？", a: "360", ex: "四邊形內角和 = 360 度。" }; } },
    // 代數
    { lv: 3, fn: () => { const x = ri(2, 9); const s = 2 * x + ri(3, 10); const b = s - 2 * x; return { q: `2 × □ + ${b} = ${s}，□ = ?`, a: String(x), ex: "先減常數，再除以 2。" }; } },
    // 統計
    { lv: 3, fn: () => { const a = ri(3, 10), b = ri(3, 10), c = ri(3, 10); return { q: `三次得分 ${a}、${b}、${c}，平均是幾？（四捨五入）`, a: String(Math.round((a + b + c) / 3)), ex: "平均 = 總和 ÷ 次數。" }; } },
    // 因數與倍數（五年級核心）
    { lv: 2, fn: () => { const pairs = [[12, 18, 6], [8, 12, 4], [15, 20, 5], [9, 15, 3], [16, 24, 8]]; const p = pick(pairs); return { q: `${p[0]} 和 ${p[1]} 的最大公因數是幾？`, a: String(p[2]), ex: "找同時能整除兩數的最大數。" }; } },
    { lv: 2, fn: () => { const base = pick([3, 4, 5, 6, 7]); const n = pick([2, 3, 4]); return { q: `${base} 的 ${n} 倍是幾？它也是 ${base} 的幾倍數？`, a: String(base * n), ex: "倍數 = 底數 × 倍。" }; } }
  ],
  // 六年級
  6: [
    { lv: 1, fn: () => { const r = pick([2, 3, 4]); return { q: `半徑 ${r} 的圓面積（π取3.14）= ?`, a: (3.14 * r * r).toFixed(2), ex: "圓面積 = 3.14 × 半徑²。" }; } },
    { lv: 1, fn: () => { const p = pick([10, 20, 25, 50]); const n = pick([40, 60, 80, 100]); return { q: `${n} 的 ${p}% 是幾？`, a: String(n * p / 100), ex: "百分率 = 總數 × 百分比。" }; } },
    { lv: 1, fn: () => { const x = ri(1, 12); return { q: `x + ${x} = ${x + x}，x = ?`, a: String(x), ex: "把常數移過去。" }; } },
    { lv: 1, fn: () => { let a = ri(-5, 5), b = ri(-5, 5); if (a === 0) a = 3; if (b === 0) b = -2; const s = a + b; const bq = b < 0 ? `(${b})` : `${b}`; return { q: `${a} + ${bq} = ?`, a: String(s), ex: "正負數相加，看符號。" }; } },
    { lv: 1, fn: () => { const k = ri(2, 4); return { q: `若 2 : 4 = ${k} : ?，? 是幾？`, a: String(2 * k), ex: "比例相等：2×? = 4×${k}。" }; } },
    // 分數四則
    { lv: 2, fn: () => { const d = pick([2, 3, 4, 5]); const a = ri(1, d - 1), b = ri(1, d - 1); if (a + b >= d) { const w = 1; const rem = (a + b) - d; return { q: `${a}/${d} + ${b}/${d} = ?`, a: `${w} ${rem}/${d}`, ex: "同分母相加，可化成帶分數。" }; } return { q: `${a}/${d} + ${b}/${d} = ?`, a: `${(a + b)}/${d}`, ex: "同分母相加。" }; } },
    // 圓進階
    { lv: 2, fn: () => { const r = pick([3, 4, 5, 6]); return { q: `半徑 ${r} 的圓周長（π取3.14，取近似整數）= ?`, a: String(Math.round(2 * 3.14 * r)), ex: "圓周長 ≈ 2×3.14×半徑。" }; } },
    // 柱錐體積
    { lv: 2, fn: () => { const b = ri(4, 12), h = ri(3, 10); return { q: `柱體底面積 ${b}、高 ${h}，體積是幾？`, a: String(b * h), ex: "柱體體積 = 底面積 × 高。" }; } },
    { lv: 3, fn: () => { const b = ri(4, 12), h = ri(3, 10); return { q: `錐體底面積 ${b}、高 ${h}，體積是幾？（四捨五入）`, a: String(Math.round(b * h / 3)), ex: "錐體體積 = 底面積×高÷3。" }; } },
    // 百分率應用
    { lv: 3, fn: () => { const price = pick([100, 200, 300, 500]); const off = pick([10, 20, 30]); return { q: `原價 ${price} 元打 ${off} 折，現價是幾元？`, a: String(Math.round(price * off / 10)), ex: "打幾折 = 乘幾/10。" }; } },
    // 代數應用
    { lv: 3, fn: () => { const x = ri(2, 9); const s = 3 * x - ri(2, 9); const b = 3 * x - s; return { q: `3 × □ - ${b} = ${s}，□ = ?`, a: String(x), ex: "先還原常數，再除以 3。" }; } },
    // 機率與統計
    { lv: 3, fn: () => { const total = pick([2, 4, 5, 10]); const want = ri(1, total - 1); return { q: `袋子有 ${total} 球，其中 ${want} 個紅球，摸到紅球的機率是幾分之幾？`, a: `${want}/${total}`, ex: "機率 = 想要的÷總數。" }; } },
    // 速率與比例應用（六年級核心）
    { lv: 2, fn: () => { const t = pick([2, 3, 4]); const s = pick([60, 90, 120, 150]); return { q: `爸爸開車 ${t} 小時走了 ${s * t} 公里，平均時速是幾公里？`, a: String(s), ex: "時速 = 路程 ÷ 時間。" }; } },
    { lv: 2, fn: () => { const v = pick([40, 60, 80]); const t = pick([2, 3, 5]); return { q: `小華騎車以每秒 ${v} 公尺的速度騎了 ${t} 秒，共騎了幾公尺？`, a: String(v * t), ex: "距離 = 速度 × 時間。" }; } }
  ]
};

/* 依年級與允許的最高 level 挑題（level 越大題越難，實作年級內坡度） */
function makeMathProblem(grade, maxLevel) {
  maxLevel = maxLevel || 3;
  const gens = (MATH[grade] || []).filter(g => g.lv <= maxLevel);
  const pool = gens.length ? gens : MATH[grade];
  return pick(pool).fn();
}

/* =========================================================================
 * 自然發音（Phonics）題庫：以 CVC（子音-母音-子音）基礎字為主，對齊 108 課綱
 * 中年級（三~四年級）「字母拼讀 / 字音對應」素養。每筆：{ w: 英文字, e: emoji,
 * grp: 押韻家族, first: 字首字母（聲音） }。遊戲題型由 phonics.js 依此生成。
 * ========================================================================= */
const PHONICS = [
  { w: "cat",  e: "🐱", grp: "at", first: "C" },
  { w: "hat",  e: "🎩", grp: "at", first: "H" },
  { w: "bat",  e: "🦇", grp: "at", first: "B" },
  { w: "mat",  e: "🟫", grp: "at", first: "M" },
  { w: "dog",  e: "🐶", grp: "og", first: "D" },
  { w: "log",  e: "🪵", grp: "og", first: "L" },
  { w: "frog", e: "🐸", grp: "og", first: "F" },
  { w: "pig",  e: "🐷", grp: "ig", first: "P" },
  { w: "wig",  e: "💇", grp: "ig", first: "W" },
  { w: "fig",  e: "🍒", grp: "ig", first: "F" },
  { w: "sun",  e: "☀️", grp: "un", first: "S" },
  { w: "run",  e: "🏃", grp: "un", first: "R" },
  { w: "cup",  e: "🥤", grp: "up", first: "C" },
  { w: "pup",  e: "🐾", grp: "up", first: "P" },
  { w: "bug",  e: "🐛", grp: "ug", first: "B" },
  { w: "rug",  e: "🟥", grp: "ug", first: "R" },
  { w: "pen",  e: "🖊️", grp: "en", first: "P" },
  { w: "ten",  e: "🔟", grp: "en", first: "T" },
  { w: "box",  e: "📦", grp: "ox", first: "B" },
  { w: "fox",  e: "🦊", grp: "ox", first: "F" },
  { w: "pet",  e: "🐹", grp: "et", first: "P" },
  { w: "net",  e: "🕸️", grp: "et", first: "N" }
];

/* 匯出給其他腳本（以全域變數方式，因靜態站不使用模組以相容 file:// 雙擊開啟） */
window.GAME_DATA = {
  EN_WORDS, EN_SENTENCES, EN_READING, MATH, PHONICS,
  makeMathProblem, buildOptions, ri, pick, shuffle
};
