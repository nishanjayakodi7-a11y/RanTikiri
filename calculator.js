/* ============ රං ටිකිරි — Calculator ============ */
const ANNUAL_RATE = 0.16;   // 16% annual interest
const LOAN_RATIO  = 0.70;   // 70% loan
const TERMS = [12, 24, 36]; // months

let currentLead = null;
let currentPrices = null;

function setInvalid(id, bad) {
  document.getElementById(id).classList.toggle('invalid', bad);
  return !bad;
}

function unlockCalculator(lead) {
  currentLead = lead;
  document.getElementById('leadFormCard').style.display = 'none';
  document.getElementById('calcSection').style.display = 'block';
  document.getElementById('calcGreeting').textContent =
    `ආයුබෝවන් ${lead.name}! ඔබේ තොරතුරු ලැබුණි. දැන් වාරිකය ගණනය කරන්න.`;
  document.getElementById('calcPawns').value = lead.pawns;
  if (currentPrices) {
    document.getElementById('pricePerGram').value =
      document.getElementById('carat').value === '24' ? currentPrices.k24 : currentPrices.k22;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveLead(lead) {
  const leads = JSON.parse(store.get('rt_leads') || '[]');
  leads.push(lead);
  store.set('rt_leads', JSON.stringify(leads));
  store.set('rt_my_lead', JSON.stringify(lead));
}

// EMI with declining (reducing) balance method
function emi(principal, annualRate, months) {
  const r = annualRate / 12;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

function calculate() {
  const carat = document.getElementById('carat').value;
  const pawns = parseFloat(document.getElementById('calcPawns').value);
  const pricePerGram = parseFloat(document.getElementById('pricePerGram').value);

  if (!pawns || pawns <= 0 || !pricePerGram || pricePerGram <= 0) {
    toast('කරුණාකර පවුම් ගණන සහ මිල නිවැරදිව ඇතුළත් කරන්න.');
    return;
  }

  const weight = pawns * GRAMS_PER_PAWN;
  const totalValue = weight * pricePerGram;
  const loan = totalValue * LOAN_RATIO;
  const down = totalValue - loan;

  document.getElementById('rWeight').textContent = `${weight}g (${pawns} පවුම්)`;
  document.getElementById('rTotal').textContent = fmtRs(totalValue);
  document.getElementById('rLoan').textContent = fmtRs(loan);
  document.getElementById('rDown').textContent = fmtRs(down);

  const tbody = document.getElementById('calcTableBody');
  tbody.innerHTML = '';
  const rows = [];
  TERMS.forEach(n => {
    const m = emi(loan, ANNUAL_RATE, n);
    const totalInterest = m * n - loan;
    const totalPayable = m * n;
    rows.push({ n, m, totalInterest, totalPayable });
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><b>මාස ${n}</b></td>
      <td class="emi">${fmtRs(m)}</td>
      <td>${fmtRs(totalInterest)}</td>
      <td>${fmtRs(totalPayable)}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById('calcResults').style.display = 'block';

  // WhatsApp order message
  const msg =
`ආයුබෝවන් රං ටිකිරි! මම රන් ඇණවුම් කිරීමට කැමැත්තෙමි.

නම: ${currentLead.name}
දුරකතනය: ${currentLead.phone}
දිස්ත්‍රික්කය: ${currentLead.district}
රන් වර්ගය: කැරට් ${carat}
පවුම් ගණන: ${pawns} (බර ${weight}g)
ග්‍රෑම් එකක මිල: ${fmtRs(pricePerGram)}
මුළු වටිනාකම: ${fmtRs(totalValue)}
ණය මුදල (70%): ${fmtRs(loan)}
අවම මුල් ගෙවීම (30%): ${fmtRs(down)}

වාරික විස්තර (පොලිය 16% — හීනවන ශේශ ක්‍රමය):
${rows.map(r => `• මාස ${r.n}: මාසික වාරිකය ${fmtRs(r.m)}`).join('\n')}

කරුණාකර මගේ ඇණවුම තහවුරු කරන්න. ස්තුතියි!`;
  document.getElementById('waOrderBtn').href = waOrder(msg);

  // Update saved lead with calc summary
  currentLead.calc = { carat, pawns, weight, pricePerGram, totalValue, loan, down,
    plans: rows.map(r => ({ months: r.n, emi: Math.round(r.m) })) };
  const leads = JSON.parse(store.get('rt_leads') || '[]');
  const idx = leads.findIndex(l => l.id === currentLead.id);
  if (idx >= 0) { leads[idx] = currentLead; store.set('rt_leads', JSON.stringify(leads)); }
  store.set('rt_my_lead', JSON.stringify(currentLead));

  toast('වාරික ගණනය සම්පූර්ණයි ✓');
}

document.addEventListener('DOMContentLoaded', async () => {
  currentPrices = await getGoldPrices();

  // If user already submitted the form before, unlock directly
  const saved = store.get('rt_my_lead');
  if (saved) {
    try { unlockCalculator(JSON.parse(saved)); } catch (e) {}
  }

  // Lead form
  document.getElementById('leadForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.replace(/[\s-]/g, '');
    const district = document.getElementById('district').value;
    const pawns = parseFloat(document.getElementById('pawns').value);

    let ok = true;
    ok = setInvalid('f-name', name.length < 3) && ok;
    ok = setInvalid('f-phone', !/^0\d{9}$/.test(phone)) && ok;
    ok = setInvalid('f-district', !district) && ok;
    ok = setInvalid('f-pawns', !pawns || pawns <= 0) && ok;
    if (!ok) { toast('කරුණාකර සියලුම ක්ෂේත්‍ර නිවැරදිව පුරවන්න.'); return; }

    const lead = { id: Date.now(), name, phone, district, pawns, date: new Date().toISOString() };
    saveLead(lead);
    unlockCalculator(lead);
    toast('ස්තුතියි! ඔබේ තොරතුරු ලැබුණි ✓');
  });

  // Carat change → update price per gram
  document.getElementById('carat').addEventListener('change', e => {
    document.getElementById('pricePerGram').value =
      e.target.value === '24' ? currentPrices.k24 : currentPrices.k22;
  });

  document.getElementById('calcBtn').addEventListener('click', calculate);

  document.getElementById('editBtn').addEventListener('click', () => {
    document.getElementById('calcSection').style.display = 'none';
    document.getElementById('leadFormCard').style.display = 'block';
    if (currentLead) {
      document.getElementById('name').value = currentLead.name;
      document.getElementById('phone').value = currentLead.phone;
      document.getElementById('district').value = currentLead.district;
      document.getElementById('pawns').value = currentLead.pawns;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
