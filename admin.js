/* ============ රං ටිකිරි — Admin ============ */
// ⚠️ Demo credentials — change these before going live!
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'ran2026';

function isLoggedIn() { return store.sget('rt_admin') === '1'; }

function getLeads() { return JSON.parse(store.get('rt_leads') || '[]'); }
function setLeads(l) { store.set('rt_leads', JSON.stringify(l)); }

function renderLeads() {
  const leads = getLeads();
  const tbody = document.getElementById('leadsBody');
  const empty = document.getElementById('emptyMsg');
  if (!tbody) return;

  tbody.innerHTML = '';
  empty.style.display = leads.length ? 'none' : 'block';

  let totalPawns = 0, totalValue = 0, todayCount = 0;
  const todayStr = new Date().toISOString().slice(0, 10);

  [...leads].reverse().forEach((l, i) => {
    totalPawns += parseFloat(l.pawns) || 0;
    if (l.calc) totalValue += l.calc.totalValue || 0;
    if ((l.date || '').slice(0, 10) === todayStr) todayCount++;

    const tr = document.createElement('tr');
    const emiText = l.calc && l.calc.plans
      ? l.calc.plans.map(p => `ම${p.months}: ${fmtRs(p.emi)}`).join(' · ')
      : '—';
    tr.innerHTML = `
      <td>${leads.length - i}</td>
      <td><b>${l.name}</b></td>
      <td>${l.phone}</td>
      <td>${l.district}</td>
      <td>${l.pawns}</td>
      <td>${l.calc ? l.calc.carat + 'K' : '—'}</td>
      <td>${l.calc ? fmtRs(l.calc.loan) : '—'}</td>
      <td>${emiText}</td>
      <td>${(l.date || '').slice(0, 10)}</td>
      <td>
        <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waOrder('ආයුබෝවන් ' + l.name + '! රං ටිකිරි වෙතින් ඔබේ රන් ඉල්ලීම පිළිබඳව සම්බන්ධ වන්නෙමු.')}">💬</a>
        <button class="btn-danger" data-del="${l.id}">මකන්න</button>
      </td>`;
    tbody.appendChild(tr);
  });

  document.getElementById('statTotal').textContent = leads.length;
  document.getElementById('statToday').textContent = todayCount;
  document.getElementById('statPawns').textContent = totalPawns;
  document.getElementById('statValue').textContent = fmtRs(totalValue);

  tbody.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('මෙම ඉල්ලීම මැකීමට වග බලා ගන්නවාද?')) {
        setLeads(getLeads().filter(l => l.id != btn.dataset.del));
        renderLeads();
        toast('ඉල්ලීම මකා දැමිනි.');
      }
    });
  });
}

function exportCSV() {
  const leads = getLeads();
  if (!leads.length) { toast('බාගැනීමට දත්ත නැත.'); return; }
  const rows = [['නම', 'දුරකතනය', 'දිස්ත්‍රික්කය', 'පවුම්', 'කැරට්', 'මුළු වටිනාකම', 'ණය මුදල', 'දිනය']];
  leads.forEach(l => rows.push([
    l.name, l.phone, l.district, l.pawns,
    l.calc ? l.calc.carat + 'K' : '',
    l.calc ? l.calc.totalValue : '',
    l.calc ? l.calc.loan : '',
    (l.date || '').slice(0, 10)
  ]));
  const csv = '﻿' + rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'ran-tikiri-leads.csv';
  a.click();
  toast('CSV ගොනුව බාගන්නා ලදී ✓');
}


/* ================= ITEMS MANAGEMENT ================= */
let adminRates = { k22: DEFAULT_PRICES.k22, k24: DEFAULT_PRICES.k24 };
let pendingImg = '';   // base64 or path chosen in modal

function renderItemsTable() {
  const tbody = document.getElementById('itemsBody');
  const empty = document.getElementById('emptyItemsMsg');
  if (!tbody) return;
  const items = getItems();
  empty.style.display = items.length ? 'none' : 'block';
  tbody.innerHTML = '';

  items.forEach(item => {
    const rate = item.carat === '24' ? adminRates.k24 : adminRates.k22;
    const price = item.grams * rate;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img class="thumb" src="${item.img}" alt="${item.name}" onerror="this.src='images/hero.jpg'"></td>
      <td><b>${item.name}</b></td>
      <td>${item.carat}K</td>
      <td>${item.grams}g<br><small style="color:var(--muted)">${pawnLabel(item.grams)}</small></td>
      <td style="max-width:220px;white-space:normal">${item.desc || '—'}</td>
      <td style="color:var(--gold-light);font-weight:700">${fmtRs(price)}</td>
      <td>${item.available === false
            ? '<span class="badge-no">සඟවා ඇත</span>'
            : (item.featured ? '<span class="badge-yes">මුල් පිටුව</span>' : '<span class="badge-yes">ඔව්</span>')}</td>
      <td>
        <button class="btn btn-outline btn-sm" data-edit="${item.id}">✏️ සංස්කරණය</button>
        <button class="btn-danger" data-delitem="${item.id}">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => openItemModal(b.dataset.edit)));
  tbody.querySelectorAll('[data-delitem]').forEach(b =>
    b.addEventListener('click', () => {
      const it = getItems().find(x => x.id === b.dataset.delitem);
      if (confirm(`"${it ? it.name : ''}" භාණ්ඩය මැකීමට වග බලා ගන්නවාද?`)) {
        saveItems(getItems().filter(x => x.id !== b.dataset.delitem));
        renderItemsTable();
        toast('භාණ්ඩය මකා දැමිනි.');
      }
    }));
}

function openItemModal(id) {
  const modal = document.getElementById('itemModal');
  const form = document.getElementById('itemForm');
  form.reset();
  pendingImg = '';
  document.querySelectorAll('.field.invalid').forEach(f => f.classList.remove('invalid'));
  document.getElementById('modalPreview').style.display = 'none';

  if (id) {
    const item = getItems().find(i => i.id === id);
    if (!item) return;
    document.getElementById('modalTitle').textContent = 'භාණ්ඩය සංස්කරණය';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCarat').value = item.carat;
    document.getElementById('itemGrams').value = item.grams;
    document.getElementById('itemDesc').value = item.desc || '';
    document.getElementById('itemImgUrl').value = item.img || '';
    document.getElementById('itemFeatured').value = item.featured ? 'yes' : 'no';
    document.getElementById('itemAvailable').value = item.available === false ? 'no' : 'yes';
    showPreview(item.img, item.grams, item.carat);
  } else {
    document.getElementById('modalTitle').textContent = 'නව භාණ්ඩයක් එකතු කරන්න';
    document.getElementById('itemId').value = '';
    document.getElementById('itemImgUrl').value = 'images/necklace.jpg';
  }
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeItemModal() {
  document.getElementById('itemModal').classList.remove('open');
  document.body.style.overflow = '';
}

function showPreview(src, grams, carat) {
  if (!src) return;
  const box = document.getElementById('modalPreview');
  box.style.display = 'flex';
  document.getElementById('previewImg').src = src;
  const rate = carat === '24' ? adminRates.k24 : adminRates.k22;
  const g = parseFloat(grams) || 0;
  document.getElementById('previewPrice').textContent = g > 0 ? fmtRs(g * rate) : '—';
}

function initItemsAdmin() {
  renderItemsTable();

  document.getElementById('newItemBtn').addEventListener('click', () => openItemModal());
  document.getElementById('resetItemsBtn').addEventListener('click', () => {
    if (confirm('සියලුම වෙනස්කම් ඉවත් කර මුල් භාණ්ඩ 6 ට යාමට වග බලා ගන්නවාද?')) {
      resetItems(); renderItemsTable(); toast('මුල් ලැයිස්තුව ප්‍රතිසාධනය කරන ලදී.');
    }
  });

  document.getElementById('modalClose').addEventListener('click', closeItemModal);
  document.getElementById('cancelItemBtn').addEventListener('click', closeItemModal);
  document.getElementById('itemModal').addEventListener('click', e => {
    if (e.target.id === 'itemModal') closeItemModal();
  });

  // Image file → base64
  document.getElementById('itemImg').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 900 * 1024) { toast('පින්තූරය 900KB ට වඩා කුඩා විය යුතුය.'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = ev => {
      pendingImg = ev.target.result;   // data URL
      document.getElementById('itemImgUrl').value = '';
      showPreview(pendingImg, document.getElementById('itemGrams').value, document.getElementById('itemCarat').value);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('itemImgUrl').addEventListener('input', e => {
    pendingImg = '';
    showPreview(e.target.value.trim(), document.getElementById('itemGrams').value, document.getElementById('itemCarat').value);
  });

  ['itemGrams', 'itemCarat'].forEach(id =>
    document.getElementById(id).addEventListener('input', () => {
      const src = pendingImg || document.getElementById('itemImgUrl').value.trim();
      showPreview(src, document.getElementById('itemGrams').value, document.getElementById('itemCarat').value);
    }));

  document.getElementById('itemForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('itemId').value;
    const name = document.getElementById('itemName').value.trim();
    const grams = parseFloat(document.getElementById('itemGrams').value);
    const carat = document.getElementById('itemCarat').value;
    const desc = document.getElementById('itemDesc').value.trim();
    const imgUrl = document.getElementById('itemImgUrl').value.trim();
    const img = pendingImg || imgUrl || 'images/hero.jpg';
    const featured = document.getElementById('itemFeatured').value === 'yes';
    const available = document.getElementById('itemAvailable').value === 'yes';

    let ok = true;
    ok = setInvalid('f-itemName', name.length < 2) && ok;
    ok = setInvalid('f-itemGrams', !grams || grams <= 0) && ok;
    if (!ok) { toast('කරුණාකර අවශ්‍ය ක්ෂේත්‍ර පුරවන්න.'); return; }

    const items = getItems();
    if (id) {
      const idx = items.findIndex(i => i.id === id);
      if (idx >= 0) items[idx] = { ...items[idx], name, grams, carat, desc, img, featured, available };
      toast('භාණ්ඩය යාවත්කාලීන කරන ලදී ✓');
    } else {
      items.push({ id: 'it-' + Date.now(), name, grams, carat, desc, img, featured, available });
      toast('නව භාණ්ඩය එකතු කරන ලදී ✓');
    }
    saveItems(items);
    closeItemModal();
    renderItemsTable();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.__rtAdminInit) return;   // guard: init only once
  window.__rtAdminInit = true;
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');

  // Login page
  if (loginForm) {
    if (isLoggedIn()) { location.href = 'admin.html'; return; }
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value;
      if (u === ADMIN_USER && p === ADMIN_PASS) {
        store.sset('rt_admin', '1');
        location.href = 'admin.html';
      } else {
        document.getElementById('f-pass').classList.add('invalid');
        document.getElementById('loginErr').style.display = 'block';
      }
    });
  }

  // Admin panel guard
  if (document.getElementById('leadsBody')) {
    if (!isLoggedIn()) { location.href = 'admin-login.html'; return; }
    renderLeads();

    document.getElementById('exportBtn').addEventListener('click', exportCSV);
    document.getElementById('clearBtn').addEventListener('click', () => {
      if (confirm('සියලුම ඉල්ලීම් මැකීමට වග බලා ගන්නවාද?')) {
        setLeads([]); renderLeads(); toast('සියලුම ඉල්ලීම් මකා දැමිනි.');
      }
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });

    // Live rates for item price preview
    try { adminRates = await getGoldPrices(); } catch (e) {}
    initItemsAdmin();

    // Price settings
    const saved = store.get('rt_prices');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        document.getElementById('setK22').value = p.k22;
        document.getElementById('setK24').value = p.k24;
      } catch (e) {}
    }
    document.getElementById('savePricesBtn').addEventListener('click', () => {
      const k22 = parseFloat(document.getElementById('setK22').value);
      const k24 = parseFloat(document.getElementById('setK24').value);
      if (!k22 || !k24 || k22 <= 0 || k24 <= 0) { toast('කරුණාකර මිල දෙකම ඇතුළත් කරන්න.'); return; }
      store.set('rt_prices', JSON.stringify({ k22, k24, updated: new Date().toISOString().slice(0, 10) }));
      toast('රන් මිල සුරකිනා ලදී ✓');
    });
    document.getElementById('resetPricesBtn').addEventListener('click', () => {
      store.del('rt_prices');
      document.getElementById('setK22').value = '';
      document.getElementById('setK24').value = '';
      toast('Live මිල භාවිතයට ගන්නා ලදී ✓');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      store.sdel('rt_admin');
      location.href = 'admin-login.html';
    });
  }
});
