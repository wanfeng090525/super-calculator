/* ================= 工具 ================= */
const $ = (sel) => document.querySelector(sel);
const $std = { expr: $('#std-expr'), result: $('#std-result') };
const $sci = { expr: $('#sci-expr'), result: $('#sci-result') };

/* ================= 标签页 ================= */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    $(`#panel-${tab.dataset.tab}`).classList.add('active');
  });
});

/* ================= 计算器核心 ================= */
function makeCalculator(state, display) {
  state = Object.assign({ cur: '0', prev: null, op: null, justEvaluated: false }, state || {});

  const fmt = (n) => {
    if (n === 'Error' || n === Infinity || n === -Infinity || Number.isNaN(n)) return 'Error';
    const num = Number(n);
    if (!isFinite(num)) return 'Error';
    // 超大/超小用科学计数，否则最多保留 12 位有效数字
    if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-9 && num !== 0)) {
      return num.toExponential(8).replace(/\.?0+e/, 'e');
    }
    return String(parseFloat(num.toPrecision(12)));
  };

  const show = (exprText) => {
    display.expr.textContent = exprText === undefined ? state.cur : exprText;
    display.result.textContent = state.cur;
  };

  const apply = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      case '^': return Math.pow(a, b);
    }
  };

  const OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };

  function press(k) {
    const numK = /^[0-9]$/.test(k);

    if (numK) {
      if (state.justEvaluated) { state.cur = '0'; state.prev = null; state.op = null; state.justEvaluated = false; }
      state.cur = state.cur === '0' ? k : (state.cur.length < 15 ? state.cur + k : state.cur);
    } else if (k === '.') {
      if (state.justEvaluated) { state.cur = '0'; state.justEvaluated = false; }
      if (!state.cur.includes('.')) state.cur += '.';
    } else if (k === 'C') {
      state.cur = '0'; state.prev = null; state.op = null; state.justEvaluated = false;
      display.expr.textContent = '\u00A0';
    } else if (k === 'CE') {
      state.cur = '0';
    } else if (k === 'BACK') {
      if (state.justEvaluated) { state.justEvaluated = false; state.cur = '0'; }
      else state.cur = state.cur.length > 1 ? state.cur.slice(0, -1) : '0';
    } else if (k === 'NEG') {
      if (state.cur !== '0') state.cur = state.cur.startsWith('-') ? state.cur.slice(1) : '-' + state.cur;
    } else if (k === '=') {
      if (state.op !== null && state.prev !== null) {
        const r = apply(Number(state.prev), Number(state.cur), state.op);
        show(`${fmt(state.prev)} ${OP_SYMBOL[state.op]} ${fmt(state.cur)} =`);
        state.cur = fmt(r);
        state.prev = null; state.op = null; state.justEvaluated = true;
        display.result.textContent = state.cur;
        return;
      }
    } else if (['+', '-', '*', '/', '^'].includes(k)) {
      if (state.op !== null && state.prev !== null && !state.justEvaluated) {
        const r = apply(Number(state.prev), Number(state.cur), state.op);
        state.prev = fmt(r);
      } else {
        state.prev = state.cur;
      }
      state.op = k;
      state.cur = String(Number(state.prev)); // 等待第二操作数
      state.cur = '0';
      show(`${fmt(state.prev)} ${OP_SYMBOL[k]}`);
      return;
    }
    show();
  }

  return { press, state };
}

/* ---- 标准计算器 ---- */
const stdCalc = makeCalculator({}, $std);
document.querySelectorAll('#std-keys .key').forEach((btn) =>
  btn.addEventListener('click', () => stdCalc.press(btn.dataset.k))
);

/* ---- 科学计算器 ---- */
const sciState = { cur: '0', prev: null, op: null, justEvaluated: false };
const sciCalc = makeCalculator(sciState, $sci);

function sciFunc(k) {
  const x = Number(sciState.cur);
  let r;
  let label = '';
  switch (k) {
    case 'sin': r = Math.sin(x); label = `sin(${fmt(x)})`; break;
    case 'cos': r = Math.cos(x); label = `cos(${fmt(x)})`; break;
    case 'tan': r = Math.tan(x); label = `tan(${fmt(x)})`; break;
    case 'ln': r = x <= 0 ? NaN : Math.log(x); label = `ln(${fmt(x)})`; break;
    case 'log': r = x <= 0 ? NaN : Math.log10(x); label = `log(${fmt(x)})`; break;
    case 'sqrt': r = x < 0 ? NaN : Math.sqrt(x); label = `√(${fmt(x)})`; break;
    case 'sq': r = x * x; label = `sqr(${fmt(x)})`; break;
    case 'pi': sciState.cur = String(Math.PI); showSci(); return;
    default: return;
  }
  sciState.cur = fmt(r);
  $sci.expr.textContent = label;
  $sci.result.textContent = sciState.cur;
  sciState.justEvaluated = true;
}

const fmt = (n) => {
  if (typeof n === 'string') n = Number(n);
  if (!isFinite(n) || Number.isNaN(n)) return 'Error';
  if (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-9 && n !== 0)) {
    return n.toExponential(8).replace(/\.?0+e/, 'e');
  }
  return String(parseFloat(n.toPrecision(12)));
};

function showSci() {
  $sci.result.textContent = sciState.cur;
}

document.querySelectorAll('#sci-keys .key').forEach((btn) =>
  btn.addEventListener('click', () => {
    const k = btn.dataset.k;
    if (['sin', 'cos', 'tan', 'ln', 'log', 'sqrt', 'sq', 'pi'].includes(k)) sciFunc(k);
    else sciCalc.press(k);
  })
);

/* ---- 物理键盘支持 ---- */
document.addEventListener('keydown', (e) => {
  const active = document.querySelector('.panel.active').id;
  if (!active.startsWith('panel-standard') && !active.startsWith('panel-scientific')) return;

  const map = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '.': '.', '+': '+', '-': '-', '*': '*', '/': '/',
    'Enter': '=', '=': '=', 'Backspace': 'BACK', 'Escape': 'C',
    'Delete': 'CE', '^': '^'
  };
  const k = map[e.key];
  if (k) {
    e.preventDefault();
    (active === 'panel-standard' ? stdCalc : sciCalc).press(k);
  }
});

/* ================= 汇率转换 ================= */
const CURRENCIES = [
  ['CNY', '人民币 ¥'], ['USD', '美元 $'], ['EUR', '欧元 €'], ['JPY', '日元 ¥'],
  ['HKD', '港币 HK$'], ['GBP', '英镑 £'], ['KRW', '韩元 ₩'], ['AUD', '澳元 A$'],
  ['CAD', '加元 C$'], ['SGD', '新加坡元 S$'], ['CHF', '瑞士法郎'], ['THB', '泰铢 ฿'],
  ['MYR', '林吉特 RM'], ['RUB', '卢布 ₽'], ['INR', '卢比 ₹'], ['NZD', '纽元 NZ$']
];

const RATE_API = 'https://open.er-api.com/v6/latest/CNY';
const RATE_STORE_KEY = 'rates_cache_v1';

let rates = { CNY: 1 };
let ratesDate = '';

function loadCache() {
  try {
    const raw = localStorage.getItem(RATE_STORE_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      rates = c.rates; ratesDate = c.date;
      updateRateUI(`离线汇率 · ${c.date}（尝试联网更新…）`);
    }
  } catch (e) { /* 忽略缓存损坏 */ }
}

async function fetchRates() {
  try {
    const res = await fetch(RATE_API);
    const data = await res.json();
    if (data && data.result === 'success' && data.rates) {
      rates = data.rates;
      ratesDate = data.time_last_update_utc || new Date().toLocaleDateString();
      localStorage.setItem(RATE_STORE_KEY, JSON.stringify({ rates, date: ratesDate }));
      updateRateUI(`在线汇率 · 更新于 ${ratesDate}`);
    } else {
      updateRateUI('联网失败，使用缓存汇率');
    }
  } catch (e) {
    updateRateUI('联网失败，使用缓存汇率');
  }
}

function updateRateUI(status) {
  $('#rate-status').textContent = status;
  convert();
  const f = $('#from-currency').value, t = $('#to-currency').value;
  if (rates[t] && rates[f]) {
    $('#rate-info').textContent = `1 ${f} = ${fmt(rates[t] / rates[f])} ${t}`;
  }
}

function convert() {
  const f = $('#from-currency').value, t = $('#to-currency').value;
  const amt = parseFloat($('#from-amount').value);
  if (!rates[t] || !rates[f]) { $('#to-amount').value = ''; return; }
  const out = (amt || 0) * rates[t] / rates[f];
  $('#to-amount').value = fmt(out);
}

function fillSelects() {
  const opts = CURRENCIES.map(([code, name]) => `<option value="${code}">${name} ${code}</option>`).join('');
  $('#from-currency').innerHTML = opts;
  $('#to-currency').innerHTML = opts;
  $('#from-currency').value = 'CNY';
  $('#to-currency').value = 'USD';
}

fillSelects();
loadCache();
fetchRates();

$('#from-amount').addEventListener('input', convert);
$('#from-currency').addEventListener('change', convert);
$('#to-currency').addEventListener('change', convert);
$('#swap-btn').addEventListener('click', () => {
  const f = $('#from-currency').value, t = $('#to-currency').value;
  $('#from-currency').value = t;
  $('#to-currency').value = f;
  convert();
});
