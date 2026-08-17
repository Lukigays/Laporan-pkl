// ============================================================
// BACKUP & RESTORE (JSON) + HAPUS SEMUA DATA
// ============================================================

function eksporDataJSON() {
    showToast("⏳ Memproses file Backup...");
    const jsonString = JSON.stringify({ profil: dataProfil, laporan: dataLaporan }, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `Backup_Laporan_PKL_${dataProfil.nama || 'LUKYY'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast("Data berhasil diekspor! 📤");
}

async function imporDataJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed.laporan && Array.isArray(parsed.laporan)) {
                dataLaporan = parsed.laporan;
                await localforage.setItem('laporanPKL', dataLaporan);
            }
            if (parsed.profil) {
                dataProfil = { ...dataProfil, ...parsed.profil };
                await localforage.setItem('profilPKL', dataProfil);
                renderProfil();
                renderLogoPreview();
            }
            dataTelahBerubah = true;
            renderSemuaData();
            tutupSettings();
            showToast("Data berhasil dipulihkan! 🎉");
        } catch (err) {
            alert("Format file JSON tidak valid!");
        }
    };
    reader.readAsText(file);
}

// ---------- Zona Bahaya: Hapus Semua ----------
function cekKonfirmasiHapus(inputEl) {
    const btn = document.getElementById('btnHapusSemuaData');
    if (inputEl.value.trim() === 'HAPUS') {
        btn.disabled = false;
        btn.classList.remove('bg-white/5', 'text-slate-500', 'cursor-not-allowed');
        btn.classList.add('bg-red-600', 'hover:bg-red-700', 'text-white', 'cursor-pointer', 'shadow-md');
    } else {
        btn.disabled = true;
        btn.classList.add('bg-white/5', 'text-slate-500', 'cursor-not-allowed');
        btn.classList.remove('bg-red-600', 'hover:bg-red-700', 'text-white', 'cursor-pointer', 'shadow-md');
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
