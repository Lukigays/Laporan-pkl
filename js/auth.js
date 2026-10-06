// ============================================================
// AUTENTIKASI & SINKRONISASI CLOUD (Supabase) — FIXED
// ============================================================

function initAuth() {
    bersihkanUrlOAuth();

    if (supabaseClient) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            currentUser = session?.user || null;
            updateAuthUI();
        });
        supabaseClient.auth.onAuthStateChange((event, session) => {
            currentUser = session?.user || null;
            updateAuthUI();
            if (event === 'PASSWORD_RECOVERY') bukaModalResetPassword();
        });
    } else {
        updateAuthUI();
    }
}

// ---------- Bersihkan URL setelah redirect Google ----------
function bersihkanUrlOAuth() {
    if (window.location.hash.includes('access_token=') || 
        window.location.hash.includes('refresh_token=') ||
        window.location.hash.includes('error=')) {
        
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
        
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            const url = new URL(link.href);
            url.searchParams.set('_', Date.now());
            link.href = url.toString();
        });
    }
}

// ---------- Loading State Helper (ROBUST) ----------
const authLoadingState = {
    btnLogin: null,
    btnRegister: null,
    btnGoogle: null,
    btnLupa: null
};

function setBtnLoading(btnKey, isLoading, customHTML) {
    const btn = authLoadingState[btnKey];
    if (!btn) return;
    
    if (isLoading) {
        if (!btn.dataset.originalHtml) {
            btn.dataset.originalHtml = btn.innerHTML;
        }
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';
        btn.innerHTML = customHTML || `
            <span class="flex items-center justify-center gap-2">
                <svg class="animate-spin" style="width:18px;height:18px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style="opacity:0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path style="opacity:0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Memproses...</span>
            </span>`;
    } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        delete btn.dataset.originalHtml;
    }
}

function resetAllAuthButtons() {
    ['btnLogin', 'btnRegister', 'btnGoogle', 'btnLupa'].forEach(key => {
        setBtnLoading(key, false);
    });
    const inputs = document.querySelectorAll('#modalAuth input');
    inputs.forEach(el => el.disabled = false);
}

// ---------- Shake Input ----------
function shakeInput(element) {
    if (!element) return;
    element.classList.remove('animate-shake');
    void element.offsetWidth; // trigger reflow
    element.classList.add('animate-shake');
    element.style.borderColor = 'rgba(239,68,68,0.8)';
    setTimeout(() => {
        element.classList.remove('animate-shake');
        element.style.borderColor = '';
    }, 500);
}

// ---------- Login dengan Google ----------
async function prosesLoginGoogle() {
    if (!supabaseClient) {
        showToast("⚠️ Koneksi cloud belum tersedia!");
        return;
    }

    const btn = document.querySelector('#modalAuth .btn-google');
    authLoadingState.btnGoogle = btn;
    
    setBtnLoading('btnGoogle', true, `
        <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin" style="width:18px;height:18px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style="opacity:0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path style="opacity:0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Membuka Google...</span>
        </span>`);

    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) throw error;
        // Jika sukses, browser akan redirect. Tidak perlu reset loading.
    } catch (error) {
        console.error("Google Login Error:", error);
        showToast("❌ Gagal login Google: " + error.message);
        setBtnLoading('btnGoogle', false);
    }
}

// ---------- Reset Password ----------
function bukaModalResetPassword() {
    const modal = document.getElementById('modalResetPassword');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

async function simpanPasswordBaru() {
    const passInput = document.getElementById('newPasswordInput');
    const pass = passInput.value;
    const btn = document.querySelector('#modalResetPassword button[onclick="simpanPasswordBaru()"]');
    
    if (!pass || pass.length < 6) { 
        shakeInput(passInput);
        showToast('⚠️ Password minimal 6 karakter!'); 
        return; 
    }
    
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="flex items-center justify-center gap-2"><svg class="animate-spin" style="width:16px;height:16px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style="opacity:0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path style="opacity:0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Menyimpan...</span></span>`;
    
    showToast("⏳ Memperbarui password...");
    
    try {
        const { error } = await supabaseClient.auth.updateUser({ password: pass });
        if (error) throw error;
        
        document.getElementById('modalResetPassword').classList.add('opacity-0');
        setTimeout(() => document.getElementById('modalResetPassword').classList.add('hidden'), 300);
        showToast("🎉 Password berhasil diperbarui!");
    } catch (error) {
        showToast("❌ " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

// ---------- UI status auth ----------
function updateAuthUI() {
    const label = document.getElementById('labelStatusAuth');
    const btnIn = document.getElementById('wrapperTombolAuth');
    const btnSync = document.getElementById('wrapperTombolSync');
    if (!label || !btnIn || !btnSync) return;

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

// ---------- Modal Auth ----------
function bukaModalAuth() {
    if (typeof tutupSemuaModal === 'function') tutupSemuaModal('modalAuth');
    const modal = document.getElementById('modalAuth');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function tutupModalAuth() {
    const modal = document.getElementById('modalAuth');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ---------- Login Email ----------
async function prosesLoginAuth() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    
    // Cari tombol spesifik lewat onclick attribute
    const allBtns = document.querySelectorAll('#modalAuth button');
    let btn = null;
    allBtns.forEach(b => {
        if (b.getAttribute('onclick') === 'prosesLoginAuth()') btn = b;
    });
    authLoadingState.btnLogin = btn;
    
    const email = emailInput.value.trim();
    const password = passInput.value;
    
    if (!email || !password) { 
        if (!email) shakeInput(emailInput);
        if (!password) shakeInput(passInput);
        showToast('⚠️ Isi email dan password!'); 
        return; 
    }

    setBtnLoading('btnLogin', true);
    if (authLoadingState.btnRegister) setBtnLoading('btnRegister', true);
    if (authLoadingState.btnGoogle) setBtnLoading('btnGoogle', true);
    
    // Disable inputs
    emailInput.disabled = true;
    passInput.disabled = true;
    
    showToast("⏳ Memproses masuk...");
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        
        if (error) {
            if (error.message.includes("Email not confirmed")) {
                showToast("❌ Email belum dikonfirmasi! Cek kotak masuk/spam email Anda.");
            } else if (error.message.includes("Invalid login credentials")) {
                shakeInput(emailInput);
                shakeInput(passInput);
                showToast("❌ Email atau password salah!");
            } else {
                showToast("❌ Gagal login: " + error.message);
            }
            return;
        }
        
        currentUser = data.user;
        updateAuthUI();
        tutupModalAuth();
        showToast("Berhasil Masuk! 🔓");

        setTimeout(() => {
            if (confirm("Apakah Anda ingin menarik & mengganti data laporan lokal dengan data dari Cloud?")) {
                tarikDariCloud();
            }
        }, 500);
        
    } catch (err) {
        showToast("❌ Terjadi kesalahan: " + err.message);
    } finally {
        resetAllAuthButtons();
        emailInput.disabled = false;
        passInput.disabled = false;
    }
}

// ---------- Register ----------
async function prosesRegisterAuth() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    
    const allBtns = document.querySelectorAll('#modalAuth button');
    let btn = null;
    allBtns.forEach(b => {
        if (b.getAttribute('onclick') === 'prosesRegisterAuth()') btn = b;
    });
    authLoadingState.btnRegister = btn;
    
    const email = emailInput.value.trim();
    const password = passInput.value;
    
    if (!email || !password) { 
        if (!email) shakeInput(emailInput);
        if (!password) shakeInput(passInput);
        showToast('⚠️ Isi email dan password!'); 
        return; 
    }
    
    setBtnLoading('btnRegister', true);
    if (authLoadingState.btnLogin) setBtnLoading('btnLogin', true);
    
    emailInput.disabled = true;
    passInput.disabled = true;
    
    showToast("⏳ Mendaftarkan akun...");
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        
        if (error) throw error;
        
        tutupModalAuth();
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            showToast("⚠️ Email ini sudah terdaftar! Silakan langsung login.");
        } else {
            showToast("Akun berhasil dibuat! Silakan cek email/langsung login. 🎉");
        }
    } catch (error) {
        showToast("❌ " + error.message);
    } finally {
        resetAllAuthButtons();
        emailInput.disabled = false;
        passInput.disabled = false;
    }
}

// ---------- Lupa Password ----------
async function prosesLupaPassword() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    
    const emailInput = document.getElementById('authEmail');
    const email = emailInput.value.trim();
    
    const allBtns = document.querySelectorAll('#modalAuth button');
    let btn = null;
    allBtns.forEach(b => {
        if (b.getAttribute('onclick') === 'prosesLupaPassword()') btn = b;
    });
    authLoadingState.btnLupa = btn;
    
    if (!email) { 
        shakeInput(emailInput);
        showToast('⚠️ Isi alamat email terlebih dahulu!'); 
        return; 
    }
    
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-pulse">⏳ Mengirim...</span>`;
    
    try {
        showToast("⏳ Mengirim link reset password...");
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        showToast("✅ Link reset password telah dikirim!");
    } catch (error) {
        showToast("❌ " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

// ---------- Logout ----------
async function logoutAuth() {
    if (!supabaseClient) return;
    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        updateAuthUI();
        showToast("Keluar akun berhasil.");
    } catch (e) { console.error(e); }
}

// ---------- Sinkronisasi Cloud ----------
let sinkronisasiCloudSedangBerjalan = false;
const HALAMAN_BACA_CLOUD = 100;
const BATCH_HAPUS_CLOUD = 25;
const BATCH_INSERT_CLOUD = 8;
const BATAS_BYTE_BATCH_CLOUD = 350 * 1024;
const BATAS_FOTO_CLOUD = 256 * 1024;
const MAKS_PERCOBAAN_SYNC_CLOUD = 3;

function tungguSyncCloud(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function errorSyncBisaDicobaUlang(error) {
    const teks = [error && error.message, error && error.details, error && error.hint]
        .filter(Boolean).join(' ').toLowerCase();
    const status = Number(error && (error.status || error.statusCode));
    return error && (String(error.code) === '57014' || error.name === 'AbortError')
        || [408, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524].includes(status)
        || /failed to fetch|fetch failed|load failed|networkerror|network request failed|network unreachable|connection reset|statement timeout|timed out|temporarily unavailable|gateway timeout/.test(teks);
}

function keteranganErrorSyncCloud(error) {
    const teks = [error && error.message, error && error.details, error && error.hint]
        .filter(Boolean).join(' ');
    const rendah = teks.toLowerCase();
    if (error && String(error.code) === '57014' || /statement timeout|canceling statement due to statement timeout/.test(rendah)) {
        return 'Database Supabase kehabisan waktu memproses data. Data lokal tetap aman; coba lagi. Jika berulang, jalankan SQL index laporan_pkl_user_id_id_idx yang disertakan.';
    }
    if (/failed to fetch|fetch failed|load failed|networkerror|network request failed|network unreachable|connection reset/.test(rendah)) {
        return 'Koneksi ke Supabase gagal. Periksa internet/URL Supabase lalu coba lagi; data lokal tetap aman.';
    }
    return teks || 'Terjadi kesalahan yang tidak diketahui.';
}

async function jalankanPermintaanCloudDenganRetry(request, label = 'permintaan cloud') {
    let errorTerakhir;
    for (let percobaan = 1; percobaan <= MAKS_PERCOBAAN_SYNC_CLOUD; percobaan++) {
        try {
            const hasil = await request();
            if (hasil && hasil.error) throw hasil.error;
            return hasil;
        } catch (err) {
            errorTerakhir = err;
            if (!errorSyncBisaDicobaUlang(err) || percobaan === MAKS_PERCOBAAN_SYNC_CLOUD) break;
            console.warn(`${label} gagal pada percobaan ${percobaan}; akan dicoba ulang:`, err);
            showToast(`⚠️ Koneksi cloud lambat. Mengulang ${label} (${percobaan + 1}/${MAKS_PERCOBAAN_SYNC_CLOUD})...`);
            await tungguSyncCloud(700 * Math.pow(2, percobaan - 1));
        }
    }
    throw errorTerakhir;
}

function pecahArray(array, ukuran) {
    const hasil = [];
    for (let i = 0; i < array.length; i += ukuran) hasil.push(array.slice(i, i + ukuran));
    return hasil;
}

function ukuranTeksUtf8(teks) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(teks).length;
    return teks.length * 2;
}

function buatBatchInsertCloud(baris) {
    const hasil = [];
    let current = [];
    let currentBytes = 2;
    for (const row of baris) {
        const bytes = ukuranTeksUtf8(JSON.stringify(row)) + 1;
        if (current.length && (current.length >= BATCH_INSERT_CLOUD || currentBytes + bytes > BATAS_BYTE_BATCH_CLOUD)) {
            hasil.push(current);
            current = [];
            currentBytes = 2;
        }
        current.push(row);
        currentBytes += bytes;
    }
    if (current.length) hasil.push(current);
    return hasil;
}

async function siapkanBarisLaporanCloud(userId, snapshotLokal) {
    const hasil = [];
    for (const item of snapshotLokal) {
        let foto = item.foto;
        // Foto lokal beresolusi tinggi dapat membuat request Supabase terlalu besar.
        // Kecilkan hanya salinan cloud; file lokal asli tidak disentuh.
        if (typeof foto === 'string' && foto.startsWith('data:image/') && foto.length > BATAS_FOTO_CLOUD
            && typeof kompresGambarRingan === 'function') {
            try {
                for (const [maksDimensi, kualitas] of [[900, 0.72], [600, 0.6], [400, 0.5]]) {
                    if (foto.length <= BATAS_FOTO_CLOUD) break;
                    const fotoLebihRingan = await kompresGambarRingan(foto, maksDimensi, kualitas);
                    if (typeof fotoLebihRingan === 'string' && fotoLebihRingan.length < foto.length) foto = fotoLebihRingan;
                }
            } catch (err) {
                console.warn(`Foto tanggal ${item.tanggal} gagal diperkecil untuk cloud; memakai versi lokal.`, err);
            }
        }
        hasil.push({
            user_id: userId,
            hari: item.hari,
            tanggal: item.tanggal,
            uraian: item.uraian,
            foto,
            bulan_label: item.bulanLabel
        });
    }
    return hasil;
}

async function ambilSemuaIdLaporanCloud(userId) {
    const semua = [];
    for (let offset = 0; ; offset += HALAMAN_BACA_CLOUD) {
        const { data, error } = await supabaseClient
            .from('laporan_pkl')
            .select('id')
            .eq('user_id', userId)
            .order('id', { ascending: true })
            .range(offset, offset + HALAMAN_BACA_CLOUD - 1);
        if (error) throw error;
        if (!Array.isArray(data)) throw new Error('Respons daftar laporan cloud tidak valid.');
        semua.push(...data.filter(row => row && row.id !== null && row.id !== undefined).map(row => row.id));
        if (data.length < HALAMAN_BACA_CLOUD) break;
    }
    return semua;
}

async function sinkronisasiCloudSatuPutaran(userId, baris) {
    // Jangan jalankan DELETE user_id sekaligus: ambil ID berpaginasi lalu hapus kecil-kecil.
    const idLama = await ambilSemuaIdLaporanCloud(userId);
    for (const batchId of pecahArray(idLama, BATCH_HAPUS_CLOUD)) {
        const { data, error } = await supabaseClient
            .from('laporan_pkl')
            .delete()
            .eq('user_id', userId)
            .in('id', batchId)
            .select('id');
        if (error) throw error;
        if (!Array.isArray(data) || data.length !== batchId.length) {
            throw new Error(`Supabase hanya menghapus ${Array.isArray(data) ? data.length : 0} dari ${batchId.length} baris. Periksa policy DELETE/RLS tabel laporan_pkl.`);
        }
    }

    // Insert dibatasi jumlah baris dan total ukuran payload agar foto tidak memicu timeout.
    for (const batch of buatBatchInsertCloud(baris)) {
        const { error } = await supabaseClient.from('laporan_pkl').insert(batch);
        if (error) throw error;
    }
}

function snapshotLaporanCloud() {
    return (Array.isArray(dataLaporan) ? dataLaporan : []).map(item => ({
        hari: item && item.hari,
        tanggal: item && item.tanggal,
        uraian: item && item.uraian,
        foto: item && item.foto,
        bulanLabel: item && item.bulanLabel
    }));
}

function laporanCloudBelumBerubah(snapshot) {
    if (!Array.isArray(dataLaporan) || dataLaporan.length !== snapshot.length) return false;
    return dataLaporan.every((item, index) => {
        const awal = snapshot[index];
        return item && item.hari === awal.hari && item.tanggal === awal.tanggal
            && item.uraian === awal.uraian && item.foto === awal.foto
            && item.bulanLabel === awal.bulanLabel;
    });
}

async function simpanKeCloud(opsi = {}) {
    const senyap = !!opsi.senyap;
    if (!supabaseClient || !currentUser) {
        if (!senyap) showToast('⚠️ Belum login akun cloud!');
        return;
    }
    if (sinkronisasiCloudSedangBerjalan) {
        if (!senyap) showToast('⏳ Sinkronisasi cloud sedang berjalan, tunggu sebentar.');
        return;
    }

    sinkronisasiCloudSedangBerjalan = true;
    const userId = currentUser.id;
    const snapshotLokal = snapshotLaporanCloud();
    if (!senyap) showToast('⏳ Menyiapkan data dan menyimpan ke Cloud...');

    try {
        const baris = await siapkanBarisLaporanCloud(userId, snapshotLokal);
        let errorTerakhir = null;
        for (let percobaan = 1; percobaan <= MAKS_PERCOBAAN_SYNC_CLOUD; percobaan++) {
            try {
                // Setiap percobaan mengulang satu siklus penuh. Ini aman jika fetch
                // putus setelah server sempat menerima sebagian insert: percobaan baru
                // membaca dan membersihkan ID yang sudah ada sebelum mengirim ulang.
                await sinkronisasiCloudSatuPutaran(userId, baris);
                errorTerakhir = null;
                break;
            } catch (err) {
                errorTerakhir = err;
                if (!errorSyncBisaDicobaUlang(err) || percobaan === MAKS_PERCOBAAN_SYNC_CLOUD) break;
                console.warn(`Sinkronisasi cloud gagal pada percobaan ${percobaan}; akan dicoba ulang:`, err);
                if (!senyap) showToast(`⚠️ Koneksi/server lambat. Mencoba ulang ${percobaan + 1}/${MAKS_PERCOBAAN_SYNC_CLOUD}...`);
                await tungguSyncCloud(700 * Math.pow(2, percobaan - 1));
            }
        }
        if (errorTerakhir) throw errorTerakhir;

        dataTelahBerubah = !laporanCloudBelumBerubah(snapshotLokal);
        if (!senyap) showToast(`✅ ${baris.length} laporan berhasil disinkronkan ke Cloud!`);
    } catch (err) {
        console.error('Gagal sinkronisasi ke Cloud:', err);
        showToast(`❌ Gagal sinkronisasi: ${keteranganErrorSyncCloud(err)}`);
        // Tetap dirty agar sinkronisasi otomatis berikutnya bisa mencoba ulang.
        dataTelahBerubah = true;
    } finally {
        sinkronisasiCloudSedangBerjalan = false;
    }
}

async function autoSyncKeCloud() {
    if (currentUser && dataTelahBerubah && supabaseClient) simpanKeCloud({ senyap: true });
}

async function tarikDariCloud() {
    if (!supabaseClient || !currentUser) {
        showToast('⚠️ Belum login akun cloud!');
        return;
    }
    if (sinkronisasiCloudSedangBerjalan) {
        showToast('⏳ Tunggu sinkronisasi yang sedang berjalan selesai dulu.');
        return;
    }
    sinkronisasiCloudSedangBerjalan = true;
    const userId = currentUser.id;
    const ukuranHalaman = 20; // respons berisi foto Base64, jadi jangan tarik ribuan baris sekaligus
    const semuaBaris = [];
    showToast('⏳ Mengambil data Cloud per halaman...');

    try {
        for (let offset = 0; ; offset += ukuranHalaman) {
            const hasil = await jalankanPermintaanCloudDenganRetry(() => supabaseClient
                .from('laporan_pkl')
                .select('*')
                .eq('user_id', userId)
                .order('id', { ascending: true })
                .range(offset, offset + ukuranHalaman - 1), 'unduhan halaman cloud');
            const halaman = hasil && hasil.data;
            if (!Array.isArray(halaman)) throw new Error('Respons data Cloud tidak valid.');
            semuaBaris.push(...halaman);
            if (halaman.length < ukuranHalaman) break;
        }

        if (semuaBaris.length > 0) {
            const laporanBaru = semuaBaris.map(row => ({
                hari: row.hari,
                tanggal: row.tanggal,
                uraian: row.uraian,
                foto: row.foto,
                bulanLabel: row.bulan_label
            }));
            await localforage.setItem('laporanPKL', laporanBaru);
            dataLaporan = laporanBaru;
            dataTelahBerubah = false;
            renderSemuaData();
            showToast(`✅ ${laporanBaru.length} laporan berhasil ditarik dari Cloud!`);
        } else {
            showToast('⚠️ Belum ada data tersimpan di akun cloud Anda. Data lokal tidak diubah.');
        }
    } catch (err) {
        console.error('Gagal tarik cloud:', err);
        showToast(`❌ Gagal mengambil data Cloud: ${keteranganErrorSyncCloud(err)}`);
    } finally {
        sinkronisasiCloudSedangBerjalan = false;
    }
}
