// ============================================================
// EKSPOR WORD (.docx) — Menggunakan docx.js (Rapi & Presisi)
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

// Helper konversi Base64 / URL Gambar ke Uint8Array agar file Word kecil
async function getGambarUint8Array(source, maxDimensi = 300, kualitas = 0.6) {
    try {
        let base64 = await getImageBase64ForPdf(source, maxDimensi, kualitas);
        if (!base64) return null;
        
        const base64Data = base64.split(',')[1];
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.warn("Gagal konversi gambar ke Word:", e);
        return null;
    }
}

async function downloadWord(opsiCover) {
    showToast("⏳ Mengompresi & Membuat Dokumen Word...");

    const docxLib = window.docx;
    if (!docxLib) {
        showToast("❌ Library docx belum siap/termuat!");
        return;
    }

    try {
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, WidthType, PageBreak, BorderStyle } = docxLib;

        const borderKosong = {
            top: { style: BorderStyle.NONE, size: 0, color: "AUTO" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "AUTO" },
            left: { style: BorderStyle.NONE, size: 0, color: "AUTO" },
            right: { style: BorderStyle.NONE, size: 0, color: "AUTO" }
        };

        const sectionsChildren = [];

        // ---------- HALAMAN COVER ----------
        if (opsiCover === 'dengan') {
            sectionsChildren.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "LAPORAN", bold: true, size: 28, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "PRAKTEK KERJA LAPANGAN (PKL)", bold: true, size: 28, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "DI", bold: true, size: 24, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spaceAfter: 400,
                    children: [new TextRun({ text: (dataProfil.alamat || "Alamat Tempat PKL").toUpperCase(), size: 22, font: "Times New Roman" })]
                })
            );

            // Logo Sekolah
            let logoRaw = dataProfil.logoCatboxUrl || dataProfil.logoSekolah || '';
            let logoBytes = await getGambarUint8Array(logoRaw, 200, 0.7);

            if (logoBytes) {
                sectionsChildren.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spaceAfter: 400,
                        children: [
                            new ImageRun({
                                data: logoBytes,
                                transformation: { width: 110, height: 110 }
                            })
                        ]
                    })
                );
            } else {
                sectionsChildren.push(new Paragraph({ spaceAfter: 800, children: [] }));
            }

            // Identitas Siswa
            sectionsChildren.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spaceAfter: 200,
                    children: [new TextRun({ text: "Disusun Oleh:", size: 22, font: "Times New Roman" })]
                }),
                new Table({
                    width: { size: 9000, type: WidthType.DXA },
                    alignment: AlignmentType.CENTER,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ borders: borderKosong, width: { size: 1500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Nama", size: 22, font: "Times New Roman" })] })] }),
                                new TableCell({ borders: borderKosong, width: { size: 300, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: ":", size: 22, font: "Times New Roman" })] })] }),
                                new TableCell({ borders: borderKosong, width: { size: 7200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: dataProfil.nama || 'LUKYY', size: 22, font: "Times New Roman" })] })] }),
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ borders: borderKosong, width: { size: 1500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Kelas", size: 22, font: "Times New Roman" })] })] }),
                                new TableCell({ borders: borderKosong, width: { size: 300, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: ":", size: 22, font: "Times New Roman" })] })] }),
                                new TableCell({ borders: borderKosong, width: { size: 7200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: dataProfil.kelas || 'XII', size: 22, font: "Times New Roman" })] })] }),
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ borders: borderKosong, width: { size: 1500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "NIS/NISN", size: 22, font: "Times New Roman" })] })] }),
                                new TableCell({ borders: borderKosong, width: { size: 300, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: ":", size: 22, font: "Times New Roman" })] })] }),
                                new TableCell({ borders: borderKosong, width: { size: 7200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: dataProfil.nis || '/', size: 22, font: "Times New Roman" })] })] }),
                            ]
                        })
                    ]
                }),
                new Paragraph({ spaceAfter: 600, children: [] }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spaceAfter: 200,
                    children: [new TextRun({ text: "SEKOLAH MENENGAH KEJURUAN NEGERI KUDU JOMBANG", bold: true, size: 24, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: `PROGRAM KEAHLIAN : ${(dataProfil.progKeahlian || '').toUpperCase()}`, bold: true, size: 20, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spaceAfter: 400,
                    children: [new TextRun({ text: `KONSENTRASI KEAHLIAN : ${(dataProfil.konsKeahlian || '').toUpperCase()}`, bold: true, size: 20, font: "Times New Roman" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: `TAHUN ${dataProfil.tahun || '2026...'}`, bold: true, size: 24, font: "Times New Roman" })]
                }),
                new Paragraph({ children: [new PageBreak()] })
            );
        }

        // ---------- TABEL LAPORAN PER BULAN ----------
        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            if (bIdx > 0 || opsiCover === 'tanpa') {
                sectionsChildren.push(new Paragraph({ children: [new PageBreak()] }));
            }

            sectionsChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: "1. Laporan Kegiatan Harian", bold: true, size: 22, font: "Times New Roman" })]
                }),
                new Paragraph({
                    spaceAfter: 200,
                    children: [new TextRun({ text: "b. Bulan " + bulan.toUpperCase(), bold: true, size: 22, font: "Times New Roman" })]
                })
            );

            // Menentukan lebar pasti untuk masing-masing kolom dalam DXA (1 pt = 20 dxa)
            const wNo = 600;       // ~30pt
            const wHari = 1200;    // ~60pt
            const wTanggal = 1500; // ~75pt
            const wUraian = 4200;  // ~210pt
            const wFoto = 1800;    // ~90pt

            const tableRows = [
                new TableRow({
                    cantSplit: true,
                    tableHeader: true,
                    children: [
                        new TableCell({ width: { size: wNo, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No", bold: true, size: 18, font: "Times New Roman" })] })] }),
                        new TableCell({ width: { size: wHari, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Hari", bold: true, size: 18, font: "Times New Roman" })] })] }),
                        new TableCell({ width: { size: wTanggal, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tanggal", bold: true, size: 18, font: "Times New Roman" })] })] }),
                        new TableCell({ width: { size: wUraian, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Uraian Kegiatan", bold: true, size: 18, font: "Times New Roman" })] })] }),
                        new TableCell({ width: { size: wFoto, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Foto", bold: true, size: 18, font: "Times New Roman" })] })] }),
                    ]
                })
            ];

            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoCellParagraph = new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "-", size: 18, font: "Times New Roman" })] });

                if (item.foto && item.foto.trim() !== '') {
                    const imgBytes = await getGambarUint8Array(item.foto, 250, 0.6);
                    if (imgBytes) {
                        fotoCellParagraph = new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new ImageRun({
                                    data: imgBytes,
                                    transformation: { width: 80, height: 80 }
                                })
                            ]
                        });
                    }
                }

                tableRows.push(
                    new TableRow({
                        cantSplit: true,
                        children: [
                            new TableCell({ width: { size: wNo, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, size: 18, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: wHari, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: item.hari, size: 18, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: wTanggal, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: item.tanggal, size: 18, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: wUraian, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: item.uraian, size: 18, font: "Times New Roman" })] })] }),
                            new TableCell({ width: { size: wFoto, type: WidthType.DXA }, children: [fotoCellParagraph] }),
                        ]
                    })
                );
            }

            sectionsChildren.push(
                new Table({
                    width: { size: 9300, type: WidthType.DXA },
                    alignment: AlignmentType.CENTER,
                    rows: tableRows
                }),
                new Paragraph({ spaceAfter: 400, children: [] })
            );
        }

        const doc = new Document({
            sections: [{
                properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
                children: sectionsChildren
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Laporan_PKL_${dataProfil.nama || 'LUKYY'}.docx`);
        showToast("Dokumen Word berhasil diunduh! 📥");

    } catch (err) {
        console.error(err);
        showToast("❌ Error Word: " + err.message);
    }
}
