/* Antarmuka aplikasi laporan keuangan. Logika perhitungan ada di finance.js. */
(function () {
  'use strict';
  const F = window.Finance;
  const STORAGE_KEY = 'alza-laporan-keuangan-v1';
  const UI_KEY = 'alza-laporan-keuangan-ui';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rp = F.formatRupiah;
  const signClass = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');

  // ---------- Penyimpanan ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (!F.validateBackup(obj)) return obj;
      }
    } catch (e) { /* storage tidak tersedia / rusak */ }
    return F.defaultData();
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { toast('Gagal menyimpan ke browser: ' + e.message); }
  }
  function loadUi() {
    try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveUi() {
    try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) { /* abaikan */ }
  }

  let data = load();
  const ui = Object.assign({ view: 'dasbor', preset: 'month', from: '', to: '' }, loadUi());

  // ---------- Utilitas ----------
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const lastDayOfMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const ymd = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const accName = (id) => (data.accounts.find((a) => a.id === id) || {}).name || '—';
  const catName = (id) => (data.categories.find((c) => c.id === id) || {}).name || '—';
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function presetRange(preset) {
    const [y, m] = today().split('-').map(Number);
    switch (preset) {
      case 'month': return [ymd(y, m, 1), ymd(y, m, lastDayOfMonth(y, m))];
      case 'last-month': {
        const py = m === 1 ? y - 1 : y; const pm = m === 1 ? 12 : m - 1;
        return [ymd(py, pm, 1), ymd(py, pm, lastDayOfMonth(py, pm))];
      }
      case 'year': return [ymd(y, 1, 1), ymd(y, 12, 31)];
      case 'last-year': return [ymd(y - 1, 1, 1), ymd(y - 1, 12, 31)];
      case 'all': return ['', ''];
      default: return [ui.from, ui.to];
    }
  }
  function period() {
    const [from, to] = ui.preset === 'custom' ? [ui.from, ui.to] : presetRange(ui.preset);
    return { from: from || '', to: to || '' };
  }
  function periodText() {
    const { from, to } = period();
    if (!from && !to) return 'Semua waktu';
    if (from && to) return `${F.formatDate(from)} – ${F.formatDate(to)}`;
    return from ? `Sejak ${F.formatDate(from)}` : `Sampai ${F.formatDate(to)}`;
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3000);
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- Navigasi ----------
  function showView(view) {
    ui.view = view; saveUi();
    $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === view)));
    $$('.view').forEach((v) => { v.hidden = v.id !== 'view-' + view; });
    $('.period').hidden = view === 'pengaturan';
    render();
  }

  function syncPeriodControls() {
    const { from, to } = period();
    $('#period-preset').value = ui.preset;
    $('#period-from').value = from;
    $('#period-to').value = to;
    $('#period-label').textContent = periodText();
  }

  // ---------- Render ----------
  function render() {
    syncPeriodControls();
    if (ui.view === 'dasbor') renderDashboard();
    else if (ui.view === 'transaksi') renderTransactions();
    else if (ui.view === 'laporan') renderReports();
    else renderSettings();
  }

  function tile(label, value, sub, cls = '') {
    return `<div class="tile"><div class="label">${esc(label)}</div>
      <div class="value ${cls}">${esc(value)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>`;
  }

  function renderDashboard() {
    const { from, to } = period();
    const pl = F.incomeStatement(data, from, to);
    const cf = F.cashFlow(data, from, to);
    const margin = pl.income.total ? Math.round((pl.netIncome / pl.income.total) * 100) : null;
    $('#tiles').innerHTML = [
      tile('Pemasukan', rp(pl.income.total)),
      tile('Pengeluaran', rp(pl.expense.total)),
      tile(pl.netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih', rp(pl.netIncome),
        margin === null ? '' : `Margin ${margin}%`, signClass(pl.netIncome)),
      tile('Saldo Kas & Bank', rp(cf.total.closing), `Akhir periode · ${data.accounts.length} akun`),
    ].join('');

    renderMonthlyChart($('#chart-monthly'), F.monthlySummary(data, from, to).slice(-12));
    renderCategoryBars($('#chart-category'), pl.expense);

    const recent = F.filterTransactions(data, { from, to }).reverse().slice(0, 8);
    $('#recent-tx').innerHTML = txTable(recent, false);
  }

  function renderMonthlyChart(el, rows) {
    if (!rows.length || rows.every((r) => !r.income && !r.expense)) {
      el.innerHTML = '<p class="empty">Belum ada data pada periode ini.</p>';
      return;
    }
    const W = 560, H = 240, padL = 56, padR = 8, padT = 8, padB = 28;
    const max = Math.max(...rows.map((r) => Math.max(r.income, r.expense)), 1);
    const step = niceStep(max / 4);
    const top = Math.ceil(max / step) * step;
    const y = (v) => padT + (H - padT - padB) * (1 - v / top);
    const band = (W - padL - padR) / rows.length;
    const barW = Math.max(3, Math.min(22, (band - 10) / 2));
    const gap = 2;

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik pemasukan dan pengeluaran per bulan">`;
    for (let v = 0; v <= top; v += step) {
      svg += `<line class="gridline" x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}"/>`;
      svg += `<text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${esc(shortRp(v))}</text>`;
    }
    const labelEvery = Math.ceil(rows.length / 8);
    rows.forEach((r, i) => {
      const cx = padL + band * i + band / 2;
      svg += barPath(cx - gap / 2 - barW, y(r.income), barW, y(0) - y(r.income), 'bar-income');
      svg += barPath(cx + gap / 2, y(r.expense), barW, y(0) - y(r.expense), 'bar-expense');
      if (i % labelEvery === 0) {
        svg += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${esc(F.monthLabel(r.month))}</text>`;
      }
      svg += `<rect class="hit" data-i="${i}" x="${padL + band * i}" y="${padT}" width="${band}" height="${H - padT - padB}"/>`;
    });
    svg += `<line class="baseline" x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}"/></svg>`;

    el.innerHTML = `<div class="legend"><span><i style="background:var(--series-income)"></i>Pemasukan</span>
      <span><i style="background:var(--series-expense)"></i>Pengeluaran</span></div>${svg}`;
    $$('.hit', el).forEach((hit) => {
      const r = rows[+hit.dataset.i];
      bindTooltip(hit, () => `<strong>${esc(F.monthLabel(r.month))}</strong>
        <div class="row"><span><i style="background:var(--series-income)"></i>Pemasukan</span><span>${rp(r.income)}</span></div>
        <div class="row"><span><i style="background:var(--series-expense)"></i>Pengeluaran</span><span>${rp(r.expense)}</span></div>
        <div class="row"><span>Selisih</span><strong>${rp(r.net)}</strong></div>`);
    });
  }

  // Batang dengan ujung atas membulat 4px, menempel pada garis dasar.
  function barPath(x, yTop, w, h, cls) {
    if (h <= 0) return '';
    const r = Math.min(4, w / 2, h);
    return `<path class="${cls}" d="M${x},${yTop + h} V${yTop + r} Q${x},${yTop} ${x + r},${yTop}
      H${x + w - r} Q${x + w},${yTop} ${x + w},${yTop + r} V${yTop + h} Z"/>`;
  }

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function shortRp(v) {
    if (v >= 1e9) return +(v / 1e9).toFixed(1) + ' M';
    if (v >= 1e6) return +(v / 1e6).toFixed(1) + ' jt';
    if (v >= 1e3) return +(v / 1e3).toFixed(0) + ' rb';
    return String(v);
  }

  function renderCategoryBars(el, section) {
    if (!section.rows.length) {
      el.innerHTML = '<p class="empty">Belum ada pengeluaran pada periode ini.</p>';
      return;
    }
    const max = section.rows[0].amount;
    el.innerHTML = '<div class="hbar">' + section.rows.map((r) => {
      const pct = Math.round((r.amount / section.total) * 100);
      return `<span class="name" title="${esc(r.name)}">${esc(r.name)}</span>
        <span class="track" data-tip="${esc(r.name)}|${r.amount}|${pct}">
          <span class="fill" style="width:${(r.amount / max) * 70}%"></span>
          <span class="val">${rp(r.amount)} · ${pct}%</span></span>`;
    }).join('') + '</div>';
    $$('.track', el).forEach((t) => {
      const [name, amount, pct] = t.dataset.tip.split('|');
      bindTooltip(t, () => `<strong>${esc(name)}</strong><div class="row"><span>Jumlah</span><span>${rp(+amount)}</span></div>
        <div class="row"><span>Porsi pengeluaran</span><span>${pct}%</span></div>`);
    });
  }

  function bindTooltip(target, html) {
    const tip = $('#tooltip');
    const move = (e) => {
      const pad = 14;
      let x = e.clientX + pad, y = e.clientY + pad;
      const r = tip.getBoundingClientRect();
      if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
      if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
      tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
    };
    target.addEventListener('pointerenter', (e) => { tip.innerHTML = html(); tip.hidden = false; move(e); });
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerleave', () => { tip.hidden = true; });
  }

  function txTable(list, withActions) {
    if (!list.length) return '<p class="empty">Belum ada transaksi.</p>';
    const rows = list.map((tx) => {
      const isT = tx.type === F.TRANSFER;
      const sign = tx.type === F.INCOME ? 1 : tx.type === F.EXPENSE ? -1 : 0;
      return `<tr>
        <td>${esc(F.formatDate(tx.date))}</td>
        <td>${isT ? '<span class="badge">Transfer</span>' : esc(catName(tx.categoryId))}</td>
        <td>${esc(isT ? `${accName(tx.accountId)} → ${accName(tx.toAccountId)}` : accName(tx.accountId))}</td>
        <td>${esc(tx.description || '')}</td>
        <td class="num ${signClass(sign)}">${sign < 0 ? '-' : sign > 0 ? '+' : ''}${rp(tx.amount)}</td>
        ${withActions ? `<td class="num"><button class="btn small" data-edit="${esc(tx.id)}">Ubah</button>
          <button class="btn small danger" data-del="${esc(tx.id)}">Hapus</button></td>` : ''}
      </tr>`;
    }).join('');
    return `<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Akun</th>
      <th>Keterangan</th><th class="num">Jumlah</th>${withActions ? '<th></th>' : ''}</tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  function txFilters() {
    const { from, to } = period();
    return {
      from, to,
      type: $('#f-type').value, accountId: $('#f-account').value,
      categoryId: $('#f-category').value, q: $('#f-q').value,
    };
  }

  function fillSelect(sel, items, placeholder) {
    const prev = sel.value;
    sel.innerHTML = (placeholder ? `<option value="">${esc(placeholder)}</option>` : '') +
      items.map((i) => `<option value="${esc(i.id)}">${esc(i.name)}</option>`).join('');
    if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;
  }

  function renderTransactions() {
    fillSelect($('#f-account'), data.accounts, 'Semua akun');
    fillSelect($('#f-category'), data.categories, 'Semua kategori');
    const list = F.filterTransactions(data, txFilters()).reverse();
    const inc = list.filter((t) => t.type === F.INCOME).reduce((s, t) => s + t.amount, 0);
    const exp = list.filter((t) => t.type === F.EXPENSE).reduce((s, t) => s + t.amount, 0);
    $('#tx-table').innerHTML = txTable(list, true) + (list.length
      ? `<p class="muted">${list.length} transaksi · Pemasukan ${rp(inc)} · Pengeluaran ${rp(exp)}</p>` : '');
  }

  function renderReports() {
    const { from, to } = period();
    $$('.report-period').forEach((p) => { p.textContent = 'Periode: ' + periodText(); });

    const pl = F.incomeStatement(data, from, to);
    const sectionRows = (sec) => sec.rows.length
      ? sec.rows.map((r) => `<tr><td class="indent">${esc(r.name)}</td><td class="num">${rp(r.amount)}</td></tr>`).join('')
      : '<tr><td class="indent muted">Tidak ada</td><td class="num">—</td></tr>';
    $('#report-pl').innerHTML = `<div class="table-wrap"><table>
      <tr class="section"><td colspan="2">Pendapatan</td></tr>${sectionRows(pl.income)}
      <tr class="total"><td>Total Pendapatan</td><td class="num">${rp(pl.income.total)}</td></tr>
      <tr class="section"><td colspan="2">Beban</td></tr>${sectionRows(pl.expense)}
      <tr class="total"><td>Total Beban</td><td class="num">${rp(pl.expense.total)}</td></tr>
      <tr class="grand"><td>${pl.netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</td>
        <td class="num ${signClass(pl.netIncome)}">${rp(pl.netIncome)}</td></tr>
    </table></div>`;

    const cf = F.cashFlow(data, from, to);
    const cfRow = (r, cls = '') => `<tr class="${cls}"><td>${esc(r.name)}</td><td class="num">${rp(r.opening)}</td>
      <td class="num">${rp(r.inflow)}</td><td class="num">${rp(r.outflow)}</td><td class="num">${rp(r.closing)}</td></tr>`;
    $('#report-cf').innerHTML = `<div class="table-wrap"><table><thead><tr><th>Akun</th><th class="num">Saldo Awal</th>
      <th class="num">Kas Masuk</th><th class="num">Kas Keluar</th><th class="num">Saldo Akhir</th></tr></thead>
      <tbody>${cf.rows.map((r) => cfRow(r)).join('')}${cfRow({ name: 'Total', ...cf.total }, 'total')}</tbody></table></div>
      <p class="muted">Transfer antar akun tercatat sebagai kas masuk/keluar per akun, tetapi saling meniadakan pada total.
      Kenaikan kas bersih: <strong class="${signClass(cf.total.closing - cf.total.opening)}">${rp(cf.total.closing - cf.total.opening)}</strong>.</p>`;

    const months = F.monthlySummary(data, from, to);
    $('#report-monthly').innerHTML = months.length ? `<div class="table-wrap"><table><thead><tr><th>Bulan</th>
      <th class="num">Pemasukan</th><th class="num">Pengeluaran</th><th class="num">Laba/Rugi</th></tr></thead><tbody>
      ${months.map((m) => `<tr><td>${esc(F.monthLabel(m.month))}</td><td class="num">${rp(m.income)}</td>
        <td class="num">${rp(m.expense)}</td><td class="num ${signClass(m.net)}">${rp(m.net)}</td></tr>`).join('')}
      <tr class="total"><td>Total</td><td class="num">${rp(pl.income.total)}</td><td class="num">${rp(pl.expense.total)}</td>
        <td class="num ${signClass(pl.netIncome)}">${rp(pl.netIncome)}</td></tr></tbody></table></div>`
      : '<p class="empty">Belum ada data.</p>';
  }

  function isUsed(field, id) {
    return data.transactions.some((t) => t[field] === id || (field === 'accountId' && t.toAccountId === id));
  }

  function renderSettings() {
    $('#accounts-list').innerHTML = data.accounts.map((a) => `<div class="list-row">
      <span class="grow"><strong>${esc(a.name)}</strong><br><span class="muted">Saldo awal ${rp(a.openingBalance)} ·
        Saldo kini ${rp(F.balanceAt(data, a.id))}</span></span>
      <button class="btn small" data-edit-acc="${esc(a.id)}">Ubah</button>
      <button class="btn small danger" data-del-acc="${esc(a.id)}">Hapus</button></div>`).join('');

    const group = (type, title) => `<p class="muted" style="margin:8px 0 0">${title}</p>` +
      data.categories.filter((c) => c.type === type).map((c) => `<div class="list-row">
        <span class="grow">${esc(c.name)}</span>
        <button class="btn small" data-edit-cat="${esc(c.id)}">Ubah</button>
        <button class="btn small danger" data-del-cat="${esc(c.id)}">Hapus</button></div>`).join('');
    $('#categories-list').innerHTML = group(F.INCOME, 'Pendapatan') + group(F.EXPENSE, 'Beban');
  }

  // ---------- Dialog transaksi ----------
  const dlg = $('#tx-dialog');
  const form = $('#tx-form');
  let editingId = null;

  function updateFormForType() {
    const type = form.type.value;
    const isT = type === F.TRANSFER;
    $('.for-cat', form).hidden = isT;
    $('.for-transfer', form).hidden = !isT;
    $('.acc-label', form).textContent = isT ? 'Dari Akun' : 'Akun';
    fillSelect(form.categoryId, data.categories.filter((c) => c.type === type));
    fillSelect(form.accountId, data.accounts);
    fillSelect(form.toAccountId, data.accounts);
    if (isT && form.toAccountId.value === form.accountId.value && data.accounts.length > 1) {
      form.toAccountId.value = data.accounts.find((a) => a.id !== form.accountId.value).id;
    }
  }

  function openTxDialog(tx) {
    editingId = tx ? tx.id : null;
    $('#tx-dialog-title').textContent = tx ? 'Ubah Transaksi' : 'Transaksi Baru';
    $('#tx-error').textContent = '';
    form.reset();
    form.type.value = tx ? tx.type : F.INCOME;
    updateFormForType();
    form.date.value = tx ? tx.date : today();
    form.amount.value = tx ? tx.amount.toLocaleString('id-ID') : '';
    if (tx) {
      form.accountId.value = tx.accountId;
      if (tx.categoryId) form.categoryId.value = tx.categoryId;
      if (tx.toAccountId) form.toAccountId.value = tx.toAccountId;
      form.description.value = tx.description || '';
    }
    dlg.showModal();
    form.amount.focus();
  }

  form.addEventListener('change', (e) => { if (e.target.name === 'type') updateFormForType(); });
  form.amount.addEventListener('blur', () => {
    const n = F.parseAmount(form.amount.value);
    if (Number.isFinite(n) && n > 0) form.amount.value = n.toLocaleString('id-ID');
  });
  $('#tx-cancel').addEventListener('click', () => dlg.close());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = form.type.value;
    const tx = {
      id: editingId || newId(),
      date: form.date.value,
      type,
      amount: F.parseAmount(form.amount.value),
      accountId: form.accountId.value,
      description: form.description.value.trim(),
    };
    if (type === F.TRANSFER) tx.toAccountId = form.toAccountId.value;
    else tx.categoryId = form.categoryId.value;
    const errors = F.validateTransaction(tx, data);
    if (errors.length) { $('#tx-error').textContent = errors.join(' '); return; }
    const idx = data.transactions.findIndex((t) => t.id === editingId);
    if (idx >= 0) data.transactions[idx] = { ...data.transactions[idx], ...tx, categoryId: tx.categoryId, toAccountId: tx.toAccountId };
    else data.transactions.push({ ...tx, createdAt: Date.now() });
    save(); dlg.close(); render();
    toast(idx >= 0 ? 'Transaksi diperbarui.' : 'Transaksi disimpan.');
  });

  // ---------- Event ----------
  $$('.tab').forEach((t) => t.addEventListener('click', () => showView(t.dataset.view)));
  $$('[data-action="new-tx"]').forEach((b) => b.addEventListener('click', () => {
    if (!data.accounts.length) { toast('Tambahkan akun terlebih dahulu di Pengaturan.'); return; }
    openTxDialog(null);
  }));

  $('#period-preset').addEventListener('change', (e) => {
    const { from, to } = period();
    ui.preset = e.target.value;
    if (ui.preset === 'custom') { ui.from = from; ui.to = to; }
    saveUi(); render();
  });
  ['#period-from', '#period-to'].forEach((sel) => $(sel).addEventListener('change', () => {
    ui.preset = 'custom';
    ui.from = $('#period-from').value; ui.to = $('#period-to').value;
    saveUi(); render();
  }));

  ['#f-type', '#f-account', '#f-category'].forEach((s) => $(s).addEventListener('change', renderTransactions));
  $('#f-q').addEventListener('input', renderTransactions);

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.edit) openTxDialog(data.transactions.find((t) => t.id === b.dataset.edit));
    else if (b.dataset.del) {
      if (!confirm('Hapus transaksi ini?')) return;
      data.transactions = data.transactions.filter((t) => t.id !== b.dataset.del);
      save(); render(); toast('Transaksi dihapus.');
    } else if (b.dataset.editAcc) {
      const acc = data.accounts.find((a) => a.id === b.dataset.editAcc);
      const name = prompt('Nama akun:', acc.name);
      if (name === null) return;
      const opening = prompt('Saldo awal (Rp):', acc.openingBalance.toLocaleString('id-ID'));
      if (opening === null) return;
      const n = F.parseAmount(opening || '0');
      if (!name.trim() || !Number.isFinite(n)) { toast('Nama atau saldo awal tidak valid.'); return; }
      acc.name = name.trim(); acc.openingBalance = n;
      save(); render();
    } else if (b.dataset.delAcc) {
      if (isUsed('accountId', b.dataset.delAcc)) { toast('Akun masih dipakai transaksi, tidak bisa dihapus.'); return; }
      if (!confirm('Hapus akun ini?')) return;
      data.accounts = data.accounts.filter((a) => a.id !== b.dataset.delAcc);
      save(); render();
    } else if (b.dataset.editCat) {
      const cat = data.categories.find((c) => c.id === b.dataset.editCat);
      const name = prompt('Nama kategori:', cat.name);
      if (!name || !name.trim()) return;
      cat.name = name.trim(); save(); render();
    } else if (b.dataset.delCat) {
      if (isUsed('categoryId', b.dataset.delCat)) { toast('Kategori masih dipakai transaksi, tidak bisa dihapus.'); return; }
      if (!confirm('Hapus kategori ini?')) return;
      data.categories = data.categories.filter((c) => c.id !== b.dataset.delCat);
      save(); render();
    }
  });

  $('#account-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    const opening = f.opening.value.trim() ? F.parseAmount(f.opening.value) : 0;
    if (!name || !Number.isFinite(opening)) { toast('Saldo awal tidak valid.'); return; }
    data.accounts.push({ id: F.uniqueId(F.slugify(name), data.accounts.map((a) => a.id)), name, openingBalance: opening });
    f.reset(); save(); render();
  });
  $('#category-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    if (!name) return;
    data.categories.push({ id: F.uniqueId(F.slugify(name), data.categories.map((c) => c.id)), name, type: f.type.value });
    f.name.value = ''; save(); render();
  });

  $('#export-csv').addEventListener('click', () => {
    const list = F.filterTransactions(data, txFilters());
    // BOM agar Excel membaca UTF-8 dengan benar.
    download(`transaksi-${today()}.csv`, '﻿' + F.transactionsToCsv(data, list), 'text/csv;charset=utf-8');
  });
  $('#backup').addEventListener('click', () => {
    download(`cadangan-keuangan-${today()}.json`, JSON.stringify(data, null, 2), 'application/json');
  });
  $('#restore').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const obj = JSON.parse(await file.text());
      const err = F.validateBackup(obj);
      if (err) { toast('Cadangan tidak valid: ' + err); return; }
      if (!confirm('Data saat ini akan diganti dengan isi cadangan. Lanjutkan?')) return;
      data = obj; save(); render(); toast('Data berhasil dipulihkan.');
    } catch (err) { toast('Gagal membaca berkas: ' + err.message); }
  });
  $('#reset').addEventListener('click', () => {
    if (!confirm('Semua transaksi, akun, dan kategori akan dihapus. Lanjutkan?')) return;
    data = F.defaultData(); save(); render(); toast('Data direset.');
  });
  $('#load-sample').addEventListener('click', () => {
    if (data.transactions.length && !confirm('Data saat ini akan diganti dengan data contoh. Lanjutkan?')) return;
    data = sampleData(); save();
    ui.preset = 'year'; saveUi();
    showView('dasbor'); toast('Data contoh dimuat.');
  });

  /** Data contoh 12 bulan terakhir untuk mencoba aplikasi. */
  function sampleData() {
    const d = F.defaultData();
    d.accounts[0].openingBalance = 2_000_000;
    d.accounts[1].openingBalance = 15_000_000;
    let n = 0;
    const add = (date, type, categoryId, accountId, amount, description, toAccountId) =>
      d.transactions.push({ id: 's' + ++n, createdAt: n, date, type, categoryId, accountId, amount, description, toAccountId });
    const [y, m] = today().split('-').map(Number);
    for (let k = 11; k >= 0; k--) {
      let yy = y, mm = m - k;
      while (mm < 1) { mm += 12; yy--; }
      const day = (dd) => ymd(yy, mm, Math.min(dd, lastDayOfMonth(yy, mm)));
      const wave = 1 + 0.25 * Math.sin((mm / 12) * Math.PI * 2);
      const r = (base) => Math.round((base * wave) / 1000) * 1000;
      add(day(3), F.INCOME, 'penjualan', 'bank', r(18_500_000), 'Penjualan bulanan');
      add(day(14), F.INCOME, 'jasa', 'bank', r(4_200_000), 'Jasa konsultasi');
      add(day(20), F.INCOME, 'penjualan', 'kas', r(2_300_000), 'Penjualan tunai');
      add(day(5), F.EXPENSE, 'hpp', 'bank', r(8_900_000), 'Pembelian bahan');
      add(day(25), F.EXPENSE, 'gaji', 'bank', 7_500_000, 'Gaji karyawan');
      add(day(1), F.EXPENSE, 'sewa', 'bank', 3_000_000, 'Sewa tempat usaha');
      add(day(10), F.EXPENSE, 'utilitas', 'bank', r(950_000), 'Listrik & internet');
      add(day(12), F.EXPENSE, 'transportasi', 'kas', r(600_000), 'Bensin & ongkir');
      if (mm % 3 === 0) add(day(15), F.EXPENSE, 'pemasaran', 'bank', 1_800_000, 'Iklan media sosial');
      add(day(8), F.TRANSFER, undefined, 'bank', 1_000_000, 'Tarik tunai', 'kas');
    }
    return d;
  }

  showView(ui.view);
})();
