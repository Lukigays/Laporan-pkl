// ============================================================
// AUTENTIKASI & SINKRONISASI CLOUD (Supabase) + ANIMATED LOGIN
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

// ---------- Helper: Loading Animation ----------
function setLoading(button, isLoading, originalText) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = originalText || button.innerHTML;
        button.innerHTML = `
            <span class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Memproses...</span>
            </span>
        `;
        button.style.opacity = '0.8';
        button.style.cursor = 'wait';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || originalText;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// ---------- Helper: Shake Animation untuk Input Error ----------
function shakeInput(element) {
    if (!element) return;
    element.classList.add('animate-shake');
    element.style.borderColor = 'rgba(239,68,68,0.6)';
    setTimeout(() => {
        element.classList.remove('animate-shake');
        element.style.borderColor = '';
    }, 500);
}

// ---------- Helper: Disable/Enable semua input di modal ----------
function setModalInputsDisabled(disabled) {
    const inputs = document.querySelectorAll('#modalAuth input, #modalAuth button:not(.hover\\:text-accent-light)');
    inputs.forEach(el => {
        if (!el.classList.contains('btn-google') || disabled) {
            el.disabled = disabled;
            if (disabled) el.style.opacity = '0.6';
            else el.style.opacity = '1';
        }
    });
}

// ---------- Login dengan Google (OAuth) ----------
async function prosesLoginGoogle() {
    if (!supabaseClient) {
        showToast("⚠️ Koneksi cloud belum tersedia!");
        return;
    }

    const btn = document.querySelector('.btn-google');
    setLoading(btn, true, btn.innerHTML);
    setModalInputsDisabled(true);

    showToast("⏳ Membuka login Google...");

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            }
        }
    });

    if (error) {
        console.error("Google Login Error:", error);
        showToast("❌ Gagal login Google: " + error.message);
        setLoading(btn, false);
        setModalInputsDisabled(false);
    }
    // Jika sukses, browser akan redirect
}

// ---------- Reset Password ----------
function bukaModalResetPassword() {
    const modal = document.getElementById('modalResetPassword');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

async function simpanPasswordBaru() {
    const pass = document.getElementById('newPasswordInput').value;
    const btn = document.querySelector('#modalResetPassword button');
    
    if (!pass || pass.length < 6) { 
        shakeInput(document.getElementById('newPasswordInput'));
        showToast('⚠️ Password minimal 6 karakter!'); 
        return; 
    }
    
    setLoading(btn, true, btn.innerHTML);
    showToast("⏳ Memperbarui password...");
    
    const { error } = await supabaseClient.auth.updateUser({ password: pass });
    
    setLoading(btn, false);
    
    if (error) {
        showToast("❌ " + error.message);
    } else {
        document.getElementById('modalResetPassword').classList.add('opacity-0');
        setTimeout(() => document.getElementById('modalResetPassword').classList.add('hidden'), 300);
        showToast("🎉 Password berhasil diperbarui!");
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

// ---------- Login ----------
async function prosesLoginAuth() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    const btn = document.querySelector('#modalAuth .btn-primary');
    
    const email = emailInput.value.trim();
    const password = passInput.value;
    
    if (!email || !password) { 
        if (!email) shakeInput(emailInput);
        if (!password) shakeInput(passInput);
        showToast('⚠️ Isi email dan password!'); 
        return; 
    }

    setLoading(btn, true, btn.innerHTML);
    setModalInputsDisabled(true);
    showToast("⏳ Memproses masuk...");
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    setLoading(btn, false);
    setModalInputsDisabled(false);
    
    if (error) {
        console.error("Auth Login Error:", error);
        if (error.message.includes("Email not confirmed")) {
            showToast("❌ Email belum dikonfirmasi! Cek kotak masuk/spam email Anda.");
        } else if (error.message.includes("Invalid login credentials")) {
            shakeInput(emailInput);
            shakeInput(passInput);
            showToast("❌ Email atau password salah!");
        } else {
            showToast("❌ Gagal login: " + error.message);
        }
    } else {
        currentUser = data.user;
        updateAuthUI();
        tutupModalAuth();
        showToast("Berhasil Masuk! 🔓");

        setTimeout(() => {
            if (confirm("Apakah Anda ingin menarik & mengganti data laporan lokal dengan data dari Cloud?")) {
                tarikDariCloud();
            }
        }, 500);
    }
}

// ---------- Register ----------
async function prosesRegisterAuth() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    const btn = document.querySelector('#modalAuth .btn-secondary');
    
    const email = emailInput.value.trim();
    const password = passInput.value;
    
    if (!email || !password) { 
        if (!email) shakeInput(emailInput);
        if (!password) shakeInput(passInput);
        showToast('⚠️ Isi email dan password!'); 
        return; 
    }
    
    setLoading(btn, true, btn.innerHTML);
    setModalInputsDisabled(true);
    showToast("⏳ Mendaftarkan akun...");
    
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    
    setLoading(btn, false);
    setModalInputsDisabled(false);
    
    if (error) {
        showToast("❌ " + error.message);
    } else {
        tutupModalAuth();
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            showToast("⚠️ Email ini sudah terdaftar! Silakan langsung login.");
        } else {
            showToast("Akun berhasil dibuat! Silakan cek email/langsung login. 🎉");
        }
    }
}

// ---------- Lupa Password ----------
async function prosesLupaPassword() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    
    const emailInput = document.getElementById('authEmail');
    const email = emailInput.value.trim();
    
    if (!email) { 
        shakeInput(emailInput);
        showToast('⚠️ Isi alamat email terlebih dahulu!'); 
        return; 
    }
    
    const btn = document.querySelector('#modalAuth button[onclick="prosesLupaPassword()"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="text-accent-light animate-pulse">⏳ Mengirim...</span>`;
    
    showToast("⏳ Mengirim link reset password...");
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    
    btn.disabled = false;
    btn.innerHTML = originalText;
    
    if (error) { showToast("❌ " + error.message); }
    else { showToast("✅ Link reset password telah dikirim!"); }
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
