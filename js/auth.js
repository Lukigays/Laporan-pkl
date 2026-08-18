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

// ---------- Reset Password ----------
function bukaModalResetPassword() {
    const modal = document.getElementById('modalResetPassword');
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
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function tutupModalAuth() {
    const modal = document.getElementById('modalAuth');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ---------- Login / Register / Lupa Password / Logout ----------
async function prosesLoginAuth() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) { showToast('⚠️ Isi email dan password!'); return; }
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) { showToast("❌ " + error.message); }
    else { tutupModalAuth(); showToast("Berhasil Masuk! 🔓"); tarikDariCloud(); }
}

async function prosesRegisterAuth() {
    if (!supabaseClient) { showToast("⚠️ Koneksi cloud belum tersedia!"); return; }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) { showToast('⚠️ Isi email dan password!'); return; }
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) { showToast("❌ " + error.message); }
    else { tutupModalAuth(); showToast("Akun berhasil dibuat! Silakan login. 🎉"); }
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
        showToast("Keluar akun berhasil.");
    } catch (e) { console.error(e); }
}

// ---------- Fungsi Bantuan Base64 ke Blob ----------
function base64ToBlob(base64, mime) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
}

// ---------- Sinkronisasi Cloud (Dengan Storage) ----------
async function simpanKeCloud() {
    if (!supabaseClient || !currentUser) { 
        showToast('⚠️ Belum login akun cloud!'); 
        return; 
    }
    
    showToast("⏳ Sedang mengunggah file ke Storage... (Harap bersabar)");

    try {
        // Hapus data lama di tabel database untuk di-refresh
        await supabaseClient.from('laporan_pkl').delete().eq('user_id', currentUser.id);

        const rowsToInsert = [];

        // Loop semua data laporan untuk mengecek gambar
        for (let i = 0; i < dataLaporan.length; i++) {
            let item = dataLaporan[i];
            let fotoUrl = item.foto;

            // Jika foto berupa Base64 (ditandai dengan 'data:image'), kita upload ke Storage
            if (fotoUrl && fotoUrl.startsWith('data:image')) {
                showToast(`📤 Upload foto ${i + 1} dari ${dataLaporan.length}...`);
                
                const mimeType = fotoUrl.match(/data:(.*?);/)[1];
                const fileBlob = base64ToBlob(fotoUrl, mimeType);
                const fileExt = mimeType.split('/')[1];
                // Nama file unik: id_user/timestamp_index.ext
                const fileName = `${currentUser.id}/${Date.now()}_${i}.${fileExt}`;

                // Upload ke bucket 'foto_pkl'
                const { data: uploadData, error: uploadError } = await supabaseClient
                    .storage
                    .from('foto_pkl')
                    .upload(fileName, fileBlob, { upsert: true });

                if (uploadError) throw uploadError;

                // Ambil Public URL dari file yang baru diupload
                const { data: publicUrlData } = supabaseClient
                    .storage
                    .from('foto_pkl')
                    .getPublicUrl(fileName);

                fotoUrl = publicUrlData.publicUrl;
                
                // Ganti data base64 lokal dengan URL public agar selamanya ringan
                dataLaporan[i].foto = fotoUrl; 
            }

            // Siapkan data teks yang sudah sangat ringan untuk database
            rowsToInsert.push({
                user_id: currentUser.id,
                hari: item.hari,
                tanggal: item.tanggal,
                uraian: item.uraian,
                foto: fotoUrl, // Isinya sekarang hanya "https://..."
                bulan_label: item.bulanLabel
            });
        }

        // Simpan update URL ke penyimpanan lokal perangkat
        await localforage.setItem('laporanPKL', dataLaporan);

        // Upload data teks ke database tabel 'laporan_pkl'
        showToast("⏳ Menyimpan data teks ke database...");
        const chunkSize = 50; // Karena isi cuma teks pendek, kirim 50 sekaligus sangat aman
        for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
            const chunk = rowsToInsert.slice(i, i + chunkSize);
            const { error } = await supabaseClient.from('laporan_pkl').insert(chunk);
            if (error) throw error;
        }

        dataTelahBerubah = false;
        showToast("✅ Sinkronisasi Cloud sukses 100%!");
        
    } catch (err) {
        console.error("Error upload:", err);
        showToast("❌ Gagal: " + err.message);
    }
}

async function autoSyncKeCloud() {
    if (currentUser && dataTelahBerubah && supabaseClient) simpanKeCloud();
}

async function tarikDariCloud() {
    if (!supabaseClient || !currentUser) return;
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
            showToast("⚠️ Belum ada data di cloud.");
        }
    } catch (err) {
        showToast("❌ Gagal mengambil data dari cloud.");
    }
}
