// ============================================================
// EKSPOR PDF (pdfMake) — Cover + Tabel per Bulan (REVISI BESAR)
// ============================================================

// ---------- Modal Opsi Ekspor ----------
function bukaOspiExport() {
    const modal = document.getElementById('modalExportOspi');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function tutupOspiExport() {
    const modal = document.getElementById('modalExportOspi');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function prosesEksekusiPDF() {
    const opsi = document.querySelector('input[name="opsiCover"]:checked')
        ? document.querySelector('input[name="opsiCover"]:checked').value
        : 'dengan';
    tutupOspiExport();
    downloadPDF(opsi);
}

// ---------- Helper Memuat Gambar untuk PDF ----------
function muatGambarPdf(src, maxDimensi = 500) {  // ← dinaikkan ke 500
    return new Promise((resolve) => {
        if (!src || src.trim() === '') {
            resolve(null);
            return;
        }

        const timer = setTimeout(() => {
            console.warn("Timeout memuat gambar:", src.substring(0, 30));
            resolve(null);
        }, 3000);

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            clearTimeout(timer);
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
                resolve(canvas.toDataURL('image/jpeg', 0.92)); // ← kualitas dinaikkan
            } catch (e) {
                console.error("Gagal menggambar ke canvas:", e);
                if (src.startsWith('data:image')) {
                    resolve(src);
                } else {
                    resolve(null);
                }
            }
        };
        img.onerror = function() {
            clearTimeout(timer);
            console.warn("Error memuat gambar:", src.substring(0, 30));
            if (src.startsWith('data:image')) {
                resolve(src);
            } else {
                resolve(null);
            }
        };
        img.src = src;
    });
}

// ---------- Helper Download PDF untuk Android / Chrome PWA ----------
function downloadPdfWithFallback(pdfDoc, namaFile) {
    pdfDoc.getBlob((blob) => {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = namaFile;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 5000);
            showToast("✅ PDF berhasil diunduh!");
        } catch (err) {
            console.warn("Fallback link gagal, mencoba open tab baru...", err);
            pdfDoc.open();
            showToast("📄 PDF dibuka di tab baru!");
        }
    });
}

// ---------- Generator PDF ----------
async function downloadPDF(opsiCover) {
    showToast("⏳ Memproses foto & menyusun PDF...");

    try {
        const docContent = [];

        // --- Halaman Cover ---
        if (opsiCover === 'dengan') {
            let logoRaw = '';
            if (dataProfil.logoCatboxUrl && dataProfil.logoCatboxUrl.trim() !== '') {
                logoRaw = dataProfil.logoCatboxUrl;
            } else if (dataProfil.logoSekolah && dataProfil.logoSekolah.trim() !== '') {
                logoRaw = dataProfil.logoSekolah;
            }

            let logoBase64 = null;
            if (logoRaw !== '') {
                logoBase64 = await muatGambarPdf(logoRaw, 250);
            }

            const coverStack = [
                { text: 'LAPORAN', style: 'headerTitle', margin: [0, 15, 0, 2] },
                { text: 'PRAKTEK KERJA LAPANGAN (PKL)', style: 'headerTitle', margin: [0, 0, 0, 15] },
                { text: 'DI', style: 'headerSub', margin: [0, 0, 0, 6] },
                { text: dataProfil.alamat || 'Alamat Tempat PKL', style: 'headerAddress', margin: [0, 0, 0, 45] }
            ];

            if (logoBase64) {
                coverStack.push({ image: logoBase64, fit: [120, 120], alignment: 'center', margin: [0, 0, 0, 65] });
            } else {
                coverStack.push({ text: '', margin: [0, 0, 0, 120] });
            }

            if (typeof labelPeriodeBulan === 'function' && labelPeriodeBulan()) {
                coverStack.push({
                    text: 'PERIODE PKL: BULAN ' + labelPeriodeBulan().toUpperCase() + (labelPeriodeTanggal() ? ' (' + labelPeriodeTanggal() + ')' : ''),
                    style: 'headerSub',
                    margin: [0, 0, 0, 0],
                    pageBreak: 'after'
                });
            } else {
                coverStack.push({ text: '', margin: [0, 0, 0, 0], pageBreak: 'after' });
            }

            coverStack.push(
                { text: 'Disusun Oleh:', alignment: 'center', fontSize: 11, margin: [0, 0, 0, 10] },
                {
                    table: {
                        widths: [90, 10, 220],
                        body: [
                            [{ text: 'Nama', border: [] }, { text: ':', border: [] }, { text: dataProfil.nama || 'LUKYY', border: [] }],
                            [{ text: 'Kelas', border: [] }, { text: ':', border: [] }, { text: dataProfil.kelas || 'XII', border: [] }],
                            [{ text: 'NIS/NISN', border: [] }, { text: ':', border: [] }, { text: dataProfil.nis || '/', border: [] }]
                        ]
                    },
                    layout: 'noBorders',
                    fontSize: 11,
                    margin: [80, 0, 0, 110]
                },
                { text: 'SEKOLAH MENENGAH KEJURUAN NEGERI KUDU JOMBANG', style: 'headerSchool', margin: [0, 0, 0, 10] },
                {
                    table: {
                        widths: [160, 10, 220],
                        body: [
                            [{ text: 'PROGRAM KEAHLIAN', bold: true, border: [] }, { text: ':', bold: true, border: [] }, { text: dataProfil.progKeahlian || '', bold: true, border: [] }],
                            [{ text: 'KONSENTRASI KEAHLIAN', bold: true, border: [] }, { text: ':', bold: true, border: [] }, { text: dataProfil.konsKeahlian || '', bold: true, border: [] }]
                        ]
                    },
                    layout: 'noBorders',
                    alignment: 'center',
                    fontSize: 10,
                    margin: [0, 0, 0, 25]
                },
                { text: 'TAHUN ' + (dataProfil.tahun || '2026...'), style: 'headerSub', margin: [0, 0, 0, 6] },
            );

            docContent.push(...coverStack);
        }

        // --- Tabel Laporan per Bulan ---
        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            const infoPeriode = (bIdx === 0 && typeof labelPeriodeBulan === 'function' && labelPeriodeBulan())
                ? [{ text: 'Periode PKL: Bulan ' + labelPeriodeBulan() + (labelPeriodeTanggal() ? ' (' + labelPeriodeTanggal() + ')' : ''), fontSize: 9, italics: true, margin: [0, 0, 0, 6] }]
                : [];

            const blockElement = {
                stack: [
                    { text: '1. Laporan Kegiatan Harian', fontSize: 11, bold: true, margin: [0, 0, 0, 2] },
                    { text: 'b. Bulan ' + bulan.toUpperCase(), fontSize: 11, bold: true, margin: [0, 0, 0, 8] },
                    ...infoPeriode
                ]
            };

            if (bIdx > 0 || opsiCover === 'tanpa') {
                blockElement.pageBreak = 'before';
            }

            const tableBody = [
                [
                    { text: 'No', style: 'tableHeader', alignment: 'center' },
                    { text: 'Hari', style: 'tableHeader' },
                    { text: 'Tanggal', style: 'tableHeader' },
                    { text: 'Uraian Kegiatan', style: 'tableHeader' },
                    { text: 'Foto', style: 'tableHeader', alignment: 'center' }
                ]
            ];

            // Pemuatan foto satu per satu dengan ukuran BESAR
            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                // Placeholder lebih tinggi agar baris tidak terlalu pendek jika foto gagal
                let fotoCell = { text: '-', alignment: 'center', margin: [0, 60, 0, 60] };

                if (item.foto && item.foto.trim() !== '') {
                    const hasilFoto = await muatGambarPdf(item.foto, 500); // ← maxDimensi naik ke 500
                    if (hasilFoto) {
                        // UKURAN FOTO DIPERBESAR JADI 160 x 160
                        fotoCell = { 
                            image: hasilFoto, 
                            fit: [160, 160],   // ← DARI 120 JADI 160
                            alignment: 'center',
                            margin: [2, 4, 2, 4] // ← padding kecil biar rapi
                        };
                    }
                }

                tableBody.push([
                    { text: idx + 1, alignment: 'center', fontSize: 10 },
                    { text: item.hari, fontSize: 10 },
                    { text: item.tanggal, fontSize: 10 },
                    { text: item.uraian, fontSize: 10 },
                    fotoCell
                ]);
            }

            blockElement.stack.push({
                table: {
                    headerRows: 1,
                    // KOLOM FOTO DIPERBESAR JADI 180, kolom lain dikurangi sedikit
                    widths: [22, 40, 55, '*', 180],  // ← DARI [25,45,60,*,140]
                    dontBreakRows: true,
                    body: tableBody
                },
                layout: {
                    fillColor: function (rowIndex) { return (rowIndex === 0) ? '#f0f0f0' : null; },
                    // Tambah padding cell biar foto nggak nempel
                    paddingLeft: function() { return 3; },
                    paddingRight: function() { return 3; },
                    paddingTop: function() { return 4; },
                    paddingBottom: function() { return 4; }
                },
                margin: [0, 0, 0, 15]
            });

            docContent.push(blockElement);
        }

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [18, 18, 18, 18], // ← MARGIN DIPERKECIL DARI 25 JADI 18
            content: docContent,
            styles: {
                headerTitle: { fontSize: 14, bold: true, alignment: 'center' },
                headerSub: { fontSize: 12, bold: true, alignment: 'center' },
                headerAddress: { fontSize: 11, alignment: 'center' },
                headerSchool: { fontSize: 12, bold: true, alignment: 'center' },
                tableHeader: { bold: true, fontSize: 10, color: 'black' }
            }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);
        const namaFile = `Laporan_PKL_${dataProfil.nama || 'LUKYY'}.pdf`;

        downloadPdfWithFallback(pdfDoc, namaFile);

    } catch (err) {
        console.error("PDF Generation Error:", err);
        showToast("❌ Gagal membuat PDF: " + err.message);
    }
}
