// Rekap transaksi dari sheet TRANSAKSI ke sheet DASHBOARD.
// Struktur TRANSAKSI (baris 1 = header):
//   kolom D = jenis ("MASUK" / "KELUAR"), kolom E = nominal.

const SHEET_TRANSAKSI = "TRANSAKSI";
const SHEET_DASHBOARD = "DASHBOARD";
const KOL_JENIS = 3;   // kolom D (index 0-based)
const KOL_NOMINAL = 4; // kolom E (index 0-based)

function updateDashboard() {
  const ss = SpreadsheetApp.getActive();
  const transaksi = getSheetOrThrow_(ss, SHEET_TRANSAKSI);
  const dashboard = getSheetOrThrow_(ss, SHEET_DASHBOARD);

  const data = transaksi.getDataRange().getValues();

  let masuk = 0;
  let keluar = 0;

  for (let i = 1; i < data.length; i++) {
    const jenis = String(data[i][KOL_JENIS]).trim().toUpperCase();
    if (jenis !== "MASUK" && jenis !== "KELUAR") continue;

    const nominal = toNumber_(data[i][KOL_NOMINAL]);
    if (nominal === null) {
      console.warn("Baris " + (i + 1) + ": nominal tidak valid -> " + data[i][KOL_NOMINAL]);
      continue;
    }

    if (jenis === "MASUK") masuk += nominal;
    else keluar += nominal;
  }

  dashboard.getRange("B3").setValue(masuk);
  dashboard.getRange("B5").setValue(keluar);
  dashboard.getRange("B7").setValue(masuk - keluar);
}

// Simple trigger: rekap ulang otomatis setiap kali sheet TRANSAKSI diedit.
function onEdit(e) {
  if (e && e.range.getSheet().getName() === SHEET_TRANSAKSI) {
    updateDashboard();
  }
}

function getSheetOrThrow_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan.');
  return sheet;
}

// Angka asli dipakai apa adanya. Teks diasumsikan format Indonesia
// ("Rp 1.500.000,50"): titik = pemisah ribuan, koma = desimal.
function toNumber_(value) {
  if (typeof value === "number") return value;
  const s = String(value).replace(/rp/i, "").replace(/\s/g, "");
  if (s === "") return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}
