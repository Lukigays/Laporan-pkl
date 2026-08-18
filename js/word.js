// ============================================================
// EKSPOR WORD (.docx) — Menggunakan Library Docx.js (Dinamis & Rapi)
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

// ============================================================
// HELPERS
// ============================================================

/**
 * Kompres gambar ke base64 JPEG dengan batas ukuran.
 */
async function kompresGambarWord(src, maxWidth = 300, quality = 0.7) {
    return new Promise((resolve) => {
        if (!src || src.trim() === '') { resolve(''); return; }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve('');
        img.src = src;
    });
}

/**
 * Konversi base64/URL ke ArrayBuffer untuk docx.ImageRun.
 */
async function base64ToArrayBuffer(base64) {
    if (!base64) return null;
    try {
        const response = await fetch(base64);
        const blob = await response.blob();
        return await blob.arrayBuffer();
    } catch (e) {
        console.warn('Gagal konversi gambar:', e);
        return null;
    }
}

/**
 * Border kosong (untuk tabel info cover).
 */
function borderNone() {
    return {
        top: { style: docx.BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: docx.BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: docx.BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: docx.BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    };
}

/**
 * Border standar (untuk tabel laporan).
 */
function borderStandard() {
    return {
        top: { style: docx.BorderStyle.SINGLE, size: 1, color: '000000' },
        bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: '000000' },
        left: { style: docx.BorderStyle.SINGLE, size: 1, color: '000000' },
        right: { style: docx.BorderStyle.SINGLE, size: 1, color: '000000' }
    };
}

// ============================================================
// BUILDERS
// ============================================================

function makeParagraph(text, opts = {}) {
    const { alignment = docx.AlignmentType.LEFT, bold = false, size = 24, spacing = {}, children = [] } = opts;
    const runs = [];
    if (text !== undefined && text !== null) {
        runs.push(new docx.TextRun({ text: String(text), bold, size, font: 'Times New Roman' }));
    }
    runs.push(...children);
    return new docx.Paragraph({ alignment, spacing, children: runs });
}

function makeCell(text, opts = {}) {
    const {
        width,
        bold = false,
        align = docx.AlignmentType.LEFT,
        shading = null,
        columnSpan = 1,
        children = null
    } = opts;

    const cellChildren = children || [
        makeParagraph(text, { alignment: align, bold, size: 22 })
    ];

    return new docx.TableCell({
        width: width ? { size: width, type: docx.WidthType.DXA } : undefined,
        columnSpan,
        shading: shading ? { fill: shading } : undefined,
        verticalAlign: docx.VerticalAlign.CENTER,
        borders: borderStandard(),
        children: cellChildren
    });
}

function makeInfoRow(label, value) {
    return new docx.TableRow({
        children: [
            new docx.TableCell({
                width: { size: 30, type: docx.WidthType.PERCENTAGE },
                borders: borderNone(),
                children: [makeParagraph(label, { size: 22 })]
            }),
            new docx.TableCell({
                width: { size: 5, type: docx.WidthType.PERCENTAGE },
                borders: borderNone(),
                children: [makeParagraph(':', { size: 22 })]
            }),
            new docx.TableCell({
                width: { size: 65, type: docx.WidthType.PERCENTAGE },
                borders: borderNone(),
                children: [makeParagraph(value, { size: 22 })]
            })
        ]
    });
}

function makeProgRow(label, value) {
    return new docx.TableRow({
        children: [
            new docx.TableCell({
                width: { size: 45, type: docx.WidthType.PERCENTAGE },
                borders: borderNone(),
                children: [makeParagraph(label, { size: 22, bold: true })]
            }),
            new docx.TableCell({
                width: { size: 5, type: docx.WidthType.PERCENTAGE },
                borders: borderNone(),
                children: [makeParagraph(':', { size: 22, bold: true })]
            }),
            new docx.TableCell({
                width: { size: 50, type: docx.WidthType.PERCENTAGE },
                borders: borderNone(),
                children: [makeParagraph(value.toUpperCase(), { size: 22, bold: true })]
            })
        ]
    });
}

// ============================================================
// MAIN EXPORT
// ============================================================

async function downloadWord(opsiCover) {
    showToast("⏳ Membuat dokumen Word, harap tunggu...");

    try {
        const children = [];

        // --- LOAD LOGO ---
        let logoBuffer = null;
        const logoRaw = dataProfil.logoCatboxUrl || dataProfil.logoSekolah || '';
        if (logoRaw) {
            const logoBase64 = await kompresGambarWord(logoRaw, 200, 0.8);
            logoBuffer = await base64ToArrayBuffer(logoBase64);
        }

        // ========================
        // COVER PAGE
        // ========================
        if (opsiCover === 'dengan') {
            // Spacer atas
            children.push(makeParagraph('', { spacing: { after: 600 } }));
            children.push(makeParagraph('', { spacing: { after: 400 } }));

            // Judul
            children.push(makeParagraph('LAPORAN', {
                alignment: docx.AlignmentType.CENTER,
                bold: true,
                size: 32,
                spacing: { after: 100 }
            }));
            children.push(makeParagraph('PRAKTEK KERJA LAPANGAN (PKL)', {
                alignment: docx.AlignmentType.CENTER,
                bold: true,
                size: 32,
                spacing: { after: 500 }
            }));

            // DI + Alamat
            children.push(makeParagraph('DI', {
                alignment: docx.AlignmentType.CENTER,
                bold: true,
                size: 26,
                spacing: { after: 100 }
            }));
            children.push(makeParagraph((dataProfil.alamat || 'Alamat Tempat PKL').toUpperCase(), {
                alignment: docx.AlignmentType.CENTER,
                size: 26,
                spacing: { after: 400 }
            }));

            // Logo
            if (logoBuffer) {
                children.push(new docx.Paragraph({
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [
                        new docx.ImageRun({
                            data: logoBuffer,
                            transformation: { width: 120, height: 120 },
                            type: 'jpg'
                        })
                    ]
                }));
            } else {
                children.push(makeParagraph('', { spacing: { after: 800 } }));
            }

            children.push(makeParagraph('', { spacing: { after: 300 } }));

            // Disusun Oleh
            children.push(makeParagraph('Disusun Oleh:', {
                alignment: docx.AlignmentType.CENTER,
                size: 22,
                spacing: { after: 200 }
            }));

            // Tabel Info
            children.push(new docx.Table({
                width: { size: 60, type: docx.WidthType.PERCENTAGE },
                alignment: docx.AlignmentType.CENTER,
                rows: [
                    makeInfoRow('Nama', dataProfil.nama || 'LUKYY'),
                    makeInfoRow('Kelas', dataProfil.kelas || 'XII'),
                    makeInfoRow('NIS/NISN', dataProfil.nis || '/')
                ]
            }));

            children.push(makeParagraph('', { spacing: { after: 500 } }));

            // Nama Sekolah
            children.push(makeParagraph('SEKOLAH MENENGAH KEJURUAN NEGERI KUDU JOMBANG', {
                alignment: docx.AlignmentType.CENTER,
                bold: true,
                size: 26,
                spacing: { after: 200 }
            }));

            // Tabel Program
            children.push(new docx.Table({
                width: { size: 85, type: docx.WidthType.PERCENTAGE },
                alignment: docx.AlignmentType.CENTER,
                rows: [
                    makeProgRow('PROGRAM KEAHLIAN', dataProfil.progKeahlian || ''),
                    makeProgRow('KONSENTRASI KEAHLIAN', dataProfil.konsKeahlian || '')
                ]
            }));

            children.push(makeParagraph('', { spacing: { after: 500 } }));

            // Tahun
            children.push(makeParagraph(`TAHUN ${dataProfil.tahun || '2026...'}`, {
                alignment: docx.AlignmentType.CENTER,
                bold: true,
                size: 26
            }));

            // Page Break
            children.push(new docx.Paragraph({ children: [new docx.PageBreak()] }));
        }

        // ========================
        // CONTENT: TABEL PER BULAN
        // ========================
        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            if (bIdx > 0 || opsiCover === 'tanpa') {
                children.push(new docx.Paragraph({ children: [new docx.PageBreak()] }));
            }

            // Header Bulan
            children.push(makeParagraph('1. Laporan Kegiatan Harian', {
                bold: true,
                size: 24,
                spacing: { after: 100 }
            }));
            children.push(makeParagraph(`b. Bulan ${bulan.toUpperCase()}`, {
                bold: true,
                size: 24,
                spacing: { after: 250 }
            }));

            // Build Rows
            const tableRows = [];

            // Header
            tableRows.push(new docx.TableRow({
                tableHeader: true,
                children: [
                    makeCell('No', { width: 500, bold: true, align: docx.AlignmentType.CENTER, shading: 'F2F2F2' }),
                    makeCell('Hari', { width: 1300, bold: true, align: docx.AlignmentType.CENTER, shading: 'F2F2F2' }),
                    makeCell('Tanggal', { width: 1500, bold: true, align: docx.AlignmentType.CENTER, shading: 'F2F2F2' }),
                    makeCell('Uraian Kegiatan', { width: 4200, bold: true, align: docx.AlignmentType.CENTER, shading: 'F2F2F2' }),
                    makeCell('Foto', { width: 1800, bold: true, align: docx.AlignmentType.CENTER, shading: 'F2F2F2' })
                ]
            }));

            // Data
            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoChildren = [];

                if (item.foto && item.foto.trim() !== '') {
                    try {
                        const compressed = await kompresGambarWord(item.foto, 180, 0.6);
                        const imgBuf = await base64ToArrayBuffer(compressed);
                        if (imgBuf) {
                            fotoChildren.push(
                                new docx.ImageRun({
                                    data: imgBuf,
                                    transformation: { width: 75, height: 56 },
                                    type: 'jpg'
                                })
                            );
                        } else {
                            fotoChildren.push(new docx.TextRun({ text: '-', font: 'Times New Roman', size: 22 }));
                        }
                    } catch (e) {
                        fotoChildren.push(new docx.TextRun({ text: '-', font: 'Times New Roman', size: 22 }));
                    }
                } else {
                    fotoChildren.push(new docx.TextRun({ text: '-', font: 'Times New Roman', size: 22 }));
                }

                tableRows.push(new docx.TableRow({
                    children: [
                        makeCell(String(idx + 1), { width: 500, align: docx.AlignmentType.CENTER }),
                        makeCell(item.hari, { width: 1300 }),
                        makeCell(item.tanggal, { width: 1500 }),
                        makeCell(item.uraian, { width: 4200 }),
                        new docx.TableCell({
                            width: { size: 1800, type: docx.WidthType.DXA },
                            verticalAlign: docx.VerticalAlign.CENTER,
                            borders: borderStandard(),
                            children: [new docx.Paragraph({
                                alignment: docx.AlignmentType.CENTER,
                                children: fotoChildren
                            })]
                        })
                    ]
                }));
            }

            children.push(new docx.Table({
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                rows: tableRows
            }));
        }

        // ========================
        // GENERATE DOCUMENT
        // ========================
        const doc = new docx.Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: 'Times New Roman',
                            size: 24 // 12pt
                        }
                    }
                }
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: docx.convertInchesToTwip(1),
                            right: docx.convertInchesToTwip(1),
                            bottom: docx.convertInchesToTwip(1),
                            left: docx.convertInchesToTwip(1)
                        }
                    }
                },
                children: children
            }]
        });

        const blob = await docx.Packer.toBlob(doc);
        saveAs(blob, `Laporan_PKL_${(dataProfil.nama || 'LUKYY').replace(/\s+/g, '_')}.docx`);
        showToast("✅ Dokumen Word berhasil diunduh!");

    } catch (err) {
        console.error('Word Export Error:', err);
        showToast("❌ Gagal membuat Word: " + (err.message || 'Unknown error'));
    }
}
