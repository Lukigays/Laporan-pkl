// ============================================================
// EKSPOR WORD (.docx) — Cover + Tabel per Bulan
// ============================================================

function bukaOspiExportWord() {
    const modal = document.getElementById('modalExportOspiWord');
    if (!modal) {
        downloadWord('dengan');
        return;
    }
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function tutupOspiExportWord() {
    const modal = document.getElementById('modalExportOspiWord');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function prosesEksekusiWord() {
    const opsi = document.querySelector('input[name="opsiCoverWord"]:checked')
        ? document.querySelector('input[name="opsiCoverWord"]:checked').value
        : 'dengan';
    tutupOspiExportWord();
    downloadWord(opsi);
}

async function downloadWord(opsiCover) {
    showToast("⏳ Membuat dokumen Word...");

    try {
        const areaCetak = document.getElementById('areaCetak').cloneNode(true);

        // Jika user memilih 'tanpa' cover, hapus section kover
        if (opsiCover === 'tanpa') {
            const coverEl = areaCetak.querySelector('#koverPrintSection');
            if (coverEl) coverEl.remove();
        }

        // Hapus elemen watermark agar tidak mengacak layout Word
        const watermark = areaCetak.querySelector('.watermark');
        if (watermark) watermark.remove();

        // Menyusun HTML khusus dengan inline style dokumen Word
        const contentHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; }
                    h2, h3, h4 { text-align: center; margin: 4px 0; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1pt solid #000; padding: 6px; vertical-align: top; }
                    th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
                    td img { max-width: 120px; max-height: 120px; display: block; margin: 0 auto; }
                    .header-print { text-align: center; }
                    .logo-kover-container { text-align: center; margin: 20px 0; }
                    .logo-kover-container img { max-width: 150px; max-height: 150px; }
                </style>
            </head>
            <body>
                ${areaCetak.innerHTML}
            </body>
            </html>
        `;

        // Konversi HTML ke blob .docx
        const converted = htmlDocx.asBlob(contentHtml);
        
        // Unduh file menggunakan FileSaver.js
        saveAs(converted, `Laporan_PKL_${dataProfil.nama || 'LUKYY'}.docx`);
        showToast("Dokumen Word berhasil diunduh! 📥");

    } catch (err) {
        console.error(err);
        showToast("❌ Error Word: " + err.message);
    }
}
