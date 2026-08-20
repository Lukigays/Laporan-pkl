// ============================================================
// PENOMORAN & PENGECEKAN HARI KERJA OTOMATIS
// ============================================================

function cekHariKerjaInput() {
    const elTanggal = document.getElementById('inputTanggal');
    const elPeringatan = document.getElementById('pesanHariKerja');
    if (!elTanggal || !elTanggal.value) return;

    const dateObj = new Date(elTanggal.value);
    const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        elPeringatan.classList.remove('hidden');
        elPeringatan.innerText = `⚠️ Tanggal ini adalah hari ${NAMA_HARI[dayOfWeek]} (Akhir Pekan).`;
    } else {
        elPeringatan.classList.add('hidden');
    }
}

function setTanggalHariKerjaBerikutnya() {
    let baseDate = new Date();
    if (dataLaporan.length > 0) {
        const lastItem = dataLaporan[dataLaporan.length - 1];
        const parts = lastItem.tanggal.split('/');
        baseDate = new Date(parts[2], parts[1] - 1, parts[0]);
        baseDate.setDate(baseDate.getDate() + 1);
    }

    // Melompati Sabtu (6) dan Minggu (0)
    while (baseDate.getDay() === 0 || baseDate.getDay() === 6) {
        baseDate.setDate(baseDate.getDate() + 1);
    }

    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');

    const inputTgl = document.getElementById('inputTanggal');
    if (inputTgl) {
        inputTgl.value = `${year}-${month}-${day}`;
        cekHariKerjaInput();
        showToast(`📅 Tanggal diset ke hari kerja: ${day}/${month}/${year}`);
    }
}
