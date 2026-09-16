// ============================================================
// KALENDER MINI, AUTO LIBUR HARI MINGGU, & PENGECEKAN TANGGAL
// ============================================================
// Aturan aplikasi:
//   • Hari MINGGU = LIBUR  -> kalau hari ini Minggu dan belum ada
//     catatan, aplikasi otomatis membuat catatan "Libur".
//   • Sabtu tetap hari kerja (harus diisi laporan).
//   • Kalender diberi warna:
//       🟢 HIJAU  = tanggal sudah ada laporan
//       🔴 MERAH  = tanggal belum ada laporan (wajib diisi)
//       ⚪ ABU    = libur (Minggu)
// ============================================================

const KALENDER_HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const CATATAN_LIBUR = 'Libur';
const KUNCI_STORAGE_LIBUR_DITOLAK = 'liburDitolak';

let kalenderBulanAktif = null;   // Date (tanggal 1) bulan yang sedang ditampilkan
let kalenderTampilLibur = true;  // show/hide sel hari libur di kalender

// ------------------------------------------------------------
// HELPER TANGGAL
// ------------------------------------------------------------
function kunciTanggalDariString(tanggalStr) {
    if (!tanggalStr || typeof tanggalStr !== 'string') return '';
    const bagian = tanggalStr.split('/');
    if (bagian.length !== 3) return '';
    return `${bagian[2]}-${String(bagian[1]).padStart(2, '0')}-${String(bagian[0]).padStart(2, '0')}`;
}

function kunciTanggalDariDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function dateDariKunci(kunci) {
    const p = String(kunci).split('-').map(Number);
    return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
}

function cariIndexLaporanByKunci(kunci) {
    return dataLaporan.findIndex(item => kunciTanggalDariString(item.tanggal) === kunci);
}

// Cek apakah sebuah entri laporan adalah catatan libur
function laporanLibur(item) {
    if (!item) return false;
    if (typeof item.libur === 'boolean') return item.libur;
    const kunci = kunciTanggalDariString(item.tanggal);
    const hariMinggu = kunci ? dateDariKunci(kunci).getDay() === 0 : false;
    const uraian = (item.uraian || '').trim().toUpperCase();
    return hariMinggu && uraian.startsWith('LIBUR');
}

function urutkanLaporan() {
    dataLaporan.sort((a, b) =>
        parseInt(a.tanggal.split('/').reverse().join('')) - parseInt(b.tanggal.split('/').reverse().join(''))
    );
}

// ------------------------------------------------------------
// AUTO ISI "LIBUR" SETIAP HARI MINGGU (hari ini)
// ------------------------------------------------------------
async function pastikanLiburHariIni(opsi = {}) {
    const hariIni = new Date();
    if (hariIni.getDay() !== 0) return false; // hanya diproses kalau hari ini Minggu

    const kunci = kunciTanggalDariDate(hariIni);
    if (cariIndexLaporanByKunci(kunci) !== -1) return false; // sudah ada catatan

    // Jangan diisi ulang kalau pengguna memang sengaja menghapusnya
    let ditolak = [];
    try { ditolak = (await localforage.getItem(KUNCI_STORAGE_LIBUR_DITOLAK)) || []; } catch (e) { }
    if (Array.isArray(ditolak) && ditolak.includes(kunci)) return false;

    dataLaporan.push({
        hari: NAMA_HARI[0],                       // "Minggu"
        tanggal: formatTanggalIndo(hariIni),      // dd/mm/yyyy
        uraian: CATATAN_LIBUR,                    // catatan: Libur
        foto: '',
        bulanLabel: labelBulanIndo(hariIni),
        libur: true
    });
    urutkanLaporan();

    try { await localforage.setItem('laporanPKL', dataLaporan); } catch (e) { }
    dataTelahBerubah = true;
    renderSemuaData();
    renderKalender();

    if (!opsi.silent) {
        showToast('📅 Hari ini Minggu — otomatis dicatat "Libur".');
    }
    return true;
}

// ------------------------------------------------------------
// INFO STATUS TANGGAL (di bawah input tanggal)
// ------------------------------------------------------------
function cekHariKerjaInput(namaId = 'inputTanggal', infoId = 'infoTanggalInput') {
    const input = document.getElementById(namaId);
    const info = document.getElementById(infoId);
    if (!input || !info) return;

    if (!input.value) { info.classList.add('hidden'); return; }

    const kunci = input.value.slice(0, 10);
    const dateObj = dateDariKunci(kunci);
    const hari = NAMA_HARI[dateObj.getDay()];
    const idx = cariIndexLaporanByKunci(kunci);
    const sudahAda = idx !== -1;
    const libur = dateObj.getDay() === 0 || (sudahAda && laporanLibur(dataLaporan[idx]));

    let warna, teks;
    if (libur) {
        warna = 'text-slate-400';
        teks = `⚪ ${hari} • LIBUR${sudahAda ? ' • catatan libur sudah ada' : ''}`;
    } else if (sudahAda) {
        warna = 'text-emerald-400';
        teks = `🟢 ${hari} • laporan sudah ada`;
    } else {
        warna = 'text-red-400';
        teks = `🔴 ${hari} • laporan belum diisi`;
    }

    info.className = `text-[11px] mt-1.5 font-semibold ${warna}`;
    info.classList.remove('hidden');
    info.innerText = teks;
}

function setTanggalInput(kunci, namaId = 'inputTanggal', infoId = 'infoTanggalInput') {
    const input = document.getElementById(namaId);
    if (!input) return;
    input.value = kunci;
    cekHariKerjaInput(namaId, infoId);
    renderKalender();
}

// ------------------------------------------------------------
// KALENDER MINI
// ------------------------------------------------------------
function initKalender() {
    const input = document.getElementById('inputTanggal');
    if (!kalenderBulanAktif) {
        const dasar = (input && input.value) ? dateDariKunci(input.value.slice(0, 10)) : new Date();
        kalenderBulanAktif = new Date(dasar.getFullYear(), dasar.getMonth(), 1);
    }
    renderKalender();
}

function geserKalenderBulan(delta) {
    const dasar = kalenderBulanAktif || new Date();
    kalenderBulanAktif = new Date(dasar.getFullYear(), dasar.getMonth() + delta, 1);
    renderKalender();
}

function kalenderKeBulanIni() {
    const hariIni = new Date();
    kalenderBulanAktif = new Date(hariIni.getFullYear(), hariIni.getMonth(), 1);
    renderKalender();
}

function toggleLiburDiKalender(checkbox) {
    kalenderTampilLibur = !!(checkbox && checkbox.checked);
    renderKalender();
}

function pilihTanggal(tahun, bulan, tanggal) {
    const dateObj = new Date(tahun, bulan, tanggal);
    kalenderBulanAktif = new Date(tahun, bulan, 1);
    setTanggalInput(kunciTanggalDariDate(dateObj));

    const tabInput = document.getElementById('tabInput');
    if (tabInput && !tabInput.classList.contains('active') && typeof switchTab === 'function') {
        switchTab('input');
    }

    if (dateObj.getDay() === 0 && cariIndexLaporanByKunci(kunciTanggalDariDate(dateObj)) === -1) {
        showToast('📅 Hari Minggu = Libur. Tulis "Libur" sebagai catatan.');
    }
}

function renderKalender() {
    const wadah = document.getElementById('kalenderHariKerja');
    if (!wadah) return;

    if (!kalenderBulanAktif) {
        const sekarang = new Date();
        kalenderBulanAktif = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
    }

    const tahun = kalenderBulanAktif.getFullYear();
    const bulan = kalenderBulanAktif.getMonth();
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
    const offsetAwal = new Date(tahun, bulan, 1).getDay();

    const inputTanggal = document.getElementById('inputTanggal');
    const kunciTerpilih = (inputTanggal && inputTanggal.value) ? inputTanggal.value.slice(0, 10) : '';
    const kunciHariIni = kunciTanggalDariDate(new Date());

    let html = `
        <div class="kalender-head">
            <div class="kalender-judul">📅 ${NAMA_BULAN[bulan]} ${tahun}</div>
            <div class="flex items-center gap-1">
                <button type="button" onclick="geserKalenderBulan(-1)" class="kalender-nav" title="Bulan sebelumnya">&lsaquo;</button>
                <button type="button" onclick="kalenderKeBulanIni()" class="kalender-today">Hari ini</button>
                <button type="button" onclick="geserKalenderBulan(1)" class="kalender-nav" title="Bulan berikutnya">&rsaquo;</button>
            </div>
        </div>
        <div class="kalender-grid kalender-nama-hari">
            ${KALENDER_HARI_SINGKAT.map((nama, i) => `<div class="${i === 0 ? 'libur' : ''}">${nama}</div>`).join('')}
        </div>
        <div class="kalender-grid">`;

    for (let i = 0; i < offsetAwal; i++) html += '<div class="kalender-kosong"></div>';

    for (let tgl = 1; tgl <= jumlahHari; tgl++) {
        const dateObj = new Date(tahun, bulan, tgl);
        const kunci = kunciTanggalDariDate(dateObj);
        const idx = cariIndexLaporanByKunci(kunci);
        const sudahAda = idx !== -1;
        const libur = dateObj.getDay() === 0 || (sudahAda && laporanLibur(dataLaporan[idx]));

        const kelas = ['kalender-hari'];
        if (libur) kelas.push('k-libur');
        else if (sudahAda) kelas.push('k-isi');
        else kelas.push('k-kosong');

        if (kunci === kunciTerpilih) kelas.push('k-terpilih');
        if (kunci === kunciHariIni) kelas.push('k-hari-ini');
        if (libur && !sudahAda && !kalenderTampilLibur) kelas.push('k-sembunyi');

        const judul = libur
            ? (sudahAda ? `Libur — catatan "${CATATAN_LIBUR}" sudah ada` : 'Libur (Minggu)')
            : (sudahAda ? 'Sudah ada laporan' : 'Belum ada laporan — klik untuk memilih');

        html += `<button type="button" class="${kelas.join(' ')}" title="${judul}"
                    onclick="pilihTanggal(${tahun}, ${bulan}, ${tgl})">${tgl}</button>`;
    }

    html += `
        </div>
        <div class="kalender-legenda">
            <span class="kl"><i class="k-dot k-isi"></i> Sudah diisi</span>
            <span class="kl"><i class="k-dot k-kosong"></i> Belum diisi</span>
            <span class="kl"><i class="k-dot k-libur"></i> Libur (Minggu)</span>
            <label class="kl cursor-pointer select-none">
                <input type="checkbox" ${kalenderTampilLibur ? 'checked' : ''}
                       onchange="toggleLiburDiKalender(this)" class="w-3.5 h-3.5 accent-accent">
                Tampilkan hari libur
            </label>
        </div>`;

    wadah.innerHTML = html;
}
