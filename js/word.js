// ============================================================
// EKSPOR WORD (.docx) — Asli Menggunakan Library docx.js
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
    showToast("⏳ Mengompresi & Membuat Dokumen Word (.docx)...");

    try {
        const {
            Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
            WidthType, AlignmentType, VerticalAlignment, BorderStyle, ImageRun,
            PageBreak
        } = window.docx;

        let children = [];

        // ----------------------------------------------------
        // 1. BAGIAN COVER / HALAMAN DEPAN
        // ----------------------------------------------------
        if (opsiCover === 'dengan') {
            // Header Laporan
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 100 },
                    children: [new TextRun({ text: "LAPORAN", bold: true, size: 32, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [new TextRun({ text: "PRAKTEK KERJA LAPANGAN (PKL)", bold: true, size: 32, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [new TextRun({ text: "DI", bold: true, size: 28, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [new TextRun({ text: (dataProfil.alamat || 'ALAMAT TEMPAT PKL').toUpperCase(), bold: true, size: 28, font: "Times New Roman" })]
                })
            );

            // Logo Sekolah (jika ada)
            let logoRaw = dataProfil.logoCatboxUrl || dataProfil.logoSekolah || '';
            if (logoRaw !== '') {
                try {
                    const logoBase64 = await getImageBase64ForPdf(logoRaw, 200, 0.8);
                    const base64Data = logoBase64.split(',')[1];
                    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                    children.push(
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 200, after: 400 },
                            children: [
                                new ImageRun({
                                    data: imageBytes,
                                    transformation: { width: 120, height: 120 }
                                })
                            ]
                        })
                    );
                } catch (e) {
                    console.warn("Gagal memuat logo untuk Word:", e);
                    children.push(new Paragraph({ spacing: { before: 600, after: 600 } }));
                }
            } else {
                children.push(new Paragraph({ spacing: { before: 600, after: 600 } }));
            }

            // Disusun Oleh
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [new TextRun({ text: "Disusun Oleh:", size: 24, font: "Times New Roman" })]
                })
            );

            // Tabel Profil Penyusun
            const tableProfil = new Table({
                alignment: AlignmentType.CENTER,
                width: { size: 60, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Nama", size: 24, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: ":", size: 24, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: dataProfil.nama || 'LUKYY', bold: true, size: 24, font: "Times New Roman" })] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Kelas", size: 24, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: ":", size: 24, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: dataProfil.kelas || 'XII', size: 24, font: "Times New Roman" })] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: "NIS/NISN", size: 24, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: ":", size: 24, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: dataProfil.nis || '/', size: 24, font: "Times New Roman" })] })] }),
                        ]
                    })
                ]
            });
            children.push(tableProfil);

            // Footer Sekolah
            children.push(
                new Paragraph({ spacing: { before: 600 } }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [new TextRun({ text: "SEKOLAH MENENGAH KEJURUAN NEGERI KUDU JOMBANG", bold: true, size: 26, font: "Times New Roman" })]
                })
            );

            // Tabel Keahlian
            const tableKeahlian = new Table({
                alignment: AlignmentType.CENTER,
                width: { size: 85, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: "PROGRAM KEAHLIAN", bold: true, size: 22, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: ":", bold: true, size: 22, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: (dataProfil.progKeahlian || '').toUpperCase(), bold: true, size: 22, font: "Times New Roman" })] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: "KONSENTRASI KEAHLIAN", bold: true, size: 22, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: ":", bold: true, size: 22, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: (dataProfil.konsKeahlian || '').toUpperCase(), bold: true, size: 22, font: "Times New Roman" })] })] }),
                        ]
                    })
                ]
            });
            children.push(tableKeahlian);

            // Tahun
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400 },
                    children: [new TextRun({ text: `TAHUN ${dataProfil.tahun || '2026'}`, bold: true, size: 26, font: "Times New Roman" })]
                }),
                new Paragraph({ children: [new PageBreak()] }) // Pindah ke halaman baru untuk tabel
            );
        }

        // ----------------------------------------------------
        // 2. BAGIAN TABEL LAPORAN KEGIATAN HARIAN
        // ----------------------------------------------------
        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            if (bIdx > 0) {
                children.push(new Paragraph({ children: [new PageBreak()] }));
            }

            // Judul Bulan
            children.push(
                new Paragraph({
                    spacing: { before: 100, after: 50 },
                    children: [new TextRun({ text: "1. Laporan Kegiatan Harian", bold: true, size: 24, font: "Times New Roman" })]
                }),
                new Paragraph({
                    spacing: { after: 200 },
                    children: [new TextRun({ text: `b. Bulan ${bulan.toUpperCase()}`, bold: true, size: 24, font: "Times New Roman" })]
                })
            );

            // Baris Header Tabel
            const tableRows = [
                new TableRow({
                    cantSplit: true,
                    children: [
                        createCell("No", 6, true, AlignmentType.CENTER, "f2f2f2"),
                        createCell("Hari", 14, true, AlignmentType.CENTER, "f2f2f2"),
                        createCell("Tanggal", 16, true, AlignmentType.CENTER, "f2f2f2"),
                        createCell("Uraian Kegiatan", 44, true, AlignmentType.CENTER, "f2f2f2"),
                        createCell("Foto", 20, true, AlignmentType.CENTER, "f2f2f2"),
                    ]
                })
            ];

            // Isi Data Tabel
            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];

                // Elemen Sel Foto
                let fotoChildren = [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "-", size: 22, font: "Times New Roman" })] })];

                if (item.foto && item.foto.trim() !== '') {
                    try {
                        const compressed = await kompresGambarRingan(item.foto, 200, 0.6);
                        const base64Data = compressed.split(',')[1];
                        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                        fotoChildren = [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 50, after: 50 },
                                children: [
                                    new ImageRun({
                                        data: imageBytes,
                                        transformation: { width: 90, height: 65 }
                                    })
                                ]
                            })
                        ];
                    } catch (err) {
                        console.warn("Gagal memproses foto item:", err);
                    }
                }

                tableRows.push(
                    new TableRow({
                        cantSplit: true,
                        children: [
                            createCell((idx + 1).toString(), 6, false, AlignmentType.CENTER),
                            createCell(item.hari || '', 14, false, AlignmentType.LEFT),
                            createCell(item.tanggal || '', 16, false, AlignmentType.LEFT),
                            createCell(item.uraian || '', 44, false, AlignmentType.LEFT),
                            new TableCell({
                                width: { size: 20, type: WidthType.PERCENTAGE },
                                verticalAlignment: VerticalAlignment.CENTER,
                                children: fotoChildren
                            })
                        ]
                    })
                );
            }

            const mainTable = new Table({
                alignment: AlignmentType.CENTER,
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows
            });

            children.push(mainTable);
        }

        // ----------------------------------------------------
        // 3. ENCODE & DOWNLOAD FILE .DOCX
        // ----------------------------------------------------
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 1 inci (2.54 cm)
                            bottom: 1440,
                            left: 1152,   // 0.8 inci (2 cm)
                            right: 1152
                        }
                    }
                },
                children: children
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Laporan_PKL_${dataProfil.nama || 'LUKYY'}.docx`);
        showToast("Dokumen Word (.docx) berhasil dibuat! 📥");

    } catch (err) {
        console.error(err);
        showToast("❌ Error Word: " + err.message);
    }
}

// Helper Function: Membuat Cell Tabel Standar
function createCell(text, widthPercent, isHeader = false, alignment = window.docx.AlignmentType.LEFT, bgHex = null) {
    const { TableCell, Paragraph, TextRun, WidthType, VerticalAlignment } = window.docx;
    
    let cellOptions = {
        width: { size: widthPercent, type: WidthType.PERCENTAGE },
        verticalAlignment: VerticalAlignment.CENTER,
        children: [
            new Paragraph({
                alignment: alignment,
                spacing: { before: 60, after: 60 },
                children: [
                    new TextRun({
                        text: text,
                        bold: isHeader,
                        size: isHeader ? 22 : 20,
                        font: "Times New Roman"
                    })
                ]
            })
        ]
    };

    if (bgHex) {
        cellOptions.shading = { fill: bgHex };
    }

    return new TableCell(cellOptions);
}

// Helper Function: Border Kosong untuk Tabel Profil Cover
function noBorders() {
    const { BorderStyle } = window.docx;
    const none = { style: BorderStyle.NONE, size: 0, color: "AUTO" };
    return { top: none, bottom: none, left: none, right: none };
}
