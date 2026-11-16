/* ============ රං ටිකිරි — Gold Items Data Layer ============ */
/* ඇඩ්මින් පැනලයෙන් ඇතුළත් කරන භාණ්ඩ localStorage ('rt_items') හි ගබඩා වේ */

const ITEMS_KEY = 'rt_items';

const DEFAULT_ITEMS = [
  { id: 'it-necklace', name: 'රන් මාලය',           carat: '22', grams: 16, desc: 'සාම්ප්‍රදායික නිර්මාණය', img: 'images/necklace.jpg', featured: true,  available: true },
  { id: 'it-bangles',  name: 'රන් වළලු',            carat: '22', grams: 24, desc: 'යුගලය — සාම්ප්‍රදායික කැටයම්', img: 'images/bangles.jpg', featured: true,  available: true },
  { id: 'it-earrings', name: 'රන් කරාබු',           carat: '22', grams: 8,  desc: 'සාම්ප්‍රදායික නිර්මාණය', img: 'images/earrings.jpg', featured: true,  available: true },
  { id: 'it-ring',     name: 'රන් මුදු',             carat: '22', grams: 4,  desc: 'අලංකාර නිර්මාණය', img: 'images/ring.jpg',     featured: false, available: true },
  { id: 'it-chain',    name: 'රන් දම්වැල',           carat: '22', grams: 16, desc: 'දිගු දම්වැල', img: 'images/chain.jpg',    featured: false, available: true },
  { id: 'it-bracelet', name: 'රන් බ්‍රේස්ලට්',       carat: '22', grams: 12, desc: 'සාම්ප්‍රදායික නිර්මාණය', img: 'images/bracelet.jpg', featured: false, available: true }
];

function getItems() {
  const raw = store.get(ITEMS_KEY);
  if (!raw) return JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  }
}

function saveItems(arr) {
  store.set(ITEMS_KEY, JSON.stringify(arr));
}

function resetItems() {
  store.del(ITEMS_KEY);
}

/* "16g" + "2 පවුම්" */
function pawnLabel(grams) {
  const p = grams / 8;
  let pText;
  if (p === 0.5) pText = 'අඩ පවුම';
  else if (p === 1.5) pText = '1.5 පවුම්';
  else if (p === 1) pText = '1 පවුම';
  else if (Number.isInteger(p)) pText = `${p} පවුම්`;
  else pText = `${p} පවුම්`;
  return `${pText} (${grams}g)`;
}

/* භාණ්ඩයක් සඳහා WhatsApp ඇණවුම් පණිවිඩය */
function itemWAMessage(item, price) {
  return `ආයුබෝවන් රං ටිකිරි! මම මෙම රන් භාණ්ඩය ඇණවුම් කිරීමට කැමැත්තෙමි.

භාණ්ඩය: ${item.name}
රන් වර්ගය: කැරට් ${item.carat} (${item.carat}K)
බර: ${pawnLabel(item.grams)}
${price ? 'මිල: ' + fmtRs(price) + '\n' : ''}
කරුණාකර මිල සහ වාරික පහසුකම් තහවුරු කරන්න. ස්තුතියි!`;
}

/* භාණ්ඩ කාඩ්පතක HTML */
function itemCardHTML(item, rates, opts = {}) {
  const rate = item.carat === '24' ? rates.k24 : rates.k22;
  const price = item.grams * rate;
  const featuredBtn = opts.featuredStyle
    ? `<a class="btn btn-gold btn-sm" href="items.html">විස්තර බලන්න</a>`
    : `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waOrder(itemWAMessage(item, price))}">💬 ඇණවුම් කරන්න</a>
       <a class="btn btn-outline btn-sm" href="calculator.html">වාරිකය බලන්න</a>`;
  return `
    <div class="item-card" data-grams="${item.grams}" data-carat="${item.carat}">
      <img src="${item.img}" alt="${item.name}" loading="lazy">
      <div class="item-body">
        <h3>${item.name}</h3>
        <p class="meta">${item.carat}K · බර: ${pawnLabel(item.grams)}${item.desc ? ' · ' + item.desc : ''}</p>
        <p class="item-price"><b>${fmtRs(price)}</b> <small>සිට</small></p>
        <div class="item-actions">${featuredBtn}</div>
      </div>
    </div>`;
}

/**
 * භාණ්ඩ ග්‍රිඩය render කරයි.
 * @param {string} selector - ඉලක්ක container selector
 * @param {object} opts - { limit, featuredStyle }
 */
async function renderItemGrid(selector, opts = {}) {
  const el = document.querySelector(selector);
  if (!el) return;
  const rates = await getGoldPrices();
  let items = getItems().filter(i => i.available !== false);
  if (opts.limit) items = items.slice(0, opts.limit);
  el.innerHTML = items.length
    ? items.map(i => itemCardHTML(i, rates, opts)).join('')
    : '<p class="empty-msg">තවම රන් භාණ්ඩ ඇතුළත් කර නැත.</p>';
  renderPrices(rates);
}
