/* =========================================================
   拳皇·数学格斗（双人对战版）v3
   选角整合进战斗页；答题即出招：
   先答对 = 出招（立即攻击），后答对 = 防御（挡下攻击），答错 = 受击。
   双方答完或倒计时结束即进入下一题。
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 工具 ---------- */
  function el(id) { return document.getElementById(id); }
  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[rnd(0, arr.length - 1)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- 角色数据 ---------- */
  const CHARS = {
    flame:     { name: "炎拳·烈",  skill: "烈焰轰拳",   power: 15, color: "#ff6a00", elem: "火", kind: "pixel", portrait: "assets/portraits/flame.jpg",  anim: "assets/animations_v22/k_prime", atkN: 11, atk3N: 9, atk2N: 8 },
    violet:    { name: "紫炎·影",  skill: "紫炎穿心",   power: 14, color: "#a64dff", elem: "暗", kind: "pixel", portrait: "assets/portraits/violet.jpg", anim: "assets/animations_v22/k9999", atkN: 12, atk3N: 9, atk2N: 8 },
    wrestler:  { name: "铁臂·霸",  skill: "泰山压顶",   power: 16, color: "#9aa7b5", elem: "地", kind: "pixel", portrait: "assets/portraits/wrestler.png", anim: "assets/animations_v22/maxima", atkN: 9, atk3N: 12, atk2N: 10 },
    redgirl:   { name: "赤蝶·舞",  skill: "蝶舞千扇",   power: 13, color: "#ff2d55", elem: "蝶", kind: "pixel", portrait: "assets/portraits/redgirl.png",  anim: "assets/animations_v22/shermie", atkN: 9, atk3N: 12, atk2N: 8 },
    blond:     { name: "金拳·泰",  skill: "能量冲拳",   power: 13, color: "#ffb02e", elem: "雷", kind: "pixel", portrait: "assets/portraits/blond.jpg",  anim: "assets/animations_v22/terry", atkN: 12, atk3N: 12, atk2N: 13 },
    ninja:     { name: "蓝影·瞬",  skill: "手里剑·疾",  power: 12, color: "#3ce7ff", elem: "风", kind: "pixel", portrait: "assets/portraits/ninja.jpg",  anim: "assets/animations_v22/andy", atkN: 9, atk3N: 12, atk2N: 8 },
    berserker: { name: "狂屠·煞",  skill: "怒噬撕裂",   power: 17, color: "#7a5cff", elem: "狂", kind: "pixel", portrait: "assets/portraits/berserker.png", anim: "assets/animations_v22/angel", atkN: 12, atk3N: 12, atk2N: 8 },
    kusanagi:  { name: "草薙·京",  skill: "百式·鬼烧",  power: 16, color: "#ff3b30", elem: "火", kind: "pixel",  portrait: "assets/portraits/kusanagi.png", anim: "assets/animations_v22/kusanagi", atkN: 11, atk3N: 12, atk2N: 12 }
  };
  const ROSTER_ORDER = ["flame", "violet", "wrestler", "redgirl", "blond", "ninja", "berserker", "kusanagi"];
  const MAX_HP = 100;
  const POW_MAX = 10;

  /* ---------- 设置 / 存档 ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("kofm2_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("kofm2_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  let difficulty = store.get("diff", 1);
  let soundOn = store.get("sound", true);
  let timeSec = store.get("time", 15);
  let best = store.get("best", 0);
  // 连击段位阈值：普通/强化/超必杀（默认 1/3/8）
  let comboSet = {
    t1: store.get("combo1", 1),
    t2: store.get("combo2", 3),
    t3: store.get("combo3", 8)
  };
  // 出题模式（横式 / 竖式）与数字 0 限制（allow / disallow）
  let gameMode = store.get("mode", "horizontal");
  let zeroRule = store.get("zero", "allow");

  /* ---------- 全局状态 ---------- */
  let screen = "title";
  let battleMode = false;
  let select = { p1: { cursor: 0, confirmed: false }, p2: { cursor: 0, confirmed: false } };
  let picks = { p1: null, p2: null };
  let battle = null;

  /* =========================================================
     题目生成器（小学数学）
     ========================================================= */
  function makeQuestion(level) {
    let a, b, op, text, answer;
    if (level === 1) {
      op = rnd(0, 1);
      if (op === 0) { a = rnd(1, 9); b = rnd(1, 9); answer = a + b; text = a + " + " + b + " = ?"; }
      else { a = rnd(2, 9); b = rnd(1, a); answer = a - b; text = a + " - " + b + " = ?"; }
    } else if (level === 2) {
      op = rnd(0, 2);
      if (op === 0) { a = rnd(12, 99); b = rnd(11, 99); answer = a + b; text = a + " + " + b + " = ?"; }
      else if (op === 1) { a = rnd(15, 99); b = rnd(2, a - 1); answer = a - b; text = a + " - " + b + " = ?"; }
      else { a = rnd(2, 9); b = rnd(2, 9); answer = a * b; text = a + " × " + b + " = ?"; }
    } else {
      op = rnd(0, 3);
      if (op === 0) { a = rnd(20, 99); b = rnd(11, 99); answer = a + b; text = a + " + " + b + " = ?"; }
      else if (op === 1) { a = rnd(40, 199); b = rnd(3, a - 3); answer = a - b; text = a + " - " + b + " = ?"; }
      else if (op === 2) { a = rnd(11, 29); b = rnd(2, 9); answer = a * b; text = a + " × " + b + " = ?"; }
      else { b = rnd(2, 9); answer = rnd(3, 12); a = b * answer; text = a + " ÷ " + b + " = ?"; }
    }
    return { text: text, answer: answer };
  }

  /* =========================================================
     竖式出题引擎（gameMode === 'vertical' 时使用）
     - 多位数 × 两位数（无进位连续竖式）
     - 三数连加/连减/加减混合竖式（A ± B ± C）
     返回题目对象 { kind:'vertical', rows, steps, curStep, curCol, dots, ... }
     ========================================================= */
  function makeQ(level) {
    return gameMode === "vertical" ? makeVQuestion(level) : makeQuestion(level);
  }
  function digitsOf(n) { return String(n).split(""); }
  function hasZero(str) { return str.indexOf("0") !== -1; }
  /* 生成 len 位随机数；noZero 时各位均取 1~9 */
  function randNum(len, noZero) {
    let s = "" + rnd(1, 9);
    for (let i = 1; i < len; i++) s += (noZero ? rnd(1, 9) : rnd(0, 9));
    return parseInt(s, 10);
  }
  function makeVQuestion(level) {
    return Math.random() < 0.5 ? makeVMul(level) : makeVAddSub(level);
  }

  /* ---- 行构建辅助（CSS Grid 数位对齐） ---- */
  function emptyCells(cols) { return new Array(cols).fill(null); }
  /* 数字行：digs[0] 为最高位，右对齐到 rightmost 列 */
  function makeNumCells(digs, rightmost) {
    const len = digs.length, cols = rightmost + 1;
    const c = emptyCells(cols);
    for (let i = 0; i < len; i++) c[rightmost - len + 1 + i] = { d: digs[i] };
    return c;
  }
  /* 运算符 + 数字行：op 固定放在最左列（即最宽数最左位左侧），数字右对齐 */
  function opNumCells(op, digs, rightmost) {
    const len = digs.length, cols = rightmost + 1;
    const c = emptyCells(cols);
    c[0] = { o: op };
    const start = rightmost - len + 1;
    for (let i = 0; i < len; i++) c[start + i] = { d: digs[i] };
    return c;
  }
  /* 输入步骤行：步骤 si 的格子从 startCol 铺到 endCol（共 endCol-startCol+1 个） */
  function stepCells(si, startCol, endCol, cols) {
    const c = emptyCells(cols);
    let idx = 0;
    for (let col = startCol; col <= endCol; col++) c[col] = { step: si, idx: idx++ };
    return c;
  }
  function rowObj(cells) { return { kind: "row", cells: cells }; }
  function divObj(from, to) { return { kind: "divider", from: from, to: to }; }
  function divFrom(w1, w2, cols) { return Math.max(0, cols - Math.max(w1, w2) - 1); }

  /* ---- 题型 1：多位数 × 两位数（无进位） ---- */
  function makeVMul(level) {
    const len = level <= 1 ? 2 : rnd(2, 3);
    let aDig, bt, bo, ok = false, t = 0;
    while (!ok && t++ < 300) {
      bt = rnd(1, 3); bo = rnd(1, 3);
      const mm = Math.max(bt, bo);
      aDig = [];
      for (let i = 0; i < len; i++) aDig.push(rnd(1, Math.floor(9 / mm)));
      const p1 = aDig.map(function (d) { return d * bo; });
      const p2 = aDig.map(function (d) { return d * bt; });
      ok = true;
      // 累加过程逐列无进位：每列和 < 10
      for (let c = 0; c <= len && ok; c++) {
        let s = 0;
        if (c < len) s += p1[len - 1 - c];
        if (c >= 1) s += p2[len - c];
        if (s >= 10) ok = false;
      }
    }
    if (!ok) { aDig = new Array(len).fill(1); bt = 1; bo = 1; }
    const A = parseInt(aDig.join(""), 10), B = bt * 10 + bo;
    const p1v = A * bo, p2v = A * bt, prodv = A * B;
    const cols = len + 1;
    const steps = [
      { expected: digitsOf(p1v), cells: [] },
      { expected: digitsOf(p2v), cells: [] },
      { expected: digitsOf(prodv), cells: [] }
    ];
    steps.forEach(function (s) { s.cells = s.expected.map(function () { return { val: "" }; }); });
    const R = [];
    R.push(rowObj(makeNumCells(aDig, len)));                         // 被乘数
    R.push(rowObj(opNumCells("×", [bt, bo], len)));                  // × 乘数
    R.push(divObj(0, len));                                          // 分割横线
    R.push(rowObj(stepCells(0, 1, len, cols)));                      // 部分积1 = A×bo（右对齐）
    R.push(rowObj(stepCells(1, 0, len - 1, cols)));                  // 部分积2 = A×bt（左错1格对十位）
    R.push(divObj(0, len));                                          // 分割横线
    R.push(rowObj(stepCells(2, 0, len, cols)));                      // 最终积 = A×B
    return {
      kind: "vertical", type: "mul", cols: cols, rows: R,
      steps: steps, curStep: 0, curCol: steps[0].cells.length - 1,
      dots: [emptyCells(cols).map(function () { return ""; }), emptyCells(cols).map(function () { return ""; })],
      text: A + " × " + B + " = ?"
    };
  }

  /* ---- 题型 2：三数连加/连减/加减混合（A ± B ± C） ---- */
  function makeVAddSub(level) {
    const aLen = level <= 1 ? 2 : rnd(2, 3);
    let A, B, C, X, Y, op1, op2, ok = false, t = 0;
    while (!ok && t++ < 400) {
      op1 = pick(["+", "-"]); op2 = pick(["+", "-"]);
      A = randNum(aLen, zeroRule === "disallow");
      B = randNum(rnd(1, Math.min(3, aLen)), zeroRule === "disallow");
      if (op1 === "-" && B >= A) continue;
      X = op1 === "+" ? A + B : A - B;
      if (X < 0) continue;
      C = randNum(rnd(1, Math.min(3, aLen)), zeroRule === "disallow");
      if (op2 === "-" && C >= X) continue;
      Y = op2 === "+" ? X + C : X - C;
      if (Y < 0) continue;
      if (zeroRule === "disallow") {
        if (hasZero(String(A) + B + C + X + Y)) continue;
      }
      ok = true;
    }
    if (!ok) { A = 11; B = 22; op1 = "+"; X = 33; C = 44; op2 = "+"; Y = 77; }
    const dA = digitsOf(A), dX = digitsOf(X), dY = digitsOf(Y);
    const widest = Math.max(dA.length, digitsOf(B).length, digitsOf(C).length, dX.length, dY.length);
    const cols = widest + 1; // col0 作为运算符槽位
    const steps = [
      { expected: dX, cells: dX.map(function () { return { val: "" }; }) },
      { expected: dY, cells: dY.map(function () { return { val: "" }; }) }
    ];
    const R = [];
    R.push(rowObj(makeNumCells(dA, cols - 1)));                       // A
    R.push(rowObj(opNumCells(op1, digitsOf(B), cols - 1)));           // op1 B
    R.push(divObj(divFrom(dA.length, digitsOf(B).length, cols), cols - 1));
    R.push(rowObj(stepCells(0, cols - dX.length, cols - 1, cols)));   // 第1步中间结果
    R.push(rowObj(opNumCells(op2, digitsOf(C), cols - 1)));           // op2 C
    R.push(divObj(divFrom(dX.length, digitsOf(C).length, cols), cols - 1));
    R.push(rowObj(stepCells(1, cols - dY.length, cols - 1, cols)));   // 最终结果
    return {
      kind: "vertical", type: "addsub", cols: cols, rows: R,
      steps: steps, curStep: 0, curCol: steps[0].cells.length - 1,
      dots: [emptyCells(cols).map(function () { return ""; }), emptyCells(cols).map(function () { return ""; })],
      text: A + " " + op1 + " " + B + " " + op2 + " " + C + " = ?"
    };
  }

  /* ---- 竖式渲染（CSS Grid，数位同列对齐） ---- */
  function renderVArea(p, q) {
    const wrap = el(p + "VArea");
    if (!q) { wrap.innerHTML = ""; return; }
    const cell = Math.max(22, Math.min(34, Math.floor(200 / q.cols)));
    wrap.style.setProperty("--cols", q.cols);
    wrap.style.setProperty("--cell", cell + "px");
    let html = "";
    const dotState = q.dots || [];
    let dotIdx = 0;
    q.rows.forEach(function (row) {
      if (row.kind === "divider") {
        const ds = dotState[dotIdx] || [];
        html += '<div class="v-dots">';
        for (let c = 0; c < q.cols; c++) {
          const st = ds[c] || "";
          html += '<button class="v-dot' + (st ? " " + st : "") + '" data-di="' + dotIdx + '" data-c="' + c + '" type="button"></button>';
        }
        html += "</div>";
        html += '<div class="v-rule"><div class="v-rule-bar" style="grid-column:' + (row.from + 1) + " / " + (row.to + 2) + '"></div></div>';
        dotIdx++;
      } else {
        html += '<div class="v-row">';
        row.cells.forEach(function (cel) {
          if (!cel) { html += '<div class="v-blank"></div>'; return; }
          if (cel.d !== undefined) { html += '<div class="v-cell fixed">' + cel.d + "</div>"; return; }
          if (cel.o !== undefined) { html += '<div class="v-cell op">' + cel.o + "</div>"; return; }
          const step = q.steps[cel.step];
          const val = step.cells[cel.idx].val;
          const isCur = q.curStep === cel.step && q.curCol === cel.idx;
          html += '<div class="v-cell in' + (isCur ? " cur" : "") + (val ? "" : " empty") + '" data-step="' + cel.step + '" data-idx="' + cel.idx + '">' + (val || "") + "</div>";
        });
        html += "</div>";
      }
    });
    wrap.innerHTML = html;
    // 进位/借位标记点：空 -> 红(进位) -> 蓝(借位) -> 取消
    wrap.querySelectorAll(".v-dot").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const di = +btn.getAttribute("data-di"), c = +btn.getAttribute("data-c");
        const ds = q.dots[di] || (q.dots[di] = []);
        const cur = ds[c] || "";
        ds[c] = cur === "" ? "carry" : (cur === "carry" ? "borrow" : "");
        sfx.click();
        renderVArea(p, q);
      });
    });
    // 点击填空格：焦点移到该格（已答对/暂停时不响应）
    wrap.querySelectorAll(".v-cell.in").forEach(function (cellEl) {
      cellEl.addEventListener("click", function () {
        if (!battle || battle.over || battle.paused) return;
        const rd = battle.roundState;
        if (!rd || rd.answered[p] || rd.q[p] !== q) return;
        const s = +cellEl.getAttribute("data-step"), i = +cellEl.getAttribute("data-idx");
        q.curStep = s; q.curCol = i;
        sfx.click();
        renderVArea(p, q);
      });
    });
  }

  /* ---- 竖式答案判定 ---- */
  function checkV(q) {
    return q.steps.every(function (s) {
      return s.cells.every(function (c, i) { return c.val === s.expected[i]; });
    });
  }

  /* ---- 竖式错误反馈（闪红 + 抖动 + 错误音，不清空、不跳过） ---- */
  function vWrong(p) {
    sfx.wrong();
    const area = el(p + "VArea");
    area.classList.remove("v-wrong"); void area.offsetWidth; area.classList.add("v-wrong");
    const panel = area.closest(".question-panel");
    panel.classList.remove("v-shake"); void panel.offsetWidth; panel.classList.add("v-shake");
    setTimeout(function () { area.classList.remove("v-wrong"); }, 600);
  }

  /* ---- 竖式提交 ---- */
  function vSubmit(p, q) {
    if (!battle || battle.over || battle.paused) return;
    const rd = battle.roundState;
    if (!rd || rd.answered[p] || q.kind !== "vertical") return;
    let allFilled = true;
    q.steps.forEach(function (s) { s.cells.forEach(function (c) { if (c.val === "") allFilled = false; }); });
    if (!allFilled || !checkV(q)) { vWrong(p); return; }
    // 判定正确：走原游戏"答对"回调（连击/能量/结算出招统一在倒计时归零时触发）
    rd.answered[p] = true; rd.correct[p] = true; rd.answerT[p] = performance.now();
    battle.combo[p]++;
    battle.maxCombo[p] = Math.max(battle.maxCombo[p], battle.combo[p]);
    battle.correct[p]++;
    battle.pow[p] = Math.min(POW_MAX, battle.pow[p] + 1);
    updatePow();
    flashInput(p, true);
    sfx.success();
  }

  /* ---- 竖式按键输入（从右到左填空，软键盘复用） ---- */
  function vKeyPress(p, k) {
    if (!battle || battle.over || battle.paused) return;
    const rd = battle.roundState;
    if (!rd) return;
    const q = rd.q[p];
    if (!q || q.kind !== "vertical" || rd.answered[p]) return;
    const step = q.steps[q.curStep];
    const n = step.cells.length;
    sfx.click();
    if (k >= "0" && k <= "9") {
      step.cells[q.curCol].val = k;
      if (q.curCol > 0) q.curCol--;                                    // 自动向左（高数位）
      else if (q.curStep < q.steps.length - 1) {                       // 本行填完 → 下一行最右格
        q.curStep++; q.curCol = q.steps[q.curStep].cells.length - 1;
      }
    } else if (k === "back") {
      if (step.cells[q.curCol].val !== "") step.cells[q.curCol].val = "";
      else if (q.curCol < n - 1) { q.curCol++; step.cells[q.curCol].val = ""; }   // 向右回退到低数位
      else if (q.curStep > 0) {                                              // 退回上一行的最右格
        q.curStep--; const ps = q.steps[q.curStep];
        q.curCol = ps.cells.length - 1;
        if (ps.cells[q.curCol].val !== "") ps.cells[q.curCol].val = "";
      }
    } else if (k === "clear") {
      // 一次性清空整个竖式所有填写内容，焦点回到第一行最右格
      q.steps.forEach(function (s) { s.cells.forEach(function (c) { c.val = ""; }); });
      q.curStep = 0;
      q.curCol = q.steps[0].cells.length - 1;
    } else if (k === "ok") {
      vSubmit(p, q);
      return;
    }
    renderVArea(p, q);
  }

  /* =========================================================
     音频（Web Audio 合成）
     ========================================================= */
  let actx = null;
  function ensureAudio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    if (actx.state === "suspended") actx.resume();
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    if (!soundOn || !actx) return;
    try {
      const o = actx.createOscillator(), g = actx.createGain();
      const t = actx.currentTime + (when || 0);
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  const sfx = {
    click() { tone(720, 0.06, "square", 0.05); },
    hit() { tone(180, 0.18, "sawtooth", 0.16, 0, 60); tone(90, 0.22, "square", 0.1, 0, 50); },
    success() { tone(520, 0.09, "square", 0.07); tone(780, 0.09, "square", 0.07, 0.09); tone(1040, 0.13, "square", 0.08, 0.18); },
    wrong() { tone(300, 0.16, "sawtooth", 0.11, 0, 150); tone(200, 0.2, "square", 0.09, 0.14, 90); },
    skill() { tone(200, 0.12, "sawtooth", 0.1, 0, 420); tone(620, 0.15, "square", 0.07, 0.1, 980); },
    superSfx() { tone(140, 0.2, "sawtooth", 0.14, 0, 900); tone(900, 0.2, "square", 0.08, 0.1, 140); tone(1400, 0.3, "square", 0.07, 0.2); },
    pow() { tone(660, 0.08, "square", 0.07); tone(880, 0.08, "square", 0.07, 0.08); },
    block() { tone(560, 0.09, "triangle", 0.13); tone(420, 0.12, "triangle", 0.1, 0.05); },
    ko() { tone(220, 0.5, "sawtooth", 0.18, 0, 40); tone(160, 0.5, "square", 0.1, 0.05, 30); }
  };

  /* ---------- 背景音乐（拳皇原版音乐） ---------- */
  const BGM_FILES = {
    title: "assets/audio/battle_esaka.mp3",
    select: "assets/audio/battle_jungle.mp3",
    battle: ["assets/audio/battle_bloody.mp3", "assets/audio/battle_jungle.mp3", "assets/audio/battle_esaka.mp3"]
  };
  let bgmEl = null, bgmKind = "", bgmIdx = 0;
  function musicPlay(kind) {
    if (!soundOn) return;
    if (bgmKind === kind) return;
    const src = kind === "battle"
      ? BGM_FILES.battle[bgmIdx++ % BGM_FILES.battle.length]
      : BGM_FILES[kind];
    try {
      if (!bgmEl) { bgmEl = new Audio(); bgmEl.loop = true; document.body.appendChild(bgmEl); }
      bgmEl.src = src;
      bgmEl.volume = 0.55;
      bgmEl.play().catch(function () {});
      bgmKind = kind;
    } catch (e) {}
  }
  function musicStop() {
    if (bgmEl) { try { bgmEl.pause(); } catch (e) {} bgmEl.src = ""; }
    bgmKind = "";
  }
  function musicSync() {
    if (!soundOn) { musicStop(); return; }
    if (screen === "battle") musicPlay(battleMode && battle && !battle.over ? "battle" : "select");
    else musicPlay("title");
  }

  /* =========================================================
     图片加载
     ========================================================= */
  const IMG = { sprites: {}, portrait: {}, kf: {} };
  const BASE_H = {}; // 每角色站立基准高度（idle_0 主体高度），用于强化/超必杀帧保持角色大小
  function loadImage(url) {
    return new Promise(function (res) {
      const im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = url;
    });
  }
  /* 帧内"不透明包围盒"高度（普通攻击/待机无特效，包围盒≈角色主体高度，可靠） */
  function measureBBox(im) {
    try {
      const cv = document.createElement("canvas");
      cv.width = im.width; cv.height = im.height;
      const cx = cv.getContext("2d");
      cx.drawImage(im, 0, 0);
      const data = cx.getImageData(0, 0, cv.width, cv.height).data;
      const w = cv.width, h = cv.height;
      let minY = h, maxY = -1;
      for (let y = 0; y < h; y++) {
        const row = y * w * 4;
        for (let x = 0; x < w; x++) {
          if (data[row + x * 4 + 3] > 8) { if (y < minY) minY = y; if (y > maxY) maxY = y; break; }
        }
      }
      return maxY >= 0 ? (maxY - minY + 1) : im.height;
    } catch (e) { return im.height; }
  }
  /* 估算帧内"角色主体"高度（去掉大面积特效）：主体行 = 非透明像素宽度 ≥ 帧宽×0.18 的行 */
  function measureBody(im) {
    try {
      const cv = document.createElement("canvas");
      cv.width = im.width; cv.height = im.height;
      const cx = cv.getContext("2d");
      cx.drawImage(im, 0, 0);
      const data = cx.getImageData(0, 0, cv.width, cv.height).data;
      const w = cv.width, h = cv.height;
      let minY = h, maxY = -1;
      const thr = Math.max(6, Math.round(w * 0.18));
      for (let y = 0; y < h; y++) {
        let cnt = 0;
        const row = y * w * 4;
        for (let x = 0; x < w; x++) {
          if (data[row + x * 4 + 3] > 128) cnt++;
        }
        if (cnt >= thr) {
          if (y < minY) minY = y;
          maxY = y;
        }
      }
      return maxY >= 0 ? (maxY - minY + 1) : h;
    } catch (e) { return im.height; }
  }
  async function loadAssets() {
    const tasks = [];
    Object.keys(CHARS).forEach(function (id) {
      const c = CHARS[id];
      if (c.portrait) tasks.push(loadImage(c.portrait).then(function (im) { IMG.portrait[id] = im; }));
      if (c.sprite) tasks.push(loadImage(c.sprite).then(function (im) { IMG.sprites[id] = im; }));
      if (c.kind === "pixel") {
        const names = ["idle_0", "idle_1", "idle_2", "idle_3", "idle_4", "idle_5"];
        for (let i = 0; i < (c.atkN || 9); i++) names.push("attack_" + i);
        for (let i = 0; i < (c.atk3N || 9); i++) names.push("attack3_" + i);
        for (let i = 0; i < (c.atk2N || 5); i++) names.push("attack2_" + i);
        IMG.kf[id] = {};
        names.forEach(function (n) {
          tasks.push(loadImage(c.anim + "/" + n + ".png").then(function (im) {
            IMG.kf[id][n] = im;
            if (im) { IMG.kf[id][n + "_bh"] = measureBody(im); IMG.kf[id][n + "_bb"] = measureBBox(im); }
          }));
        });
        // 站立基准高度：idle_0 的角色主体高度
        tasks.push(loadImage(c.anim + "/idle_0.png").then(function (im) {
          BASE_H[id] = im ? measureBody(im) : 0;
        }));
      }
    });
    await Promise.all(tasks);
  }

  /* =========================================================
     舞台渲染（Canvas 2D）
     ========================================================= */
  const stage = {
    cv: null, ctx: null, W: 0, H: 0, dpr: 1,
    fighters: {}, effects: [], running: false, t0: 0
  };

  function setupStage() {
    stage.cv = el("stageCanvas");
    stage.ctx = stage.cv.getContext("2d");
    resizeStage();
    window.addEventListener("resize", resizeStage);
    stage.running = true;
    requestAnimationFrame(loop);
  }
  function resizeStage() {
    const wrap = stage.cv.parentElement;
    const rw = wrap.offsetWidth, rh = wrap.offsetHeight;
    stage.dpr = Math.min(window.devicePixelRatio || 1, 2);
    stage.cv.width = Math.max(1, Math.round(rw * stage.dpr));
    stage.cv.height = Math.max(1, Math.round(rh * stage.dpr));
    stage.W = rw; stage.H = rh;
    if (stage.fighters.p1) {
      Object.keys(stage.fighters).forEach(function (p) {
        const f = stage.fighters[p];
        f.baseX = p === "p1" ? stage.W * 0.16 : stage.W * 0.84;
        f.groundY = stage.H * 0.84;
        f.h = stage.H * (f.char.kind === "pixel" ? 0.36 : 0.34);
        if (f.state === "idle") f.x = f.baseX;
      });
    }
  }

  function makeFighter(p, charId) {
    const c = CHARS[charId];
    return {
      player: p, charId: charId, char: c,
      x: p === "p1" ? stage.W * 0.16 : stage.W * 0.84,
      baseX: p === "p1" ? stage.W * 0.16 : stage.W * 0.84,
      facing: p === "p1" ? 1 : -1,
      groundY: stage.H * 0.84,
      h: stage.H * (c.kind === "pixel" ? 0.36 : 0.34),
      state: "idle", stateT: 0,
      animFrame: 0, animT: 0,
      flash: 0, knockX: 0, dead: false
    };
  }

  function loop(ts) {
    if (!stage.running) return;
    const ctx = stage.ctx;
    const dt = Math.min(0.05, (ts - (stage.t0 || ts)) / 1000);
    stage.t0 = ts;
    ctx.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
    ctx.clearRect(0, 0, stage.W, stage.H);
    updateFighters(dt);
    updateEffects(dt);
    drawFighters(ctx);
    drawEffects(ctx);
    requestAnimationFrame(loop);
  }

  /* ---------- 拳手状态机 ---------- */
  function updateFighters(dt) {
    const keys = Object.keys(stage.fighters);
    keys.forEach(function (k) {
      const f = stage.fighters[k];
      f.stateT += dt;
      const t = f.stateT;
      if (f.state === "dash") {
        const dur = 0.16;
        const p = clamp(t / dur, 0, 1);
        f.x = f.baseX + (f.dashX - f.baseX) * easeOutCubic(p);
        if (t >= dur) setState(f, "attack");
      } else if (f.state === "attack") {
        const dur = f.attackDur || 0.5;
        f.animT += dt;
        f.animFrame = Math.min(f.animFrames - 1, Math.floor(f.animT * (f.animFps || 14)));
        if (t >= dur) setState(f, "return");
      } else if (f.state === "return") {
        const dur = 0.22;
        const p = clamp(t / dur, 0, 1);
        f.x = f.baseX + (f.dashX - f.baseX) * (1 - easeOutCubic(p));
        if (t >= dur) setState(f, "idle");
      } else if (f.state === "hit") {
        if (t >= 0.4) setState(f, "idle");
      } else if (f.state === "guard") {
        if (t >= 0.75) setState(f, "idle");
      } else if (f.state === "ko") {
        // 倒地保持
      } else if (f.state === "win") {
        f.animT += dt;
        f.animFrame = Math.floor(f.animT * 10) % 6;
      } else {
        f.animT += dt;
        const fps = f.char.kind === "pixel" ? 8 : 10;
        f.animFrame = Math.floor(f.animT * fps) % 6;
      }
      if (f.flash > 0) f.flash -= dt;
      if (f.knockX !== 0) {
        f.x += f.knockX * dt;
        f.knockX *= (1 - dt * 6);
        if (Math.abs(f.knockX) < 2) f.knockX = 0;
        f.x = clamp(f.x, stage.W * 0.05, stage.W * 0.95); // 防止连续受击被推出舞台
      }
    });
  }
  function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }

  function setState(f, state) {
    f.state = state; f.stateT = 0; f.animT = 0; f.animFrame = 0;
  }

  /* ---------- 拳手绘制 ---------- */
  function drawFighters(ctx) {
    ["p1", "p2"].forEach(function (p) {
      const f = stage.fighters[p];
      if (!f) return;
      const c = f.char;
      let img = null, imgW = 0, imgH = 0;
      if (c.kind === "pixel") {
        const name = frameName(f);
        const im = IMG.kf[f.charId] && IMG.kf[f.charId][name];
        if (im) {
          img = im; imgW = im.width; imgH = im.height;
          if (name.indexOf("attack2_") === 0 || name.indexOf("attack3_") === 0) {
            // 强化/超必杀帧含大面积特效：优先用帧内角色主体高度；若特效撑满整帧（主体检测不可信）则回退站立基准，保证角色与待机大小一致
            const bh = IMG.kf[f.charId][name + "_bh"];
            let effH = 0;
            if (bh && bh > 0 && bh < imgH * 0.92) effH = bh;
            else effH = BASE_H[f.charId] || 0;
            if (effH && effH > 0) imgH = effH;
          } else {
            // 普通攻击/待机（无大面积特效）：按不透明包围盒高度缩放，保证角色主体在任何动作下与待机大小一致
            const bb = IMG.kf[f.charId][name + "_bb"];
            if (bb && bb >= 10) imgH = bb;
          }
        }
      } else {
        img = IMG.sprites[f.charId];
        if (img) { imgW = img.width; imgH = img.height; }
      }
      if (!img) return;
      const scale = f.h / imgH;
      const dw = imgW * scale, dh = imgH * scale;
      ctx.save();
      ctx.translate(f.x, f.groundY);
      ctx.scale(f.facing, 1);
      if (c.kind === "pixel") ctx.imageSmoothingEnabled = false;
      else ctx.imageSmoothingEnabled = true;
      let bob = 0, rot = 0, squash = 1;
      if (f.state === "idle") bob = Math.sin(f.animT * 6) * 4;
      if (f.state === "dash" || f.state === "attack") {
        const ph = clamp(f.stateT / (f.state === "dash" ? 0.16 : f.attackDur), 0, 1);
        rot = f.facing * Math.sin(ph * Math.PI) * 0.14;
        squash = 1 + Math.sin(ph * Math.PI) * 0.08;
      }
      if (f.state === "hit") bob = -6 * (1 - clamp(f.stateT / 0.4, 0, 1));
      if (f.state === "guard") bob = Math.sin(f.stateT * 14) * 2 - 4;
      if (f.state === "ko") { rot = f.facing * Math.min(1, f.stateT / 0.5) * 1.55; bob = -dh * 0.25 * Math.min(1, f.stateT / 0.5); }
      if (f.state === "win") bob = Math.abs(Math.sin(f.animT * 8)) * -10;
      ctx.translate(0, bob);
      ctx.rotate(rot);
      ctx.scale(1, squash);
      if (f.flash > 0) ctx.filter = "brightness(2.4) saturate(0.3)";
      ctx.drawImage(img, -dw / 2, -dh, dw, dh);
      ctx.filter = "none";
      if (f.state === "guard") {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = p === "p1" ? "#3ce7ff" : "#ff7ab6";
        ctx.lineWidth = 5;
        ctx.shadowColor = p === "p1" ? "#3ce7ff" : "#ff7ab6";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, -dh * 0.45, dh * 0.5, -1.05, 1.05);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    });
  }

  function frameName(f) {
    if (f.state === "attack") {
      if (f.isSuper) {
        const n = f.char.atk2N || 5;
        return "attack2_" + Math.min(n - 1, f.animFrame);
      }
      if (f.atkTier === 2) {
        const n = f.char.atk3N || 9;
        return "attack3_" + Math.min(n - 1, f.animFrame);
      }
      return "attack_" + Math.min(f.animFrames - 1, f.animFrame);
    }
    return "idle_" + f.animFrame;
  }

  /* ---------- 攻击特效（飞行 → 锁定 → 命中/格挡） ---------- */
  function launchAttack(atkP, isSuper, round, clash, tier) {
    const f = stage.fighters[atkP];
    const other = stage.fighters[atkP === "p1" ? "p2" : "p1"];
    if (!f || !other || f.dead) return;
    setState(f, "dash");
    if (clash) f.dashX = atkP === "p1" ? stage.W * 0.44 : stage.W * 0.56;
    else f.dashX = other.baseX + (atkP === "p1" ? -1 : 1) * stage.W * 0.12; // 跑到对手站立位置面前出招
    f.isSuper = !!isSuper;
    f.atkTier = tier || 1;
    f.attackDur = isSuper ? 0.62 : (tier === 2 ? 0.55 : 0.48);
    f.animFps = Math.max(8, f.animFrames / f.attackDur);
    f.animFrames = f.char.kind === "pixel"
      ? (isSuper ? (f.char.atk2N || 5) : (tier === 2 ? (f.char.atk3N || 9) : (f.char.atkN || 9)))
      : 6;
    sfx.skill();
    spawnEffect(atkP, isSuper, round, clash, tier || 1);
  }

  function spawnEffect(atkP, isSuper, round, clash, tier) {
    const a = stage.fighters[atkP];
    const d = stage.fighters[atkP === "p1" ? "p2" : "p1"];
    const c = CHARS[a.charId];
    const dir = a.facing;
    const sx = a.x + dir * a.h * 0.3;
    const sy = a.groundY - a.h * 0.72;
    const ex = clash ? stage.W * 0.5 : d.x;
    const ey = clash ? (a.groundY - a.h * 0.72 + d.groundY - d.h * 0.72) / 2 : d.groundY - d.h * 0.72;
    const eff = {
      type: c.elem, isSuper: !!isSuper, tier: tier || 1, color: c.color,
      x: sx, y: sy, tx: ex, ty: ey, dir: dir,
      t: 0, fly: 0.8, state: "fly",
      round: round, atk: atkP, def: atkP === "p1" ? "p2" : "p1",
      resolved: false, clash: !!clash
    };
    if (c.elem === "地") { eff.type = "shock"; eff.x = a.x; eff.y = a.groundY; }
    if (isSuper || tier >= 3) eff.type = "super_" + c.elem;
    stage.effects.push(eff);
    return eff;
  }

  function updateEffects(dt) {
    const alive = [];
    stage.effects.forEach(function (e) {
      if (e.resolved) {
        e.t += dt;
        if (e.t < 0.4) alive.push(e);   // 命中/格挡爆发短暂停留
        return;
      }
      if (e.state === "fly") {
        e.t += dt;
        const p = clamp(e.t / e.fly, 0, 1);
        if (p >= 1) {
          e.state = "burst";
          e.t = 0;
          e.resolved = true;
          const rd = e.round;
          if (e.clash) {
            // 双方同时出招 → 对撞；时间差 1~3s 时慢方受极少量伤害
            if (e.round.slowSide && e.round.slowSide === e.def) applyMiniDamage(e);
          } else if (rd.mode && rd.mode[e.def] === "guard") doGuard(e);
          else doDamage(e);
        }
      } else if (e.state === "arrived" || e.state === "lock") {
        e.t += dt;             // 锁定悬浮脉冲（防御性保留）
      } else if (e.state === "burst") {
        e.resolved = true; e.t = 0;
      }
      alive.push(e);
    });
    stage.effects = alive;
  }

  /* 对撞余波：时间差 1~3s 双方同时出招，慢方受极少量伤害 */
  function applyMiniDamage(e) {
    if (!battle || battle.over) return;
    const dmg = Math.max(2, Math.round(computeDamage(e.atk, e.tier || 1, false) * 0.15));
    battle.hp[e.def] = Math.max(0, battle.hp[e.def] - dmg);
    updateHp();
    const f = stage.fighters[e.def];
    if (f) { f.flash = 0.18; f.knockX = (e.atk === "p1" ? 1 : -1) * 150; setState(f, "hit"); }
    stageShake();
    sfx.hit();
    dmgNumber(e.tx, e.ty, dmg, "guard");
    if (battle.hp[e.def] <= 0) koFighter(e.atk, e.def);
  }

  /* 防守方处于防御状态 → 格挡减伤（受少量伤害） */
  function doGuard(e) {
    const defP = e.def;
    const f = stage.fighters[defP];
    if (f) { f.flash = 0.18; setState(f, "guard"); }
    sfx.block();
    const g = { type: "block", x: e.tx, y: e.ty, t: 0, dur: 0.4, color: defP === "p1" ? "#3ce7ff" : "#ff7ab6" };
    stage.effects.push(g);
    applyDamage(e.atk, e.isSuper, e, 0.3);
  }

  function doDamage(e) {
    applyDamage(e.atk, e.isSuper, e);
  }

  function applyDamage(atkP, isSuper, eff, guardMult) {
    if (!battle || battle.over) return;
    const defP = atkP === "p1" ? "p2" : "p1";
    const dmg = Math.max(2, Math.round(computeDamage(atkP, eff ? eff.tier || 1 : 1, isSuper) * (guardMult || 1)));
    battle.hp[defP] = Math.max(0, battle.hp[defP] - dmg);
    updateHp();
    const f = stage.fighters[defP];
    if (f) {
      if (guardMult) { f.flash = 0.18; setState(f, "guard"); }
      else { f.flash = 0.32; f.knockX = (atkP === "p1" ? 1 : -1) * 260; setState(f, "hit"); }
    }
    stageShake();
    sfx.hit();
    const x = eff ? eff.tx : (defP === "p1" ? stage.W * 0.3 : stage.W * 0.7);
    const y = eff ? eff.ty : (f ? f.groundY - f.h * 0.7 : stage.H * 0.5);
    dmgNumber(x, y, dmg, guardMult ? "guard" : (isSuper ? "super" : (battle.combo[atkP] >= 3 ? "crit" : "")));
    if (guardMult) announce("格挡 · 损伤", "#35f0a0");
    else announce(CHARS[battle.chars[atkP]].skill + (isSuper ? " 超必杀！" : "！"), CHARS[battle.chars[atkP]].color);
    if (battle.hp[defP] <= 0) koFighter(atkP, defP);
  }

  /* K.O.：血条强制归零，防守方倒地，攻击方胜利 */
  function koFighter(atkP, defP) {
    if (!battle || battle.over) return;
    battle.hp[defP] = 0;
    updateHp();
    battle.over = true;
    stopTimer();
    battle.roundState = null;
    const f2 = stage.fighters[defP];
    if (f2) { setState(f2, "ko"); f2.dead = true; }
    const wf = stage.fighters[atkP];
    if (wf) setState(wf, "win");
    sfx.ko();
    announce("K.O.！", "#ff2d55");
    setTimeout(function () { endBattle(atkP); }, 1100);
  }

  function computeDamage(atkP, tier, isSuper) {
    const base = CHARS[battle.chars[atkP]].power;
    // 基础伤害下调：保证整局约 11~20 轮
    let dmg = base * 0.45;
    if (tier >= 3 || isSuper) dmg *= 1.6;      // 超必杀
    else if (tier === 2) dmg *= 1.25;          // 强化
    dmg *= 1 + Math.min(battle.combo[atkP], 8) * 0.08;  // 温和连击加成
    // 前 12 回合动态兜底：单次伤害上限 = 剩余HP / 剩余回合，保证至少打 11 轮
    const round = battle.roundNum;
    const defP = atkP === "p1" ? "p2" : "p1";
    if (round < 12 && battle.hp[defP] > 0) {
      const cap = battle.hp[defP] / Math.max(1, 12 - round);
      dmg = Math.min(dmg, cap);
    }
    return Math.max(2, Math.round(dmg));
  }

  function drawEffects(ctx) {
    stage.effects.forEach(function (e) {
      if (e.type === "block") {
        const p = clamp(e.t / e.dur, 0, 1);
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4 + p * 3;
        ctx.shadowColor = e.color; ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 14 + p * 56, -1.1, 1.1);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        return;
      }
      if (e.state === "burst") {
        // 命中爆发
        const p = clamp(e.t / 0.4, 0, 1);
        const x = e.tx, y = e.ty, r = 8 + p * 42 + (e.isSuper ? 14 : 0) + (e.tier === 2 ? 8 : 0);
        ctx.globalAlpha = 0.9 * (1 - p);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
        grad.addColorStop(0, e.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.shadowColor = e.color; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        if (e.isSuper) {
          const h = 40 + p * 190;
          ctx.globalAlpha = 0.9 - p * 0.6;
          const g2 = ctx.createLinearGradient(x - 60, 0, x + 60, 0);
          g2.addColorStop(0, "rgba(0,0,0,0)"); g2.addColorStop(0.5, e.color); g2.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g2;
          ctx.fillRect(x - 60, e.ty - h, 120, h + 40);
          ctx.globalAlpha = 1;
        }
        return;
      }
      // 飞行中 / 锁定
      if (e.state === "fly") {
        const p = clamp(e.t / e.fly, 0, 1);
        e._x = e.x + (e.tx - e.x) * easeInQuad(p);
        e._y = e.y + (e.ty - e.y) * easeInQuad(p);
      } else {
        e._x = e.tx; e._y = e.ty;
      }
      const x = e._x, y = e._y;
      const r = 9 + (e.isSuper ? 9 : 0) + (e.tier === 2 ? 5 : 0);
      ctx.globalAlpha = 0.9;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      grad.addColorStop(0, e.color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.shadowColor = e.color; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      if (e.state === "lock") {
        const pulse = 1 + Math.sin(e.t * 12) * 0.2;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.55 + Math.sin(e.t * 12) * 0.25;
        ctx.beginPath(); ctx.arc(x, y, 26 * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 34 * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  }
  function easeInQuad(p) { return p * p; }

  /* =========================================================
     DOM 特效助手
     ========================================================= */
  function announce(text, color) {
    const a = el("announce");
    a.textContent = text;
    a.style.color = color || "#ffd93d";
    a.classList.remove("show"); void a.offsetWidth; a.classList.add("show");
  }
  function stageShake() {
    const st = el("stage");
    st.classList.remove("shake"); void st.offsetWidth; st.classList.add("shake");
  }
  function dmgNumber(x, y, val, cls) {
    const layer = el("stageFx");
    const d = document.createElement("div");
    d.className = "dmg-num" + (cls ? " " + cls : "");
    d.textContent = "-" + val;
    d.style.left = x + "px"; d.style.top = y + "px";
    layer.appendChild(d);
    d.animate([
      { transform: "translate(-50%,-50%) translateY(0) scale(1)", opacity: 1 },
      { transform: "translate(-50%,-50%) translateY(-46px) scale(1.15)", opacity: 0 }
    ], { duration: 900, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" }).onfinish = function () { d.remove(); };
  }

  /* =========================================================
     选角模式（战斗页内整合）
     ========================================================= */
  function avatarSrc(c) {
    if (c.kind === "pixel") return c.anim.replace(/animations[^/]*\//, "heads/") + ".png";
    if (c.portrait) return c.portrait;
    return c.sprite;
  }

  function enterSelectMode() {
    battleMode = false;
    battle = null;
    select = { p1: { cursor: 0, confirmed: false }, p2: { cursor: 0, confirmed: false } };
    picks = { p1: null, p2: null };
    musicPlay("select");
    stage.running = true;
    resizeStage();
    stage.fighters = { p1: makeFighter("p1", ROSTER_ORDER[select.p1.cursor]), p2: makeFighter("p2", ROSTER_ORDER[select.p2.cursor]) };
    stage.effects = [];
    buildKeypad("keypadP1", "p1", "select");
    buildKeypad("keypadP2", "p2", "select");
    buildRosters();
    refreshRoster();
    updateHudPreview();
    el("btnBattleExit").style.display = "";
    el("btnSettingsBattle").textContent = "设置";
    el("screen-battle").classList.remove("battle-mode");
    el("p1Hint").textContent = "方向键选人 · 确认键锁定";
    el("p2Hint").textContent = "方向键选人 · 确认键锁定";
    syncQDisplay();
    announce("请选择你的英雄", "#ffd93d");
  }

  function updatePreview(p) {
    const id = ROSTER_ORDER[select[p].cursor];
    stage.fighters[p] = makeFighter(p, id);
  }

  /* 题目文字超出可用宽度时，自动缩小字号到一行能完整放下（布局不变） */
  function fitQText(p) {
    const t = el(p + "QText");
    t.style.fontSize = "";
    let fs = parseFloat(getComputedStyle(t).fontSize);
    while (fs > 12 && t.scrollWidth > t.clientWidth) {
      fs -= 1;
      t.style.fontSize = fs + "px";
    }
  }

  function updateHudPreview() {
    ["p1", "p2"].forEach(function (p) {
      const c = CHARS[ROSTER_ORDER[select[p].cursor]];
      el(p + "Name").textContent = c.name;
      el(p + "Avatar").src = avatarSrc(c);
      el(p + "HpFill").style.width = "100%";
      el(p + "HpNum").textContent = MAX_HP;
      const bar = el(p + "Pow");
      bar.querySelectorAll("i").forEach(function (i) { i.classList.remove("on"); });
      bar.classList.remove("full");
      el(p + "QText").textContent = "请选择英雄";
      fitQText(p);
      const ie = el(p + "QInput");
      ie.textContent = "…";
      ie.classList.remove("ok", "bad", "done");
      el(p + "TimerFill").style.width = "0%";
      el(p + "TimerNum").textContent = "--";
    });
    el("roundLabel").textContent = "选择英雄";
  }

  function buildRosters() {
    ["p1", "p2"].forEach(function (p) {
      const wrap = el("roster" + p.toUpperCase());
      wrap.innerHTML = "";
      ROSTER_ORDER.forEach(function (id, i) {
        const c = CHARS[id];
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "roster-cell";
        const isSprite = !c.portrait;
        cell.innerHTML = '<img src="' + avatarSrc(c) + '" alt=""' + (isSprite ? ' class="spr"' : '') + '><span class="rname">' + c.name + "</span>";
        cell.onclick = function () {
          if (battleMode) return;
          select[p].cursor = i;
          select[p].confirmed = false;
          refreshRoster();
          updatePreview(p);
          updateHudPreview();
          sfx.click();
        };
        wrap.appendChild(cell);
      });
    });
  }

  function refreshRoster() {
    ["p1", "p2"].forEach(function (p) {
      const wrap = el("roster" + p.toUpperCase());
      const cells = wrap.children;
      for (let i = 0; i < cells.length; i++) {
        const on = select[p].cursor === i;
        cells[i].classList.toggle("cur", on);
        cells[i].classList.toggle("anim", on && !battleMode);
        cells[i].classList.toggle("locked", on && select[p].confirmed);
      }
    });
  }

  function moveCursor(p, dir) {
    if (battleMode) return;
    if (select[p].confirmed) select[p].confirmed = false;
    const s = select[p];
    let row = Math.floor(s.cursor / 2), col = s.cursor % 2;
    if (dir === "up") row = (row + 3) % 4;
    else if (dir === "down") row = (row + 1) % 4;
    else if (dir === "left") col = (col + 1) % 2;
    else if (dir === "right") col = (col + 1) % 2;
    s.cursor = row * 2 + col;
    sfx.click();
    refreshRoster();
    updatePreview(p);
    updateHudPreview();
  }

  function confirmHero(p) {
    if (battleMode) return;
    const s = select[p];
    s.confirmed = !s.confirmed;
    sfx.click();
    refreshRoster();
    if (s.confirmed) sfx.pow();
    if (select.p1.confirmed && select.p2.confirmed) {
      announce("双方就绪 · 开战！", "#ffd93d");
      sfx.superSfx();
      setTimeout(enterBattleMode, 900);
    }
  }

  function enterBattleMode() {
    if (battleMode) return;
    if (!(select.p1.confirmed && select.p2.confirmed)) return;
    battleMode = true;
    picks.p1 = ROSTER_ORDER[select.p1.cursor];
    picks.p2 = ROSTER_ORDER[select.p2.cursor];
    buildKeypad("keypadP1", "p1", "battle");
    buildKeypad("keypadP2", "p2", "battle");
    el("btnBattleExit").style.display = "none";
    el("btnSettingsBattle").textContent = "返回";
    el("screen-battle").classList.add("battle-mode");
    el("p1Hint").textContent = "倒计时归零结算 · 先答对=攻击 · 后答对=防御 · 答错=受击";
    el("p2Hint").textContent = "倒计时归零结算 · 先答对=攻击 · 后答对=防御 · 答错=受击";
    newBattle(picks.p1, picks.p2);
    setBattleUI();
    syncQDisplay();
    announce("READY...", "#ffd93d");
    setTimeout(function () {
      if (!battle.over) startRound();
    }, 900);
  }

  /* =========================================================
     战斗流程
     ========================================================= */
  function newBattle(p1Id, p2Id) {
    battle = {
      chars: { p1: p1Id, p2: p2Id },
      hp: { p1: MAX_HP, p2: MAX_HP },
      pow: { p1: 0, p2: 0 },
      combo: { p1: 0, p2: 0 },
      maxCombo: { p1: 0, p2: 0 },
      correct: { p1: 0, p2: 0 },
      total: 0,
      round: 0,
      roundState: null,
      input: { p1: "", p2: "" },
      timeLeft: 0, timerHandle: null,
      over: false, paused: false, winner: null
    };
    stage.fighters = { p1: makeFighter("p1", p1Id), p2: makeFighter("p2", p2Id) };
    stage.effects = [];
  }

  function setBattleUI() {
    const c1 = CHARS[battle.chars.p1], c2 = CHARS[battle.chars.p2];
    el("p1Name").textContent = c1.name;
    el("p2Name").textContent = c2.name;
    el("p1Avatar").src = avatarSrc(c1);
    el("p2Avatar").src = avatarSrc(c2);
    updateHp();
    updatePow();
  }
  function updateHp() {
    el("p1HpFill").style.width = (battle.hp.p1 / MAX_HP * 100) + "%";
    el("p2HpFill").style.width = (battle.hp.p2 / MAX_HP * 100) + "%";
    el("p1HpNum").textContent = battle.hp.p1;
    el("p2HpNum").textContent = battle.hp.p2;
  }
  function updatePow() {
    ["p1", "p2"].forEach(function (p) {
      const bar = el(p + "Pow");
      const n = battle.pow[p];
      const cells = bar.querySelectorAll("i");
      cells.forEach(function (c, i) { c.classList.toggle("on", i < n); });
      bar.classList.toggle("full", n >= POW_MAX);
    });
  }

  function startRound() {
    if (!battleMode || !battle || battle.over) return;
    musicPlay("battle");
    battle.round++;
    battle.total++;
    const rd = {
      q: { p1: makeQ(difficulty), p2: makeQ(difficulty) },
      answered: { p1: false, p2: false },
      correct: { p1: false, p2: false },
      answerT: { p1: 0, p2: 0 },
      closeT: null
    };
    battle.roundState = rd;
    battle.input = { p1: "", p2: "" };
    el("roundLabel").textContent = "ROUND " + battle.round;
    ["p1", "p2"].forEach(function (p) {
      const q = rd.q[p];
      if (q && q.kind === "vertical") {
        renderVArea(p, q);
      } else {
        el(p + "QText").textContent = q.text;
        const ie = el(p + "QInput");
        ie.textContent = "_";
        ie.classList.remove("ok", "bad", "done");
      }
    });
    fitQText("p1");
    fitQText("p2");
    syncQDisplay();
    startTimer(rd);
    announce("ROUND " + battle.round + " · FIGHT！", "#ffd93d");
  }

  /* 根据模式切换题目展示：横式显示 q-row，竖式显示竖式答题区 */
  function syncQDisplay() {
    ["p1", "p2"].forEach(function (p) {
      let vertical = battleMode && gameMode === "vertical";
      // 回合进行中时，以当前回合实际题目类型为准（避免战斗中切换模式导致显示区空白）
      const rd = battle && battle.roundState;
      if (rd && rd.q && rd.q[p]) vertical = rd.q[p].kind === "vertical";
      el(p + "QText").closest(".q-row").style.display = vertical ? "none" : "flex";
      el(p + "VArea").style.display = vertical ? "flex" : "none";
    });
  }

  /* ---------- 输入 ---------- */
  const flashT = { p1: null, p2: null };
  function flashInput(p, ok) {
    if (gameMode === "vertical") {
      const area = el(p + "VArea");
      area.classList.remove("ok", "bad", "done");
      void area.offsetWidth;
      area.classList.add(ok ? "ok" : "bad");
      clearTimeout(flashT[p]);
      flashT[p] = setTimeout(function () {
        area.classList.remove("ok", "bad");
        area.classList.add("done");
      }, 650);
      return;
    }
    const ie = el(p + "QInput");
    ie.classList.remove("ok", "bad", "done");
    void ie.offsetWidth;
    ie.classList.add(ok ? "ok" : "bad");
    clearTimeout(flashT[p]);
    flashT[p] = setTimeout(function () {
      ie.classList.remove("ok", "bad");
      ie.classList.add("done");
    }, 650);
  }

  function keyPress(p, k) {
    if (!battleMode) {
      if (k === "up" || k === "down" || k === "left" || k === "right") moveCursor(p, k);
      else if (k === "ok") confirmHero(p);
      return;
    }
    if (!battle || battle.over || battle.paused) return;
    const rd = battle.roundState;
    if (!rd || rd.answered[p]) return;
    if (gameMode === "vertical") { vKeyPress(p, k); return; }
    sfx.click();
    let s = battle.input[p];
    if (k >= "0" && k <= "9") {
      if (s.length < 6) s += k;
    } else if (k === "dot") {
      if (s.length < 6 && s.indexOf(".") === -1) s += ".";
    } else if (k === "clear") {
      s = "";
    } else if (k === "back") {
      s = s.slice(0, -1);
    } else if (k === "ok") {
      onAnswer(p);
      return;
    }
    battle.input[p] = s;
    el(p + "QInput").textContent = s || "_";
  }

  function onAnswer(p) {
    if (!battleMode || !battle || battle.over) return;
    const rd = battle.roundState;
    if (!rd || rd.answered[p]) return;
    const correct = rd.q[p] && parseInt(battle.input[p].trim(), 10) === rd.q[p].answer;
    rd.answered[p] = true;
    rd.correct[p] = correct;
    rd.answerT[p] = performance.now();
    if (correct) {
      battle.combo[p]++;
      battle.maxCombo[p] = Math.max(battle.maxCombo[p], battle.combo[p]);
      battle.correct[p]++;
      battle.pow[p] = Math.min(POW_MAX, battle.pow[p] + 1);
      updatePow();
      flashInput(p, true);
      sfx.success();
    } else {
      battle.combo[p] = 0;
      flashInput(p, false);
      sfx.wrong();
    }
    // 出招/防御在倒计时归零时统一结算（见 onTimeout / settleRound）
  }

  /* ---------- 计时器 ---------- */
  function startTimer(rd) {
    stopTimer();
    battle.timeLeft = timeSec;
    renderTimer();
    battle.timerHandle = setInterval(function () {
      if (!battleMode || !battle || battle.over) { stopTimer(); return; }
      battle.timeLeft--;
      renderTimer();
      if (battle.timeLeft <= 0) {
        stopTimer();
        onTimeout(rd);
      }
    }, 1000);
  }
  function stopTimer() {
    if (battle && battle.timerHandle) { clearInterval(battle.timerHandle); battle.timerHandle = null; }
  }
  function renderTimer() {
    const pct = battle.timeLeft / timeSec * 100;
    ["p1", "p2"].forEach(function (p) {
      const fill = el(p + "TimerFill");
      fill.style.width = pct + "%";
      fill.classList.toggle("danger", battle.timeLeft <= 3);
      el(p + "TimerNum").textContent = battle.timeLeft + "s";
    });
  }

  function onTimeout(rd) {
    if (!battleMode || !battle || battle.over) return;
    if (battle.roundState !== rd) return;
    ["p1", "p2"].forEach(function (p) {
      if (!rd.answered[p]) { rd.answered[p] = true; rd.correct[p] = false; rd.answerT[p] = 0; }
    });
    settleRound(rd);
  }

  /* 倒计时归零：统一结算本回合（攻击 / 防御 / 对撞） */
  const CLASH_WINDOW = 1000;      // 双方答对时间差 ≤1s → 同时出招，中央对撞无伤
  const MID_ATTACK_WINDOW = 3000; // 时间差 1~3s → 双方中央释放技能，慢方受极少量伤害
  function settleRound(rd) {
    const c1 = rd.correct.p1, c2 = rd.correct.p2;
    const mode = { p1: "miss", p2: "miss" };
    let clash = false;
    let slowSide = null;
    if (c1 && c2) {
      const d = Math.abs(rd.answerT.p1 - rd.answerT.p2);
      const first = rd.answerT.p1 <= rd.answerT.p2 ? "p1" : "p2";
      const last = first === "p1" ? "p2" : "p1";
      if (d <= CLASH_WINDOW) {
        mode.p1 = "attack"; mode.p2 = "attack"; clash = true;
      } else if (d <= MID_ATTACK_WINDOW) {
        mode.p1 = "attack"; mode.p2 = "attack"; clash = true; slowSide = last;
      } else {
        mode[first] = "attack"; mode[last] = "guard";
      }
    } else if (c1) { mode.p1 = "attack"; }
    else if (c2) { mode.p2 = "attack"; }
    rd.mode = mode;
    rd.clash = clash;
    rd.slowSide = slowSide;
    const anyAction = clash || mode.p1 === "attack" || mode.p2 === "attack" || mode.p1 === "guard" || mode.p2 === "guard";
    if (!anyAction) announce("时间到！", "#ff9a3c");
    // 连击段位：combo >= t3 → 超必杀；combo >= t2 → 强化；否则普通
    function tierOf(p) { return battle.combo[p] >= comboSet.t3 ? 3 : battle.combo[p] >= comboSet.t2 ? 2 : 1; }
    if (clash) {
      launchAttack("p1", battle.pow.p1 >= POW_MAX, rd, true, tierOf("p1"));
      launchAttack("p2", battle.pow.p2 >= POW_MAX, rd, true, tierOf("p2"));
      consumeSuper("p1"); consumeSuper("p2");
      sfx.superSfx();
      announce(slowSide ? "招式对撞 · 慢手受挫！" : "旗鼓相当 · 招式中断！", "#ffd93d");
    } else {
      ["p1", "p2"].forEach(function (p) {
        if (mode[p] === "attack") {
          const tier = tierOf(p);
          const isSuper = tier === 3 || battle.pow[p] >= POW_MAX;
          if (isSuper) { sfx.superSfx(); announce("超必杀！", "#ff5eb5"); }
          else if (tier === 2) announce(CHARS[battle.chars[p]].name + " · 强化出招！", "#ffd93d");
          else announce(CHARS[battle.chars[p]].name + " 出招！", CHARS[battle.chars[p]].color);
          launchAttack(p, isSuper, rd, false, tier);
          consumeSuper(p);
        } else if (mode[p] === "guard") {
          const f = stage.fighters[p];
          if (f) setState(f, "guard");
          sfx.block();
        }
      });
    }
    closeRound(rd);
  }
  function consumeSuper(p) {
    if (battle.pow[p] >= POW_MAX) { battle.pow[p] = 0; updatePow(); }
  }

  function closeRound(rd) {
    if (!battleMode || !battle || battle.over) return;
    if (battle.roundState !== rd) return;
    battle.roundState = null;
    stopTimer();
    setTimeout(function () {
      if (battleMode && battle && !battle.over) startRound();
    }, 1000);
  }

  /* ---------- 结算 ---------- */
  function endBattle(winner) {
    battle.over = true;
    musicStop();
    stopTimer();
    battle.roundState = null;
    const c1 = CHARS[battle.chars.p1], c2 = CHARS[battle.chars.p2];
    const emblem = el("resultEmblem"), title = el("resultTitle");
    if (winner === "p1") {
      emblem.className = "result-emblem";
      emblem.textContent = "胜";
      title.className = "result-title";
      title.textContent = "玩家1 · " + c1.name + " 获胜！";
      sfx.success(); sfx.success();
    } else {
      emblem.className = "result-emblem p2win";
      emblem.textContent = "胜";
      title.className = "result-title p2win";
      title.textContent = "玩家2 · " + c2.name + " 获胜！";
      sfx.success(); sfx.success();
    }
    el("resultKo").textContent = "K.O.！体力耗尽";
    el("r1Correct").textContent = battle.correct.p1;
    el("r2Correct").textContent = battle.correct.p2;
    el("r1Combo").textContent = "×" + battle.maxCombo.p1;
    el("r2Combo").textContent = "×" + battle.maxCombo.p2;
    const roundBest = Math.max(battle.correct.p1, battle.correct.p2);
    if (roundBest > best) { best = roundBest; store.set("best", best); }
    el("rBestLine").textContent = "最佳答题纪录 " + best + " 题 · 本局共 " + battle.total + " 回合";
    el("bestScore").textContent = best;
    openModal("modalResult");
  }

  /* =========================================================
     虚拟键盘构建
     ========================================================= */
  function buildKeypad(containerId, player, mode) {
    const wrap = el(containerId);
    wrap.className = "keypad " + (mode === "select" ? "select" : "battle");
    wrap.innerHTML = "";
    if (mode === "select") {
      const dirs = [
        { k: "up", t: "▲", cls: "dir up" },
        { k: "left", t: "◀", cls: "dir left" },
        { k: "down", t: "▼", cls: "dir down" },
        { k: "right", t: "▶", cls: "dir right" }
      ];
      dirs.forEach(function (b) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "key " + b.cls;
        btn.textContent = b.t;
        btn.addEventListener("click", function () { ensureAudio(); keyPress(player, b.k); });
        wrap.appendChild(btn);
      });
      const ok = document.createElement("button");
      ok.type = "button";
      ok.className = "key confirm-hero";
      ok.textContent = "确认";
      ok.addEventListener("click", function () { ensureAudio(); keyPress(player, "ok"); });
      wrap.appendChild(ok);
    } else {
      const rows = [
        [{ k: "7", t: "7" }, { k: "8", t: "8" }, { k: "9", t: "9" }, { k: "clear", t: "清除", cls: "fn clear" }],
        [{ k: "4", t: "4" }, { k: "5", t: "5" }, { k: "6", t: "6" }, { k: "dot", t: ".", cls: "dot" }],
        [{ k: "1", t: "1" }, { k: "2", t: "2" }, { k: "3", t: "3" }, { k: "0", t: "0" }],
        [{ k: "back", t: "退格", cls: "fn back" }, { k: "ok", t: "确定", cls: "fn confirm" }]
      ];
      rows.forEach(function (row) {
        row.forEach(function (b) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "key" + (b.cls ? " " + b.cls : "");
          btn.textContent = b.t;
          btn.addEventListener("click", function () { ensureAudio(); keyPress(player, b.k); });
          wrap.appendChild(btn);
        });
      });
    }
  }

  /* =========================================================
     界面切换
     ========================================================= */
  function showScreen(id) {
    screen = id;
    ["title", "battle"].forEach(function (s) {
      el("screen-" + s).classList.toggle("active", s === id);
    });
  }

  /* =========================================================
     弹窗管理
     ========================================================= */
  function openModal(id) { el(id).classList.add("open"); el(id).setAttribute("aria-hidden", "false"); }
  function closeModal(id) { el(id).classList.remove("open"); el(id).setAttribute("aria-hidden", "true"); }
  function openSettings() {
    syncSettingsUI();
    if (battleMode && battle && !battle.over) { stopTimer(); battle.paused = true; }
    openModal("modalSettings");
  }
  function closeSettings() {
    closeModal("modalSettings");
    if (battleMode && battle && battle.paused && !battle.over) {
      battle.paused = false;
      if (battle.roundState && battle.timeLeft > 0) startTimer(battle.roundState);
    }
  }
  function syncSettingsUI() {
    document.querySelectorAll("#segDifficulty .seg-btn").forEach(function (b) {
      b.classList.toggle("on", Number(b.getAttribute("data-diff")) === difficulty);
    });
    document.querySelectorAll("#segMode .seg-btn").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-mode") === gameMode);
    });
    document.querySelectorAll("#segZero .seg-btn").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-zero") === zeroRule);
    });
    const ti = el("timeInput");
    if (ti) { ti.value = timeSec; }
    const ci1 = el("comboInput1");
    if (ci1) { ci1.value = comboSet.t1; el("comboInput2").value = comboSet.t2; el("comboInput3").value = comboSet.t3; }
    el("toggleSound").classList.toggle("on", soundOn);
  }

  /* =========================================================
     事件绑定
     ========================================================= */
  function bind() {
    el("btnStart").onclick = function () { ensureAudio(); sfx.click(); musicPlay("select"); showScreen("battle"); enterSelectMode(); };
    el("btnHow").onclick = function () { ensureAudio(); sfx.click(); musicPlay("title"); openModal("modalHow"); };
    el("btnHowClose").onclick = function () { sfx.click(); closeModal("modalHow"); };
    el("btnSettingsBattle").onclick = function () {
      ensureAudio(); sfx.click();
      if (battleMode) { stopTimer(); battleMode = false; enterSelectMode(); }
      else { musicPlay("title"); openSettings(); }
    };
    el("btnBattleExit").onclick = function () {
      sfx.click();
      battleMode = false;
      stopTimer();
      if (battle) { battle.roundState = null; battle.over = true; }
      stage.running = false;
      stage.fighters = {};
      showScreen("title");
      musicPlay("title");
    };

    document.addEventListener("keydown", function (e) {
      if (screen !== "battle") {
        if (e.key === "Escape") openSettings();
        return;
      }
      const code = e.code || "";
      const k = e.key;
      if (!battleMode) {
        let p = null, act = null;
        if (code === "KeyW") { p = "p1"; act = "up"; }
        else if (code === "KeyS") { p = "p1"; act = "down"; }
        else if (code === "KeyA") { p = "p1"; act = "left"; }
        else if (code === "KeyD") { p = "p1"; act = "right"; }
        else if (k === "Enter") { p = "p1"; act = "ok"; }
        else if (code === "ArrowUp") { p = "p2"; act = "up"; }
        else if (code === "ArrowDown") { p = "p2"; act = "down"; }
        else if (code === "ArrowLeft") { p = "p2"; act = "left"; }
        else if (code === "ArrowRight") { p = "p2"; act = "right"; }
        else if (code === "NumpadEnter") { p = "p2"; act = "ok"; }
        if (p) {
          e.preventDefault();
          ensureAudio();
          keyPress(p, act);
        } else if (e.key === "Escape") {
          openSettings();
        }
        return;
      }
      if (code.indexOf("Numpad") === 0) {
        e.preventDefault();
        ensureAudio();
        if (code === "NumpadEnter") keyPress("p2", "ok");
        else if (code === "NumpadDecimal") keyPress("p2", "dot");
        else {
          const d = code.replace("Numpad", "");
          if (/^[0-9]$/.test(d)) keyPress("p2", d);
        }
        return;
      }
      if (code === "Delete") { e.preventDefault(); ensureAudio(); keyPress("p2", "back"); return; }
      if (/^[0-9]$/.test(k)) { ensureAudio(); keyPress("p1", k); }
      else if (k === "Enter") { ensureAudio(); keyPress("p1", "ok"); }
      else if (k === "Backspace") { ensureAudio(); keyPress("p1", "back"); }
      else if (k === ".") { ensureAudio(); keyPress("p1", "dot"); }
      else if (k === "Escape") { openSettings(); }
    });

    document.querySelectorAll("#segDifficulty .seg-btn").forEach(function (b) {
      b.onclick = function () {
        difficulty = Number(b.getAttribute("data-diff"));
        store.set("diff", difficulty); syncSettingsUI(); sfx.click();
      };
    });
    document.querySelectorAll("#segMode .seg-btn").forEach(function (b) {
      b.onclick = function () {
        gameMode = b.getAttribute("data-mode");
        store.set("mode", gameMode);
        syncSettingsUI(); syncQDisplay(); sfx.click();
      };
    });
    document.querySelectorAll("#segZero .seg-btn").forEach(function (b) {
      b.onclick = function () {
        zeroRule = b.getAttribute("data-zero");
        store.set("zero", zeroRule);
        syncSettingsUI(); sfx.click();
      };
    });
    document.querySelectorAll("#segTime .seg-btn").forEach(function (b) {});
    el("timeInput").addEventListener("change", function () {
      const v = parseInt(this.value, 10);
      if (isNaN(v) || v < 5 || v > 60) { this.value = timeSec; return; }
      timeSec = v;
      store.set("time", timeSec); syncSettingsUI(); sfx.click();
    });
    // 连击段位阈值（普通/强化/超必杀）：需 1 ≤ t1 < t2 < t3 ≤ 30，非法回滚
    ["comboInput1", "comboInput2", "comboInput3"].forEach(function (id, idx) {
      el(id).addEventListener("change", function () {
        const v = parseInt(this.value, 10);
        const t1 = parseInt(el("comboInput1").value, 10);
        const t2 = parseInt(el("comboInput2").value, 10);
        const t3 = parseInt(el("comboInput3").value, 10);
        if (isNaN(v) || v < 1 || v > 30 || !(t1 < t2 && t2 < t3)) {
          el("comboInput1").value = comboSet.t1;
          el("comboInput2").value = comboSet.t2;
          el("comboInput3").value = comboSet.t3;
          return;
        }
        comboSet.t1 = t1; comboSet.t2 = t2; comboSet.t3 = t3;
        store.set("combo1", t1); store.set("combo2", t2); store.set("combo3", t3);
        syncSettingsUI(); sfx.click();
      });
    });
    el("timeInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); el("btnSettingsClose").click(); }
    });
    el("toggleSound").onclick = function () {
      soundOn = !soundOn; store.set("sound", soundOn); ensureAudio(); syncSettingsUI(); sfx.click();
      musicSync();
    };
    el("btnSettingsClose").onclick = function () { sfx.click(); closeSettings(); };

    el("btnResultAgain").onclick = function () {
      sfx.click(); closeModal("modalResult");
      enterBattleMode();
    };
    el("btnResultSelect").onclick = function () {
      sfx.click(); closeModal("modalResult");
      enterSelectMode();
    };

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (battleMode && battle && !battle.over && !battle.paused) {
          stopTimer(); battle.paused = true;
        }
      } else {
        if (battleMode && battle && battle.paused && !battle.over) {
          battle.paused = false;
          if (battle.roundState && battle.timeLeft > 0) startTimer(battle.roundState);
        }
      }
    });
  }

  /* ---------- 初始化 ---------- */
  function fitScreen() {
    const app = el("app");
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    app.style.transform = "translate(-50%,-50%) scale(" + s + ")";
  }
  async function init() {
    bind();
    buildKeypad("keypadP1", "p1", "select");
    buildKeypad("keypadP2", "p2", "select");
    el("bestScore").textContent = best;
    setupStage();
    fitScreen();
    window.addEventListener("resize", fitScreen);
    await loadAssets();
    showScreen("title");
    musicPlay("title");
    document.addEventListener("click", function once() { musicSync(); }, { once: true });
  }

  init();
})();
