// ============================================================
// BACKUP & RESTORE DATABASE LOKAL (JSON) + HAPUS SEMUA DATA
// ============================================================

const FORMAT_BACKUP_PKL = 'laporan-pkl-database-backup';
const VERSI_FORMAT_BACKUP_PKL = 1;
const KUNCI_LAPORAN_PKL = 'laporanPKL';
const KUNCI_PROFIL_PKL = 'profilPKL';

function tampilkanStatusBackup(status, judul, pesan) {
    const modal = document.getElementById('modalStatusBackup');
    if (!modal) return;

    const spinner = document.getElementById('statusBackupSpinner');
    const icon = document.getElementById('statusBackupIcon');
    const tombolTutup = document.getElementById('statusBackupClose');
    const judulEl = document.getElementById('statusBackupTitle');
    const pesanEl = document.getElementById('statusBackupMessage');
    const sedangMemproses = status === 'loading';
    const ikonStatus = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️'
    };

    if (spinner) spinner.classList.toggle('hidden', !sedangMemproses);
    if (icon) {
        icon.classList.toggle('hidden', sedangMemproses);
        icon.textContent = ikonStatus[status] || '💾';
    }
    if (judulEl) judulEl.textContent = judul || (sedangMemproses ? 'Memproses...' : 'Selesai');
    if (pesanEl) pesanEl.textContent = pesan || '';
    if (tombolTutup) tombolTutup.classList.toggle('hidden', sedangMemproses);

    modal.classList.remove('hidden', 'opacity-0');
}

function tutupStatusBackup() {
    const modal = document.getElementById('modalStatusBackup');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 180);
}

function isPlainRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function punyaProperti(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function namaFileAman(value) {
    let nama = String(value || 'LUKYY').trim();
    try { nama = nama.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { /* browser lama */ }
    nama = nama
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/\.+$/g, '')
        .slice(0, 60);
    return nama || 'LUKYY';
}

function formatUkuranFile(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function tungguDataAplikasiSiap() {
    if (typeof window !== 'undefined' && window.appDataReady && typeof window.appDataReady.then === 'function') {
        try { await window.appDataReady; } catch (err) { console.warn('Menunggu data aplikasi gagal:', err); }
    }
}

// Baca seluruh key dari LocalForage/IndexedDB. Jika database tidak bisa dibaca,
// data yang masih ada di memori tetap bisa diekspor sebagai backup penyelamatan.
async function bacaDatabaseLokalUntukBackup() {
    const database = Object.create(null);
    const storage = (typeof localforage !== 'undefined') ? localforage : null;
    let databaseTerbaca = false;
    let errorStorage = null;

    if (storage && typeof storage.keys === 'function' && typeof storage.getItem === 'function') {
        try {
            const keys = await storage.keys();
            if (Array.isArray(keys)) {
                const entri = await Promise.all(keys
                    .filter(key => typeof key === 'string' && key.length > 0)
                    .map(async key => [key, await storage.getItem(key)]));
                for (const [key, value] of entri) database[key] = value;
                databaseTerbaca = true;
            }
        } catch (err) {
            errorStorage = err;
            console.warn('Database lokal tidak bisa dibaca penuh:', err);
        }
    }

    // Bila list key gagal, tetap coba baca tabel utama secara langsung.
    if (storage && typeof storage.getItem === 'function') {
        for (const key of [KUNCI_LAPORAN_PKL, KUNCI_PROFIL_PKL, 'liburDitolak']) {
            if (punyaProperti(database, key)) continue;
            try {
                const value = await storage.getItem(key);
                if (value !== null && value !== undefined) database[key] = value;
            } catch (err) {
                errorStorage = errorStorage || err;
            }
        }
    }

    const statusMuat = (typeof window !== 'undefined' && window.appDataLoadStatus)
        ? window.appDataLoadStatus
        : {};

    // State aktif dipakai jika memang sudah selesai dimuat dari database.
    // Ini memastikan perubahan terakhir yang baru disimpan tetap ikut terbackup.
    if (statusMuat.laporanLoaded && Array.isArray(dataLaporan)) {
        database[KUNCI_LAPORAN_PKL] = dataLaporan;
    } else if (!Array.isArray(database[KUNCI_LAPORAN_PKL]) && Array.isArray(dataLaporan)) {
        database[KUNCI_LAPORAN_PKL] = dataLaporan;
    }

    if (statusMuat.profilLoaded && isPlainRecord(dataProfil)) {
        database[KUNCI_PROFIL_PKL] = dataProfil;
    } else if (!isPlainRecord(database[KUNCI_PROFIL_PKL]) && isPlainRecord(dataProfil)) {
        database[KUNCI_PROFIL_PKL] = dataProfil;
    }

    if (!Array.isArray(database[KUNCI_LAPORAN_PKL])) database[KUNCI_LAPORAN_PKL] = [];
    if (!isPlainRecord(database[KUNCI_PROFIL_PKL])) database[KUNCI_PROFIL_PKL] = {};

    return { database, databaseTerbaca, errorStorage };
}

function buatNamaFileBackup() {
    const tanggal = new Date().toISOString().slice(0, 10);
    const nama = namaFileAman(dataProfil && dataProfil.nama);
    return `Backup_Database_Laporan_PKL_${nama}_${tanggal}.json`;
}

// Panggilan picker dilakukan sebelum operasi async supaya tetap berada dalam
// user gesture browser. Jika tidak didukung, file diunduh memakai Blob URL.
function mulaiSavePicker(namaFile) {
    if (typeof window === 'undefined' || typeof window.showSaveFilePicker !== 'function') return null;
    try {
        return window.showSaveFilePicker({
            suggestedName: namaFile,
            types: [{
                description: 'Backup database Laporan PKL (JSON)',
                accept: { 'application/json': ['.json'] }
            }]
        }).then(handle => ({ handle }), error => ({ error }));
    } catch (error) {
        return Promise.resolve({ error });
    }
}

async function simpanBlobBackup(blob, namaFile, promiseSavePicker) {
    if (promiseSavePicker) {
        const hasilPicker = await promiseSavePicker;
        if (hasilPicker.error && hasilPicker.error.name === 'AbortError') return 'dibatalkan';
        if (hasilPicker.handle) {
            try {
                const writable = await hasilPicker.handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return 'tersimpan';
            } catch (err) {
                console.warn('Save picker gagal, mencoba unduhan browser:', err);
            }
        }
    }

    // iOS/PWA: share sheet menyediakan pilihan "Save to Files" saat download
    // biasa tidak tersedia. Jika share gagal/tidak didukung, lanjutkan ke link.
    const navigatorObj = (typeof navigator !== 'undefined') ? navigator : null;
    const perangkatApple = navigatorObj && /iPhone|iPad|iPod/i.test(navigatorObj.userAgent || '');
    if (perangkatApple && typeof File !== 'undefined' && navigatorObj.share && navigatorObj.canShare) {
        try {
            const fileObj = new File([blob], namaFile, { type: 'application/json' });
            if (navigatorObj.canShare({ files: [fileObj] })) {
                await navigatorObj.share({ files: [fileObj], title: 'Backup Database Laporan PKL' });
                return 'dibagikan';
            }
        } catch (err) {
            if (err && err.name === 'AbortError') return 'dibatalkan';
            console.warn('Share sheet gagal, mencoba unduhan browser:', err);
        }
    }

    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
        throw new Error('Browser ini tidak mendukung unduhan file backup. Coba buka aplikasi di Chrome/Edge terbaru.');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = namaFile;
    link.style.display = 'none';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Beri waktu browser membaca blob, terutama untuk database berfoto besar.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'diunduh';
}

async function eksporDataJSON() {
    tampilkanStatusBackup('loading', 'Menyiapkan backup...', 'Membaca database lokal dan menyiapkan file. Mohon tunggu.');
    showToast('⏳ Membaca database dan menyiapkan backup...');

    try {
        // Panggil picker sebelum await agar tetap dianggap sebagai aksi pengguna.
        const namaAwal = buatNamaFileBackup();
        const promiseSavePicker = mulaiSavePicker(namaAwal);
        await tungguDataAplikasiSiap();
        const { database, databaseTerbaca, errorStorage } = await bacaDatabaseLokalUntukBackup();
        const laporan = database[KUNCI_LAPORAN_PKL];
        const foto = laporan.filter(item => item && typeof item.foto === 'string' && item.foto.trim()).length;
        const payload = {
            format: FORMAT_BACKUP_PKL,
            version: VERSI_FORMAT_BACKUP_PKL,
            app: 'Laporan PKL by Lukyy',
            exportedAt: new Date().toISOString(),
            summary: { jumlahLaporan: laporan.length, jumlahFoto: foto },
            database
        };
        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const namaFile = buatNamaFileBackup();
        tampilkanStatusBackup('loading', 'Menyimpan file backup...', `Membuat ${namaFile} (${formatUkuranFile(blob.size)}).`);
        const hasilSimpan = await simpanBlobBackup(blob, namaFile, promiseSavePicker);

        if (hasilSimpan === 'dibatalkan') {
            tampilkanStatusBackup('info', 'Backup dibatalkan', 'Tidak ada file backup yang disimpan. Data Anda tidak berubah.');
            showToast('Backup dibatalkan. Data Anda tidak berubah.');
            return;
        }

        const ukuran = formatUkuranFile(blob.size);
        const caraSimpan = hasilSimpan === 'tersimpan'
            ? 'File tersimpan di lokasi yang Anda pilih.'
            : (hasilSimpan === 'dibagikan'
                ? 'Pilih lokasi/aplikasi tujuan dari menu berbagi untuk menyimpan file.'
                : 'Browser sudah memulai unduhan; cek folder Unduhan/Downloads.');
        if (!databaseTerbaca) {
            const alasan = errorStorage ? 'Database lokal tidak terbaca penuh.' : 'Penyimpanan lokal tidak dapat diperiksa.';
            tampilkanStatusBackup('warning', 'Backup dibuat dengan peringatan', `${laporan.length} laporan, ${foto} foto (${ukuran}). ${alasan} File: ${namaFile}`);
            showToast(`⚠️ Backup ${laporan.length} laporan dibuat dari sesi aktif (${ukuran}); database lokal tidak terbaca penuh.`);
        } else {
            tampilkanStatusBackup('success', 'Backup berhasil dibuat', `${laporan.length} laporan, ${foto} foto (${ukuran}). ${caraSimpan} File: ${namaFile}`);
            showToast(`✅ Backup ${laporan.length} laporan (${foto} foto, ${ukuran}) berhasil dibuat!`);
        }
    } catch (err) {
        console.error('Gagal membuat backup database:', err);
        const pesan = err && err.message ? err.message : 'terjadi kesalahan saat membaca database.';
        tampilkanStatusBackup('error', 'Backup gagal', pesan);
        showToast(`❌ Backup gagal: ${pesan}`);
    }
}

function kunciDatabaseAman(key) {
    return typeof key === 'string'
        && key.length > 0
        && key.length <= 120
        && !['__proto__', 'prototype', 'constructor'].includes(key)
        && !/[\u0000-\u001F]/.test(key);
}

function normalisasiBackupImpor(parsed) {
    if (!isPlainRecord(parsed)) throw new Error('Isi file JSON harus berupa object backup.');

    const database = new Map();
    let backupDatabasePenuh = false;

    if (punyaProperti(parsed, 'format')) {
        if (parsed.format !== FORMAT_BACKUP_PKL) throw new Error('Format backup tidak dikenali.');
        if (!Number.isInteger(parsed.version) || parsed.version < 1) throw new Error('Versi backup tidak valid.');
        if (parsed.version > VERSI_FORMAT_BACKUP_PKL) {
            throw new Error('Backup dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi sebelum mengimpornya.');
        }
        if (!isPlainRecord(parsed.database)) throw new Error('Bagian database pada backup tidak valid.');
        backupDatabasePenuh = true;
        for (const [key, value] of Object.entries(parsed.database)) {
            if (!kunciDatabaseAman(key)) continue;
            database.set(key, value);
        }
    } else if (isPlainRecord(parsed.database)) {
        // Format tanpa metadata (untuk kompatibilitas dengan backup pihak ketiga).
        backupDatabasePenuh = true;
        for (const [key, value] of Object.entries(parsed.database)) {
            if (!kunciDatabaseAman(key)) continue;
            database.set(key, value);
        }
    } else if (punyaProperti(parsed, KUNCI_LAPORAN_PKL) || punyaProperti(parsed, KUNCI_PROFIL_PKL)) {
        if (punyaProperti(parsed, KUNCI_LAPORAN_PKL)) database.set(KUNCI_LAPORAN_PKL, parsed[KUNCI_LAPORAN_PKL]);
        if (punyaProperti(parsed, KUNCI_PROFIL_PKL)) database.set(KUNCI_PROFIL_PKL, parsed[KUNCI_PROFIL_PKL]);
    } else {
        // Format lama yang dipakai aplikasi sebelum patch ini: { profil, laporan }.
        if (punyaProperti(parsed, 'laporan')) database.set(KUNCI_LAPORAN_PKL, parsed.laporan);
        if (punyaProperti(parsed, 'profil')) database.set(KUNCI_PROFIL_PKL, parsed.profil);
    }

    if (database.size === 0) throw new Error('File tidak berisi data laporan atau profil yang bisa dipulihkan.');
    if (backupDatabasePenuh && (!database.has(KUNCI_LAPORAN_PKL) || !database.has(KUNCI_PROFIL_PKL))) {
        throw new Error('Backup database tidak lengkap: data laporan atau profil tidak ditemukan.');
    }
    if (database.has(KUNCI_LAPORAN_PKL) && !Array.isArray(database.get(KUNCI_LAPORAN_PKL))) {
        throw new Error('Data laporan di dalam backup tidak berbentuk daftar yang valid.');
    }
    if (database.has(KUNCI_PROFIL_PKL) && !isPlainRecord(database.get(KUNCI_PROFIL_PKL))) {
        throw new Error('Data profil di dalam backup tidak valid.');
    }
    if (database.has('liburDitolak') && !Array.isArray(database.get('liburDitolak'))) {
        throw new Error('Data kalender libur di dalam backup tidak valid.');
    }

    return { database, backupDatabasePenuh };
}

async function bacaDatabasePersistenSaatIni() {
    const storage = (typeof localforage !== 'undefined') ? localforage : null;
    if (!storage || typeof storage.keys !== 'function' || typeof storage.getItem !== 'function') {
        return { tersedia: false, database: new Map() };
    }
    const keys = await storage.keys();
    if (!Array.isArray(keys)) return { tersedia: false, database: new Map() };
    const database = new Map();
    for (const key of keys) {
        if (!kunciDatabaseAman(key)) continue;
        database.set(key, await storage.getItem(key));
    }
    return { tersedia: true, database };
}

async function tulisDatabasePersisten(database, gantiSemua) {
    const storage = (typeof localforage !== 'undefined') ? localforage : null;
    if (!storage || typeof storage.setItem !== 'function' || typeof storage.keys !== 'function') return false;

    const keysSaatIni = await storage.keys();
    if (!Array.isArray(keysSaatIni)) return false;
    if (gantiSemua) {
        if (typeof storage.removeItem !== 'function') return false;
        for (const key of keysSaatIni) {
            if (kunciDatabaseAman(key) && !database.has(key)) await storage.removeItem(key);
        }
    }

    for (const [key, value] of database) {
        if (kunciDatabaseAman(key)) await storage.setItem(key, value);
    }
    return true;
}

async function pulihkanDatabaseDariJSON(parsed) {
    const { database: dataImpor, backupDatabasePenuh } = normalisasiBackupImpor(parsed);
    const jumlah = Array.isArray(dataImpor.get(KUNCI_LAPORAN_PKL))
        ? dataImpor.get(KUNCI_LAPORAN_PKL).length
        : (Array.isArray(dataLaporan) ? dataLaporan.length : 0);
    const konfirmasi = `Pulihkan ${jumlah} laporan dari backup?\n\nData lokal yang sesuai akan diganti. Pastikan file backup benar. Cloud tidak diubah sampai sinkronisasi cloud dijalankan.`;
    if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(konfirmasi)) {
        return { dibatalkan: true, permanen: false };
    }

    await tungguDataAplikasiSiap();
    let databaseLama = { tersedia: false, database: new Map() };
    try { databaseLama = await bacaDatabasePersistenSaatIni(); } catch (err) {
        console.warn('Tidak dapat membuat titik pemulihan sebelum impor:', err);
    }

    const profilBaru = dataImpor.has(KUNCI_PROFIL_PKL)
        ? { ...(isPlainRecord(dataProfil) ? dataProfil : {}), ...dataImpor.get(KUNCI_PROFIL_PKL) }
        : dataProfil;
    const databaseUntukDisimpan = new Map(dataImpor);
    if (isPlainRecord(profilBaru)) databaseUntukDisimpan.set(KUNCI_PROFIL_PKL, profilBaru);

    let penyimpananPermanen = false;
    try {
        penyimpananPermanen = await tulisDatabasePersisten(databaseUntukDisimpan, backupDatabasePenuh);
    } catch (err) {
        // Coba pulihkan database sebelumnya jika penulisan backup gagal di tengah jalan.
        if (databaseLama.tersedia) {
            try { await tulisDatabasePersisten(databaseLama.database, true); } catch (rollbackError) {
                console.error('Rollback database gagal:', rollbackError);
            }
        }
        throw new Error(`Gagal menyimpan ke database lokal: ${err && err.message ? err.message : 'penyimpanan ditolak browser'}`);
    }

    if (dataImpor.has(KUNCI_LAPORAN_PKL)) dataLaporan = dataImpor.get(KUNCI_LAPORAN_PKL);
    else if (backupDatabasePenuh) dataLaporan = [];
    if (dataImpor.has(KUNCI_PROFIL_PKL)) dataProfil = profilBaru;
    // Restore hanya mengubah data lokal. Pengguna perlu menekan sinkronisasi cloud
    // secara sengaja agar backup lama tidak otomatis menimpa data cloud.
    dataTelahBerubah = false;

    if (typeof renderProfil === 'function') renderProfil();
    if (typeof renderLogoPreview === 'function') renderLogoPreview();
    if (typeof renderSemuaData === 'function') renderSemuaData();
    if (typeof refreshTanggalDanTarget === 'function') refreshTanggalDanTarget();
    if (typeof tutupSettings === 'function') tutupSettings();

    return { dibatalkan: false, permanen: penyimpananPermanen };
}

async function bacaTeksFile(file) {
    if (file && typeof file.text === 'function') return file.text();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = () => reject(new Error('File tidak bisa dibaca oleh browser.'));
        reader.readAsText(file);
    });
}

async function imporDataJSON(event) {
    const input = event && event.target ? event.target : null;
    const file = input && input.files ? input.files[0] : null;
    if (!file) return;

    tampilkanStatusBackup('loading', 'Memulihkan backup...', `Membaca ${file.name || 'file JSON'} dan memeriksa isinya.`);
    showToast('⏳ Membaca dan memeriksa file backup...');
    try {
        const teks = await bacaTeksFile(file);
        tampilkanStatusBackup('loading', 'Memeriksa data...', 'Memvalidasi format backup sebelum mengubah database.');
        let parsed;
        try { parsed = JSON.parse(teks); } catch (err) { throw new Error('Format JSON rusak atau tidak valid.'); }
        tampilkanStatusBackup('loading', 'Menyimpan data...', 'Memulihkan laporan, foto, profil, dan data kalender. Mohon tunggu.');
        const hasilPemulihan = await pulihkanDatabaseDariJSON(parsed);
        if (hasilPemulihan.dibatalkan) {
            tampilkanStatusBackup('info', 'Pemulihan dibatalkan', 'Data Anda tidak berubah.');
            showToast('Pemulihan dibatalkan. Data Anda tidak berubah.');
        } else if (!hasilPemulihan.permanen) {
            tampilkanStatusBackup('warning', 'Data dibuka sementara', 'Penyimpanan lokal tidak tersedia, jadi perubahan mungkin hilang saat halaman ditutup. Coba browser lain.');
            showToast('⚠️ Data dibuka, tetapi penyimpanan lokal tidak tersedia. Coba browser lain.');
        } else {
            const jumlah = Array.isArray(dataLaporan) ? dataLaporan.length : 0;
            tampilkanStatusBackup('success', 'Pemulihan berhasil', `${jumlah} laporan berhasil dipulihkan dari ${file.name || 'file backup'}.`);
            showToast('✅ Data backup berhasil dipulihkan!');
        }
    } catch (err) {
        console.error('Gagal mengimpor backup:', err);
        const pesan = err && err.message ? err.message : 'periksa file dan ruang penyimpanan.';
        tampilkanStatusBackup('error', 'Pemulihan gagal', pesan);
        showToast(`❌ Pemulihan gagal: ${pesan}`);
    } finally {
        if (input) input.value = '';
    }
}

// ---------- Zona Bahaya: Hapus Semua ----------
function cekKonfirmasiHapus(inputEl) {
    const btn = document.getElementById('btnHapusSemuaData');
    if (inputEl.value.trim() === 'HAPUS') {
        btn.disabled = false;
        btn.classList.add('is-active', 'flat-btn-danger');
    } else {
        btn.disabled = true;
        btn.classList.remove('is-active', 'flat-btn-danger');
    }
}

async function hapusSemuaDataLaporan() {
    dataLaporan = [];
    await localforage.removeItem('laporanPKL');
    dataTelahBerubah = true;
    renderSemuaData();
    document.getElementById('inputKonfirmasiHapus').value = '';
    cekKonfirmasiHapus(document.getElementById('inputKonfirmasiHapus'));
    tutupSettings();
    showToast("Seluruh laporan berhasil dihapus! 🗑️");
}
