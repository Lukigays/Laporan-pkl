// ============================================================
// LAPORAN: CRUD, Render Tabel, Statistik, Filter
// ============================================================

// ---------- Navigasi Tab ----------
function switchTab(tabName) {
    const tabInput = document.getElementById('tabInput');
    const tabEdit = document.getElementById('tabEdit');
    const tabLaporan = document.getElementById('tabLaporan');
    const btnInput = document.getElementById('btnTabInput');
    const btnEdit = document.getElementById('btnTabEdit');
    const btnLaporan = document.getElementById('btnTabLaporan');
    [tabInput, tabEdit, tabLaporan].forEach(t => t.classList.remove('active'));
    [btnInput, btnEdit, btnLaporan].forEach(b => { b.classList.remove('active'); });
    if (tabName === 'input') {
        tabInput.classList.add('active');
        btnInput.classList.add('active');
    } else if (tabName === 'edit') {
        tabEdit.classList.add('active');
        btnEdit.classList.add('active');
        updateDropdownEditTab();
    } else {
        tabLaporan.classList.add('active');
        btnLaporan.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Tambah Laporan Baru ----------
async function tambahBaris() {
    const tanggalInput = document.getElementById('inputTanggal').value;
    const uraian = document.getElementById('inputUraian').value;
    const fotoInput = document.getElementById('inputFoto');
    if (!tanggalInput || !uraian) { showToast('⚠️ Isi Tanggal dan Uraian terlebih dahulu!'); return; }
    const dateObj = new Date(tanggalInput);
    const formatTgl = formatTanggalIndo(dateObj);
    const labelBulan = labelBulanIndo(dateObj);
    let fotoBase64 = '';
    if (fotoInput.files && fotoInput.files[0]) {
        showToast('⏳ Memproses foto HD...');
        try {
            // Resolusi HD 1500px & Kualitas Tinggi 0.9
            fotoBase64 = await bacaDanKompresFile(fotoInput.files[0], 1500, 0.9);
            await simpanDataBaru(NAMA_HARI[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
        } catch (err) {
            console.error('Error upload foto:', err);
            showToast('❌ Gagal memproses foto, coba gambar lain!');
        }
    } else {
        await simpanDataBaru(NAMA_HARI[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
    }
}

async function simpanDataBaru(hari, tanggal, uraian, foto, bulanLabel) {
    dataLaporan.push({ hari, tanggal, uraian, foto, bulanLabel });
    dataLaporan.sort((a, b) => parseInt(a.tanggal.split('/').reverse().join('')) - parseInt(b.tanggal.split('/').reverse().join('')));
    await localforage.setItem('laporanPKL', dataLaporan);
    dataTelahBerubah = true;
    renderSemuaData();
    document.getElementById('inputTanggal').value = '';
    document.getElementById('inputUraian').value = '';
    document.getElementById('inputFoto').value = '';
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    showToast('Laporan berhasil disimpan! 🎉');
    switchTab('laporan');
}

// ---------- Edit Laporan ----------
function updateDropdownEditTab() {
    const dropdown = document.getElementById('pilihEditDropdown');
    dropdown.innerHTML = '<option value="">-- Pilih Catatan Laporan --</option>';
    dataLaporan.forEach((item, idx) => {
        dropdown.innerHTML += `<option value="${idx}">${item.tanggal} (${item.hari}) - ${item.uraian.substring(0,30)}...</option>`;
    });
}

function pilihTanggalEditDropdown() {
    const idx = document.getElementById('pilihEditDropdown').value;
    const container = document.getElementById('formEditContainer');
    if (idx === "") { container.classList.add('hidden'); return; }
    const item = dataLaporan[idx];
    document.getElementById('editIndexHidden').value = idx;
    document.getElementById('editTanggal').value = item.tanggal.split('/').reverse().join('-');
    document.getElementById('editUraian').value = item.uraian;
    document.getElementById('editFoto').value = '';
    container.classList.remove('hidden');
}

async function simpanLaporanEdited() {
    const idx = document.getElementById('editIndexHidden').value;
    const tglInput = document.getElementById('editTanggal').value;
    const uraian = document.getElementById('editUraian').value;
    const fotoInput = document.getElementById('editFoto');
    if (!tglInput || !uraian) { showToast('⚠️ Isi Tanggal dan Uraian terlebih dahulu!'); return; }
    const dateObj = new Date(tglInput);
    const formatTgl = formatTanggalIndo(dateObj);
    const labelBulan = labelBulanIndo(dateObj);
    let fotoBase64 = dataLaporan[idx].foto;
    if (fotoInput.files && fotoInput.files[0]) {
        showToast('⏳ Memproses foto HD...');
        try {
            // Resolusi HD 1500px & Kualitas Tinggi 0.9
            fotoBase64 = await bacaDanKompresFile(fotoInput.files[0], 1500, 0.9);
            await finalizeEdit(idx, NAMA_HARI[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
        } catch (err) {
            console.error('Error ganti foto:', err);
            showToast('❌ Gagal memproses foto baru, coba gambar lain!');
        }
    } else {
        await finalizeEdit(idx, NAMA_HARI[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
    }
}

async function finalizeEdit(idx, hari, tanggal, uraian, foto, bulanLabel) {
    dataLaporan[idx] = { hari, tanggal, uraian, foto, bulanLabel };
    dataLaporan.sort((a, b) => parseInt(a.tanggal.split('/').reverse().join('')) - parseInt(b.tanggal.split('/').reverse().join('')));
    await localforage.setItem('laporanPKL', dataLaporan);
    dataTelahBerubah = true;
    renderSemuaData();
    switchTab('laporan');
    showToast('Laporan berhasil diperbarui! ✅');
}

async function hapusLaporanSelected() {
    const idx = document.getElementById('editIndexHidden').value;
    if (idx === '' || !dataLaporan[idx]) { showToast('⚠️ Pilih laporan yang ingin dihapus dulu.'); return; }
    const item = dataLaporan[idx];
    if (confirm(`Hapus permanen laporan tanggal ${item.tanggal}?`)) {
        // Kalau yang dihapus adalah catatan "Libur" otomatis hari Minggu,
        // simpan daftar penolakan supaya tidak dibuat ulang otomatis.
        const kunci = typeof kunciTanggalDariString === 'function' ? kunciTanggalDariString(item.tanggal) : '';
        const autoLibur = typeof laporanLibur === 'function' && laporanLibur(item);
        dataLaporan.splice(idx, 1);
        if (autoLibur && kunci) {
            try {
                const ditolak = (await localforage.getItem('liburDitolak')) || [];
                if (!ditolak.includes(kunci)) {
                    ditolak.push(kunci);
                    await localforage.setItem('liburDitolak', ditolak);
                }
            } catch (e) { }
        }
        await localforage.setItem('laporanPKL', dataLaporan);
        dataTelahBerubah = true;
        renderSemuaData();
        switchTab('laporan');
        showToast('Laporan berhasil dihapus! 🗑️');
    }
}

// ---------- Filter ----------
function resetFilterTanggal() {
    document.getElementById('filterTglMulai').value = '';
    document.getElementById('filterTglAkhir').value = '';
    renderSemuaData();
}

// ---------- Statistik ----------
function updateStatistik(dataAktif) {
    document.getElementById('statTotalHari').innerText = dataAktif.length;
    document.getElementById('statTotalUraian').innerText = dataAktif.length;
    document.getElementById('statTotalFoto').innerText = dataAktif.filter(i => i.foto && i.foto.trim() !== '').length;
    const unikBulan = [...new Set(dataAktif.map(i => i.bulanLabel))].length;
    document.getElementById('statRataBulan').innerText = unikBulan > 0 ? (dataAktif.length / unikBulan).toFixed(1) : 0;
}

// ---------- Render Tabel Laporan ----------
function renderSemuaData() {
    const wadahTabel = document.getElementById('wadahTabelBulan');
    wadahTabel.innerHTML = '';
    
    if (dataLaporan.length === 0) {
        wadahTabel.innerHTML = '<p class="text-center font-bold my-10 opacity-60">Belum ada data laporan.</p>';
        updateStatistik([]);
        if (typeof hitungDanRenderBadge === 'function') hitungDanRenderBadge();
        if (typeof refreshTanggalDanTarget === 'function') refreshTanggalDanTarget();
        return;
    }
    const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];
    const filter = document.getElementById('filterBulan');
    const nilaiFilterSblm = filter.value;
    filter.innerHTML = '<option value="SEMUA">Filter: Semua Bulan</option>';
    unikBulan.forEach(b => { filter.innerHTML += `<option value="${b}">${b}</option>`; });
    if ([...filter.options].some(o => o.value === nilaiFilterSblm)) filter.value = nilaiFilterSblm;
    const kataKunci = document.getElementById('inputPencarian').value.toLowerCase();
    const bulanDipilih = filter.value === 'SEMUA' ? unikBulan : [filter.value];
    const tglMulaiVal = document.getElementById('filterTglMulai').value;
    const tglAkhirVal = document.getElementById('filterTglAkhir').value;
    const angkaMulai = tglMulaiVal ? parseInt(tglMulaiVal.replace(/-/g, '')) : 0;
    const angkaAkhir = tglAkhirVal ? parseInt(tglAkhirVal.replace(/-/g, '')) : 99999999;
    let dataFiltered = dataLaporan.filter(i => {
        const matchBulan = bulanDipilih.includes(i.bulanLabel);
        const matchCari = i.uraian.toLowerCase().includes(kataKunci) || i.tanggal.includes(kataKunci);
        const parts = i.tanggal.split('/');
        const angkaTgl = parseInt(parts[2] + parts[1] + parts[0]);
        const matchRentang = angkaTgl >= angkaMulai && angkaTgl <= angkaAkhir;
        return matchBulan && matchCari && matchRentang;
    });
    updateStatistik(dataFiltered);
    if (dataFiltered.length === 0) {
        wadahTabel.innerHTML = '<p class="text-center font-bold my-10 opacity-60">Tidak ada data yang sesuai filter.</p>';
        if (typeof hitungDanRenderBadge === 'function') hitungDanRenderBadge();
        if (typeof refreshTanggalDanTarget === 'function') refreshTanggalDanTarget();
        return;
    }
    const unikBulanFiltered = [...new Set(dataFiltered.map(i => i.bulanLabel))];
    unikBulanFiltered.forEach((bulan, idxBulanTampil) => {
        const dataBulanIni = dataFiltered.filter(i => i.bulanLabel === bulan);
        if (dataBulanIni.length === 0) return;

        // Baris periode (bulan dari apa sampai bulan apa) di blok bulan pertama
        const barisPeriode = (idxBulanTampil === 0 && typeof labelPeriodeBulan === 'function' && labelPeriodeBulan())
            ? `<p style="font-size: 12px; font-style: italic;">Periode PKL: Bulan ${labelPeriodeBulan()}${typeof labelPeriodeTanggal === 'function' && labelPeriodeTanggal() ? ' (' + labelPeriodeTanggal() + ')' : ''}</p>`
            : '';

        let htmlTabel = `
            <div class="block-bulan" style="width: 100%;">
                <div class="mb-3 text-base font-bold text-black pt-2">
                    <p>1. Laporan Kegiatan Harian</p><p>b. Bulan <span class="uppercase">${bulan}</span></p>
                    ${barisPeriode}
                </div>
                <div class="table-wrapper" style="width: 100%;">
                    <table class="w-full text-black" style="color: black !important; border-collapse: collapse; width: 100%; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid black; padding: 6px; width: 40px; text-align: center;">No</th>
                                <th style="border: 1px solid black; padding: 6px; width: 80px;">Hari</th>
                                <th style="border: 1px solid black; padding: 6px; width: 90px;">Tanggal</th>
                                <th style="border: 1px solid black; padding: 6px; width: auto;">Uraian Kegiatan</th>
                                <th style="border: 1px solid black; padding: 6px; width: 100px; text-align: center;">Foto</th>
                            </tr>
                        </thead>
                        <tbody>`;
        dataBulanIni.forEach((item, idx) => {
            const idxTampil = idx + 1;
            const namaFileFoto = `PKL_${item.tanggal.replace(/\//g,'-')}_${idxTampil}.jpg`;
            
            // LINK DOWNLOAD FOTO
            const fotoHtml = item.foto 
                ? `<div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
                     <img src="${item.foto}" style="max-height: 65px; max-width: 75px; object-fit: contain; display: block;" class="border border-gray-300">
                     <a href="${item.foto}" download="${namaFileFoto}" 
                        style="font-size: 9px; color: #7c3aed; text-decoration: none; font-weight: bold; 
                               background: #f3e8ff; padding: 2px 6px; border-radius: 4px; display: inline-block; white-space: nowrap;">
                        ⬇️ Unduh
                     </a>
                   </div>`
                : '-';
            
            htmlTabel += `
                            <tr>
                                <td style="border: 1px solid black; padding: 5px; text-align: center; width: 40px;">${idxTampil}</td>
                                <td style="border: 1px solid black; padding: 5px; width: 80px;">${item.hari}</td>
                                <td style="border: 1px solid black; padding: 5px; width: 90px;">${item.tanggal}</td>
                                <td style="border: 1px solid black; padding: 5px; width: auto;">${item.uraian}</td>
                                <td style="border: 1px solid black; padding: 5px; text-align: center; width: 100px;">
                                    ${fotoHtml}
                                </td>
                            </tr>`;
        });
        htmlTabel += `
                        </tbody>
                    </table>
                </div>
            </div>`;
        wadahTabel.innerHTML += htmlTabel;
    });

    if (typeof hitungDanRenderBadge === 'function') {
        hitungDanRenderBadge();
    }
    if (typeof refreshTanggalDanTarget === 'function') {
        refreshTanggalDanTarget();
    } else if (typeof renderKalender === 'function') {
        renderKalender();
    }
}
