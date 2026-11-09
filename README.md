# Laporan PKL by Lukyy

Aplikasi jurnal PKL untuk mencatat kegiatan harian, memantau hari kerja, dan menyiapkan laporan.

## Tema jurnal

Tema ini mengambil inspirasi dari komposisi fotografis dan panel membulat: warna biru senja, permukaan netral, dan aksen hangat. Foto ruang kerja pada halaman utama bersifat ilustratif; ringkasan progres tetap berasal dari data pengguna. Tampilan beradaptasi untuk desktop dan ponsel, dan aset tema disimpan lokal untuk penggunaan offline.

## ✅ Yang TIDAK berubah (fungsi)

Semua fitur tetap utuh — hanya kelas CSS/struktur tampilannya yang diganti:

- Input/edit/hapus laporan harian + foto bukti (kamera web / galeri).
- Kalender hari kerja (hijau = terisi, merah = kosong, abu = libur) + chip tanggal merah.
- Periode & target PKL, badge pencapaian, statistik.
- Ekspor **PDF** (dengan/tanpa kover), **backup/restore JSON**.
- Login/register **Supabase** (email + Google), sinkronisasi cloud.
- Panduan/tour, PWA install, **mode offline** (service worker).
- Semua `id` elemen, nama fungsi, dan handler `onclick` dipertahankan 1:1,
  jadi data lokal (localForage/IndexedDB) milik pengguna **tidak hilang**.

---

## 📁 Struktur File

```
pkl-flat/
├── index.html              # UI jurnal (semua id/handler lama dipertahankan)
├── manifest.json           # metadata PWA
├── sw.js                   # service worker (cache aset tema + font lokal)
├── favicon.png, icon-192.png, icon-512.png, icon-maskable-512.png
├── css/
│   ├── style.css           # gaya dasar komponen
│   ├── theme.css           # tema jurnal
│   └── fonts/              # Inter (latin & latin-ext) + Noto Color Emoji subset
├── assets/                 # foto ilustrasi tema
└── js/
    ├── config.js           # palet Tailwind diarahkan ke warna flat
    ├── utils.js            # + helper tutupSemuaModal()
    ├── auth.js, tour.js, profil.js, laporan.js, backup.js, pdf.js,
    │   kamera.js, badge.js, liburnasional.js, harikerja.js, pwa.js, main.js
    └── vendor/             # library yang di-host lokal:
        ├── tailwind.js                  #   - Tailwind Play CDN
        ├── localforage.min.js           #   - penyimpanan lokal (IndexedDB)
        └── confetti.browser.min.js      #   - animasi perayaan
```

### Catatan perubahan kecil di JS (hanya soal tampilan)
- `harikerja.js` — panel “Periode & Target PKL” ditulis ulang dengan kelas flat;
  kalender memakai kelas flat; status tanggal pakai kelas `st-ok` / `st-warn` / `st-libur`.
- `badge.js` — kartu pencapaian memakai kelas `badge-item`.
- `tour.js` — indikator langkah memakai kelas `tour-dot`.
- `backup.js` — tombol hapus data memakai kelas `is-active` (bukan kelas warna lama).
- `laporan.js` — tombol Edit/Unduh di tabel dll. memakai gaya pill flat;
  `switchTab()` juga menyinkronkan bottom-nav mobile.
- `pdf.js` & `kamera.js` — dokumentasi/komentar gaya, tanpa perubahan logika.
- `index.html` — tambahan skrip ringkasan hero (`renderRingkasanHero`) yang membaca
  `hitungProgresPKL()`; kalau fungsi itu tidak ada, kartu ringkasan dibiarkan apa adanya.

---

## 💾 Backup & Restore Database Lokal

- Tombol **Unduh Backup Database** menunggu IndexedDB selesai dimuat, lalu mengekspor seluruh key LocalForage yang dipakai aplikasi—laporan, foto bukti, profil/logo, dan data kalender—ke file JSON bertanda versi.
- Tombol **Pulihkan Backup** menerima format baru dan juga format lama `{ "profil": ..., "laporan": [...] }`.
- Pemulihan meminta konfirmasi dan hanya mengganti database lokal. Data cloud tidak langsung ditimpa; sinkronisasi cloud dilakukan terpisah.
- Jika penyimpanan browser gagal dibaca, ekspor tetap mencoba membuat file dari data aktif di layar dan memberi peringatan agar hasilnya tidak disangka salinan lengkap.
- Browser yang mendukung pemilih file memakai dialog simpan; pada iPhone/iPad tersedia lembar berbagi sebagai opsi menyimpan ke Files.
- Saat backup/pemulihan berjalan, aplikasi menampilkan indikator loading penuh dan hasil akhir yang tetap terlihat (berhasil, peringatan, atau gagal beserta pesannya).

## ☁️ Perbaikan Sinkronisasi Cloud

Sinkronisasi Supabase sekarang membaca ID secara berpaginasi, menghapus per kelompok kecil, membatasi ukuran batch insert (terutama foto), dan mencoba ulang kegagalan jaringan/statement timeout. Data lokal tidak dihapus saat sinkronisasi gagal. Jika timeout masih terjadi, jalankan `supabase/sync-index.sql` sekali melalui **Supabase Dashboard → SQL Editor** agar filter `user_id` lebih cepat.

## 🚀 Cara Menjalankan

Karena ini aplikasi statis (client-side):

```bash
# dari folder pkl-flat
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

Untuk **fitur cloud (Supabase)** dan **kamera**, jalankan lewat `http://localhost`
atau hosting HTTPS (mis. GitHub Pages / Netlify / Vercel). Semua fitur lain
(termasuk ekspor PDF & penyimpanan lokal) tetap bekerja offline.

---

## 📶 Catatan Koneksi

| Fitur | Butuh internet? |
|---|---|
| Input/edit laporan, kalender, statistik, badge | ❌ (offline, IndexedDB) |
| Tampilan & font (Inter, emoji) | ❌ (di-host lokal) |
| Ekspor PDF (pdfMake), Login/Sinkronisasi Cloud (Supabase) | ✅ (di-load dari CDN) |

Kalau CDN tidak tersedia, aplikasi tetap terbuka normal — hanya tombol PDF/cloud
yang menampilkan pesan bahwa butuh koneksi.

---

## 🎨 Palet Warna

| Token | Nilai | Pemakaian |
|---|---|---|
| `--blue` | `#1D2BF0` | aksen utama, tombol primer, angka penting |
| `--navy` | `#131A2B` | tab aktif, toast, panel gelap |
| `--lilac-100/200` | `#F3E1FB` / `#E7C6F7` | panel lembut, pill aktif |
| `--pink-soft` | `#EFC4F6` | tombol sekunder (gaya referensi) |
| `--sky-100/200` | `#D8F0FC` / `#BEE7FB` | kartu cloud sync |
| `--mint-100` | `#D9F6E6` | badge aktif, periode PKL |
| `--surface` | `#F5F4F2` | latar halaman |
| `--line` | `#EBE9F0` | garis/border tipis |

Sudut: `--r: 18px`, `--r-md: 24px`, `--r-lg: 30px`, `--r-pill: 999px`.
