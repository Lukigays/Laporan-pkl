// ============================================================
// AUTENTIKASI & SINKRONISASI CLOUD (Supabase)
// ============================================================

function initAuth() {
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

// ---------- Login dengan Google (OAuth) ----------
async function prosesLoginGoogle() {
    if (!supabaseClient) {
        showToast("⚠️ Koneksi cloud belum tersedia!");
        return;
    }

    showToast("⏳ Membuka login Google...");

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });

    if (error) {
        console.error("Google Login Error:", error);
        showToast("❌ Gagal login Google: " + error.message);
    }
    // Jika sukses, browser akan redirect ke halaman Google login,
    // lalu kembali ke aplikasi. initAuth() akan otomatis menangani session.
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
    if (!pass || pass.length < 6) { showToast('⚠️ Password minimal 6 karakter!'); return; }
    showToast("⏳ Memperbarui password...");
    const { error } = await supabaseClient.auth.updateUser({ password: pass });
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

// ---------- Login / Register / Lupa Password / Logout ----------
async function prosesLoginAuth() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) { showToast('⚠️ Isi email dan password!'); return; }

    showToast("⏳ Memproses masuk...");
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        console.error("Auth Login Error:", error);
        if (error.message.includes("Email not confirmed")) {
            showToast("❌ Email belum dikonfirmasi! Cek kotak masuk/spam email Anda.");
        } else if (error.message.includes("Invalid login credentials")) {
            showToast("❌ Email atau password salah!");
        } else {
            showToast("❌ Gagal login: " + error.message);
        }
    } else {
        // Set user aktif langsung dari respon login
        currentUser = data.user;
        updateAuthUI();
        tutupModalAuth();
        showToast("Berhasil Masuk! 🔓");

        // Konfirmasi sebelum menarik data agar data lokal tidak tertimpa tanpa sengaja
        setTimeout(() => {
            if (confirm("Apakah Anda ingin menarik & mengganti data laporan lokal dengan data dari Cloud?")) {
                tarikDariCloud();
            }
        }, 500);
    }
}

async function prosesRegisterAuth() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) { showToast('⚠️ Isi email dan password!'); return; }
    
    showToast("⏳ Mendaftarkan akun...");
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    
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

async function prosesLupaPassword() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    const email = document.getElementById('authEmail').value.trim();
    if (!email) { showToast('⚠️ Isi alamat email terlebih dahulu!'); return; }
    showToast("⏳ Mengirim link reset password...");
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) { showToast("❌ " + error.message); }
    else { showToast("✅ Link reset password telah dikirim!"); }
}

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
