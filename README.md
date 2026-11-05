# Portofolio M. Alzawan Saputra

Portofolio web pribadi M. Alzawan Saputra, mahasiswa Komunikasi dan Penyiaran Islam (KPI), Fakultas Agama Islam, Universitas Muhammadiyah Bengkulu.

Isi: karya (SIMAK IMM, artikel ilmiah, desain dakwah Prodi KPI), sertifikasi (CPHRM, BNSP Pemasaran Digital, Administrasi Perkantoran, Wasit & Pelatih Panahan Tradisional), perjalanan organisasi, dan kontak.

## Menjalankan

```bash
npm install
npm run build      # menghasilkan Asset/dist/app.js dan Asset/dist/app.css
npx serve .        # pratinjau lokal
```

Situs ini statis: cukup host `index.html` dan folder `Asset/` (GitHub Pages, Netlify, dan sejenisnya). Hasil build di `Asset/dist/` ikut disimpan di repo, jadi GitHub Pages bisa langsung menyajikannya.

## Struktur

- `src/app.jsx`: halaman (React 19 + Framer Motion)
- `src/styles.css`: gaya
- `src/data/projects.json`: daftar karya dan sertifikat
- `src/data/brands.json`: deretan institusi
- `Asset/`: foto, sampul karya, scan sertifikat, ikon, dan hasil build

Desain diadaptasi dari template portofolio sinematik "RENANDO".
