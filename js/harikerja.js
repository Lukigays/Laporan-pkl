// ============================================================
// KALENDER MINI, AUTO LIBUR HARI MINGGU, & PENGECEKAN TANGGAL
// ============================================================
// Aturan aplikasi:
//   • Hari MINGGU = LIBUR  -> kalau hari ini Minggu dan belum ada
//     catatan, aplikasi otomatis membuat catatan "Libur".
//   • Tanggal merah (libur nasional / cuti bersama) ditandai manual:
//     muncul titik bulat merah kecil di kalender (tanpa catatan otomatis).
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
    const tglMerah = adalahTanggalMerah(kunci);
    const libur = dateObj.getDay() === 0 || tglMerah || (sudahAda && laporanLibur(dataLaporan[idx]));

    let warna, teks;
    if (libur) {
        warna = 'text-slate-400';
        const sebab = dateObj.getDay() === 0 ? 'Minggu' : (tglMerah ? 'tanggal merah' : 'Libur');
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

    if (typeof updateTombolTanggalMerah === 'function') updateTombolTanggalMerah();
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
        const tglMerah = adalahTanggalMerah(kunci);
        const libur = dateObj.getDay() === 0 || tglMerah || (sudahAda && laporanLibur(dataLaporan[idx]));

        const kelas = ['kalender-hari'];
        if (libur) kelas.push('k-libur');
        else if (sudahAda) kelas.push('k-isi');
        else kelas.push('k-kosong');

        if (kunci === kunciTerpilih) kelas.push('k-terpilih');
        if (kunci === kunciHariIni) kelas.push('k-hari-ini');
        if (libur && !sudahAda && !kalenderTampilLibur) kelas.push('k-sembunyi');

        const judul = libur
            ? (tglMerah ? '🔴 Tanggal merah' : 'Libur (Minggu)') + (sudahAda ? ' — catatan sudah ada' : '')
            : (sudahAda ? 'Sudah ada laporan' : 'Belum ada laporan — klik untuk memilih');

        // titik bulat merah kecil = penanda tanggal merah
        const titikMerah = tglMerah ? '<i class="k-dot-merah"></i>' : '';
        html += `<button type="button" class="${kelas.join(' ')}" title="${judul}"
                    onclick="pilihTanggal(${tahun}, ${bulan}, ${tgl})">${tgl}${titikMerah}</button>`;
    }

    html += `
        </div>
        <div class="kalender-legenda">
            <span class="kl"><i class="k-dot k-isi"></i> Sudah diisi</span>
            <span class="kl"><i class="k-dot k-kosong"></i> Belum diisi</span>
            <span class="kl"><i class="k-dot k-libur"></i> Libur (Minggu)</span>
            <span class="kl"><i class="k-dot-merah k-dot-merah-legenda"></i> Tanggal merah (ditandai)</span>
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

// ---------- Tanggal merah (ditandai manual -> titik bulat merah di kalender) ----------
function daftarTanggalMerah() {
    if (!Array.isArray(dataProfil.tanggalMerah)) dataProfil.tanggalMerah = [];
    return dataProfil.tanggalMerah;
}

function adalahTanggalMerah(kunci) {
    return daftarTanggalMerah().includes(kunci);
}

// Tandai / batalkan tanda tanggal merah. Tidak membuat catatan "Libur" otomatis:
// hanya memberi titik bulat merah di kalender & tanggal itu tidak dihitung
// sebagai hari kerja yang belum diisi.
async function toggleTanggalMerah(kunci) {
    if (!kunci) { showToast('⚠️ Pilih tanggalnya dulu di kolom Tanggal Pelaksanaan.'); return false; }
    daftarTanggalMerah();
    const sudah = adalahTanggalMerah(kunci);
    if (sudah) {
        dataProfil.tanggalMerah = dataProfil.tanggalMerah.filter(t => t !== kunci);
    } else {
        dataProfil.tanggalMerah.push(kunci);
        dataProfil.tanggalMerah.sort();
    }
    await simpanProfilPKL();
    dataTelahBerubah = true;

    const d = dateDariKunci(kunci);
    refreshTanggalDanTarget();
    showToast(sudah
        ? `↩️ Tanda tanggal merah ${formatTanggalIndo(d)} dibatalkan.`
        : `🔴 ${formatTanggalIndo(d)} ditandai sebagai tanggal merah.`);
    return true;
}

// Dipanggil tombol di bawah kolom tanggal (tab Input)
async function toggleTanggalMerahInput() {
    const el = document.getElementById('inputTanggal');
    if (!el || !el.value) { showToast('⚠️ Pilih tanggal di kolom Tanggal Pelaksanaan dulu.'); return; }
    await toggleTanggalMerah(el.value.slice(0, 10));
}

function updateTombolTanggalMerah() {
    const btn = document.getElementById('btnTandaiTanggalMerah');
    if (!btn) return;
    const el = document.getElementById('inputTanggal');
    const kunci = (el && el.value) ? el.value.slice(0, 10) : '';
    if (!kunci) { btn.classList.add('hidden'); return; }
    btn.classList.remove('hidden');
    if (adalahTanggalMerah(kunci)) {
        btn.innerHTML = '↩️ Batalkan Tanda Tanggal Merah';
        btn.className = 'w-full mt-2 py-2 px-3 rounded-xl text-[11px] font-bold border transition-all border-white/15 bg-white/5 hover:bg-white/10 text-slate-300';
    } else {
        btn.innerHTML = '🔴 Tandai Tanggal Merah';
        btn.className = 'w-full mt-2 py-2 px-3 rounded-xl text-[11px] font-bold border transition-all border-red-500/30 bg-red-500/10 hover:bg-red-500/25 text-red-300';
    }
}

// Migrasi data lama: "libur tambahan" -> penanda tanggal merah
async function migrasiKeTanggalMerah() {
    let berubah = false;

    if (Array.isArray(dataProfil.liburTambahan) && dataProfil.liburTambahan.length > 0) {
        if (!Array.isArray(dataProfil.tanggalMerah)) dataProfil.tanggalMerah = [];
        dataProfil.liburTambahan.forEach(item => {
            if (item && item.tanggal && !dataProfil.tanggalMerah.includes(item.tanggal)) {
                dataProfil.tanggalMerah.push(item.tanggal);
            }
        });
        dataProfil.tanggalMerah.sort();
        dataProfil.liburTambahan = [];
        berubah = true;
    }

    // hapus catatan "Libur - NAMA" yang dulu dibuat otomatis untuk tanggal merah
    const sebelum = dataLaporan.length;
    dataLaporan = dataLaporan.filter(item => !item.ket && !/^Libur\s*[-–]\s*/.test((item.uraian || '').trim()));
    if (dataLaporan.length !== sebelum) {
        try { await localforage.setItem('laporanPKL', dataLaporan); } catch (e) { }
        berubah = true;
    }

    if (berubah) {
        await simpanProfilPKL();
        renderSemuaData();
        showToast('ℹ️ Libur tambahan diganti jadi penanda tanggal merah (titik merah di kalender).');
    }
    return berubah;
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
        else if (adalahTanggalMerah(kunciTanggalDariDate(d))) kustom++;   // kustom = tanggal merah
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
        liburTercatat: 0, hariKerjaDalamRentang: 0, teksPeriode: labelPeriodeBulan(), teksTanggal: labelPeriodeTanggal()
    };

    const rEfektif = rentangEfektif();
    if (!rEfektif) return hasil;

    // jumlah hari kerja (Minggu libur, Sabtu tetap kerja) sepanjang rentang
    let hariKerja = 0;
    for (let d = new Date(rEfektif.mulai); d <= rEfektif.selesai; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) continue;
        if (adalahTanggalMerah(kunciTanggalDariDate(d))) continue;
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
        if (adalahTanggalMerah(kunciTanggalDariDate(d))) continue;
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
                • ${p.liburTercatat} catatan libur • ${daftarTanggalMerah().length} tanggal merah • sisa ${p.sisa} hari kerja
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
        if (adalahTanggalMerah(kunciTanggalDariDate(d))) continue;
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
    if (typeof updateTombolTanggalMerah === 'function') updateTombolTanggalMerah();
}

