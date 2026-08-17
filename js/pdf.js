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
                // Header Judul Atas
                { text: 'LAPORAN', style: 'headerTitle', margin: [0, 15, 0, 2] },
                { text: 'PRAKTEK KERJA LAPANGAN (PKL)', style: 'headerTitle', margin: [0, 0, 0, 15] },
                { text: 'DI', style: 'headerSub', margin: [0, 0, 0, 6] },
                { text: dataProfil.alamat || 'Alamat Tempat PKL', style: 'headerAddress', margin: [0, 0, 0, 45] }
            ];

            // Logo Sekolah
            if (logoBase64) {
                coverStack.push({ image: logoBase64, fit: [110, 110], alignment: 'center', margin: [0, 0, 0, 65] });
            } else {
                coverStack.push({ text: '', margin: [0, 0, 0, 120] });
            }

            // Identitas Siswa & Sekolah
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

            // 1. Kompresi dinaikkan ukurannya ke 300px agar tidak pecah saat diperbesar
            const fotoPromises = dataBulanIni.map(item => {
                if (item.foto && item.foto.trim() !== '') {
                    return kompresGambarRingan(item.foto, 300, 0.6).catch(err => null);
                }
                return Promise.resolve(null);
            });
            const fotoHasil = await Promise.all(fotoPromises);

            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoCell = { text: '-', alignment: 'center' };

                // 2. Dimensi foto diperbesar ke [100, 100]
                if (fotoHasil[idx]) {
                    fotoCell = { image: fotoHasil[idx], fit: [100, 100], alignment: 'center' };
                }

                tableBody.push([
                    { text: idx + 1, alignment: 'center', fontSize: 9 },
                    { text: item.hari, fontSize: 9 },
                    { text: item.tanggal, fontSize: 9 },
                    { text: item.uraian, fontSize: 9 },
                    fotoCell
                ]);
            }

            // 3. Lebar kolom foto diperbesar menjadi 110
            blockElement.stack.push({
                table: {
                    headerRows: 1,
                    widths: [20, 40, 55, '*', 110],
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

        pdfMake.createPdf(docDefinition).download(`Laporan_PKL_${dataProfil.nama || 'LUKYY'}.pdf`);
        showToast("PDF berhasil diunduh! 📥");

    } catch (err) {
        console.error(err);
        showToast("❌ Error PDF: " + err.message);
    }
}
