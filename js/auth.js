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
async function simpanKeCloud() {
    if (!supabaseClient || !currentUser) { showToast('⚠️ Belum login akun cloud!'); return; }
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
    } catch (err) {
        showToast("❌ Gagal sinkronisasi: " + err.message);
    }
}

async function autoSyncKeCloud() {
    if (currentUser && dataTelahBerubah && supabaseClient) simpanKeCloud();
}

async function tarikDariCloud() {
    if (!supabaseClient || !currentUser) {
        showToast('⚠️ Belum login akun cloud!');
        return;
    }
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
            showToast("⚠️ Belum ada data tersimpan di akun cloud Anda.");
        }
    } catch (err) {
        console.error("Gagal tarik cloud:", err);
        showToast("❌ Gagal mengambil data dari cloud.");
    }
}
