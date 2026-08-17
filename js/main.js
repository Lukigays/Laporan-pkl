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
    cekDanJalankanTour();
    setInterval(autoSyncKeCloud, 300000);
};
