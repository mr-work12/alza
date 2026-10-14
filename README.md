# Laporan Keuangan

Aplikasi laporan keuangan sederhana untuk usaha kecil / pribadi. Berjalan sepenuhnya
di browser — tanpa server, tanpa instalasi, tanpa dependensi. Data disimpan di
`localStorage` browser.

## Fitur

- **Transaksi**: pemasukan, pengeluaran, dan transfer antar akun (Kas, Bank, dll.),
  lengkap dengan kategori, keterangan, ubah/hapus, filter, pencarian, dan ekspor CSV.
- **Dasbor**: total pemasukan, pengeluaran, laba/rugi bersih (+ margin), saldo kas & bank,
  grafik bulanan, dan pengeluaran per kategori.
- **Laporan** (mengikuti periode yang dipilih, bisa dicetak / disimpan PDF):
  - Laporan Laba Rugi (pendapatan & beban per kategori)
  - Laporan Arus Kas per akun (saldo awal, kas masuk, kas keluar, saldo akhir)
  - Ringkasan bulanan
- **Periode**: bulan ini, bulan lalu, tahun ini, tahun lalu, semua waktu, atau rentang kustom.
- **Pengaturan**: kelola akun (dengan saldo awal) dan kategori; cadangkan/pulihkan data (JSON);
  muat data contoh; reset.
- Tampilan responsif (ponsel & desktop) dan mendukung mode gelap.

## Menjalankan

Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
npm start        # python3 -m http.server 8000 → http://localhost:8000
```

## Pengujian

Logika perhitungan (`js/finance.js`) terpisah dari antarmuka dan diuji dengan Node:

```bash
npm test
```

## Catatan akuntansi

- Pencatatan memakai **basis kas** (single-entry): transaksi diakui saat uang masuk/keluar.
  Aplikasi ini tidak mencatat piutang, utang, persediaan, atau penyusutan, jadi belum
  menghasilkan Neraca lengkap sesuai SAK.
- Transfer antar akun tidak memengaruhi laba rugi.
- Nominal disimpan sebagai bilangan bulat Rupiah.

## Struktur

```
index.html          Halaman aplikasi
css/style.css       Gaya (terang & gelap, cetak)
js/finance.js       Logika laporan (tanpa DOM, dapat diuji)
js/app.js           Antarmuka
tests/              Uji unit (node:test)
```
