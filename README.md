# 🚀 Aplikasi Laporan PKL (Praktek Kerja Lapangan)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Aplikasi berbasis web futuristik untuk mencatat, mengelola, dan mengekspor Laporan Kegiatan Harian Praktek Kerja Lapangan (PKL) dengan mudah dan praktis. Dibuat khusus dengan antarmuka mode gelap bergaya *glassmorphism* yang elegan.

---

## ✨ Fitur Unggulan

*   📝 **Manajemen Jurnal Harian:** Input dan edit uraian kegiatan harian beserta foto bukti kegiatan.
*   📥 **Ekspor Laporan Otomatis:**
    *   **Export to PDF:** Cetak tabel laporan beserta kover otomatis menggunakan `pdfMake`.
    *   **Export to Word (.doc):** Unduh laporan dalam format Microsoft Word yang 100% rapi dan siap print.
*   ☁️ **Sinkronisasi Cloud:** Terintegrasi dengan **Supabase** untuk menyimpan dan menarik data secara online (Fitur Login/Register akun).
*   💾 **Penyimpanan Offline First:** Data tersimpan otomatis di perangkat secara lokal (menggunakan `localForage`/IndexedDB), sehingga bisa digunakan tanpa internet.
*   📦 **Backup & Restore:** Fitur ekspor/impor seluruh data jurnal beserta profil pengguna ke dalam format file `.json`.
*   📊 **Dashboard Statistik:** Menampilkan total hari, total uraian, dan jumlah foto secara *real-time*.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN)
*   **Database & Auth:** [Supabase](https://supabase.com/)
*   **Library Eksternal:**
    *   `pdfMake` (Pembuat dokumen PDF)
    *   `docx.js` (Pembuat dokumen Word)
    *   `localForage` (Penyimpanan lokal)
    *   `FileSaver.js` (Pengunduh file)
    *   `canvas-confetti` (Animasi partikel)

---

## 💻 Cara Penggunaan (Instalasi)

Karena aplikasi ini adalah *Static Web App* (berbasis murni *client-side*), Anda tidak perlu menginstal server khusus seperti Node.js atau XAMPP.

1. **Clone Repository**
   ```bash
   git clone [https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git](https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git)
   
