// ============================================================
// LAPORAN: CRUD Cepat, Select All / Multi-Select, Bulk Hapus,
// Render Tabel, Statistik, & Filter
// ============================================================

// ---------- State Seleksi & Cache Foto ----------
let selectedLaporanIndices = new Set();
let pendingDeleteAction = null; // { mode: 'selected' | 'single' | 'all', indices: [] }
let cacheFotoInput = { file: null, promise: null };
let cacheFotoEdit = { file: null, promise: null };
let timerSimpanStorage = null;

// Helper konversi cepat "dd/mm/yyyy" -> integer YYYYMMDD untuk sorting
function angkaUrutTanggal(tglStr) {
    if (!tglStr || tglStr.length < 10) return 0;
    return (
        tInt(tglStr.slice(6, 10)) * 10000 +
        tInt(tglStr.slice(3, 5)) * 100 +
        tInt(tglStr.slice(0, 2))
    );
}
function tInt(s) {
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
}

function urutkanDataLaporanCepat() {
    dataLaporan.sort((a, b) => angkaUrutTanggal(a.tanggal) - angkaUrutTanggal(b.tanggal));
}

// Simpan ke IndexedDB di background agar UI tidak pernah nge-freeze
function jadwalSimpanLaporanLokal() {
    if (timerSimpanStorage) clearTimeout(timerSimpanStorage);
    timerSimpanStorage = setTimeout(() => {
        if (typeof localforage !== 'undefined' && localforage.setItem) {
            if (dataLaporan.length > 0) {
                localforage.setItem('laporanPKL', dataLaporan).catch(err => console.error('Gagal simpan lokal:', err));
            } else if (localforage.removeItem) {
                localforage.removeItem('laporanPKL').catch(err => console.error('Gagal hapus lokal:', err));
            }
        }
    }, 10);
}

// Pra-kompresi foto begitu file dipilih supaya saat klik Simpan langsung instan (0ms)
function siapkanFotoCepat(mode) {
    const isEdit = mode === 'edit';
    const inputEl = document.getElementById(isEdit ? 'editFoto' : 'inputFoto');
    const statusEl = document.getElementById(isEdit ? 'statusFotoEdit' : 'statusFotoInput');
    const cache = isEdit ? cacheFotoEdit : cacheFotoInput;

    if (!inputEl || !inputEl.files || !inputEl.files[0]) {
        cache.file = null;
        cache.promise = null;
        if (statusEl) {
            statusEl.textContent = '';
            statusEl.classList.add('hidden');
        }
        return;
    }

    const file = inputEl.files[0];
    cache.file = file;
    if (statusEl) {
        statusEl.textContent = 'Memproses foto...';
        statusEl.classList.remove('hidden');
    }

    cache.promise = bacaDanKompresFile(file, 850, 0.76)
        .then(hasil => {
            if (statusEl && cache.file === file) {
                statusEl.textContent = 'Foto siap disimpan';
            }
            return hasil;
        })
        .catch(err => {
            console.error('Gagal kompres foto:', err);
            if (statusEl && cache.file === file) {
                statusEl.textContent = 'Gagal memuat foto';
            }
            return '';
        });
}

// ---------- Navigasi Tab (Instan, Tanpa Animasi Berat) ----------
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
}

// ---------- Helper Form Input ----------
function pastikanTanggalDefaultInput() {
    const tgl = document.getElementById('inputTanggal');
    if (tgl && !tgl.value) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        tgl.value = `${y}-${m}-${d}`;
        if (typeof cekHariKerjaInput === 'function') cekHariKerjaInput();
    }
}

function majukanTanggalInputSatuHari(tglStrYmd) {
    if (!tglStrYmd) return;
    const p = tglStrYmd.split('-').map(Number);
    if (p.length !== 3) return;
    const d = new Date(p[0], p[1] - 1, p[2]);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const input = document.getElementById('inputTanggal');
    if (input) {
        input.value = `${y}-${m}-${day}`;
        if (typeof cekHariKerjaInput === 'function') cekHariKerjaInput();
        if (typeof renderKalender === 'function') renderKalender();
    }
}

function isiCepatUraian(teks) {
    const el = document.getElementById('inputUraian');
    if (!el) return;
    el.value = teks;
    el.focus();
}

function resetFormInput() {
    const uraian = document.getElementById('inputUraian');
    const foto = document.getElementById('inputFoto');
    const statusFoto = document.getElementById('statusFotoInput');
    if (uraian) uraian.value = '';
    if (foto) foto.value = '';
    if (statusFoto) {
        statusFoto.textContent = '';
        statusFoto.classList.add('hidden');
    }
    cacheFotoInput.file = null;
    cacheFotoInput.promise = null;
    pastikanTanggalDefaultInput();
    if (uraian) uraian.focus();
}

// Shortcut Ctrl+Enter di textarea untuk langsung simpan
document.addEventListener('DOMContentLoaded', () => {
    pastikanTanggalDefaultInput();
    const inputUraian = document.getElementById('inputUraian');
    if (inputUraian) {
        inputUraian.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                tambahBaris();
            }
        });
    }
    const inputFoto = document.getElementById('inputFoto');
    if (inputFoto) {
        inputFoto.addEventListener('change', () => siapkanFotoCepat('input'));
    }
    const editFoto = document.getElementById('editFoto');
    if (editFoto) {
        editFoto.addEventListener('change', () => siapkanFotoCepat('edit'));
    }
});

// ---------- Tambah Laporan Baru (Instan) ----------
async function tambahBaris() {
    const tglEl = document.getElementById('inputTanggal');
    const uraianEl = document.getElementById('inputUraian');
    const fotoInput = document.getElementById('inputFoto');
    const tanggalInput = tglEl ? tglEl.value : '';
    const uraian = uraianEl ? uraianEl.value.trim() : '';

    if (!tanggalInput || !uraian) {
        showToast('Isi Tanggal dan Uraian terlebih dahulu.');
        if (!tanggalInput && tglEl) tglEl.focus();
        else if (uraianEl) uraianEl.focus();
        return;
    }

    const parts = tanggalInput.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatTgl = formatTanggalIndo(dateObj);
    const labelBulan = labelBulanIndo(dateObj);
    const namaHari = NAMA_HARI[dateObj.getDay()];

    let fotoBase64 = '';
    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        const file = fotoInput.files[0];
        try {
            if (cacheFotoInput.file === file && cacheFotoInput.promise) {
                fotoBase64 = await cacheFotoInput.promise;
            } else {
                fotoBase64 = await bacaDanKompresFile(file, 850, 0.76);
            }
        } catch (err) {
            console.error('Error upload foto:', err);
            showToast('Gagal memproses foto, coba gambar lain.');
            return;
        }
    }

    simpanDataBaru(namaHari, formatTgl, uraian, fotoBase64, labelBulan, tanggalInput);
}

function simpanDataBaru(hari, tanggal, uraian, foto, bulanLabel, tanggalInputAsal) {
    dataLaporan.push({ hari, tanggal, uraian, foto, bulanLabel });
    urutkanDataLaporanCepat();
    selectedLaporanIndices.clear();
    dataTelahBerubah = true;

    // Bersihkan uraian & foto seketika, lalu majukan tanggal ke hari berikutnya
    // agar pengguna bisa input banyak laporan beruntun dengan cepat
    const uraianEl = document.getElementById('inputUraian');
    const fotoEl = document.getElementById('inputFoto');
    const statusFoto = document.getElementById('statusFotoInput');
    if (uraianEl) {
        uraianEl.value = '';
        uraianEl.focus();
    }
    if (fotoEl) fotoEl.value = '';
    if (statusFoto) {
        statusFoto.textContent = '';
        statusFoto.classList.add('hidden');
    }
    cacheFotoInput.file = null;
    cacheFotoInput.promise = null;

    if (tanggalInputAsal) {
        majukanTanggalInputSatuHari(tanggalInputAsal);
    }

    // Simpan ke IndexedDB di background (non-blocking)
    jadwalSimpanLaporanLokal();

    // Render tabel & statistik
    renderSemuaData();
    showToast(`Laporan ${tanggal} tersimpan.`);
}

// ---------- Edit Laporan & Daftar Kelola di Tab Edit ----------
function updateDropdownEditTab() {
    bersihkanSeleksiTidakValid();
    const dropdown = document.getElementById('pilihEditDropdown');
    if (dropdown) {
        const prevVal = dropdown.value;
        const opts = ['<option value="">-- Pilih catatan laporan untuk diedit --</option>'];
        for (let idx = 0; idx < dataLaporan.length; idx++) {
            const item = dataLaporan[idx];
            const cuplikan = (item.uraian || '').substring(0, 45);
            opts.push(`<option value="${idx}">${item.tanggal} (${item.hari}) - ${escapeHtml(cuplikan)}${(item.uraian || '').length > 45 ? '...' : ''}</option>`);
        }
        dropdown.innerHTML = opts.join('');
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
                <p class="text-sm font-medium" style="color:var(--muted);">Belum ada catatan laporan tersimpan.</p>
            </div>`;
        return;
    }

    const editIdxAktif = document.getElementById('editIndexHidden') ? document.getElementById('editIndexHidden').value : '';
    const formTerbuka = !document.getElementById('formEditContainer')?.classList.contains('hidden');

    const barisHtml = new Array(dataLaporan.length);
    for (let idx = 0; idx < dataLaporan.length; idx++) {
        const item = dataLaporan[idx];
        const terpilih = selectedLaporanIndices.has(idx);
        const sedangDiedit = formTerbuka && String(idx) === String(editIdxAktif);
        const adaFoto = !!(item.foto && item.foto.trim() !== '');
        const teksUraian = escapeHtml(item.uraian || '-');

        barisHtml[idx] = `
            <div class="edit-list-item ${terpilih ? 'is-selected' : ''} ${sedangDiedit ? 'is-editing' : ''}" data-row-edit-idx="${idx}">
                <label class="flex items-center cursor-pointer p-1">
                    <input type="checkbox" class="custom-checkbox chk-item-laporan" data-laporan-idx="${idx}"
                        ${terpilih ? 'checked' : ''}
                        onchange="toggleSelectLaporan(${idx}, this.checked)">
                </label>
                <div class="flex-1 min-w-0 cursor-pointer" onclick="bukaEditPadaIndex(${idx})">
                    <div class="flex items-center gap-2 flex-wrap mb-0.5">
                        <span class="item-no-badge">#${idx + 1}</span>
                        <span class="font-semibold text-xs" style="color:var(--ink);">${escapeHtml(item.tanggal)}</span>
                        <span class="item-day-badge">${escapeHtml(item.hari)}</span>
                        ${adaFoto ? '<span class="item-photo-badge">Foto</span>' : ''}
                    </div>
                    <p class="text-xs truncate" style="color:var(--ink-soft);">${teksUraian}</p>
                </div>
                <div class="flex items-center gap-1.5 flex-none">
                    <button type="button" onclick="bukaEditPadaIndex(${idx})" class="table-action-btn edit">Edit</button>
                    <button type="button" onclick="hapusSatuLaporanDariTabel(${idx})" class="table-action-btn delete">Hapus</button>
                </div>
            </div>`;
    }
    wadah.innerHTML = barisHtml.join('');
}

function bukaEditPadaIndex(idx) {
    if (typeof idx !== 'number' || idx < 0 || !dataLaporan[idx]) return;
    const dropdown = document.getElementById('pilihEditDropdown');
    if (dropdown) {
        dropdown.value = String(idx);
        pilihTanggalEditDropdown();
    }
}

function batalEditLaporan() {
    const dropdown = document.getElementById('pilihEditDropdown');
    const container = document.getElementById('formEditContainer');
    const hidden = document.getElementById('editIndexHidden');
    const statusFoto = document.getElementById('statusFotoEdit');
    if (dropdown) dropdown.value = '';
    if (hidden) hidden.value = '';
    if (container) container.classList.add('hidden');
    if (statusFoto) {
        statusFoto.textContent = '';
        statusFoto.classList.add('hidden');
    }
    cacheFotoEdit.file = null;
    cacheFotoEdit.promise = null;
    renderDaftarKelolaEdit();
}

function cariIndexAsliLaporan(item) {
    if (!item) return -1;
    let idx = dataLaporan.indexOf(item);
    if (idx !== -1) return idx;
    return dataLaporan.findIndex(d => d.tanggal === item.tanggal && d.uraian === item.uraian && d.foto === item.foto);
}

function editLaporanDariTabel(idx) {
    if (typeof idx !== 'number' || idx < 0 || !dataLaporan[idx]) {
        showToast('Laporan tidak ditemukan.');
        return;
    }
    switchTab('edit');
    const dropdown = document.getElementById('pilihEditDropdown');
    if (!dropdown) return;
    dropdown.value = String(idx);
    pilihTanggalEditDropdown();
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
    cacheFotoEdit.file = null;
    cacheFotoEdit.promise = null;
    const judulEl = document.getElementById('judulFormEditAktif');
    if (judulEl) judulEl.textContent = `Edit Laporan: ${item.hari}, ${item.tanggal}`;
    container.classList.remove('hidden');
    if (typeof cekHariKerjaInput === 'function') cekHariKerjaInput('editTanggal', 'infoTanggalEdit');
    renderDaftarKelolaEdit();
}

async function simpanLaporanEdited() {
    const idx = document.getElementById('editIndexHidden').value;
    const tglInput = document.getElementById('editTanggal').value;
    const uraian = document.getElementById('editUraian').value.trim();
    const fotoInput = document.getElementById('editFoto');
    if (idx === '' || !dataLaporan[idx]) {
        showToast('Pilih laporan terlebih dahulu.');
        return;
    }
    if (!tglInput || !uraian) {
        showToast('Isi Tanggal dan Uraian terlebih dahulu.');
        return;
    }
    const parts = tglInput.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatTgl = formatTanggalIndo(dateObj);
    const labelBulan = labelBulanIndo(dateObj);
    let fotoBase64 = dataLaporan[idx].foto;

    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        const file = fotoInput.files[0];
        try {
            if (cacheFotoEdit.file === file && cacheFotoEdit.promise) {
                fotoBase64 = await cacheFotoEdit.promise;
            } else {
                fotoBase64 = await bacaDanKompresFile(file, 850, 0.76);
            }
        } catch (err) {
            console.error('Error ganti foto:', err);
            showToast('Gagal memproses foto baru.');
            return;
        }
    }
    finalizeEdit(Number(idx), NAMA_HARI[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
}

function finalizeEdit(idx, hari, tanggal, uraian, foto, bulanLabel) {
    dataLaporan[idx] = { hari, tanggal, uraian, foto, bulanLabel };
    urutkanDataLaporanCepat();
    selectedLaporanIndices.clear();
    dataTelahBerubah = true;
    jadwalSimpanLaporanLokal();
    batalEditLaporan();
    renderSemuaData();
    showToast('Laporan diperbarui.');
}

// ============================================================
// FITUR SELECT ALL, PILIH LAPORAN, & HAPUS BANYAK / SEMUA
// ============================================================

function bersihkanSeleksiTidakValid() {
    if (selectedLaporanIndices.size === 0) return;
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
    const semuaBulan = (filterVal === 'SEMUA' || !unikBulan.includes(filterVal));

    const tglMulaiVal = document.getElementById('filterTglMulai')?.value || '';
    const tglAkhirVal = document.getElementById('filterTglAkhir')?.value || '';
    const angkaMulai = tglMulaiVal ? parseInt(tglMulaiVal.replace(/-/g, ''), 10) : 0;
    const angkaAkhir = tglAkhirVal ? parseInt(tglAkhirVal.replace(/-/g, ''), 10) : 99999999;

    const hasil = [];
    for (let idxAsli = 0; idxAsli < dataLaporan.length; idxAsli++) {
        const item = dataLaporan[idxAsli];
        if (!semuaBulan && item.bulanLabel !== filterVal) continue;
        if (kataKunci && !(item.uraian || '').toLowerCase().includes(kataKunci) && !(item.tanggal || '').includes(kataKunci)) continue;
        if (angkaMulai > 0 || angkaAkhir < 99999999) {
            const angkaTgl = angkaUrutTanggal(item.tanggal);
            if (angkaTgl < angkaMulai || angkaTgl > angkaAkhir) continue;
        }
        hasil.push({ item, idxAsli });
    }
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
        showToast('Belum ada laporan untuk dipilih.');
        return;
    }

    const tabEditAktif = document.getElementById('tabEdit')?.classList.contains('active');
    const targetIndices = tabEditAktif
        ? dataLaporan.map((_, idx) => idx)
        : dapatkanDataFiltered().map(d => d.idxAsli);

    if (targetIndices.length === 0) {
        showToast('Tidak ada laporan yang sesuai filter.');
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
}

function pilihSemuaLaporanGlobal() {
    if (dataLaporan.length === 0) return;
    for (let i = 0; i < dataLaporan.length; i++) selectedLaporanIndices.add(i);
    sinkronkanDomSeleksi();
    updateBulkActionUI();
}

function batalPilihSemuaLaporan() {
    selectedLaporanIndices.clear();
    sinkronkanDomSeleksi();
    updateBulkActionUI();
}

function sinkronkanDomSeleksi() {
    document.querySelectorAll('.chk-item-laporan').forEach(chk => {
        const idx = Number(chk.getAttribute('data-laporan-idx'));
        chk.checked = selectedLaporanIndices.has(idx);
    });

    document.querySelectorAll('tr[data-row-laporan-idx]').forEach(tr => {
        const idx = Number(tr.getAttribute('data-row-laporan-idx'));
        tr.classList.toggle('row-selected', selectedLaporanIndices.has(idx));
    });

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

    const navBadge = document.getElementById('navBadgeTotalLaporan');
    if (navBadge) navBadge.textContent = String(dataLaporan.length);

    const chkAllLaporan = document.getElementById('chkSelectAllLaporan');
    if (chkAllLaporan) {
        const jmlFilteredTerpilih = indicesFiltered.filter(idx => selectedLaporanIndices.has(idx)).length;
        chkAllLaporan.disabled = indicesFiltered.length === 0;
        chkAllLaporan.checked = indicesFiltered.length > 0 && jmlFilteredTerpilih === indicesFiltered.length;
        chkAllLaporan.indeterminate = jmlFilteredTerpilih > 0 && jmlFilteredTerpilih < indicesFiltered.length;
    }

    const chkAllEdit = document.getElementById('chkSelectAllEdit');
    if (chkAllEdit) {
        chkAllEdit.disabled = dataLaporan.length === 0;
        chkAllEdit.checked = dataLaporan.length > 0 && totalTerpilih === dataLaporan.length;
        chkAllEdit.indeterminate = totalTerpilih > 0 && totalTerpilih < dataLaporan.length;
    }

    document.querySelectorAll('.chk-select-bulan').forEach(chk => {
        const bulan = chk.getAttribute('data-bulan');
        const itemBulan = dataFiltered.filter(d => d.item.bulanLabel === bulan);
        const terpilihBulan = itemBulan.filter(d => selectedLaporanIndices.has(d.idxAsli)).length;
        chk.checked = itemBulan.length > 0 && terpilihBulan === itemBulan.length;
        chk.indeterminate = terpilihBulan > 0 && terpilihBulan < itemBulan.length;
    });

    const badgeLaporan = document.getElementById('badgeJumlahTerpilih');
    if (badgeLaporan) {
        badgeLaporan.textContent = `${totalTerpilih} dipilih`;
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
        btnToggleText.textContent = semuaFilteredTerpilih ? 'Batal Pilih Semua' : 'Pilih Semua';
    }

    const badgeEdit = document.getElementById('badgeJumlahTerpilihEdit');
    if (badgeEdit) {
        badgeEdit.textContent = `${totalTerpilih} dipilih`;
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
        showToast('Pilih minimal 1 laporan terlebih dahulu.');
        return;
    }

    pendingDeleteAction = { mode, indices: [...new Set(indices)].sort((a, b) => a - b) };

    const modal = document.getElementById('modalKonfirmasiHapus');
    const judulEl = document.getElementById('judulKonfirmasiHapus');
    const pesanEl = document.getElementById('pesanKonfirmasiHapus');
    const previewEl = document.getElementById('daftarPreviewHapus');
    const btnEksekusi = document.getElementById('btnEksekusiHapusModal');

    if (judulEl) judulEl.textContent = judul || 'Konfirmasi Hapus Laporan';
    if (pesanEl) pesanEl.textContent = pesan || `Hapus ${pendingDeleteAction.indices.length} laporan yang dipilih?`;
    if (btnEksekusi) btnEksekusi.textContent = `Hapus (${pendingDeleteAction.indices.length})`;

    if (previewEl) {
        const maksPreview = 20;
        const daftar = pendingDeleteAction.indices.slice(0, maksPreview).map(i => dataLaporan[i]).filter(Boolean);
        let htmlPreview = daftar.map(item => `
            <div class="flex items-center justify-between gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-200">
                <div class="truncate">
                    <b style="color:var(--ink);">${escapeHtml(item.tanggal)}</b>
                    <span style="color:var(--muted);">(${escapeHtml(item.hari)})</span>
                    — <span style="color:var(--ink-soft);">${escapeHtml((item.uraian || '').substring(0, 48))}</span>
                </div>
            </div>`).join('');
        if (pendingDeleteAction.indices.length > maksPreview) {
            htmlPreview += `<p class="text-[11px] text-center pt-1 font-medium" style="color:var(--muted);">+ ${pendingDeleteAction.indices.length - maksPreview} laporan lainnya</p>`;
        }
        previewEl.innerHTML = htmlPreview;
    }

    if (modal) {
        if (typeof tutupSemuaModal === 'function') tutupSemuaModal('modalKonfirmasiHapus');
        modal.classList.remove('hidden', 'opacity-0');
    }
}

function tutupModalKonfirmasiHapus() {
    const modal = document.getElementById('modalKonfirmasiHapus');
    pendingDeleteAction = null;
    if (!modal) return;
    modal.classList.add('hidden', 'opacity-0');
}

async function eksekusiKonfirmasiHapus() {
    if (!pendingDeleteAction || !Array.isArray(pendingDeleteAction.indices) || pendingDeleteAction.indices.length === 0) {
        tutupModalKonfirmasiHapus();
        return;
    }

    const setHapus = new Set(pendingDeleteAction.indices);
    const jumlahDihapus = setHapus.size;

    // Catat penolakan untuk entri "Libur" otomatis hari Minggu yang sengaja dihapus
    const kunciLiburDihapus = [];
    setHapus.forEach(idx => {
        const item = dataLaporan[idx];
        if (!item) return;
        const kunci = typeof kunciTanggalDariString === 'function' ? kunciTanggalDariString(item.tanggal) : '';
        const autoLibur = typeof laporanLibur === 'function' && laporanLibur(item);
        if (autoLibur && kunci) kunciLiburDihapus.push(kunci);
    });

    if (kunciLiburDihapus.length > 0 && typeof localforage !== 'undefined' && localforage.getItem) {
        localforage.getItem('liburDitolak').then(ditolakLama => {
            const ditolak = Array.isArray(ditolakLama) ? ditolakLama : [];
            kunciLiburDihapus.forEach(k => { if (!ditolak.includes(k)) ditolak.push(k); });
            return localforage.setItem('liburDitolak', ditolak);
        }).catch(() => {});
    }

    dataLaporan = dataLaporan.filter((_, idx) => !setHapus.has(idx));
    selectedLaporanIndices.clear();
    dataTelahBerubah = true;

    jadwalSimpanLaporanLokal();
    tutupModalKonfirmasiHapus();
    batalEditLaporan();
    renderSemuaData();
    updateDropdownEditTab();
    showToast(`${jumlahDihapus} laporan dihapus.`);
}

function hapusLaporanTerpilih() {
    bersihkanSeleksiTidakValid();
    if (selectedLaporanIndices.size === 0) {
        showToast('Centang minimal 1 laporan yang ingin dihapus.');
        return;
    }
    const indices = Array.from(selectedLaporanIndices);
    bukaModalKonfirmasiHapus(
        'selected',
        indices,
        `Hapus ${indices.length} Laporan Terpilih`,
        `Anda akan menghapus ${indices.length} catatan laporan secara permanen.`
    );
}

function hapusSatuLaporanDariTabel(idx) {
    const numIdx = Number(idx);
    if (isNaN(numIdx) || !dataLaporan[numIdx]) {
        showToast('Laporan tidak ditemukan.');
        return;
    }
    const item = dataLaporan[numIdx];
    bukaModalKonfirmasiHapus(
        'single',
        [numIdx],
        `Hapus Laporan ${item.tanggal}`,
        `Hapus permanen catatan hari ${item.hari}, tanggal ${item.tanggal}?`
    );
}

async function hapusLaporanSelected() {
    const idx = document.getElementById('editIndexHidden').value;
    if (idx === '' || !dataLaporan[idx]) {
        showToast('Pilih laporan yang ingin dihapus terlebih dahulu.');
        return;
    }
    hapusSatuLaporanDariTabel(Number(idx));
}

function bukaKonfirmasiHapusSemuaCepat() {
    if (!Array.isArray(dataLaporan) || dataLaporan.length === 0) {
        showToast('Belum ada data laporan untuk dihapus.');
        return;
    }
    const semuaIndices = dataLaporan.map((_, idx) => idx);
    bukaModalKonfirmasiHapus(
        'all',
        semuaIndices,
        `Hapus Semua Laporan (${semuaIndices.length})`,
        `Apakah Anda yakin ingin menghapus seluruh (${semuaIndices.length}) catatan laporan PKL sekaligus?`
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
    const elHari = document.getElementById('statTotalHari');
    const elUraian = document.getElementById('statTotalUraian');
    const elFoto = document.getElementById('statTotalFoto');
    const elRata = document.getElementById('statRataBulan');
    if (elHari) elHari.innerText = dataAktif.length;
    if (elUraian) elUraian.innerText = dataAktif.length;
    if (elFoto) elFoto.innerText = dataAktif.filter(i => i.foto && i.foto.trim() !== '').length;
    const unikBulan = new Set(dataAktif.map(i => i.bulanLabel)).size;
    if (elRata) elRata.innerText = unikBulan > 0 ? (dataAktif.length / unikBulan).toFixed(1) : 0;
}

// ---------- Render Tabel Laporan (Single Join, Cepat & Ringan) ----------
function renderSemuaData() {
    bersihkanSeleksiTidakValid();
    const wadahTabel = document.getElementById('wadahTabelBulan');
    if (!wadahTabel) return;

    if (dataLaporan.length === 0) {
        wadahTabel.innerHTML = `
            <div class="no-print text-center my-10 p-6 rounded-xl" style="background:#F8FAFC;border:1px solid var(--line);">
                <p class="text-sm font-semibold mb-1" style="color:var(--ink);">Belum ada data laporan PKL</p>
                <p class="text-xs mb-3" style="color:var(--muted);">Silakan isi kegiatan harian pada tab Catat Kegiatan.</p>
                <button type="button" onclick="switchTab('input')" class="flat-btn flat-btn-primary flat-btn-sm">Catat Kegiatan</button>
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
        const opsiBulan = ['<option value="SEMUA">Semua Bulan</option>'];
        unikBulan.forEach(b => { opsiBulan.push(`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`); });
        filter.innerHTML = opsiBulan.join('');
        if ([...filter.options].some(o => o.value === nilaiFilterSblm)) filter.value = nilaiFilterSblm;
    }

    const pasanganFiltered = dapatkanDataFiltered();
    const dataFiltered = pasanganFiltered.map(d => d.item);
    updateStatistik(dataFiltered);

    if (pasanganFiltered.length === 0) {
        wadahTabel.innerHTML = `
            <div class="no-print text-center my-8 p-6 rounded-xl" style="background:#F8FAFC;border:1px solid var(--line);">
                <p class="text-sm font-medium mb-2" style="color:var(--ink);">Tidak ada laporan yang cocok dengan filter.</p>
                <button type="button" onclick="resetFilterTanggal()" class="flat-btn flat-btn-soft flat-btn-sm">Reset Filter</button>
            </div>`;
        updateBulkActionUI();
        if (typeof hitungDanRenderBadge === 'function') hitungDanRenderBadge();
        if (typeof refreshTanggalDanTarget === 'function') refreshTanggalDanTarget();
        return;
    }

    const unikBulanFiltered = [...new Set(dataFiltered.map(i => i.bulanLabel))];
    const semuaBlokHtml = [];

    for (let b = 0; b < unikBulanFiltered.length; b++) {
        const bulan = unikBulanFiltered[b];
        const grupBulanIni = pasanganFiltered.filter(d => d.item.bulanLabel === bulan);
        if (grupBulanIni.length === 0) continue;

        const bulanAman = escapeHtml(bulan);
        const bulanJs = String(bulan).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        const barisBulan = [];
        for (let idx = 0; idx < grupBulanIni.length; idx++) {
            const { item, idxAsli } = grupBulanIni[idx];
            const idxTampil = idx + 1;
            const terpilih = selectedLaporanIndices.has(idxAsli);
            const namaFileFoto = `PKL_${item.tanggal.replace(/\//g, '-')}_${idxTampil}.jpg`;
            const adaFoto = !!(item.foto && item.foto.trim() !== '');

            const fotoHtml = adaFoto
                ? `<div style="display:flex;justify-content:center;">
                     <img src="${item.foto}" loading="lazy" decoding="async" alt="Foto" style="max-height:64px;max-width:78px;object-fit:contain;display:block;" class="border border-gray-300">
                   </div>`
                : `<span>-</span>`;

            const unduhFotoBtn = adaFoto
                ? `<a href="${item.foto}" download="${namaFileFoto}" class="table-action-btn download">Unduh</a>`
                : '';

            barisBulan.push(`
                <tr data-row-laporan-idx="${idxAsli}" class="${terpilih ? 'row-selected' : ''}">
                    <td class="no-print" style="border: 1px solid black; padding: 5px; text-align: center; width: 36px;">
                        <input type="checkbox" class="custom-checkbox chk-item-laporan" data-laporan-idx="${idxAsli}"
                            ${terpilih ? 'checked' : ''}
                            onchange="toggleSelectLaporan(${idxAsli}, this.checked)">
                    </td>
                    <td style="border: 1px solid black; padding: 5px; text-align: center; width: 36px;">${idxTampil}</td>
                    <td style="border: 1px solid black; padding: 5px; width: 72px;">${escapeHtml(item.hari)}</td>
                    <td style="border: 1px solid black; padding: 5px; width: 86px;">${escapeHtml(item.tanggal)}</td>
                    <td style="border: 1px solid black; padding: 5px; width: auto; word-wrap: break-word;">${escapeHtml(item.uraian)}</td>
                    <td style="border: 1px solid black; padding: 5px; text-align: center; width: 92px;">${fotoHtml}</td>
                    <td class="no-print" style="border: 1px solid black; padding: 5px; text-align: center; width: 105px;">
                        <div class="table-action-group">
                            <button type="button" class="table-action-btn edit" onclick="editLaporanDariTabel(${idxAsli})">Edit</button>
                            <button type="button" class="table-action-btn delete" onclick="hapusSatuLaporanDariTabel(${idxAsli})">Hapus</button>
                            ${unduhFotoBtn}
                        </div>
                    </td>
                </tr>`);
        }

        semuaBlokHtml.push(`
            <div class="block-bulan mb-7" style="width: 100%;">
                <div class="flex items-end justify-between gap-2 mb-2.5 pt-2">
                    <div class="text-base font-bold text-black">
                        <p>1. Laporan Kegiatan Harian</p>
                        <p>b. Bulan <span class="uppercase">${bulanAman}</span></p>
                    </div>
                    <label class="no-print month-select-pill cursor-pointer select-none">
                        <input type="checkbox" class="custom-checkbox chk-select-bulan" data-bulan="${bulanAman}"
                            onchange="toggleSelectBulan('${bulanJs}', this.checked)">
                        <span>Pilih bulan ini (${grupBulanIni.length})</span>
                    </label>
                </div>
                <div class="table-wrapper" style="width: 100%;">
                    <table class="w-full text-black" style="color: black !important; border-collapse: collapse; width: 100%; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th class="no-print" style="border: 1px solid black; padding: 6px; width: 36px; text-align: center;">
                                    <input type="checkbox" class="custom-checkbox chk-select-bulan" data-bulan="${bulanAman}"
                                        onchange="toggleSelectBulan('${bulanJs}', this.checked)">
                                </th>
                                <th style="border: 1px solid black; padding: 6px; width: 36px; text-align: center;">No</th>
                                <th style="border: 1px solid black; padding: 6px; width: 72px;">Hari</th>
                                <th style="border: 1px solid black; padding: 6px; width: 86px;">Tanggal</th>
                                <th style="border: 1px solid black; padding: 6px; width: auto;">Uraian Kegiatan</th>
                                <th style="border: 1px solid black; padding: 6px; width: 92px; text-align: center;">Foto</th>
                                <th class="no-print" style="border: 1px solid black; padding: 6px; width: 105px; text-align: center;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>${barisBulan.join('')}</tbody>
                    </table>
                </div>
            </div>`);
    }

    wadahTabel.innerHTML = semuaBlokHtml.join('');

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
