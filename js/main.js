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

    await muatProfil();
    renderSemuaData();

    // Kalender mini pemilih tanggal (hijau = sudah diisi, merah = belum)
    if (typeof initKalender === 'function') initKalender();

    // Bersihkan data lama "libur tambahan" -> jadi penanda tanggal merah
    if (typeof migrasiKeTanggalMerah === 'function') await migrasiKeTanggalMerah();

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
