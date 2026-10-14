const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../js/finance.js');

function sample() {
  const data = F.defaultData();
  data.accounts[0].openingBalance = 1_000_000; // Kas
  data.accounts[1].openingBalance = 5_000_000; // Bank
  let n = 0;
  const add = (tx) => data.transactions.push({ id: 't' + ++n, createdAt: n, ...tx });
  add({ date: '2026-01-05', type: F.INCOME, categoryId: 'penjualan', accountId: 'bank', amount: 3_000_000 });
  add({ date: '2026-01-10', type: F.EXPENSE, categoryId: 'sewa', accountId: 'bank', amount: 1_500_000 });
  add({ date: '2026-01-20', type: F.TRANSFER, accountId: 'bank', toAccountId: 'kas', amount: 500_000 });
  add({ date: '2026-02-03', type: F.EXPENSE, categoryId: 'gaji', accountId: 'kas', amount: 700_000 });
  add({ date: '2026-02-15', type: F.INCOME, categoryId: 'jasa', accountId: 'kas', amount: 250_000 });
  add({ date: '2026-03-01', type: F.EXPENSE, categoryId: 'utilitas', accountId: 'bank', amount: 400_000 });
  return data;
}

test('parseAmount memahami format Rupiah Indonesia', () => {
  assert.equal(F.parseAmount('1.500.000'), 1500000);
  assert.equal(F.parseAmount('Rp 2.000'), 2000);
  assert.equal(F.parseAmount('1500000'), 1500000);
  assert.equal(F.parseAmount('1.000,50'), 1001);
  assert.ok(Number.isNaN(F.parseAmount('abc')));
  assert.ok(Number.isNaN(F.parseAmount('')));
});

test('formatRupiah', () => {
  assert.equal(F.formatRupiah(1500000), 'Rp 1.500.000');
  assert.equal(F.formatRupiah(-2500), '-Rp 2.500');
  assert.equal(F.formatRupiah(0), 'Rp 0');
});

test('validateTransaction menolak data yang salah', () => {
  const data = F.defaultData();
  assert.deepEqual(F.validateTransaction(
    { date: '2026-01-01', type: F.INCOME, categoryId: 'penjualan', accountId: 'kas', amount: 10 }, data), []);
  assert.ok(F.validateTransaction(
    { date: '2026-02-30', type: F.INCOME, categoryId: 'penjualan', accountId: 'kas', amount: 10 }, data).length);
  assert.ok(F.validateTransaction(
    { date: '2026-01-01', type: F.EXPENSE, categoryId: 'penjualan', accountId: 'kas', amount: 10 }, data).length);
  assert.ok(F.validateTransaction(
    { date: '2026-01-01', type: F.TRANSFER, accountId: 'kas', toAccountId: 'kas', amount: 10 }, data).length);
  assert.ok(F.validateTransaction(
    { date: '2026-01-01', type: F.INCOME, categoryId: 'penjualan', accountId: 'kas', amount: 0 }, data).length);
});

test('laba rugi mengabaikan transfer dan menghormati periode', () => {
  const data = sample();
  const all = F.incomeStatement(data);
  assert.equal(all.income.total, 3_250_000);
  assert.equal(all.expense.total, 2_600_000);
  assert.equal(all.netIncome, 650_000);

  const jan = F.incomeStatement(data, '2026-01-01', '2026-01-31');
  assert.equal(jan.income.total, 3_000_000);
  assert.equal(jan.expense.total, 1_500_000);
  assert.equal(jan.netIncome, 1_500_000);
});

test('arus kas: saldo awal periode memperhitungkan transaksi sebelumnya', () => {
  const data = sample();
  const feb = F.cashFlow(data, '2026-02-01', '2026-02-28');
  const kas = feb.rows.find((r) => r.accountId === 'kas');
  const bank = feb.rows.find((r) => r.accountId === 'bank');
  assert.equal(kas.opening, 1_500_000); // 1jt + transfer 500rb
  assert.equal(kas.inflow, 250_000);
  assert.equal(kas.outflow, 700_000);
  assert.equal(kas.closing, 1_050_000);
  assert.equal(bank.opening, 6_000_000); // 5jt + 3jt - 1,5jt - 500rb
  assert.equal(bank.closing, 6_000_000);
  // Total saldo akhir = saldo awal total + laba bersih periode
  assert.equal(feb.total.closing - feb.total.opening, F.incomeStatement(data, '2026-02-01', '2026-02-28').netIncome);
});

test('saldo terkini konsisten dengan laba bersih seluruh periode', () => {
  const data = sample();
  const totalNow = data.accounts.reduce((s, a) => s + F.balanceAt(data, a.id), 0);
  assert.equal(totalNow, 6_000_000 + F.incomeStatement(data).netIncome);
});

test('ringkasan bulanan mengisi bulan kosong', () => {
  const data = sample();
  const rows = F.monthlySummary(data, '2026-01-01', '2026-04-30');
  assert.deepEqual(rows.map((r) => r.month), ['2026-01', '2026-02', '2026-03', '2026-04']);
  assert.equal(rows[0].income, 3_000_000);
  assert.equal(rows[0].expense, 1_500_000);
  assert.equal(rows[3].net, 0);
  assert.deepEqual(F.monthsBetween('2025-11-15', '2026-02-01'), ['2025-11', '2025-12', '2026-01', '2026-02']);
});

test('filter dan CSV', () => {
  const data = sample();
  data.transactions[0].description = 'Penjualan, "grosir"';
  const kasTx = F.filterTransactions(data, { accountId: 'kas' });
  assert.equal(kasTx.length, 3); // transfer masuk + 2 transaksi kas
  const csv = F.transactionsToCsv(data, F.filterTransactions(data, { q: 'grosir' }));
  assert.match(csv, /"Penjualan, ""grosir"""/);
  assert.equal(csv.split('\r\n').length, 2);
});

test('validateBackup', () => {
  assert.equal(F.validateBackup(sample()), null);
  assert.ok(F.validateBackup({}));
  const bad = sample();
  bad.transactions[0].amount = -1;
  assert.ok(F.validateBackup(bad));
});

test('uniqueId & slugify', () => {
  assert.equal(F.slugify('Biaya Iklan & Promosi'), 'biaya-iklan-promosi');
  assert.equal(F.uniqueId('kas', ['kas', 'kas-2']), 'kas-3');
});
