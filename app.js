let dataLaporan = [];
let dataTelahBerubah = false; 

let dataProfil = {
    nama: 'LUKYY',
    kelas: 'XII',
    nis: '',
    alamat: 'Alamat Tempat PKL',
    progKeahlian: '',
    konsKeahlian: '',
    tahun: '2026...'
};

const SUPABASE_URL = "https://tdcgtxoaaplcfpwqvvfe.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_SIoTFjw3KqVQvAVu2AHWuw_B2A5o6Xp";

let supabaseClient = null;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
    console.warn("URL Supabase belum valid.");
}

let currentUser = null;

window.addEventListener('DOMContentLoaded', () => {
    if (supabaseClient) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            currentUser = session?.user || null;
            updateAuthUI();
        });

        supabaseClient.auth.onAuthStateChange((event, session) => {
            currentUser = session?.user || null;
            updateAuthUI();

            if (event === 'PASSWORD_RECOVERY') {
                bukaModalResetPassword();
            }
        });
    } else {
        updateAuthUI();
    }
});

function bukaModalResetPassword() {
    const modal = document.getElementById('modalResetPassword');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);
}

async function simpanPasswordBaru() {
    const pass = document.getElementById('newPasswordInput').value;
    if(!pass || pass.length < 6) { showToast('⚠️ Password minimal 6 karakter!'); return; }
    
    showToast("⏳ Memperbarui password...");
    const { error } = await supabaseClient.auth.updateUser({ password: pass });
    if(error) {
        showToast("❌ " + error.message);
    } else {
        const modal = document.getElementById('modalResetPassword');
        modal.classList.add('opacity-0');
        setTimeout(() => { modal.classList.add('hidden'); }, 300);
        showToast("🎉 Password berhasil diperbarui!");
    }
}

function updateAuthUI() {
    const label = document.getElementById('labelStatusAuth');
    const btnIn = document.getElementById('wrapperTombolAuth');
    const btnSync = document.getElementById('wrapperTombolSync');
    if (currentUser) {
        label.innerText = `Status: Masuk sebagai (${currentUser.email})`;
        btnIn.classList.add('hidden');
        btnSync.classList.remove('hidden');
    } else {
        label.innerText = "Status: Belum masuk akun cloud.";
        btnIn.classList.remove('hidden');
        btnSync.classList.add('hidden');
    }
}

function bukaModalAuth() {
    const modal = document.getElementById('modalAuth');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);
}

function tutupModalAuth() {
    const modal = document.getElementById('modalAuth');
    modal.classList.add('opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

async function prosesLoginAuth() {
    if (!supabaseClient) { showToast("⚠️ Hubungkan URL Supabase terlebih dahulu!"); return; }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if(!email || !password) { showToast('⚠️ Isi email dan password terlebih dahulu!'); return; }
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) { showToast("❌ " + error.message); } 
    else { tutupModalAuth(); showToast("Berhasil Masuk! 🔓"); tarikDariCloud(); }
}

async function prosesRegisterAuth() {
    if (!supabaseClient) { showToast("⚠️ Hubungkan URL Supabase terlebih dahulu!"); return; }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if(!email || !password) { showToast('⚠️ Isi email dan password terlebih dahulu!'); return; }
    
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) { showToast("❌ " + error.message); } 
    else { tutupModalAuth(); showToast("Akun berhasil dibuat! Silakan login. 🎉"); }
}

async function prosesLupaPassword() {
    if (!supabaseClient) { showToast("⚠️ Hubungkan URL Supabase terlebih dahulu!"); return; }
    const email = document.getElementById('authEmail').value.trim();
    if(!email) { showToast('⚠️ Isi alamat email di kolom atas terlebih dahulu!'); return; }
    
    showToast("⏳ Mengirim link reset password...");
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
    });
    if (error) { showToast("❌ " + error.message); } 
    else { showToast("✅ Link reset password telah dikirim ke email Anda!"); }
}

async function logoutAuth() {
    if (!supabaseClient) return;
    try {
        await supabaseClient.auth.signOut();
        showToast("Keluar akun berhasil.");
    } catch(e) { console.error(e); }
}

async function simpanKeCloud() {
    if(!supabaseClient || !currentUser) { showToast('⚠️ Belum login akun cloud!'); return; }
    showToast("⏳ Sedang menyimpan data ke Cloud...");
    try {
        await supabaseClient.from('laporan_pkl').delete().eq('user_id', currentUser.id);

        const rowsToInsert = dataLaporan.map(item => ({
            user_id: currentUser.id,
            hari: item.hari,
            tanggal: item.tanggal,
            uraian: item.uraian,
            foto: item.foto,
            bulan_label: item.bulanLabel
        }));

        const chunkSize = 50;
        for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
            const chunk = rowsToInsert.slice(i, i + chunkSize);
            const { error } = await supabaseClient.from('laporan_pkl').insert(chunk);
            if (error) throw error;
        }
        
        dataTelahBerubah = false;
        showToast("✅ Data berhasil disimpan ke Cloud!");
    } catch(err) {
        showToast("❌ Gagal sinkronisasi ke cloud: " + err.message);
    }
}

async function autoSyncKeCloud() {
    if (currentUser && dataTelahBerubah && supabaseClient) { simpanKeCloud(); }
}

async function tarikDariCloud() {
    if(!supabaseClient || !currentUser) { return; }
    showToast("⏳ Mengambil data dari Cloud...");
    try {
        const { data, error } = await supabaseClient
            .from('laporan_pkl')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('id', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            dataLaporan = data.map(row => ({
                hari: row.hari,
                tanggal: row.tanggal,
                uraian: row.uraian,
                foto: row.foto,
                bulanLabel: row.bulan_label
            }));

            await localforage.setItem('laporanPKL', dataLaporan);
            renderSemuaData();
            showToast("✅ Data berhasil ditarik dari Cloud!");
        } else {
            showToast("⚠️ Belum ada data di cloud untuk akun ini.");
        }
    } catch(err) {
        showToast("❌ Gagal mengambil data dari cloud.");
    }
}

const langkahTour = [
    { icon: '👋', title: 'Selamat Datang di Laporan PKL', desc: 'Aplikasi canggih untuk menyusun dan mengekspor laporan PKL harian Anda dengan mudah.' },
    { icon: '📝', title: 'Tab Input Data', desc: 'Gunakan tab ini untuk mencatat kegiatan baru harian Anda.' },
    { icon: '✏️', title: 'Tab Pengeditan Laporan', desc: 'Pilih dan edit catatan laporan sebelumnya secara cepat tanpa memakan banyak ruang.' },
    { icon: '📋', title: 'Tab Laporan & PDF', desc: 'Lihat ringkasan statistik, saring data, lalu unduh dokumen ke format PDF.' }
];
let indexTourAktif = 0;

function cekDanJalankanTour() {
    const sudahPernah = localStorage.getItem('sudahTourPKL');
    if (!sudahPernah) { bukaTourManual(); }
}

function bukaTourManual() {
    indexTourAktif = 0; renderTourStep();
    const modal = document.getElementById('modalTour');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);
}

function renderTourStep() {
    const step = langkahTour[indexTourAktif];
    document.getElementById('tourIcon').innerText = step.icon;
    document.getElementById('tourTitle').innerText = step.title;
    document.getElementById('tourDesc').innerText = step.desc;
    document.getElementById('tourStepIndicator').innerText = `${indexTourAktif + 1} / ${langkahTour.length}`;
}

function lanjutTour() {
    indexTourAktif++;
    if (indexTourAktif < langkahTour.length) { renderTourStep(); } else { tutupTour(); }
}

function lewatiTour() { tutupTour(); }

function tutupTour() {
    localStorage.setItem('sudahTourPKL', 'true');
    const modal = document.getElementById('modalTour');
    modal.classList.add('opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

async function muatProfil() {
    try {
        const profil = await localforage.getItem('profilPKL');
        if (profil) { dataProfil = { ...dataProfil, ...profil }; }
    } catch (err) { console.error(err); }
    renderProfil();
}

function renderProfil() {
    document.getElementById('coverNama').textContent = dataProfil.nama || 'LUKYY';
    document.getElementById('coverKelas').textContent = dataProfil.kelas || 'XII';
    document.getElementById('coverNis').textContent = dataProfil.nis || '/';
    document.getElementById('coverAlamat').textContent = dataProfil.alamat || 'Alamat Tempat PKL';
    document.getElementById('coverProgKeahlian').textContent = dataProfil.progKeahlian || '';
    document.getElementById('coverKonsKeahlian').textContent = dataProfil.konsKeahlian || '';
    document.getElementById('coverTahun').textContent = dataProfil.tahun || '2026...';
}

function bukaSettings() {
    document.getElementById('setNama').value = dataProfil.nama || '';
    document.getElementById('setKelas').value = dataProfil.kelas || '';
    document.getElementById('setNis').value = dataProfil.nis || '';
    document.getElementById('setAlamat').value = dataProfil.alamat || '';
    document.getElementById('setProgKeahlian').value = dataProfil.progKeahlian || '';
    document.getElementById('setKonsKeahlian').value = dataProfil.konsKeahlian || '';
    document.getElementById('setTahun').value = dataProfil.tahun || '';

    const modal = document.getElementById('modalSettings');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);
}

function tutupSettings() {
    const modal = document.getElementById('modalSettings');
    modal.classList.add('opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

async function simpanSettings() {
    dataProfil.nama = document.getElementById('setNama').value.trim() || 'LUKYY';
    dataProfil.kelas = document.getElementById('setKelas').value.trim() || 'XII';
    dataProfil.nis = document.getElementById('setNis').value.trim();
    dataProfil.alamat = document.getElementById('setAlamat').value.trim() || 'Alamat Tempat PKL';
    dataProfil.progKeahlian = document.getElementById('setProgKeahlian').value.trim();
    dataProfil.konsKeahlian = document.getElementById('setKonsKeahlian').value.trim();
    dataProfil.tahun = document.getElementById('setTahun').value.trim() || '2026...';

    await localforage.setItem('profilPKL', dataProfil);
    dataTelahBerubah = true;
    renderProfil();
    tutupSettings();
    showToast('Profil berhasil diperbarui! ✅');
}

window.onload = async function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('btnDarkMode').innerHTML = '☀️ <span>Mode Terang</span>';
    }
    try {
        const dataDariIndexedDB = await localforage.getItem('laporanPKL');
        if (dataDariIndexedDB !== null) { dataLaporan = dataDariIndexedDB; }
    } catch (err) { console.error(err); }

    await muatProfil();
    renderSemuaData();
    cekDanJalankanTour();
    setInterval(autoSyncKeCloud, 300000); 
};

function showToast(message) {
    const container = document.getElementById('toast-container');
    document.getElementById('toast-message').innerText = message;
    container.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    setTimeout(() => { container.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none'); }, 3500);
}

function switchTab(tabName) {
    const tabInput = document.getElementById('tabInput');
    const tabEdit = document.getElementById('tabEdit');
    const tabLaporan = document.getElementById('tabLaporan');

    const btnInput = document.getElementById('btnTabInput');
    const btnEdit = document.getElementById('btnTabEdit');
    const btnLaporan = document.getElementById('btnTabLaporan');

    [tabInput, tabEdit, tabLaporan].forEach(t => t.classList.remove('active'));
    [btnInput, btnEdit, btnLaporan].forEach(b => {
        b.classList.remove('bg-slate-100', 'dark:bg-white/10', 'text-[#0a84ff]');
    });

    if(tabName === 'input') {
        tabInput.classList.add('active');
        btnInput.classList.add('bg-slate-100', 'dark:bg-white/10', 'text-[#0a84ff]');
    } else if(tabName === 'edit') {
        tabEdit.classList.add('active');
        btnEdit.classList.add('bg-slate-100', 'dark:bg-white/10', 'text-[#0a84ff]');
        updateDropdownEditTab();
    } else {
        tabLaporan.classList.add('active');
        btnLaporan.classList.add('bg-slate-100', 'dark:bg-white/10', 'text-[#0a84ff]');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    document.getElementById('btnDarkMode').innerHTML = isDark ? '☀️ <span>Mode Terang</span>' : '🌙 <span>Mode Gelap</span>';
}

async function tambahBaris() {
    const tanggalInput = document.getElementById('inputTanggal').value;
    const uraian = document.getElementById('inputUraian').value;
    const fotoInput = document.getElementById('inputFoto');

    if(!tanggalInput || !uraian) { showToast('⚠️ Isi Tanggal dan Uraian terlebih dahulu!'); return; }
    
    const dateObj = new Date(tanggalInput);
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const formatTgl = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    const labelBulan = `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    let fotoBase64 = '';
    if(fotoInput.files && fotoInput.files[0]) {
        showToast('⏳ Memproses kompresi foto...'); 
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = async function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600; 
                let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height = Math.round(height * (MAX_WIDTH / width)); width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                fotoBase64 = canvas.toDataURL('image/jpeg', 0.5); 
                await simpanDataBaru(namaHari[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(fotoInput.files[0]);
    } else {
        await simpanDataBaru(namaHari[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
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
    
    if(idx === "") {
        container.classList.add('hidden');
        return;
    }

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

    if(!tglInput || !uraian) { showToast('⚠️ Isi Tanggal dan Uraian terlebih dahulu!'); return; }

    const dateObj = new Date(tglInput);
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const formatTgl = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    const labelBulan = `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    let fotoBase64 = dataLaporan[idx].foto;

    if(fotoInput.files && fotoInput.files[0]) {
        showToast('⏳ Memproses kompresi foto...'); 
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = async function() {
                const canvas = document.getElementById('canvasTemp') || document.createElement('canvas');
                const MAX_WIDTH = 600;
                let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height = Math.round(height * (MAX_WIDTH / width)); width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                fotoBase64 = canvas.toDataURL('image/jpeg', 0.5); 
                
                finalizeEdit(idx, namaHari[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(fotoInput.files[0]);
    } else {
        finalizeEdit(idx, namaHari[dateObj.getDay()], formatTgl, uraian, fotoBase64, labelBulan);
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
    if (confirm(`Hapus permanen laporan tanggal ${dataLaporan[idx].tanggal}?`)) {
        dataLaporan.splice(idx, 1);
        await localforage.setItem('laporanPKL', dataLaporan);
        dataTelahBerubah = true;
        renderSemuaData(); 
        switchTab('laporan');
        showToast('Laporan berhasil dihapus! 🗑️');
    }
}

function resetFilterTanggal() {
    document.getElementById('filterTglMulai').value = '';
    document.getElementById('filterTglAkhir').value = '';
    renderSemuaData();
}

function updateStatistik(dataAktif) {
    document.getElementById('statTotalHari').innerText = dataAktif.length;
    document.getElementById('statTotalUraian').innerText = dataAktif.length;
    document.getElementById('statTotalFoto').innerText = dataAktif.filter(i => i.foto && i.foto.trim() !== '').length;
    const unikBulan = [...new Set(dataAktif.map(i => i.bulanLabel))].length;
    document.getElementById('statRataBulan').innerText = unikBulan > 0 ? (dataAktif.length / unikBulan).toFixed(1) : 0;
}

function renderSemuaData() {
    const wadahTabel = document.getElementById('wadahTabelBulan');
    wadahTabel.innerHTML = '';
    
    if (dataLaporan.length === 0) {
        wadahTabel.innerHTML = '<p class="text-center font-bold my-10 opacity-60">Belum ada data laporan.</p>';
        updateStatistik([]);
        return;
    }

    const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];
    const filter = document.getElementById('filterBulan');
    const nilaiFilterSblm = filter.value;
    filter.innerHTML = '<option value="SEMUA">Filter: Semua Bulan</option>';
    unikBulan.forEach(b => { filter.innerHTML += `<option value="${b}">${b}</option>`; });
    if([...filter.options].some(o => o.value === nilaiFilterSblm)) { filter.value = nilaiFilterSblm; }
    
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
        return;
    }

    const unikBulanFiltered = [...new Set(dataFiltered.map(i => i.bulanLabel))];

    unikBulanFiltered.forEach((bulan) => {
        const dataBulanIni = dataFiltered.filter(i => i.bulanLabel === bulan);
        if(dataBulanIni.length === 0) return;

        let htmlTabel = `
            <div class="block-bulan" style="page-break-before: always; break-before: page;">
                <div class="mb-4 text-base font-bold text-black pt-4">
                    <p>1. Laporan Kegiatan Harian</p><p>b. Bulan <span class="uppercase">${bulan}</span></p>
                </div>
                <div class="table-wrapper">
                    <table class="w-full text-black" style="color: black !important; border-collapse: collapse; width: 100%; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;">
                        <thead>
                            <tr style="page-break-inside: avoid; break-inside: avoid;">
                                <th style="border: 1px solid black; padding: 5px; width: 40px;">No</th>
                                <th style="border: 1px solid black; padding: 5px; width: 80px;">Hari</th>
                                <th style="border: 1px solid black; padding: 5px; width: 90px;">Tanggal</th>
                                <th style="border: 1px solid black; padding: 5px; width: 40%;">Uraian Kegiatan</th>
                                <th style="border: 1px solid black; padding: 5px; width: 100px;">Foto</th>
                            </tr>
                        </thead>
                    </table>`;

        dataBulanIni.forEach((item) => {
            const idxTampil = dataBulanIni.indexOf(item) + 1;

            htmlTabel += `
                <div class="row-block" style="page-break-inside: avoid !important; break-inside: avoid !important; margin-top: -1px;">
                    <table class="w-full text-black" style="color: black !important; border-collapse: collapse; width: 100%;">
                        <tbody>
                            <tr style="page-break-inside: avoid !important; break-inside: avoid !important;">
                                <td style="border: 1px solid black !important; padding: 5px; text-align: center; width: 40px;">${idxTampil}</td>
                                <td style="border: 1px solid black !important; padding: 5px; width: 80px;">${item.hari}</td>
                                <td style="border: 1px solid black !important; padding: 5px; width: 90px;">${item.tanggal}</td>
                                <td style="border: 1px solid black !important; padding: 5px; width: 40%;">${item.uraian}</td>
                                <td style="border: 1px solid black !important; padding: 5px; text-align: center; width: 100px;">
                                    ${item.foto ? `<img src="${item.foto}" style="max-height: 70px; page-break-inside: avoid;" class="mx-auto border border-gray-300">` : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>`;
        });
        wadahTabel.innerHTML += htmlTabel + `</div></div>`;
    });
}

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

function cekKonfirmasiHapus(inputEl) {
    const btn = document.getElementById('btnHapusSemuaData');
    if (inputEl.value.trim() === 'HAPUS') {
        btn.disabled = false;
        btn.classList.remove('bg-slate-300', 'dark:bg-gray-700', 'text-slate-500', 'cursor-not-allowed');
        btn.classList.add('bg-red-600', 'hover:bg-red-700', 'text-white', 'cursor-pointer', 'shadow-md');
    } else {
        btn.disabled = true;
        btn.classList.add('bg-slate-300', 'dark:bg-gray-700', 'text-slate-500', 'cursor-not-allowed');
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

function downloadPDF(opsiCover = 'dengan') {
    const elemenAsli = document.getElementById('areaCetak');
    const koverSection = document.getElementById('koverPrintSection');
    const pemisahHal = document.getElementById('pemisahHalPrint');

    if (opsiCover === 'tanpa') {
        if (koverSection) koverSection.style.display = 'none';
        if (pemisahHal) pemisahHal.style.display = 'none';
    } else {
        if (koverSection) koverSection.style.display = 'block';
        if (pemisahHal) pemisahHal.style.display = 'block';
    }

    elemenAsli.classList.add('pdf-export-mode'); 
    elemenAsli.style.display = 'block';
    
    showToast("⏳ Sedang memproses PDF...");

    html2pdf().set({
        margin: [12, 10, 12, 10], 
        filename: `Laporan_PKL_${dataProfil.nama || 'LUKYY'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'], avoid: ['.row-block', 'tr', 'td', 'img'] }
    }).from(elemenAsli).save().then(() => {
        elemenAsli.classList.remove('pdf-export-mode');
        elemenAsli.style.display = '';
        if (koverSection) koverSection.style.display = '';
        if (pemisahHal) pemisahHal.style.display = '';
        showToast("PDF berhasil di-download! 📥");
    });
}
