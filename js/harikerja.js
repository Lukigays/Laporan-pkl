// ============================================================
// KALENDER MINI, AUTO LIBUR HARI MINGGU, & PENGECEKAN TANGGAL
// ============================================================
// Aturan aplikasi:
//   • Hari MINGGU = LIBUR  -> kalau hari ini Minggu dan belum ada
//     catatan, aplikasi otomatis membuat catatan "Libur".
//   • Tanggal merah (libur nasional & cuti bersama) otomatis dikenali dari
//     data SKB 3 Menteri (js/liburnasional.js) dan tampil di kalender
//     lengkap dengan keterangan namanya, seperti kalender HP.
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
    if (hariIni.getDay() !== 0) return false; // hanya hari Minggu yang dicatat otomatis
    const kunci = kunciTanggalDariDate(hariIni);

    if (cariIndexLaporanByKunci(kunci) !== -1) return false; // sudah ada catatan

    // Jangan diisi ulang kalau pengguna memang sengaja menghapusnya
    let ditolak = [];
    try { ditolak = (await localforage.getItem(KUNCI_STORAGE_LIBUR_DITOLAK)) || []; } catch (e) { }
    if (Array.isArray(ditolak) && ditolak.includes(kunci)) return false;

    dataLaporan.push({
        hari: NAMA_HARI[hariIni.getDay()],
        tanggal: formatTanggalIndo(hariIni),      // dd/mm/yyyy
        uraian: CATATAN_LIBUR,
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
    const infoLib = (typeof infoLibur === 'function') ? infoLibur(kunci) : null;
    const libur = dateObj.getDay() === 0 || !!infoLib || (sudahAda && laporanLibur(dataLaporan[idx]));

    let warna, teks;
    if (libur) {
        warna = 'text-slate-400';
        const sebab = infoLib
            ? (infoLib.jenis === 'cuti' ? 'Cuti Bersama' : 'Libur Nasional') + ': ' + infoLib.nama
            : 'Minggu';
        teks = `⚪ ${hari} • LIBUR (${sebab})${sudahAda ? ' • catatan libur sudah ada' : ''}`;
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
        const infoLib = (typeof infoLibur === 'function') ? infoLibur(kunci) : null;
        const libur = dateObj.getDay() === 0 || !!infoLib || (sudahAda && laporanLibur(dataLaporan[idx]));

        const kelas = ['kalender-hari'];
        if (libur) kelas.push('k-libur');
        else if (sudahAda) kelas.push('k-isi');
        else kelas.push('k-kosong');

        if (kunci === kunciTerpilih) kelas.push('k-terpilih');
        if (kunci === kunciHariIni) kelas.push('k-hari-ini');
        if (libur && !sudahAda && !kalenderTampilLibur) kelas.push('k-sembunyi');

        const judul = libur
            ? (infoLib ? tooltipLibur(kunci) : 'Libur (Minggu)') + (sudahAda ? ' — catatan sudah ada' : '')
            : (sudahAda ? 'Sudah ada laporan' : 'Belum ada laporan — klik untuk memilih');

        // Keterangan hari libur (seperti kalender HP): kotak kecil berisi nama liburnya
        let chip = '';
        if (infoLib) {
            chip = `<i class="k-chip ${infoLib.jenis === 'cuti' ? 'k-chip-cuti' : 'k-chip-nasional'}">${escapeHtml(infoLib.singkat)}</i>`;
        } else if (dateObj.getDay() === 0) {
            chip = '<i class="k-chip k-chip-libur">Libur</i>';
        }

        html += `<button type="button" class="${kelas.join(' ')}" title="${escapeHtml(judul)}"
                    onclick="pilihTanggal(${tahun}, ${bulan}, ${tgl})">
                    <span class="k-tanggal">${tgl}</span>${chip}
                 </button>`;
    }

    html += `
        </div>
        <div class="kalender-legenda">
            <span class="kl"><i class="k-dot k-isi"></i> Sudah diisi</span>
            <span class="kl"><i class="k-dot k-kosong"></i> Belum diisi</span>
            <span class="kl"><i class="k-dot k-libur"></i> Libur (Minggu)</span>
            <span class="kl"><i class="k-chip k-chip-nasional k-chip-legenda">Proklamasi RI</i> Libur Nasional</span>
            <span class="kl"><i class="k-chip k-chip-cuti k-chip-legenda">Cuti: Idul Fitri</i> Cuti Bersama</span>
            <label class="kl cursor-pointer select-none">
                <input type="checkbox" ${kalenderTampilLibur ? 'checked' : ''}
                       onchange="toggleLiburDiKalender(this)" class="w-3.5 h-3.5 accent-accent">
                Tampilkan hari libur
            </label>
        </div>`;

    wadah.innerHTML = html;
}

// ============================================================
// PAKET C — PERIODE PKL, LIBUR TAMBAHAN, & TARGET HARI KERJA
// ============================================================

// ---------- Rentang periode PKL ----------
function rentangPKL() {
    if (!dataProfil.pklMulai || !dataProfil.pklSelesai) return null;
    const mulai = dateDariKunci(dataProfil.pklMulai);
    const selesai = dateDariKunci(dataProfil.pklSelesai);
    if (isNaN(mulai) || isNaN(selesai) || selesai < mulai) return null;
    return { mulai, selesai };
}

// Rentang efektif: kalau periode belum diatur, pakai laporan pertama s/d hari ini
function rentangEfektif() {
    const r = rentangPKL();
    if (r) return r;
    if (dataLaporan.length === 0) return null;
    const kunciAwal = kunciTanggalDariString(dataLaporan[0].tanggal);
    if (!kunciAwal) return null;
    return { mulai: dateDariKunci(kunciAwal), selesai: new Date() };
}

// Label bulan: "Juli 2026 s/d September 2026"
function labelPeriodeBulan() {
    const r = rentangPKL();
    if (!r) return '';
    const a = `${NAMA_BULAN[r.mulai.getMonth()]} ${r.mulai.getFullYear()}`;
    const b = `${NAMA_BULAN[r.selesai.getMonth()]} ${r.selesai.getFullYear()}`;
    return a === b ? a : `${a} s/d ${b}`;
}

function labelPeriodeTanggal() {
    const r = rentangPKL();
    if (!r) return '';
    return `${formatTanggalIndo(r.mulai)} s/d ${formatTanggalIndo(r.selesai)}`;
}

// ---------- Libur nasional & cuti bersama (data otomatis, js/liburnasional.js) ----------
// Tidak ada penandaan manual: tanggal merah dikenali otomatis dari data SKB 3 Menteri
// dan tampil di kalender dengan keterangan namanya.

// Bersihkan sisa data penandaan lama (kalau ada) dari profil
async function bersihkanPenandaLama() {
    let berubah = false;
    if (dataProfil.tanggalMerah && dataProfil.tanggalMerah.length) { dataProfil.tanggalMerah = []; berubah = true; }
    if (dataProfil.liburTambahan && dataProfil.liburTambahan.length) { dataProfil.liburTambahan = []; berubah = true; }
    if (berubah) { try { await simpanProfilPKL(); } catch (e) { } }
    return berubah;
}

// Daftar libur nasional/cuti bersama yang masuk periode PKL (tampil di pengaturan)
function renderDaftarLiburPeriode() {
    const wadah = document.getElementById('daftarLiburPeriode');
    if (!wadah) return;
    const r = rentangPKL();
    if (!r) {
        wadah.innerHTML = '<p class="text-[11px] text-slate-500 italic">Isi tanggal mulai & selesai PKL di atas untuk melihat daftar libur nasional pada periode tersebut.</p>';
        return;
    }
    const daftar = daftarLiburRentang(r.mulai, r.selesai);
    if (daftar.length === 0) {
        wadah.innerHTML = '<p class="text-[11px] text-slate-500 italic">Tidak ada libur nasional pada periode PKL ini.</p>';
        return;
    }
    wadah.innerHTML = daftar.map(item => `
        <div class="chip-libur">
            <span class="chip-libur-teks">
                <b>${formatTanggalIndo(item.tanggal)}</b> (${NAMA_HARI[item.tanggal.getDay()]}) — ${escapeHtml(item.nama)}
                <span class="tag-jenis ${item.jenis === 'cuti' ? 'tag-cuti' : 'tag-nasional'}">${item.jenis === 'cuti' ? 'Cuti Bersama' : 'Libur Nasional'}</span>
            </span>
        </div>`).join('');
}

// Info jumlah data yang terpasang
function renderInfoLibur() {
    const el = document.getElementById('infoJumlahLibur');
    if (!el) return;
    const daftarTahun = (typeof TAHUN_LIBUR_TERSEDIA !== 'undefined') ? TAHUN_LIBUR_TERSEDIA : [];
    el.innerHTML = `Kalender libur nasional otomatis aktif untuk tahun <b class="text-slate-200">${daftarTahun.join(', ')}</b> `
        + `(sumber: SKB 3 Menteri) — total <b class="text-slate-200">${Object.keys(LIBUR_NASIONAL).length}</b> tanggal.`;
}

// Buatkan catatan "Libur" untuk satu tanggal tertentu (dipakai isi otomatis hari Minggu)
async function pastikanLiburTanggal(dateObj) {
    const kunci = kunciTanggalDariDate(dateObj);
    if (cariIndexLaporanByKunci(kunci) !== -1) return false;

    let ditolak = [];
    try { ditolak = (await localforage.getItem(KUNCI_STORAGE_LIBUR_DITOLAK)) || []; } catch (e) { }
    if (Array.isArray(ditolak) && ditolak.includes(kunci)) return false;

    dataLaporan.push({
        hari: NAMA_HARI[dateObj.getDay()],
        tanggal: formatTanggalIndo(dateObj),
        uraian: CATATAN_LIBUR,
        foto: '',
        bulanLabel: labelBulanIndo(dateObj),
        libur: true
    });
    urutkanLaporan();
    try { await localforage.setItem('laporanPKL', dataLaporan); } catch (e) { }
    dataTelahBerubah = true;
    renderSemuaData();
    return true;
}

// ---------- Isi otomatis semua hari Minggu sepanjang rentang ----------
async function isiLiburOtomatisRentang(opsi = {}) {
    const r = rentangPKL();
    if (!r) {
        showToast('⚠️ Atur dulu "Tanggal Mulai & Selesai PKL" di ⚙️ Setting.');
        return 0;
    }
    const batasAkhir = opsi.sampaiSelesai ? r.selesai : (new Date(r.selesai < new Date() ? r.selesai : new Date()));
    const sampai = new Date(batasAkhir.getFullYear(), batasAkhir.getMonth(), batasAkhir.getDate());
    if (sampai < r.mulai) { showToast('ℹ️ Rentang PKL belum dimulai.'); return 0; }

    if (!opsi.tanpaKonfirmasi) {
        const jmlMinggu = hitungHariLiburRentang(r.mulai, sampai).minggu;
        if (!confirm(`Isi otomatis catatan "Libur" untuk hari Minggu?\n\nHari Minggu: ${jmlMinggu} hari\nPeriode: ${formatTanggalIndo(r.mulai)} s/d ${formatTanggalIndo(sampai)}\n\nCatatan yang sudah ada tidak akan ditimpa. Tanggal merah tidak diisi otomatis.`)) return 0;
    }

    let jumlah = 0;
    for (let d = new Date(r.mulai); d <= sampai; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) continue;   // hanya hari Minggu
        if (await pastikanLiburTanggal(new Date(d))) jumlah++;
    }
    refreshTanggalDanTarget();
    showToast(jumlah > 0 ? `✅ ${jumlah} catatan "Libur" berhasil dibuat.` : 'ℹ️ Semua tanggal libur sudah ada catatannya.');
    return jumlah;
}

// Hitung jumlah hari libur (Minggu & libur tambahan) dalam rentang
function hitungHariLiburRentang(mulai, selesai) {
    let minggu = 0, kustom = 0;
    for (let d = new Date(mulai); d <= selesai; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) minggu++;
        else if (adalahLiburNasional(kunciTanggalDariDate(d))) kustom++;   // kustom = tanggal merah (libur nasional/cuti bersama)
    }
    return { minggu, kustom, total: minggu + kustom };
}

// ---------- Target & progress hari kerja ----------
function hitungProgresPKL() {
    const r = rentangPKL();
    const hasil = {
        adaRentang: !!r,
        target: 0, targetManual: false,
        terisi: 0, belumSampaiHariIni: 0, sisa: 0, persen: 0,
        liburTercatat: 0, hariKerjaDalamRentang: 0,
        tanggalMerah: 0, tanggalMerahDalamRentang: 0,   // libur nasional + cuti bersama
        teksPeriode: labelPeriodeBulan(), teksTanggal: labelPeriodeTanggal()
    };

    hasil.tanggalMerah = (typeof Object.keys === 'function' && typeof LIBUR_NASIONAL !== 'undefined') ? Object.keys(LIBUR_NASIONAL).length : 0;

    const rEfektif = rentangEfektif();
    if (!rEfektif) return hasil;

    // berapa tanggal merah (libur nasional/cuti bersama) di dalam rentang
    hasil.tanggalMerahDalamRentang = (typeof daftarLiburRentang === 'function')
        ? daftarLiburRentang(rEfektif.mulai, rEfektif.selesai).length : 0;

    // jumlah hari kerja (Minggu libur, Sabtu tetap kerja) sepanjang rentang
    let hariKerja = 0;
    for (let d = new Date(rEfektif.mulai); d <= rEfektif.selesai; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) continue;
        if (adalahLiburNasional(kunciTanggalDariDate(d))) continue;
        hariKerja++;
    }
    hasil.hariKerjaDalamRentang = hariKerja;

    const targetManual = parseInt(dataProfil.targetHariKerja, 10);
    hasil.target = (targetManual > 0) ? targetManual : hariKerja;
    hasil.targetManual = targetManual > 0;

    const dalamRentang = dataLaporan.filter(item => {
        const k = kunciTanggalDariString(item.tanggal);
        if (!k) return false;
        const d = dateDariKunci(k);
        return d >= rEfektif.mulai && d <= rEfektif.selesai;
    });
    hasil.terisi = dalamRentang.filter(i => !laporanLibur(i)).length;
    hasil.liburTercatat = dalamRentang.filter(i => laporanLibur(i)).length;

    // hari kerja sampai hari ini yang belum diisi
    const hariIni = new Date();
    const batas = hariIni < rEfektif.selesai ? hariIni : rEfektif.selesai;
    let belum = 0;
    for (let d = new Date(rEfektif.mulai); d <= batas; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) continue;
        if (adalahLiburNasional(kunciTanggalDariDate(d))) continue;
        if (cariIndexLaporanByKunci(kunciTanggalDariDate(d)) === -1) belum++;
    }
    hasil.belumSampaiHariIni = belum;
    hasil.sisa = Math.max(hasil.target - hasil.terisi, 0);
    hasil.persen = hasil.target > 0 ? Math.min(Math.round((hasil.terisi / hasil.target) * 100), 100) : 0;
    return hasil;
}

function renderPanelTarget() {
    const wadah = document.getElementById('panelTargetPKL');
    if (!wadah) return;
    const p = hitungProgresPKL();

    if (!p.adaRentang) {
        wadah.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 class="text-sm font-display font-bold text-accent-light flex items-center gap-2"><span>🎯</span> Periode & Target PKL</h3>
                    <p class="text-xs text-slate-400 mt-1">Periode PKL belum diatur, jadi laporan belum bisa menampilkan "dari bulan apa sampai bulan apa".</p>
                </div>
                <button type="button" onclick="bukaSettings()" class="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold">⚙️ Atur Periode</button>
            </div>
            ${p.terisi > 0 ? `<p class="text-[11px] text-slate-500 mt-3">Sementara ini dihitung dari laporan pertama (${p.terisi} hari terisi).</p>` : ''}`;
        return;
    }

    wadah.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
                <h3 class="text-sm font-display font-bold text-accent-light flex items-center gap-2"><span>🎯</span> Periode & Target PKL</h3>
                <p class="text-xs text-slate-300 mt-1.5">
                    📆 Laporan PKL: <b class="text-white">Bulan ${p.teksPeriode}</b>
                    <span class="text-slate-500">(${p.teksTanggal})</span>
                </p>
            </div>
            <button type="button" onclick="cariTanggalBelumDiisi()" class="btn-secondary px-4 py-2.5 rounded-xl text-[11px] font-bold">🔎 Lompat ke Tanggal Kosong</button>
        </div>

        <div class="progress-track"><div class="progress-fill" style="width: ${p.persen}%"></div></div>

        <div class="flex flex-wrap items-center justify-between gap-2 mt-3 text-[11px]">
            <span class="text-slate-300">Terisi <b class="text-emerald-400">${p.terisi}</b> dari <b class="text-white">${p.target}</b> hari kerja
                ${p.targetManual ? '<span class="text-slate-500">(target manual)</span>' : '<span class="text-slate-500">(otomatis dari rentang)</span>'}
                • <b class="text-accent-light">${p.persen}%</b></span>
            <span class="text-slate-400">
                ${p.belumSampaiHariIni > 0
                    ? `<b class="text-red-400">${p.belumSampaiHariIni} hari kerja belum diisi</b>`
                    : '<b class="text-emerald-400">Semua hari kerja terisi ✓</b>'}
                • ${p.liburTercatat} catatan libur • ${p.tanggalMerahDalamRentang} tanggal merah dalam periode • sisa ${p.sisa} hari kerja
            </span>
        </div>`;
}

// Lompat ke hari kerja pertama yang belum diisi (dalam rentang)
function cariTanggalBelumDiisi() {
    const r = rentangEfektif();
    if (!r) { showToast('ℹ️ Belum ada cukup data untuk mencari tanggal kosong.'); return; }
    const hariIni = new Date(); hariIni.setHours(23, 59, 59, 999);
    const batas = hariIni < r.selesai ? hariIni : r.selesai;
    for (let d = new Date(r.mulai); d <= batas; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) continue;
        if (adalahLiburNasional(kunciTanggalDariDate(d))) continue;
        if (cariIndexLaporanByKunci(kunciTanggalDariDate(d)) === -1) {
            kalenderBulanAktif = new Date(d.getFullYear(), d.getMonth(), 1);
            pilihTanggal(d.getFullYear(), d.getMonth(), d.getDate());
            showToast(`✏️ Tanggal ${formatTanggalIndo(d)} belum ada laporan.`);
            return;
        }
    }
    showToast('✅ Tidak ada tanggal kosong sampai hari ini.');
}

// ---------- Pengaturan periode dari modal ⚙️ ----------
async function simpanProfilPKL() {
    try { await localforage.setItem('profilPKL', dataProfil); } catch (e) { }
}

async function simpanPeriodeDariSettings() {
    const elMulai = document.getElementById('setPklMulai');
    const elSelesai = document.getElementById('setPklSelesai');
    const elTarget = document.getElementById('setTargetHari');
    const elAuto = document.getElementById('setAutoLibur');
    if (!elMulai || !elSelesai) return;

    const mulai = elMulai.value;
    const selesai = elSelesai.value;
    if (mulai && selesai && dateDariKunci(selesai) < dateDariKunci(mulai)) {
        showToast('⚠️ Tanggal selesai tidak boleh sebelum tanggal mulai.');
        return;
    }

    dataProfil.pklMulai = mulai;
    dataProfil.pklSelesai = selesai;
    dataProfil.targetHariKerja = (elTarget && elTarget.value) ? String(parseInt(elTarget.value, 10) || '') : '';
    dataProfil.autoLiburRentang = !!(elAuto && elAuto.checked);
    await simpanProfilPKL();

    renderProfil();          // cover + periode
    refreshTanggalDanTarget();

    // kalau opsi auto-isi dinyalakan -> langsung isi sepanjang rentang
    if (dataProfil.autoLiburRentang && rentangPKL()) {
        await isiLiburOtomatisRentang();
    } else {
        showToast('📆 Periode PKL disimpan.');
    }
}

// ---------- Helper refresh terpadu ----------
function refreshTanggalDanTarget() {
    if (typeof renderKalender === 'function') renderKalender();
    if (typeof renderPanelTarget === 'function') renderPanelTarget();
    if (typeof renderDaftarLiburPeriode === 'function') renderDaftarLiburPeriode();
    if (typeof renderInfoLibur === 'function') renderInfoLibur();
}

