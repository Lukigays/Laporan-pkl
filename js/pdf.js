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

// ---------- Helper Khusus Download Android/PWA ----------
function downloadPdfWithFallback(pdfDoc, namaFile) {
    pdfDoc.getBlob((blob) => {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = namaFile;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            showToast("PDF berhasil diunduh! 📥");
        } catch (err) {
            console.warn("Fallback link gagal, mencoba open tab baru...", err);
            pdfDoc.open();
            showToast("PDF dibuka di tab baru! 📄");
        }
    });
}

// ---------- Generator PDF ----------
async function downloadPDF(opsiCover) {
    showToast("⏳ Mengompresi & Membuat PDF...");

    try {
        const docContent = [];

        if (opsiCover === 'dengan') {
            let logoRaw = '';
            if (dataProfil.logoCatboxUrl && dataProfil.logoCatboxUrl.trim() !== '') {
                logoRaw = dataProfil.logoCatboxUrl;
            } else if (dataProfil.logoSekolah && dataProfil.logoSekolah.trim() !== '') {
                logoRaw = dataProfil.logoSekolah;
            }

            let logoBase64 = null;
            if (logoRaw !== '') {
                logoBase64 = await getImageBase64ForPdf(logoRaw, 180, 0.6);
            }

            const coverStack = [
                { text: 'LAPORAN', style: 'headerTitle', margin: [0, 15, 0, 2] },
                { text: 'PRAKTEK KERJA LAPANGAN (PKL)', style: 'headerTitle', margin: [0, 0, 0, 15] },
                { text: 'DI', style: 'headerSub', margin: [0, 0, 0, 6] },
                { text: dataProfil.alamat || 'Alamat Tempat PKL', style: 'headerAddress', margin: [0, 0, 0, 45] }
            ];

            if (logoBase64) {
                coverStack.push({ image: logoBase64, fit: [110, 110], alignment: 'center', margin: [0, 0, 0, 65] });
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

            const fotoPromises = dataBulanIni.map(item => {
                if (item.foto && item.foto.trim() !== '') {
                    return kompresGambarRingan(item.foto, 150, 0.5).catch(err => null);
                }
                return Promise.resolve(null);
            });
            const fotoHasil = await Promise.all(fotoPromises);

            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoCell = { text: '-', alignment: 'center' };

                if (fotoHasil[idx]) {
                    fotoCell = { image: fotoHasil[idx], fit: [50, 50], alignment: 'center' };
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

        // Panggil helper fallback download
        downloadPdfWithFallback(pdfDoc, namaFile);

    } catch (err) {
        console.error(err);
        showToast("❌ Error PDF: " + err.message);
    }
}
