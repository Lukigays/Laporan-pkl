// ============================================================
// UTILITAS: Toast, Kompresi Gambar Cepat, Helper Tanggal
// ============================================================

let toastTimeoutId = null;

// ---------- Toast notifikasi ----------
function showToast(message) {
    const container = document.getElementById('toast-container');
    const msgEl = document.getElementById('toast-message');
    if (!container || !msgEl) return;
    msgEl.innerText = message;
    container.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    toastTimeoutId = setTimeout(() => {
        container.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
    }, 2200);
}

// ---------- Modal: tutup modal lain agar tidak bertumpuk ----------
function tutupSemuaModal(kecualiId) {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        if (kecualiId && m.id === kecualiId) return;
        m.classList.add('hidden', 'opacity-0');
    });
}

// ---------- Resize elemen gambar/bitmap ke Base64 JPEG ----------
function gambarKeBase64Terukur(sumber, widthAsli, heightAsli, maxDimensi = 800, kualitas = 0.75) {
    let width = widthAsli;
    let height = heightAsli;

    if (width > height) {
        if (width > maxDimensi) {
            height = Math.round(height * (maxDimensi / width));
            width = maxDimensi;
        }
    } else if (height > maxDimensi) {
        width = Math.round(width * (maxDimensi / height));
        height = maxDimensi;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(sumber, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', kualitas);
}

// ---------- Kompresi gambar ringan berbasis canvas ----------
function kompresGambarRingan(dataBase64, maxDimensi = 800, kualitas = 0.75) {
    return new Promise((resolve) => {
        if (!dataBase64 || !dataBase64.startsWith('data:image')) {
            resolve(dataBase64);
            return;
        }

        const timeoutId = setTimeout(() => {
            resolve(dataBase64);
        }, 6000);

        const img = new Image();
        img.onload = function() {
            clearTimeout(timeoutId);
            try {
                resolve(gambarKeBase64Terukur(img, img.width, img.height, maxDimensi, kualitas));
            } catch (err) {
                resolve(dataBase64);
            }
        };
        img.onerror = function() {
            clearTimeout(timeoutId);
            resolve(dataBase64);
        };
        img.src = dataBase64;
    });
}

// ---------- Ambil gambar (base64 / URL) untuk PDF ----------
async function getImageBase64ForPdf(source, maxDimensi = 500, kualitas = 0.75) {
    if (source && source.startsWith('data:image')) {
        return await kompresGambarRingan(source, maxDimensi, kualitas);
    }
    if (source && source.startsWith('http')) {
        try {
            const response = await fetch(source, { mode: 'cors' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const blob = await response.blob();
            if (typeof createImageBitmap === 'function') {
                const bitmap = await createImageBitmap(blob);
                const hasil = gambarKeBase64Terukur(bitmap, bitmap.width, bitmap.height, maxDimensi, kualitas);
                if (typeof bitmap.close === 'function') bitmap.close();
                return hasil;
            }
        } catch (err) {
            // Lanjut ke fallback Image
        }
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function() {
                try {
                    resolve(gambarKeBase64Terukur(img, img.width, img.height, maxDimensi, kualitas));
                } catch (e) {
                    resolve(null);
                }
            };
            img.onerror = function() { resolve(null); };
            setTimeout(() => resolve(null), 5000);
            img.src = source;
        });
    }
    return null;
}

// ---------- Baca file lalu kompres (SANGAT CEPAT via createImageBitmap / ObjectURL) ----------
async function bacaDanKompresFile(file, maxDimensi = 850, kualitas = 0.76) {
    if (!file) return '';

    // Jalur tercepat: decode langsung dari Blob di thread native browser
    if (typeof createImageBitmap === 'function') {
        try {
            const bitmap = await createImageBitmap(file);
            const hasil = gambarKeBase64Terukur(bitmap, bitmap.width, bitmap.height, maxDimensi, kualitas);
            if (typeof bitmap.close === 'function') bitmap.close();
            return hasil;
        } catch (e) {
            // Fallback ke ObjectURL bila format file tidak didukung createImageBitmap
        }
    }

    // Jalur cepat kedua: ObjectURL tanpa konversi FileReader Base64 mentah
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        return new Promise((resolve, reject) => {
            const objUrl = URL.createObjectURL(file);
            const img = new Image();
            img.onload = function() {
                URL.revokeObjectURL(objUrl);
                try {
                    resolve(gambarKeBase64Terukur(img, img.width, img.height, maxDimensi, kualitas));
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = function() {
                URL.revokeObjectURL(objUrl);
                reject(new Error('Gagal memuat gambar'));
            };
            img.src = objUrl;
        });
    }

    // Fallback terakhir untuk browser sangat lama
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const hasil = await kompresGambarRingan(e.target.result, maxDimensi, kualitas);
                resolve(hasil);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
    });
}

// ---------- Escape HTML ----------
function escapeHtml(teks) {
    return String(teks == null ? '' : teks)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ---------- Helper tanggal ----------
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatTanggalIndo(dateObj) {
    return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
}

function labelBulanIndo(dateObj) {
    return `${NAMA_BULAN[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}
