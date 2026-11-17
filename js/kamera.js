// ============================================================
// FITUR KAMERA WEB & SIMPAN KE GALERI
// ============================================================

let streamKamera = null;
let targetInput = 'input'; // 'input' atau 'edit'
let hasilFotoBase64 = null;

async function bukaKamera(target) {
    if (typeof tutupSemuaModal === 'function') tutupSemuaModal('modalKamera');
    targetInput = target;
    const modal = document.getElementById('modalKamera');
    const video = document.getElementById('videoKamera');
    
    // Tampilkan modal terlebih dahulu
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    
    // Reset UI ke mode siap jepret
    ulangiFoto();

    try {
        // Minta akses kamera HP (Memprioritaskan kamera belakang jika tersedia)
        const constraints = {
            video: { facingMode: 'environment' }
        };
        streamKamera = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = streamKamera;
    } catch (err) {
        console.error("Error akses kamera:", err);
        showToast("❌ Gagal mengakses kamera. Pastikan izin kamera diberikan.");
        tutupKamera();
    }
}

function tutupKamera() {
    const modal = document.getElementById('modalKamera');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);

    // Matikan lampu/kamera
    if (streamKamera) {
        streamKamera.getTracks().forEach(track => track.stop());
        streamKamera = null;
    }
}

function ambilFoto() {
    const video = document.getElementById('videoKamera');
    const imgPreview = document.getElementById('previewHasilKamera');
    
    // Buat kanvas sementara untuk menangkap frame video
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Gambar frame saat ini ke kanvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Ubah gambar ke format base64
    hasilFotoBase64 = canvas.toDataURL('image/jpeg', 0.9);
    
    // Tampilkan hasil di tag img dan timpa video yang sedang berjalan
    imgPreview.src = hasilFotoBase64;
    imgPreview.classList.remove('hidden');
    
    // Ganti tombol UI ke mode hasil
    document.getElementById('kontrolKameraAktif').classList.add('hidden');
    document.getElementById('kontrolKameraHasil').classList.remove('hidden');
    document.getElementById('kontrolKameraHasil').classList.add('flex');
}

function ulangiFoto() {
    hasilFotoBase64 = null;
    document.getElementById('previewHasilKamera').classList.add('hidden');
    
    document.getElementById('kontrolKameraAktif').classList.remove('hidden');
    document.getElementById('kontrolKameraHasil').classList.add('hidden');
    document.getElementById('kontrolKameraHasil').classList.remove('flex');
}

function simpanKeGaleri() {
    if (!hasilFotoBase64) return;
    
    // Unduh sebagai file JPG agar tersimpan ke galeri HP
    const dateStr = new Date().toISOString().replace(/[:.-]/g, '');
    const fileName = `Foto_PKL_${dateStr}.jpg`;
    
    const link = document.createElement('a');
    link.href = hasilFotoBase64;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("⬇️ Foto sedang diunduh/disimpan ke galeri!");
}

function gunakanFoto() {
    if (!hasilFotoBase64) return;
    
    // Konversi Data Base64 menjadi objek File yang dikenali input type="file"
    const file = dataURLtoFile(hasilFotoBase64, 'kamera_pkl.jpg');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Tempelkan file ke input form yang sesuai
    if (targetInput === 'input') {
        document.getElementById('inputFoto').files = dataTransfer.files;
        if (typeof siapkanFotoCepat === 'function') siapkanFotoCepat('input');
    } else if (targetInput === 'edit') {
        document.getElementById('editFoto').files = dataTransfer.files;
        if (typeof siapkanFotoCepat === 'function') siapkanFotoCepat('edit');
    }
    
    showToast("✅ Foto berhasil dipasang ke form laporan!");
    tutupKamera();
}

// Helper untuk konversi Data URL Base64 ke File Object
function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
        
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}
