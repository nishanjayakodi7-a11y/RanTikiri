/* ============ රං ටිකිරි — Shared JS ============ */
const WA_NUMBER = '94763729072'; // 076 372 9072
const WA_LINK = `https://wa.me/${WA_NUMBER}`;

// Default live prices (2026-11-13, Sri Lanka) — fallback if live fetch fails
const DEFAULT_PRICES = { k22: 41400, k24: 45000, updated: '2026-11-13' };
const GRAMS_PER_PAWN = 8;

/* ---------- Safe storage (works even when localStorage is blocked) ---------- */
const __mem = {};
let __lsOk = true, __ssOk = true;

const store = {
  get(k) { if (__lsOk) { try { return localStorage.getItem(k); } catch (e) { __lsOk = false; } } return (k in __mem) ? __mem[k] : null; },
  set(k, v) { if (__lsOk) { try { localStorage.setItem(k, v); return; } catch (e) { __lsOk = false; } } __mem[k] = v; },
  del(k) { if (__lsOk) { try { localStorage.removeItem(k); return; } catch (e) { __lsOk = false; } } delete __mem[k]; },
  sget(k) { if (__ssOk) { try { return sessionStorage.getItem(k); } catch (e) { __ssOk = false; } } return (k in __mem) ? __mem[k] : null; },
  sset(k, v) { if (__ssOk) { try { sessionStorage.setItem(k, v); return; } catch (e) { __ssOk = false; } } __mem[k] = v; },
  sdel(k) { if (__ssOk) { try { sessionStorage.removeItem(k); return; } catch (e) { __ssOk = false; } } delete __mem[k]; }
};



function fmtRs(n) {
  return 'රු. ' + Math.round(n).toLocaleString('en-LK');
}

// Price source priority: admin override > live API > defaults
async function getGoldPrices() {
  const adminSet = store.get('rt_prices');
  if (adminSet) {
    try { return JSON.parse(adminSet); } catch (e) {}
  }
  try {
    const [goldRes, fxRes] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU'),
      fetch('https://open.er-api.com/v6/latest/USD')
    ]);
    const gold = await goldRes.json();
    const fx = await fxRes.json();
    const usdPerOz = gold.price;
    const lkrPerUsd = fx.rates && fx.rates.LKR;
    if (usdPerOz && lkrPerUsd) {
      const k24 = (usdPerOz / 31.1035) * lkrPerUsd;
      const k22 = k24 * (22 / 24);
      return { k22: Math.round(k22), k24: Math.round(k24), updated: new Date().toISOString().slice(0, 10), live: true };
    }
  } catch (e) { /* fall through to defaults */ }
  return DEFAULT_PRICES;
}

function renderPrices(p) {
  document.querySelectorAll('[data-price="k22"]').forEach(el => el.textContent = fmtRs(p.k22));
  document.querySelectorAll('[data-price="k24"]').forEach(el => el.textContent = fmtRs(p.k24));
  document.querySelectorAll('[data-price="pawn22"]').forEach(el => el.textContent = fmtRs(p.k22 * GRAMS_PER_PAWN));
  document.querySelectorAll('[data-price="pawn24"]').forEach(el => el.textContent = fmtRs(p.k24 * GRAMS_PER_PAWN));
  document.querySelectorAll('[data-price-date]').forEach(el => el.textContent = p.updated || '');
  // Item cards: price = grams * per-gram rate
  document.querySelectorAll('.item-card').forEach(card => {
    const grams = parseFloat(card.dataset.grams || '0');
    const carat = card.dataset.carat || '22';
    const rate = carat === '24' ? p.k24 : p.k22;
    const priceEl = card.querySelector('.item-price b');
    if (priceEl && grams > 0) priceEl.textContent = fmtRs(grams * rate);
  });
}

async function initPrices() {
  const p = await getGoldPrices();
  renderPrices(p);
  return p;
}

// Field validation helper (shared)
function setInvalid(fieldId, bad) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.toggle('invalid', !!bad);
  return !bad;
}

// WhatsApp order link builder
function waOrder(text) {
  return `${WA_LINK}?text=${encodeURIComponent(text)}`;
}

// Toast notification
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// Mobile menu
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.menu-btn');
  const links = document.querySelector('.nav-links');
  if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
  initPrices();
});
