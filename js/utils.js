// ============================================================
// UTILITAS: Toast, Kompresi Gambar, Helper Tanggal
// ============================================================

// ---------- Toast notifikasi ----------
function showToast(message) {
    const container = document.getElementById('toast-container');
    document.getElementById('toast-message').innerText = message;
    container.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
    setTimeout(() => {
        container.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
    }, 3500);
}

// ---------- Kompresi gambar ringan berbasis canvas ----------
function kompresGambarRingan(dataBase64, maxDimensi = 200, kualitas = 0.6) {
    return new Promise((resolve) => {
        if (!dataBase64 || !dataBase64.startsWith('data:image')) {
            resolve(dataBase64);
            return;
        }

        const timeoutId = setTimeout(() => {
            console.warn('Kompresi timeout, mengembalikan gambar asli');
            resolve(dataBase64);
        }, 10000);

        const img = new Image();
        img.onload = function() {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDimensi) {
                        height = Math.round(height * (maxDimensi / width));
                        width = maxDimensi;
                    }
                } else {
                    if (height > maxDimensi) {
                        width = Math.round(width * (maxDimensi / height));
                        height = maxDimensi;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                const result = canvas.toDataURL('image/jpeg', kualitas);
                resolve(result);
            } catch (err) {
                console.error('Error kompresi canvas:', err);
                resolve(dataBase64);
            }
        };
        img.onerror = function(err) {
            clearTimeout(timeoutId);
            console.warn('Error load gambar untuk kompresi:', err);
            resolve(dataBase64);
        };
        img.src = dataBase64;
    });
}

// ---------- Ambil gambar (base64 / URL) untuk PDF ----------
async function getImageBase64ForPdf(source, maxDimensi = 200, kualitas = 0.6) {
    if (source && source.startsWith('data:image')) {
        return await kompresGambarRingan(source, maxDimensi, kualitas);
    }
    if (source && source.startsWith('http')) {
        try {
            const response = await fetch(source, { mode: 'cors' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            let width = bitmap.width;
            let height = bitmap.height;
            if (width > height) {
                if (width > maxDimensi) { height = Math.round(height * (maxDimensi / width)); width = maxDimensi; }
            } else {
                if (height > maxDimensi) { width = Math.round(width * (maxDimensi / height)); height = maxDimensi; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(bitmap, 0, 0, width, height);
            return canvas.toDataURL('image/jpeg', kualitas);
        } catch (err) {
            console.warn('Fetch CORS gagal, mencoba fallback Image:', err.message);
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxDimensi) { height = Math.round(height * (maxDimensi / width)); width = maxDimensi; }
                    } else {
                        if (height > maxDimensi) { width = Math.round(width * (maxDimensi / height)); height = maxDimensi; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', kualitas));
                };
                img.onerror = function() {
                    console.error('Gagal memuat gambar dari URL:', source);
                    resolve(null);
                };
                setTimeout(() => { resolve(null); }, 8000);
                img.src = source;
            });
        }
    }
    return null;
}

// ---------- Baca file lalu kompres ----------
function bacaDanKompresFile(file, maxDimensi = 200, kualitas = 0.6) {
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
        reader.onerror = function(err) {
            reject(new Error('Gagal membaca file: ' + (err?.message || 'unknown')));
        };
        reader.readAsDataURL(file);
    });
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
