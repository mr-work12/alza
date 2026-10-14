/*
 * Logika inti laporan keuangan (tanpa DOM) supaya bisa diuji dengan Node.
 * Semua nominal disimpan sebagai bilangan bulat Rupiah untuk menghindari
 * galat pembulatan floating point.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Finance = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const INCOME = 'pemasukan';
  const EXPENSE = 'pengeluaran';
  const TRANSFER = 'transfer';

  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function defaultData() {
    return {
      version: 1,
      accounts: [
        { id: 'kas', name: 'Kas', openingBalance: 0 },
        { id: 'bank', name: 'Bank', openingBalance: 0 },
      ],
      categories: [
        { id: 'penjualan', name: 'Penjualan', type: INCOME },
        { id: 'jasa', name: 'Pendapatan Jasa', type: INCOME },
        { id: 'pendapatan-lain', name: 'Pendapatan Lain-lain', type: INCOME },
        { id: 'hpp', name: 'Harga Pokok Penjualan', type: EXPENSE },
        { id: 'gaji', name: 'Gaji & Upah', type: EXPENSE },
        { id: 'sewa', name: 'Sewa', type: EXPENSE },
        { id: 'utilitas', name: 'Listrik, Air & Internet', type: EXPENSE },
        { id: 'transportasi', name: 'Transportasi', type: EXPENSE },
        { id: 'pemasaran', name: 'Pemasaran', type: EXPENSE },
        { id: 'beban-lain', name: 'Beban Lain-lain', type: EXPENSE },
      ],
      transactions: [],
    };
  }

  /** "1.500.000", "Rp 1.500.000", "1500000" -> 1500000. Desimal (",50") dibulatkan. */
  function parseAmount(input) {
    if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input) : NaN;
    if (typeof input !== 'string') return NaN;
    let s = input.replace(/rp/i, '').replace(/\s/g, '');
    if (!s) return NaN;
    const negative = s.startsWith('-');
    if (negative) s = s.slice(1);
    if (!/^[\d.,]+$/.test(s)) return NaN;
    // Format Indonesia: titik = pemisah ribuan, koma = desimal.
    s = s.replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    if (!Number.isFinite(n)) return NaN;
    return Math.round(negative ? -n : n);
  }

  function formatRupiah(n) {
    const abs = Math.abs(Math.round(n || 0));
    const body = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '-Rp ' : 'Rp ') + body;
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
  }

  function monthLabel(ym) {
    const [y, m] = ym.split('-').map(Number);
    return `${MONTHS[m - 1].slice(0, 3)} ${y}`;
  }

  function isValidDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const d = new Date(iso + 'T00:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
  }

  /** Mengembalikan daftar pesan galat; kosong berarti transaksi valid. */
  function validateTransaction(tx, data) {
    const errors = [];
    if (!isValidDate(tx.date)) errors.push('Tanggal tidak valid.');
    if (![INCOME, EXPENSE, TRANSFER].includes(tx.type)) errors.push('Jenis transaksi tidak dikenal.');
    if (!Number.isInteger(tx.amount) || tx.amount <= 0) errors.push('Jumlah harus lebih dari 0.');
    const accountIds = new Set(data.accounts.map((a) => a.id));
    if (!accountIds.has(tx.accountId)) errors.push('Akun tidak ditemukan.');
    if (tx.type === TRANSFER) {
      if (!accountIds.has(tx.toAccountId)) errors.push('Akun tujuan tidak ditemukan.');
      else if (tx.toAccountId === tx.accountId) errors.push('Akun asal dan tujuan harus berbeda.');
    } else {
      const cat = data.categories.find((c) => c.id === tx.categoryId);
      if (!cat) errors.push('Kategori tidak ditemukan.');
      else if (cat.type !== tx.type) errors.push('Kategori tidak sesuai dengan jenis transaksi.');
    }
    return errors;
  }

  function inRange(date, from, to) {
    return (!from || date >= from) && (!to || date <= to);
  }

  function sortTransactions(list) {
    return list.slice().sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : (a.createdAt || 0) - (b.createdAt || 0));
  }

  /** Efek satu transaksi terhadap saldo akun tertentu. */
  function effectOn(tx, accountId) {
    if (tx.type === INCOME) return tx.accountId === accountId ? tx.amount : 0;
    if (tx.type === EXPENSE) return tx.accountId === accountId ? -tx.amount : 0;
    let e = 0;
    if (tx.accountId === accountId) e -= tx.amount;
    if (tx.toAccountId === accountId) e += tx.amount;
    return e;
  }

  /** Saldo akun pada akhir hari `date` (inklusif). Tanpa `date` = saldo terkini. */
  function balanceAt(data, accountId, date) {
    const acc = data.accounts.find((a) => a.id === accountId);
    let bal = acc ? acc.openingBalance || 0 : 0;
    for (const tx of data.transactions) {
      if (!date || tx.date <= date) bal += effectOn(tx, accountId);
    }
    return bal;
  }

  function dayBefore(iso) {
    const d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Laporan Laba Rugi untuk periode [from, to].
   * Transfer antar akun tidak memengaruhi laba rugi.
   */
  function incomeStatement(data, from, to) {
    const byCat = new Map();
    for (const tx of data.transactions) {
      if (tx.type === TRANSFER || !inRange(tx.date, from, to)) continue;
      byCat.set(tx.categoryId, (byCat.get(tx.categoryId) || 0) + tx.amount);
    }
    const section = (type) => {
      const rows = data.categories
        .filter((c) => c.type === type && byCat.has(c.id))
        .map((c) => ({ categoryId: c.id, name: c.name, amount: byCat.get(c.id) }))
        .sort((a, b) => b.amount - a.amount);
      return { rows, total: rows.reduce((s, r) => s + r.amount, 0) };
    };
    const income = section(INCOME);
    const expense = section(EXPENSE);
    return { income, expense, netIncome: income.total - expense.total };
  }

  /** Laporan Arus Kas per akun: saldo awal, masuk, keluar, saldo akhir. */
  function cashFlow(data, from, to) {
    const rows = data.accounts.map((acc) => {
      const opening = from ? balanceAt(data, acc.id, dayBefore(from)) : acc.openingBalance || 0;
      let inflow = 0;
      let outflow = 0;
      for (const tx of data.transactions) {
        if (!inRange(tx.date, from, to)) continue;
        const e = effectOn(tx, acc.id);
        if (e > 0) inflow += e;
        else outflow -= e;
      }
      return { accountId: acc.id, name: acc.name, opening, inflow, outflow, closing: opening + inflow - outflow };
    });
    const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
    return {
      rows,
      total: { opening: sum('opening'), inflow: sum('inflow'), outflow: sum('outflow'), closing: sum('closing') },
    };
  }

  function monthsBetween(from, to) {
    const out = [];
    let [y, m] = from.slice(0, 7).split('-').map(Number);
    const [ey, em] = to.slice(0, 7).split('-').map(Number);
    while (y < ey || (y === ey && m <= em)) {
      out.push(`${y}-${String(m).padStart(2, '0')}`);
      if (++m > 12) { m = 1; y++; }
    }
    return out;
  }

  /** Pemasukan & pengeluaran per bulan dalam periode (transfer diabaikan). */
  function monthlySummary(data, from, to) {
    const txs = data.transactions.filter((t) => t.type !== TRANSFER && inRange(t.date, from, to));
    if (!from || !to) {
      if (!txs.length) return [];
      const dates = txs.map((t) => t.date).sort();
      from = from || dates[0];
      to = to || dates[dates.length - 1];
    }
    const map = new Map(monthsBetween(from, to).map((ym) => [ym, { month: ym, income: 0, expense: 0 }]));
    for (const tx of txs) {
      const row = map.get(tx.date.slice(0, 7));
      if (row) row[tx.type === INCOME ? 'income' : 'expense'] += tx.amount;
    }
    return [...map.values()].map((r) => ({ ...r, net: r.income - r.expense }));
  }

  function filterTransactions(data, { from, to, type, accountId, categoryId, q } = {}) {
    const needle = (q || '').trim().toLowerCase();
    return sortTransactions(data.transactions).filter((tx) => {
      if (!inRange(tx.date, from, to)) return false;
      if (type && tx.type !== type) return false;
      if (accountId && tx.accountId !== accountId && tx.toAccountId !== accountId) return false;
      if (categoryId && tx.categoryId !== categoryId) return false;
      if (needle && !(tx.description || '').toLowerCase().includes(needle)) return false;
      return true;
    });
  }

  function csvEscape(v) {
    const s = String(v ?? '');
    return /[",;\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function transactionsToCsv(data, list) {
    const accName = (id) => (data.accounts.find((a) => a.id === id) || {}).name || '';
    const catName = (id) => (data.categories.find((c) => c.id === id) || {}).name || '';
    const header = ['Tanggal', 'Jenis', 'Kategori', 'Akun', 'Akun Tujuan', 'Keterangan', 'Jumlah'];
    const lines = [header.join(',')];
    for (const tx of list) {
      lines.push([
        tx.date, tx.type, tx.type === TRANSFER ? '' : catName(tx.categoryId),
        accName(tx.accountId), tx.type === TRANSFER ? accName(tx.toAccountId) : '',
        tx.description || '', tx.amount,
      ].map(csvEscape).join(','));
    }
    return lines.join('\r\n');
  }

  /** Memeriksa bentuk berkas cadangan sebelum menimpa data. */
  function validateBackup(obj) {
    if (!obj || typeof obj !== 'object') return 'Berkas bukan JSON objek.';
    for (const k of ['accounts', 'categories', 'transactions']) {
      if (!Array.isArray(obj[k])) return `Bagian "${k}" tidak ditemukan.`;
    }
    for (const tx of obj.transactions) {
      const errs = validateTransaction(tx, obj);
      if (errs.length) return `Transaksi ${tx.id || '?'} tidak valid: ${errs[0]}`;
    }
    return null;
  }

  function slugify(name) {
    return name.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '')
      .trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-') || 'item';
  }

  function uniqueId(base, existingIds) {
    const ids = new Set(existingIds);
    if (!ids.has(base)) return base;
    let i = 2;
    while (ids.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  return {
    INCOME, EXPENSE, TRANSFER, MONTHS,
    defaultData, parseAmount, formatRupiah, formatDate, monthLabel, isValidDate,
    validateTransaction, sortTransactions, balanceAt, incomeStatement, cashFlow,
    monthlySummary, monthsBetween, filterTransactions, transactionsToCsv,
    validateBackup, slugify, uniqueId, dayBefore,
  };
});
