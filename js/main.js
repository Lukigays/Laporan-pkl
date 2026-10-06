// ============================================================
// INISIALISASI APLIKASI (Entry Point)
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

// Backup/restore menunggu promise ini agar klik terlalu cepat saat halaman baru
// dibuka tidak menghasilkan file kosong sebelum IndexedDB selesai dibaca.
window.appDataLoadStatus = { laporanLoaded: false, profilLoaded: false, complete: false };
let resolveAppDataReady;
window.appDataReady = new Promise(resolve => { resolveAppDataReady = resolve; });

window.addEventListener('load', async function() {
    const status = window.appDataLoadStatus;
    try {
        try {
            const dataDariIndexedDB = await localforage.getItem('laporanPKL');
            if (dataDariIndexedDB !== null) dataLaporan = dataDariIndexedDB;
            status.laporanLoaded = true;
        } catch (err) {
            console.error('Gagal memuat laporan dari database lokal:', err);
        }

        try {
            status.profilLoaded = await muatProfil();
        } catch (err) {
            status.profilLoaded = false;
            console.warn('muatProfil gagal:', err);
        }
        renderSemuaData();

        // Kalender mini pemilih tanggal (hijau = sudah diisi, merah = belum)
        if (typeof initKalender === 'function') initKalender();

        // Bersihkan sisa data penandaan manual lama (kalau ada) —
        // sekarang tanggal merah otomatis dari data libur nasional
        if (typeof bersihkanPenandaLama === 'function') await bersihkanPenandaLama();

        // Hari Minggu otomatis dicatat "Libur" (kalau hari ini Minggu & belum ada catatan)
        if (typeof pastikanLiburHariIni === 'function') await pastikanLiburHariIni();

        // Kalau opsi "isi otomatis libur sepanjang rentang" aktif, lengkapi tanggal libur yang belum tercatat
        if (dataProfil.autoLiburRentang && typeof isiLiburOtomatisRentang === 'function' && typeof rentangPKL === 'function' && rentangPKL()) {
            await isiLiburOtomatisRentang({ tanpaKonfirmasi: true, silent: true });
        }

        cekDanJalankanTour();
        setInterval(autoSyncKeCloud, 300000);
        // Cek berkala: kalau aplikasi dibiarkan terbuka sampai lewat tengah malam Minggu
        setInterval(() => { if (typeof pastikanLiburHariIni === 'function') pastikanLiburHariIni(); }, 300000);
    } catch (err) {
        console.error('Inisialisasi aplikasi gagal:', err);
    } finally {
        status.complete = true;
        resolveAppDataReady(status);
    }
});
