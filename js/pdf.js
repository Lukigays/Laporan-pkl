// ============================================================
// EKSPOR PDF (pdfMake) — Cover + Tabel per Bulan
// ============================================================

// ---------- Modal Ospi Ekspor ----------
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

// ---------- Helper Kompresi Gambar Aman dengan Timeout ----------
function kompresGambarAman(fotoBase64, maxDimensi = 120, kualitas = 0.4) {
    return new Promise((resolve) => {
        if (!fotoBase64 || !fotoBase64.startsWith('data:image')) {
            resolve(null);
            return;
        }

        // Timeout 2 detik per gambar agar tidak gantung
        const timer = setTimeout(() => {
            console.warn("Kompresi timeout, melewati foto...");
            resolve(null);
        }, 2000);

        const img = new Image();
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
                resolve(canvas.toDataURL('image/jpeg', kualitas));
            } catch (e) {
                console.error("Gagal resize canvas:", e);
                resolve(null);
            }
        };
        img.onerror = function() {
            clearTimeout(timer);
            resolve(null);
        };
        img.src = fotoBase64;
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
    showToast("⏳ Mengompresi foto & menyusun PDF...");

    try {
        const docContent = [];

        // --- Halaman Kover ---
        if (opsiCover === 'dengan') {
            let logoRaw = '';
            if (dataProfil.logoCatboxUrl && dataProfil.logoCatboxUrl.trim() !== '') {
                logoRaw = dataProfil.logoCatboxUrl;
            } else if (dataProfil.logoSekolah && dataProfil.logoSekolah.trim() !== '') {
                logoRaw = dataProfil.logoSekolah;
            }

            let logoBase64 = null;
            if (logoRaw !== '') {
                try {
                    logoBase64 = await getImageBase64ForPdf(logoRaw, 120, 0.5);
                } catch (e) {
                    logoBase64 = null;
                }
            }

            const coverStack = [
                { text: 'LAPORAN', style: 'headerTitle', margin: [0, 15, 0, 2] },
                { text: 'PRAKTEK KERJA LAPANGAN (PKL)', style: 'headerTitle', margin: [0, 0, 0, 15] },
                { text: 'DI', style: 'headerSub', margin: [0, 0, 0, 6] },
                { text: dataProfil.alamat || 'Alamat Tempat PKL', style: 'headerAddress', margin: [0, 0, 0, 45] }
            ];

            if (logoBase64) {
                coverStack.push({ image: logoBase64, fit: [100, 100], alignment: 'center', margin: [0, 0, 0, 65] });
            } else {
                coverStack.push({ text: '', margin: [0, 0, 0, 120] });
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
                { text: 'TAHUN ' + (dataProfil.tahun || '2026...'), style: 'headerSub', margin: [0, 0, 0, 0], pageBreak: 'after' }
            );

            docContent.push(...coverStack);
        }

        // --- Tabel Laporan per Bulan ---
        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            const blockElement = {
                stack: [
                    { text: '1. Laporan Kegiatan Harian', fontSize: 11, bold: true, margin: [0, 0, 0, 2] },
                    { text: 'b. Bulan ' + bulan.toUpperCase(), fontSize: 11, bold: true, margin: [0, 0, 0, 8] }
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

            // Proses kompresi satu per satu agar memori ringan
            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoCell = { text: '-', alignment: 'center' };

                if (item.foto && item.foto.trim() !== '') {
                    const fotoKecil = await kompresGambarAman(item.foto, 120, 0.4);
                    if (fotoKecil) {
                        fotoCell = { image: fotoKecil, fit: [45, 45], alignment: 'center' };
                    }
                }

                tableBody.push([
                    { text: idx + 1, alignment: 'center', fontSize: 9 },
                    { text: item.hari, fontSize: 9 },
                    { text: item.tanggal, fontSize: 9 },
                    { text: item.uraian, fontSize: 9 },
                    fotoCell
                ]);
            }

            blockElement.stack.push({
                table: {
                    headerRows: 1,
                    widths: [25, 45, 60, '*', 65],
                    dontBreakRows: true,
                    body: tableBody
                },
                layout: {
                    fillColor: function (rowIndex) { return (rowIndex === 0) ? '#f0f0f0' : null; }
                },
                margin: [0, 0, 0, 15]
            });

            docContent.push(blockElement);
        }

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 40],
            content: docContent,
            styles: {
                headerTitle: { fontSize: 14, bold: true, alignment: 'center' },
                headerSub: { fontSize: 12, bold: true, alignment: 'center' },
                headerAddress: { fontSize: 11, alignment: 'center' },
                headerSchool: { fontSize: 12, bold: true, alignment: 'center' },
                tableHeader: { bold: true, fontSize: 9, color: 'black' }
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
