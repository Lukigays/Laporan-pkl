// ============================================================
// PROFIL PENGGUNA & LOGO SEKOLAH (Pengaturan)
// ============================================================

async function muatProfil() {
    try {
        const profil = (typeof localforage !== 'undefined' && localforage.getItem)
            ? await localforage.getItem('profilPKL')
            : null;
        if (profil) dataProfil = { ...dataProfil, ...profil };
    } catch (err) { console.error(err); }
    renderProfil();
    renderLogoPreview();
}

function renderProfil() {
    document.getElementById('coverNama').textContent = dataProfil.nama || 'LUKYY';
    document.getElementById('coverKelas').textContent = dataProfil.kelas || 'XII';
    document.getElementById('coverNis').textContent = dataProfil.nis || '/';
    document.getElementById('coverAlamat').textContent = dataProfil.alamat || 'Alamat Tempat PKL';
    document.getElementById('coverProgKeahlian').textContent = dataProfil.progKeahlian || '';
    document.getElementById('coverKonsKeahlian').textContent = dataProfil.konsKeahlian || '';
    document.getElementById('coverTahun').textContent = dataProfil.tahun || '2026...';
    if (typeof renderPanelTarget === 'function') renderPanelTarget();
    const logoEl = document.getElementById('coverLogoSekolah');
    if (logoEl) {
        let logoSrc = '';
        if (dataProfil.logoCatboxUrl && dataProfil.logoCatboxUrl.trim() !== '') {
            logoSrc = dataProfil.logoCatboxUrl;
        } else if (dataProfil.logoSekolah && dataProfil.logoSekolah.trim() !== '') {
            logoSrc = dataProfil.logoSekolah;
        }
        if (logoSrc !== '') {
            logoEl.parentElement.style.display = 'none';
            logoEl.src = logoSrc;
            logoEl.onload = function() { logoEl.parentElement.style.display = 'flex'; };
            logoEl.onerror = function() {
                logoEl.parentElement.style.display = 'none';
                console.warn('Gagal memuat logo:', logoSrc);
            };
        } else {
            logoEl.src = '';
            logoEl.parentElement.style.display = 'none';
        }
    }
}

// ---------- Modal Pengaturan ----------
function bukaSettings() {
    if (typeof tutupSemuaModal === 'function') tutupSemuaModal('modalSettings');
    document.getElementById('setNama').value = dataProfil.nama || '';
    document.getElementById('setKelas').value = dataProfil.kelas || '';
    document.getElementById('setNis').value = dataProfil.nis || '';
    document.getElementById('setAlamat').value = dataProfil.alamat || '';
    document.getElementById('setProgKeahlian').value = dataProfil.progKeahlian || '';
    document.getElementById('setKonsKeahlian').value = dataProfil.konsKeahlian || '';
    document.getElementById('setTahun').value = dataProfil.tahun || '';
    document.getElementById('inputUrlLogoCatbox').value = dataProfil.logoCatboxUrl || '';
    document.getElementById('inputLogoSekolah').value = '';
    const elMulai = document.getElementById('setPklMulai');
    if (elMulai) {
        elMulai.value = dataProfil.pklMulai || '';
        document.getElementById('setPklSelesai').value = dataProfil.pklSelesai || '';
        document.getElementById('setTargetHari').value = dataProfil.targetHariKerja || '';
        document.getElementById('setAutoLibur').checked = !!dataProfil.autoLiburRentang;
    }
    if (typeof renderInfoLibur === 'function') renderInfoLibur();
    if (typeof renderDaftarLiburPeriode === 'function') renderDaftarLiburPeriode();
    renderLogoPreview();
    const modal = document.getElementById('modalSettings');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function tutupSettings() {
    const modal = document.getElementById('modalSettings');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function simpanSettings() {
    dataProfil.nama = document.getElementById('setNama').value.trim() || 'LUKYY';
    dataProfil.kelas = document.getElementById('setKelas').value.trim() || 'XII';
    dataProfil.nis = document.getElementById('setNis').value.trim();
    dataProfil.alamat = document.getElementById('setAlamat').value.trim() || 'Alamat Tempat PKL';
    dataProfil.progKeahlian = document.getElementById('setProgKeahlian').value.trim();
    dataProfil.konsKeahlian = document.getElementById('setKonsKeahlian').value.trim();
    dataProfil.tahun = document.getElementById('setTahun').value.trim() || '2026...';
    dataProfil.logoCatboxUrl = document.getElementById('inputUrlLogoCatbox').value.trim();

    // ---- Periode & target PKL ----
    const elMulai = document.getElementById('setPklMulai');
    if (elMulai) {
        const mulai = elMulai.value;
        const selesai = document.getElementById('setPklSelesai').value;
        if (mulai && selesai && dateDariKunci(selesai) < dateDariKunci(mulai)) {
            showToast('⚠️ Tanggal selesai tidak boleh sebelum tanggal mulai.');
            return;
        }
        dataProfil.pklMulai = mulai;
        dataProfil.pklSelesai = selesai;
        const t = document.getElementById('setTargetHari').value;
        dataProfil.targetHariKerja = t ? String(parseInt(t, 10) || '') : '';
        const autoLama = !!dataProfil.autoLiburRentang;
        dataProfil.autoLiburRentang = document.getElementById('setAutoLibur').checked;

        await localforage.setItem('profilPKL', dataProfil);
        dataTelahBerubah = true;
        renderProfil();
        tutupSettings();

        // Kalau opsi auto-isi baru dinyalakan -> isi libur Minggu sepanjang rentang
        if (dataProfil.autoLiburRentang && !autoLama && typeof isiLiburOtomatisRentang === 'function' && rentangPKL()) {
            await isiLiburOtomatisRentang();
            return;
        }
        showToast('Profil & periode PKL berhasil diperbarui! ✅');
        if (typeof refreshTanggalDanTarget === 'function') refreshTanggalDanTarget();
        return;
    }

    await localforage.setItem('profilPKL', dataProfil);
    dataTelahBerubah = true;
    renderProfil();
    tutupSettings();
    showToast('Profil berhasil diperbarui! ✅');
}

// ---------- Logo Sekolah ----------
function simpanUrlLogoCatbox(url) {
    dataProfil.logoCatboxUrl = url.trim();
    renderLogoPreview();
    renderProfil();
}

function renderLogoPreview() {
    const img = document.getElementById('previewLogoSekolah');
    const placeholder = document.getElementById('placeholderLogo');
    const btnHapus = document.getElementById('btnHapusLogo');

    let targetSrc = '';
    if (dataProfil.logoCatboxUrl && dataProfil.logoCatboxUrl.trim() !== '') {
        targetSrc = dataProfil.logoCatboxUrl;
    } else if (dataProfil.logoSekolah && dataProfil.logoSekolah.trim() !== '') {
        targetSrc = dataProfil.logoSekolah;
    }

    if (targetSrc !== '') {
        img.src = targetSrc;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
        if (btnHapus) btnHapus.classList.remove('hidden');
    } else {
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
        if (btnHapus) btnHapus.classList.add('hidden');
    }
}

async function hapusLogoSekolah() {
    dataProfil.logoSekolah = '';
    dataProfil.logoCatboxUrl = '';
    document.getElementById('inputUrlLogoCatbox').value = '';
    await localforage.setItem('profilPKL', dataProfil);
    renderLogoPreview();
    renderProfil();
    showToast('Logo berhasil dihapus! 🗑️');
}

async function previewLogoUpload(input) {
    if (input.files && input.files[0]) {
        showToast('⏳ Memproses kompresi logo...');
        try {
            const compressedLogo = await bacaDanKompresFile(input.files[0], 200, 0.7);
            dataProfil.logoSekolah = compressedLogo;
            dataProfil.logoCatboxUrl = '';
            document.getElementById('inputUrlLogoCatbox').value = '';
            renderLogoPreview();
            renderProfil();
            await localforage.setItem('profilPKL', dataProfil);
            showToast('Logo berhasil dikompresi & disimpan! ✅');
        } catch (err) {
            console.error('Error kompresi logo:', err);
            showToast('❌ Gagal memproses logo, coba file lain!');
        }
    }
}
