// ============================================================
// LAPORAN: CRUD, Select All / Multi-Select, Bulk Hapus,
// Render Tabel, Statistik, & Filter
// ============================================================

// ---------- State Seleksi Laporan ----------
let selectedLaporanIndices = new Set();
let pendingDeleteAction = null; // { mode: 'selected' | 'single' | 'all', indices: [] }

// ---------- Navigasi Tab ----------
function switchTab(tabName) {
    const tabInput = document.getElementById('tabInput');
    const tabEdit = document.getElementById('tabEdit');
    const tabLaporan = document.getElementById('tabLaporan');
    const btnInput = document.getElementById('btnTabInput');
    const btnEdit = document.getElementById('btnTabEdit');
    const btnLaporan = document.getElementById('btnTabLaporan');
    [tabInput, tabEdit, tabLaporan].forEach(t => { if (t) t.classList.remove('active'); });
    [btnInput, btnEdit, btnLaporan].forEach(b => { if (b) b.classList.remove('active'); });
    if (tabName === 'input') {
        if (tabInput) tabInput.classList.add('active');
        if (btnInput) btnInput.classList.add('active');
    } else if (tabName === 'edit') {
        if (tabEdit) tabEdit.classList.add('active');
        if (btnEdit) btnEdit.classList.add('active');
        updateDropdownEditTab();
        updateBulkActionUI();
    } else {
        if (tabLaporan) tabLaporan.classList.add('active');
        if (btnLaporan) btnLaporan.classList.add('active');
        updateBulkActionUI();
    }
    if (typeof window.syncNavMobile === 'function') window.syncNavMobile(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Helper Form Input ----------
function isiCepatUraian(teks) {
    const el = document.getElementById('inputUraian');
    if (!el) return;
    el.value = teks;
    el.focus();
    showToast('✨ Template uraian diterapkan!');
}

function resetFormInput() {
    const tgl = document.getElementById('inputTanggal');
    const uraian = document.getElementById('inputUraian');
    const foto = document.getElementById('inputFoto');
    const info = document.getElementById('infoTanggalInput');
    if (tgl) tgl.value = '';
    if (uraian) uraian.value = '';
    if (foto) foto.value = '';
    if (info) info.classList.add('hidden');
    if (typeof renderKalender === 'function') renderKalender();
    showToast('🔄 Formulir dibersihkan.');
}

// ---------- Tambah Laporan Baru ----------
async function tambahBaris() {
    const tanggalInput = document.getElementById('inputTanggal').value;
    const uraian = document.getElementById('inputUraian').value;
    const fotoInput = document.getElementById('inputFoto');
    if (!tanggalInput || !uraian.trim()) {
        showToast('⚠️ Isi Tanggal dan Uraian terlebih dahulu!');
        return;
    }
    const dateObj = new Date(tanggalInput);
    const formatTgl = formatTanggalIndo(dateObj);
    const labelBulan = labelBulanIndo(dateObj);
    let fotoBase64 = '';
    if (fotoInput.files && fotoInput.files[0]) {
        showToast('⏳ Memproses foto HD...');
        try {
            fotoBase64 = await bacaDanKompresFile(fotoInput.files[0], 1500, 0.9);
            await simpanDataBaru(NAMA_HARI[dateObj.getDay()], formatTgl, uraian.trim(), fotoBase64, labelBulan);
        } catch (err) {
            console.error('Error upload foto:', err);
            showToast('❌ Gagal memproses foto, coba gambar lain!');
        }
    } else {
        await simpanDataBaru(NAMA_HARI[dateObj.getDay()], formatTgl, uraian.trim(), fotoBase64, labelBulan);
    }
}

async function simpanDataBaru(hari, tanggal, uraian, foto, bulanLabel) {
    dataLaporan.push({ hari, tanggal, uraian, foto, bulanLabel });
    dataLaporan.sort((a, b) => parseInt(a.tanggal.split('/').reverse().join('')) - parseInt(b.tanggal.split('/').reverse().join('')));
    selectedLaporanIndices.clear();
    await localforage.setItem('laporanPKL', dataLaporan);
    dataTelahBerubah = true;
    renderSemuaData();
    document.getElementById('inputTanggal').value = '';
    document.getElementById('inputUraian').value = '';
    document.getElementById('inputFoto').value = '';
    const info = document.getElementById('infoTanggalInput');
    if (info) info.classList.add('hidden');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    showToast('Laporan berhasil disimpan! 🎉');
    switchTab('laporan');
}

// ---------- Edit Laporan & Daftar Kelola di Tab Edit ----------
function updateDropdownEditTab() {
    bersihkanSeleksiTidakValid();
    const dropdown = document.getElementById('pilihEditDropdown');
    if (dropdown) {
        const prevVal = dropdown.value;
        dropdown.innerHTML = '<option value="">-- Pilih Catatan Laporan --</option>';
        dataLaporan.forEach((item, idx) => {
            const cuplikan = (item.uraian || '').substring(0, 42);
            dropdown.innerHTML += `<option value="${idx}">${item.tanggal} (${item.hari}) — ${escapeHtml(cuplikan)}${(item.uraian || '').length > 42 ? '...' : ''}</option>`;
        });
        if (prevVal !== '' && dataLaporan[Number(prevVal)]) {
            dropdown.value = prevVal;
        }
    }
    renderDaftarKelolaEdit();
}

function renderDaftarKelolaEdit() {
    const wadah = document.getElementById('daftarKelolaEdit');
    if (!wadah) return;

    if (!Array.isArray(dataLaporan) || dataLaporan.length === 0) {
        wadah.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-sm font-semibold" style="color:var(--muted);">Belum ada catatan laporan tersimpan.</p>
                <button type="button" onclick="switchTab('input')" class="flat-btn flat-btn-primary flat-btn-sm mt-3">➕ Buat Catatan Pertama</button>
            </div>`;
        return;
    }

    const editIdxAktif = document.getElementById('editIndexHidden') ? document.getElementById('editIndexHidden').value : '';

    wadah.innerHTML = dataLaporan.map((item, idx) => {
        const terpilih = selectedLaporanIndices.has(idx);
        const sedangDiedit = String(idx) === String(editIdxAktif) && !document.getElementById('formEditContainer')?.classList.contains('hidden');
        const adaFoto = !!(item.foto && item.foto.trim() !== '');
        const teksUraian = escapeHtml(item.uraian || '-');

        return `
            <div class="edit-list-item ${terpilih ? 'is-selected' : ''} ${sedangDiedit ? 'is-editing' : ''}" data-row-edit-idx="${idx}">
                <label class="flex items-center cursor-pointer p-1" title="Pilih laporan tanggal ${escapeHtml(item.tanggal)}">
                    <input type="checkbox" class="custom-checkbox chk-item-laporan" data-laporan-idx="${idx}"
                        ${terpilih ? 'checked' : ''}
                        onchange="toggleSelectLaporan(${idx}, this.checked)">
                </label>
                <div class="flex-1 min-w-0 cursor-pointer" onclick="bukaEditPadaIndex(${idx})">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="item-no-badge">#${idx + 1}</span>
                        <span class="font-bold text-xs" style="color:var(--ink);">${escapeHtml(item.tanggal)}</span>
                        <span class="item-day-badge">${escapeHtml(item.hari)}</span>
                        ${adaFoto ? '<span class="item-photo-badge">📷 Foto</span>' : ''}
                    </div>
                    <p class="text-xs truncate" style="color:var(--ink-soft);">${teksUraian}</p>
                </div>
                <div class="flex items-center gap-1.5 flex-none">
                    <button type="button" onclick="bukaEditPadaIndex(${idx})" class="table-action-btn edit" title="Edit laporan ini">
                        <span>✏️</span> <span class="hidden sm:inline">Edit</span>
                    </button>
                    <button type="button" onclick="hapusSatuLaporanDariTabel(${idx})" class="table-action-btn delete" title="Hapus laporan ini">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>`;
    }).join('');
}

function bukaEditPadaIndex(idx) {
    if (typeof idx !== 'number' || idx < 0 || !dataLaporan[idx]) return;
    const dropdown = document.getElementById('pilihEditDropdown');
    if (dropdown) {
        dropdown.value = String(idx);
        pilihTanggalEditDropdown();
    }
    const form = document.getElementById('formEditContainer');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function batalEditLaporan() {
    const dropdown = document.getElementById('pilihEditDropdown');
    const container = document.getElementById('formEditContainer');
    const hidden = document.getElementById('editIndexHidden');
    if (dropdown) dropdown.value = '';
    if (hidden) hidden.value = '';
    if (container) container.classList.add('hidden');
    renderDaftarKelolaEdit();
}

// ---------- Tombol Edit di samping foto (tabel laporan) ----------
function cariIndexAsliLaporan(item) {
    if (!item) return -1;
    let idx = dataLaporan.indexOf(item);
    if (idx !== -1) return idx;
    return dataLaporan.findIndex(d => d.tanggal === item.tanggal && d.uraian === item.uraian && d.foto === item.foto);
}

function editLaporanDariTabel(idx) {
    if (typeof idx !== 'number' || idx < 0 || !dataLaporan[idx]) {
        showToast('⚠️ Laporan tidak ditemukan, coba muat ulang halaman.');
        return;
    }
    switchTab('edit');
    const dropdown = document.getElementById('pilihEditDropdown');
    if (!dropdown) return;
    dropdown.value = String(idx);
    pilihTanggalEditDropdown();
    showToast(`✏️ Mengedit laporan tanggal ${dataLaporan[idx].tanggal}`);
    setTimeout(() => {
        const form = document.getElementById('formEditContainer');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
}

function pilihTanggalEditDropdown() {
    const dropdown = document.getElementById('pilihEditDropdown');
    const idx = dropdown ? dropdown.value : '';
    const container = document.getElementById('formEditContainer');
    if (!container) return;
    if (idx === '' || !dataLaporan[idx]) {
        container.classList.add('hidden');
        renderDaftarKelolaEdit();
        return;
    }
    const item = dataLaporan[idx];
    document.getElementById('editIndexHidden').value = idx;
    document.getElementById('editTanggal').value = item.tanggal.split('/').reverse().join('-');
    document.getElementById('editUraian').value = item.uraian;
    document.getElementById('editFoto').value = '';
    const judulEl = document.getElementById('judulFormEditAktif');
    if (judulEl) judulEl.textContent = `Edit Laporan: ${item.hari}, ${item.tanggal}`;
    container.classList.remove('hidden');
    if (typeof cekHariKerjaInput === 'function') cekHariKerjaInput('editTanggal', 'infoTanggalEdit');
    renderDaftarKelolaEdit();
}

async function simpanLaporanEdited() {
    const idx = document.getElementById('editIndexHidden').value;
    const tglInput = document.getElementById('editTanggal').value;
    const uraian = document.getElementById('editUraian').value;
    const fotoInput = document.getElementById('editFoto');
    if (idx === '' || !dataLaporan[idx]) {
        showToast('⚠️ Pilih laporan terlebih dahulu!');
        return;
    }
    if (!tglInput || !uraian.trim()) {
        showToast('⚠️ Isi Tanggal dan Uraian terlebih dahulu!');
        return;
    }
    const dateObj = new Date(tglInput);
    const formatTgl = formatTanggalIndo(dateObj);
    const labelBulan = labelBulanIndo(dateObj);
    let fotoBase64 = dataLaporan[idx].foto;
    if (fotoInput.files && fotoInput.files[0]) {
        showToast('⏳ Memproses foto HD...');
        try {
            fotoBase64 = await bacaDanKompresFile(fotoInput.files[0], 1500, 0.9);
            await finalizeEdit(idx, NAMA_HARI[dateObj.getDay()], formatTgl, uraian.trim(), fotoBase64, labelBulan);
        } catch (err) {
            console.error('Error ganti foto:', err);
            showToast('❌ Gagal memproses foto baru, coba gambar lain!');
        }
    } else {
        await finalizeEdit(idx, NAMA_HARI[dateObj.getDay()], formatTgl, uraian.trim(), fotoBase64, labelBulan);
    }
}

async function finalizeEdit(idx, hari, tanggal, uraian, foto, bulanLabel) {
    dataLaporan[idx] = { hari, tanggal, uraian, foto, bulanLabel };
    dataLaporan.sort((a, b) => parseInt(a.tanggal.split('/').reverse().join('')) - parseInt(b.tanggal.split('/').reverse().join('')));
    selectedLaporanIndices.clear();
    await localforage.setItem('laporanPKL', dataLaporan);
    dataTelahBerubah = true;
    batalEditLaporan();
    renderSemuaData();
    switchTab('laporan');
    showToast('Laporan berhasil diperbarui! ✅');
}

// ============================================================
// FITUR SELECT ALL, PILIH LAPORAN, & HAPUS BANYAK / SEMUA
// ============================================================

function bersihkanSeleksiTidakValid() {
    const valid = new Set();
    selectedLaporanIndices.forEach(idx => {
        if (typeof idx === 'number' && idx >= 0 && idx < dataLaporan.length) {
            valid.add(idx);
        }
    });
    selectedLaporanIndices = valid;
}

function dapatkanDataFiltered() {
    if (!Array.isArray(dataLaporan) || dataLaporan.length === 0) return [];
    const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];
    const filterEl = document.getElementById('filterBulan');
    const filterVal = (filterEl && filterEl.value) ? filterEl.value : 'SEMUA';
    const kataKunciEl = document.getElementById('inputPencarian');
    const kataKunci = (kataKunciEl && kataKunciEl.value) ? kataKunciEl.value.toLowerCase() : '';
    const bulanDipilih = (filterVal === 'SEMUA' || !unikBulan.includes(filterVal)) ? unikBulan : [filterVal];

    const tglMulaiVal = document.getElementById('filterTglMulai')?.value || '';
    const tglAkhirVal = document.getElementById('filterTglAkhir')?.value || '';
    const angkaMulai = tglMulaiVal ? parseInt(tglMulaiVal.replace(/-/g, ''), 10) : 0;
    const angkaAkhir = tglAkhirVal ? parseInt(tglAkhirVal.replace(/-/g, ''), 10) : 99999999;

    const hasil = [];
    dataLaporan.forEach((item, idxAsli) => {
        const matchBulan = bulanDipilih.includes(item.bulanLabel);
        const matchCari = (item.uraian || '').toLowerCase().includes(kataKunci) || (item.tanggal || '').includes(kataKunci);
        const parts = (item.tanggal || '').split('/');
        const angkaTgl = parts.length === 3 ? parseInt(parts[2] + parts[1] + parts[0], 10) : 0;
        const matchRentang = angkaTgl >= angkaMulai && angkaTgl <= angkaAkhir;
        if (matchBulan && matchCari && matchRentang) {
            hasil.push({ item, idxAsli });
        }
    });
    return hasil;
}

function toggleSelectLaporan(idx, checked) {
    const numIdx = Number(idx);
    if (isNaN(numIdx) || numIdx < 0 || numIdx >= dataLaporan.length) return;

    const akanDipilih = typeof checked === 'boolean' ? checked : !selectedLaporanIndices.has(numIdx);
    if (akanDipilih) {
        selectedLaporanIndices.add(numIdx);
    } else {
        selectedLaporanIndices.delete(numIdx);
    }
    sinkronkanDomSeleksi();
    updateBulkActionUI();
}

function toggleSelectBulan(bulan, checked) {
    const dataAktif = dapatkanDataFiltered().filter(d => d.item.bulanLabel === bulan);
    if (dataAktif.length === 0) return;

    const semuaTerpilih = dataAktif.every(d => selectedLaporanIndices.has(d.idxAsli));
    const akanDipilih = typeof checked === 'boolean' ? checked : !semuaTerpilih;

    dataAktif.forEach(({ idxAsli }) => {
        if (akanDipilih) selectedLaporanIndices.add(idxAsli);
        else selectedLaporanIndices.delete(idxAsli);
    });

    sinkronkanDomSeleksi();
    updateBulkActionUI();
}

function toggleSelectAllLaporan(checked) {
    if (dataLaporan.length === 0) {
        showToast('ℹ️ Belum ada laporan untuk dipilih.');
        return;
    }

    const tabEditAktif = document.getElementById('tabEdit')?.classList.contains('active');
    const targetIndices = tabEditAktif
        ? dataLaporan.map((_, idx) => idx)
        : dapatkanDataFiltered().map(d => d.idxAsli);

    if (targetIndices.length === 0) {
        showToast('ℹ️ Tidak ada laporan yang cocok dengan filter saat ini.');
        return;
    }

    const semuaTargetTerpilih = targetIndices.every(idx => selectedLaporanIndices.has(idx));
    const akanDipilih = typeof checked === 'boolean' ? checked : !semuaTargetTerpilih;

    targetIndices.forEach(idx => {
        if (akanDipilih) selectedLaporanIndices.add(idx);
        else selectedLaporanIndices.delete(idx);
    });

    sinkronkanDomSeleksi();
    updateBulkActionUI();
    showToast(akanDipilih
        ? `☑️ ${selectedLaporanIndices.size} laporan dipilih.`
        : '✖️ Pilihan laporan dibatalkan.');
}

function pilihSemuaLaporanGlobal() {
    if (dataLaporan.length === 0) {
        showToast('ℹ️ Belum ada data laporan.');
        return;
    }
    dataLaporan.forEach((_, idx) => selectedLaporanIndices.add(idx));
    sinkronkanDomSeleksi();
    updateBulkActionUI();
    showToast(`☑️ Seluruh laporan (${dataLaporan.length}) dipilih.`);
}

function batalPilihSemuaLaporan() {
    selectedLaporanIndices.clear();
    sinkronkanDomSeleksi();
    updateBulkActionUI();
}

function sinkronkanDomSeleksi() {
    // Sinkronkan setiap checkbox item di tabel laporan & daftar edit
    document.querySelectorAll('.chk-item-laporan').forEach(chk => {
        const idx = Number(chk.getAttribute('data-laporan-idx'));
        chk.checked = selectedLaporanIndices.has(idx);
    });

    // Highlight baris pada tabel laporan
    document.querySelectorAll('tr[data-row-laporan-idx]').forEach(tr => {
        const idx = Number(tr.getAttribute('data-row-laporan-idx'));
        tr.classList.toggle('row-selected', selectedLaporanIndices.has(idx));
    });

    // Highlight baris pada daftar kelola tab edit
    document.querySelectorAll('div[data-row-edit-idx]').forEach(row => {
        const idx = Number(row.getAttribute('data-row-edit-idx'));
        row.classList.toggle('is-selected', selectedLaporanIndices.has(idx));
    });
}

function updateBulkActionUI() {
    bersihkanSeleksiTidakValid();
    const totalTerpilih = selectedLaporanIndices.size;
    const dataFiltered = dapatkanDataFiltered();
    const indicesFiltered = dataFiltered.map(d => d.idxAsli);

    // Badge total laporan di navigasi
    const navBadge = document.getElementById('navBadgeTotalLaporan');
    if (navBadge) navBadge.textContent = String(dataLaporan.length);

    // Master checkbox di Tab Laporan
    const chkAllLaporan = document.getElementById('chkSelectAllLaporan');
    if (chkAllLaporan) {
        const jmlFilteredTerpilih = indicesFiltered.filter(idx => selectedLaporanIndices.has(idx)).length;
        chkAllLaporan.disabled = indicesFiltered.length === 0;
        chkAllLaporan.checked = indicesFiltered.length > 0 && jmlFilteredTerpilih === indicesFiltered.length;
        chkAllLaporan.indeterminate = jmlFilteredTerpilih > 0 && jmlFilteredTerpilih < indicesFiltered.length;
    }

    // Master checkbox di Tab Edit
    const chkAllEdit = document.getElementById('chkSelectAllEdit');
    if (chkAllEdit) {
        chkAllEdit.disabled = dataLaporan.length === 0;
        chkAllEdit.checked = dataLaporan.length > 0 && totalTerpilih === dataLaporan.length;
        chkAllEdit.indeterminate = totalTerpilih > 0 && totalTerpilih < dataLaporan.length;
    }

    // Checkbox per bulan di header tabel
    document.querySelectorAll('.chk-select-bulan').forEach(chk => {
        const bulan = chk.getAttribute('data-bulan');
        const itemBulan = dataFiltered.filter(d => d.item.bulanLabel === bulan);
        const terpilihBulan = itemBulan.filter(d => selectedLaporanIndices.has(d.idxAsli)).length;
        chk.checked = itemBulan.length > 0 && terpilihBulan === itemBulan.length;
        chk.indeterminate = terpilihBulan > 0 && terpilihBulan < itemBulan.length;
    });

    // Counter & Tombol di Tab Laporan
    const badgeLaporan = document.getElementById('badgeJumlahTerpilih');
    if (badgeLaporan) {
        badgeLaporan.textContent = `${totalTerpilih} dari ${dataLaporan.length} dipilih`;
        badgeLaporan.classList.toggle('has-selection', totalTerpilih > 0);
    }

    const btnHapusTerpilih = document.getElementById('btnHapusTerpilih');
    const teksBtnHapusTerpilih = document.getElementById('teksBtnHapusTerpilih');
    if (btnHapusTerpilih) {
        btnHapusTerpilih.disabled = totalTerpilih === 0;
        btnHapusTerpilih.classList.toggle('flat-btn-danger-solid', totalTerpilih > 0);
        btnHapusTerpilih.classList.toggle('flat-btn-danger', totalTerpilih === 0);
    }
    if (teksBtnHapusTerpilih) {
        teksBtnHapusTerpilih.textContent = `Hapus Terpilih (${totalTerpilih})`;
    }

    const btnBatalPilih = document.getElementById('btnBatalPilih');
    if (btnBatalPilih) btnBatalPilih.classList.toggle('hidden', totalTerpilih === 0);

    const btnToggleText = document.getElementById('btnToggleSelectAllText');
    if (btnToggleText) {
        const semuaFilteredTerpilih = indicesFiltered.length > 0 && indicesFiltered.every(idx => selectedLaporanIndices.has(idx));
        btnToggleText.innerHTML = semuaFilteredTerpilih
            ? '<span>✖️</span> <span>Batal Pilih Semua</span>'
            : '<span>☑️</span> <span>Pilih Semua</span>';
    }

    // Counter & Tombol di Tab Edit
    const badgeEdit = document.getElementById('badgeJumlahTerpilihEdit');
    if (badgeEdit) {
        badgeEdit.textContent = `${totalTerpilih} dari ${dataLaporan.length} dipilih`;
        badgeEdit.classList.toggle('has-selection', totalTerpilih > 0);
    }

    const btnHapusEdit = document.getElementById('btnHapusTerpilihEdit');
    const teksBtnHapusEdit = document.getElementById('teksBtnHapusTerpilihEdit');
    if (btnHapusEdit) {
        btnHapusEdit.disabled = totalTerpilih === 0;
        btnHapusEdit.classList.toggle('flat-btn-danger-solid', totalTerpilih > 0);
        btnHapusEdit.classList.toggle('flat-btn-danger', totalTerpilih === 0);
    }
    if (teksBtnHapusEdit) {
        teksBtnHapusEdit.textContent = `Hapus Terpilih (${totalTerpilih})`;
    }

    const btnBatalEdit = document.getElementById('btnBatalPilihEdit');
    if (btnBatalEdit) btnBatalEdit.classList.toggle('hidden', totalTerpilih === 0);

    // Floating Bulk Bar (muncul otomatis saat ada laporan yang dicentang)
    const floatingBar = document.getElementById('floatingBulkBar');
    const floatingCount = document.getElementById('floatingCountTerpilih');
    const floatingBtnCount = document.getElementById('floatingBtnCount');
    if (floatingCount) floatingCount.textContent = String(totalTerpilih);
    if (floatingBtnCount) floatingBtnCount.textContent = String(totalTerpilih);
    if (floatingBar) {
        floatingBar.classList.toggle('hidden', totalTerpilih === 0);
    }
}

// ---------- Modal Konfirmasi & Eksekusi Hapus ----------
function bukaModalKonfirmasiHapus(mode, indices, judul, pesan) {
    if (!Array.isArray(indices) || indices.length === 0) {
        showToast('⚠️ Tidak ada laporan yang dipilih untuk dihapus.');
        return;
    }

    pendingDeleteAction = { mode, indices: [...new Set(indices)].sort((a, b) => a - b) };

    const modal = document.getElementById('modalKonfirmasiHapus');
    const judulEl = document.getElementById('judulKonfirmasiHapus');
    const pesanEl = document.getElementById('pesanKonfirmasiHapus');
    const previewEl = document.getElementById('daftarPreviewHapus');
    const btnEksekusi = document.getElementById('btnEksekusiHapusModal');

    if (judulEl) judulEl.textContent = judul || 'Konfirmasi Hapus Laporan';
    if (pesanEl) pesanEl.textContent = pesan || `Apakah Anda yakin ingin menghapus ${pendingDeleteAction.indices.length} laporan ini?`;
    if (btnEksekusi) btnEksekusi.innerHTML = `🗑️ Ya, Hapus (${pendingDeleteAction.indices.length})`;

    if (previewEl) {
        const maksPreview = 25;
        const daftar = pendingDeleteAction.indices.slice(0, maksPreview).map(i => dataLaporan[i]).filter(Boolean);
        let htmlPreview = daftar.map(item => `
            <div class="flex items-center justify-between gap-2 text-xs py-1.5 px-2.5 rounded-xl bg-white border border-slate-100">
                <div class="truncate">
                    <b style="color:var(--ink);">${escapeHtml(item.tanggal)}</b>
                    <span style="color:var(--muted);">(${escapeHtml(item.hari)})</span>
                    — <span style="color:var(--ink-soft);">${escapeHtml((item.uraian || '').substring(0, 48))}</span>
                </div>
            </div>`).join('');
        if (pendingDeleteAction.indices.length > maksPreview) {
            htmlPreview += `<p class="text-[11px] text-center pt-1 font-semibold" style="color:var(--muted);">+ ${pendingDeleteAction.indices.length - maksPreview} laporan lainnya...</p>`;
        }
        previewEl.innerHTML = htmlPreview;
    }

    if (modal) {
        if (typeof tutupSemuaModal === 'function') tutupSemuaModal('modalKonfirmasiHapus');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    }
}

function tutupModalKonfirmasiHapus() {
    const modal = document.getElementById('modalKonfirmasiHapus');
    pendingDeleteAction = null;
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 220);
}

async function eksekusiKonfirmasiHapus() {
    if (!pendingDeleteAction || !Array.isArray(pendingDeleteAction.indices) || pendingDeleteAction.indices.length === 0) {
        tutupModalKonfirmasiHapus();
        return;
    }

    const setHapus = new Set(pendingDeleteAction.indices);
    const jumlahDihapus = setHapus.size;

    // Catat penolakan untuk entri "Libur" otomatis hari Minggu yang sengaja dihapus
    try {
        const ditolak = (await localforage.getItem('liburDitolak')) || [];
        let adaTambahanDitolak = false;
        setHapus.forEach(idx => {
            const item = dataLaporan[idx];
            if (!item) return;
            const kunci = typeof kunciTanggalDariString === 'function' ? kunciTanggalDariString(item.tanggal) : '';
            const autoLibur = typeof laporanLibur === 'function' && laporanLibur(item);
            if (autoLibur && kunci && !ditolak.includes(kunci)) {
                ditolak.push(kunci);
                adaTambahanDitolak = true;
            }
        });
        if (adaTambahanDitolak) {
            await localforage.setItem('liburDitolak', ditolak);
        }
    } catch (e) {
        console.warn('Gagal memperbarui liburDitolak:', e);
    }

    dataLaporan = dataLaporan.filter((_, idx) => !setHapus.has(idx));
    selectedLaporanIndices.clear();

    try {
        if (dataLaporan.length > 0) {
            await localforage.setItem('laporanPKL', dataLaporan);
        } else {
            await localforage.removeItem('laporanPKL');
        }
    } catch (e) {
        console.error('Gagal menyimpan perubahan hapus ke database lokal:', e);
    }

    dataTelahBerubah = true;
    tutupModalKonfirmasiHapus();
    batalEditLaporan();
    renderSemuaData();
    updateDropdownEditTab();
    showToast(`🗑️ ${jumlahDihapus} laporan berhasil dihapus!`);
}

// Dipanggil dari tombol "Hapus Terpilih"
function hapusLaporanTerpilih() {
    bersihkanSeleksiTidakValid();
    if (selectedLaporanIndices.size === 0) {
        showToast('⚠️ Centang minimal 1 laporan yang ingin dihapus!');
        return;
    }
    const indices = Array.from(selectedLaporanIndices);
    bukaModalKonfirmasiHapus(
        'selected',
        indices,
        `Hapus ${indices.length} Laporan Terpilih`,
        `Anda memilih ${indices.length} catatan laporan untuk dihapus permanen dari daftar.`
    );
}

// Dipanggil dari tombol "Hapus" pada 1 baris tabel atau daftar edit
function hapusSatuLaporanDariTabel(idx) {
    const numIdx = Number(idx);
    if (isNaN(numIdx) || !dataLaporan[numIdx]) {
        showToast('⚠️ Laporan tidak ditemukan.');
        return;
    }
    const item = dataLaporan[numIdx];
    bukaModalKonfirmasiHapus(
        'single',
        [numIdx],
        `Hapus Laporan ${item.tanggal}`,
        `Hapus permanen catatan kegiatan hari ${item.hari}, tanggal ${item.tanggal}?`
    );
}

// Dipanggil dari tombol "Hapus Laporan Ini" di dalam form edit
async function hapusLaporanSelected() {
    const idx = document.getElementById('editIndexHidden').value;
    if (idx === '' || !dataLaporan[idx]) {
        showToast('⚠️ Pilih laporan yang ingin dihapus dulu.');
        return;
    }
    hapusSatuLaporanDariTabel(Number(idx));
}

// Dipanggil dari tombol "Hapus Semua" cepat di toolbar
function bukaKonfirmasiHapusSemuaCepat() {
    if (!Array.isArray(dataLaporan) || dataLaporan.length === 0) {
        showToast('ℹ️ Belum ada data laporan untuk dihapus.');
        return;
    }
    const semuaIndices = dataLaporan.map((_, idx) => idx);
    bukaModalKonfirmasiHapus(
        'all',
        semuaIndices,
        `Hapus Seluruh Laporan (${semuaIndices.length} Data)`,
        `Apakah Anda yakin ingin menghapus SEMUA (${semuaIndices.length}) catatan laporan PKL sekaligus?`
    );
}

// ---------- Filter ----------
function resetFilterTanggal() {
    const mulai = document.getElementById('filterTglMulai');
    const akhir = document.getElementById('filterTglAkhir');
    const cari = document.getElementById('inputPencarian');
    const bulan = document.getElementById('filterBulan');
    if (mulai) mulai.value = '';
    if (akhir) akhir.value = '';
    if (cari) cari.value = '';
    if (bulan) bulan.value = 'SEMUA';
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
    bersihkanSeleksiTidakValid();
    const wadahTabel = document.getElementById('wadahTabelBulan');
    if (!wadahTabel) return;
    wadahTabel.innerHTML = '';

    if (dataLaporan.length === 0) {
        wadahTabel.innerHTML = `
            <div class="no-print text-center my-12 p-8 rounded-2xl" style="background:#F8FAFC;border:1px dashed var(--line);">
                <p class="text-base font-bold mb-1" style="color:var(--ink);">Belum ada data laporan PKL</p>
                <p class="text-xs mb-4" style="color:var(--muted);">Mulai catat kegiatan harian PKL Anda untuk melihat tabel laporan.</p>
                <button type="button" onclick="switchTab('input')" class="flat-btn flat-btn-primary flat-btn-sm">📝 Tambah Catatan Pertama</button>
            </div>`;
        updateStatistik([]);
        updateBulkActionUI();
        if (typeof hitungDanRenderBadge === 'function') hitungDanRenderBadge();
        if (typeof refreshTanggalDanTarget === 'function') refreshTanggalDanTarget();
        return;
    }

    const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];
    const filter = document.getElementById('filterBulan');
    if (filter) {
        const nilaiFilterSblm = filter.value;
        filter.innerHTML = '<option value="SEMUA">📅 Semua Bulan</option>';
        unikBulan.forEach(b => { filter.innerHTML += `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`; });
        if ([...filter.options].some(o => o.value === nilaiFilterSblm)) filter.value = nilaiFilterSblm;
    }

    const pasanganFiltered = dapatkanDataFiltered();
    const dataFiltered = pasanganFiltered.map(d => d.item);
    updateStatistik(dataFiltered);

    if (pasanganFiltered.length === 0) {
        wadahTabel.innerHTML = `
            <div class="no-print text-center my-10 p-6 rounded-2xl" style="background:#F8FAFC;border:1px dashed var(--line);">
                <p class="text-sm font-bold mb-2" style="color:var(--ink);">Tidak ada laporan yang sesuai dengan filter pencarian.</p>
                <button type="button" onclick="resetFilterTanggal()" class="flat-btn flat-btn-soft flat-btn-sm">🔄 Reset Filter</button>
            </div>`;
        updateBulkActionUI();
        if (typeof hitungDanRenderBadge === 'function') hitungDanRenderBadge();
        if (typeof refreshTanggalDanTarget === 'function') refreshTanggalDanTarget();
        return;
    }

    const unikBulanFiltered = [...new Set(dataFiltered.map(i => i.bulanLabel))];
    unikBulanFiltered.forEach((bulan) => {
        const grupBulanIni = pasanganFiltered.filter(d => d.item.bulanLabel === bulan);
        if (grupBulanIni.length === 0) return;

        const bulanAman = escapeHtml(bulan);
        const bulanJs = String(bulan).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        let htmlTabel = `
            <div class="block-bulan mb-8" style="width: 100%;">
                <div class="flex items-end justify-between gap-2 mb-3 pt-2">
                    <div class="text-base font-bold text-black">
                        <p>1. Laporan Kegiatan Harian</p>
                        <p>b. Bulan <span class="uppercase">${bulanAman}</span></p>
                    </div>
                    <label class="no-print month-select-pill cursor-pointer select-none" title="Pilih semua laporan di bulan ${bulanAman}">
                        <input type="checkbox" class="custom-checkbox chk-select-bulan" data-bulan="${bulanAman}"
                            onchange="toggleSelectBulan('${bulanJs}', this.checked)">
                        <span>Pilih Bulan Ini (${grupBulanIni.length})</span>
                    </label>
                </div>
                <div class="table-wrapper" style="width: 100%;">
                    <table class="w-full text-black" style="color: black !important; border-collapse: collapse; width: 100%; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th class="no-print" style="border: 1px solid black; padding: 6px; width: 38px; text-align: center;" title="Pilih semua di bulan ${bulanAman}">
                                    <input type="checkbox" class="custom-checkbox chk-select-bulan" data-bulan="${bulanAman}"
                                        onchange="toggleSelectBulan('${bulanJs}', this.checked)">
                                </th>
                                <th style="border: 1px solid black; padding: 6px; width: 38px; text-align: center;">No</th>
                                <th style="border: 1px solid black; padding: 6px; width: 74px;">Hari</th>
                                <th style="border: 1px solid black; padding: 6px; width: 88px;">Tanggal</th>
                                <th style="border: 1px solid black; padding: 6px; width: auto;">Uraian Kegiatan</th>
                                <th style="border: 1px solid black; padding: 6px; width: 96px; text-align: center;">Foto</th>
                                <th class="no-print" style="border: 1px solid black; padding: 6px; width: 112px; text-align: center;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>`;

        grupBulanIni.forEach(({ item, idxAsli }, idx) => {
            const idxTampil = idx + 1;
            const terpilih = selectedLaporanIndices.has(idxAsli);
            const namaFileFoto = `PKL_${item.tanggal.replace(/\//g, '-')}_${idxTampil}.jpg`;
            const adaFoto = !!(item.foto && item.foto.trim() !== '');

            const fotoHtml = adaFoto
                ? `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                     <img src="${item.foto}" alt="Foto ${escapeHtml(item.tanggal)}" style="max-height: 68px; max-width: 80px; object-fit: contain; display: block; border-radius: 4px;" class="border border-gray-300">
                   </div>`
                : `<span style="color:#64748B;">-</span>`;

            const unduhFotoBtn = adaFoto
                ? `<a href="${item.foto}" download="${namaFileFoto}" class="table-action-btn download" title="Unduh foto tanggal ${escapeHtml(item.tanggal)}">
                     ⬇️ Foto
                   </a>`
                : '';

            htmlTabel += `
                            <tr data-row-laporan-idx="${idxAsli}" class="${terpilih ? 'row-selected' : ''}">
                                <td class="no-print" style="border: 1px solid black; padding: 5px; text-align: center; width: 38px;">
                                    <input type="checkbox" class="custom-checkbox chk-item-laporan" data-laporan-idx="${idxAsli}"
                                        ${terpilih ? 'checked' : ''}
                                        onchange="toggleSelectLaporan(${idxAsli}, this.checked)"
                                        title="Pilih laporan tanggal ${escapeHtml(item.tanggal)}">
                                </td>
                                <td style="border: 1px solid black; padding: 5px; text-align: center; width: 38px;">${idxTampil}</td>
                                <td style="border: 1px solid black; padding: 5px; width: 74px;">${escapeHtml(item.hari)}</td>
                                <td style="border: 1px solid black; padding: 5px; width: 88px;">${escapeHtml(item.tanggal)}</td>
                                <td style="border: 1px solid black; padding: 5px; width: auto; word-wrap: break-word;">${escapeHtml(item.uraian)}</td>
                                <td style="border: 1px solid black; padding: 5px; text-align: center; width: 96px;">
                                    ${fotoHtml}
                                </td>
                                <td class="no-print" style="border: 1px solid black; padding: 6px; text-align: center; width: 112px;">
                                    <div class="table-action-group">
                                        <button type="button" class="table-action-btn edit" onclick="editLaporanDariTabel(${idxAsli})" title="Edit laporan tanggal ${escapeHtml(item.tanggal)}">
                                            ✏️ Edit
                                        </button>
                                        <button type="button" class="table-action-btn delete" onclick="hapusSatuLaporanDariTabel(${idxAsli})" title="Hapus laporan tanggal ${escapeHtml(item.tanggal)}">
                                            🗑️ Hapus
                                        </button>
                                        ${unduhFotoBtn}
                                    </div>
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

    updateBulkActionUI();
    if (typeof hitungDanRenderBadge === 'function') {
        hitungDanRenderBadge();
    }
    if (typeof refreshTanggalDanTarget === 'function') {
        refreshTanggalDanTarget();
    } else if (typeof renderKalender === 'function') {
        renderKalender();
    }
}
