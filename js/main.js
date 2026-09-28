// ============================================================
// INISIALISASI APLIKASI (Entry Point)
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

window.onload = async function() {
    try {
        const dataDariIndexedDB = await localforage.getItem('laporanPKL');
        if (dataDariIndexedDB !== null) dataLaporan = dataDariIndexedDB;
    } catch (err) { console.error(err); }

    try { await muatProfil(); } catch (err) { console.warn('muatProfil gagal:', err); }
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
};
