// ============================================================
// EKSPOR WORD (.docx) — Tampilan Rapi & Presisi Seputar PDF
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
    showToast("⏳ Mengompresi & Membuat Dokumen Word...");

    try {
        let logoRaw = dataProfil.logoCatboxUrl || dataProfil.logoSekolah || '';
        let logoBase64 = '';
        if (logoRaw !== '') {
            logoBase64 = await getImageBase64ForPdf(logoRaw, 200, 0.7);
        }

        let htmlCover = '';
        if (opsiCover === 'dengan') {
            htmlCover = `
                <div class="page-cover" style="text-align: center; page-break-after: always; padding-top: 20px;">
                    <h2 style="font-size: 16pt; margin: 0; font-weight: bold;">LAPORAN</h2>
                    <h2 style="font-size: 16pt; margin: 0 0 15px 0; font-weight: bold;">PRAKTEK KERJA LAPANGAN (PKL)</h2>
                    <p style="font-size: 12pt; margin: 0 0 5px 0; font-weight: bold;">DI</p>
                    <h3 style="font-size: 12pt; margin: 0 0 45px 0; font-weight: normal;">${(dataProfil.alamat || 'Alamat Tempat PKL').toUpperCase()}</h3>
                    
                    <div style="margin: 30px 0;">
                        ${logoBase64 ? `<img src="${logoBase64}" style="width: 120px; height: auto;" />` : '<div style="height: 120px;"></div>'}
                    </div>

                    <p style="font-size: 11pt; margin-bottom: 10px;">Disusun Oleh:</p>
                    <table style="border: none !important; width: 320px; margin: 0 auto 50px auto; font-size: 11pt; text-align: left;">
                        <tr><td style="border: none !important; width: 90px; padding: 2px;">Nama</td><td style="border: none !important; width: 10px; padding: 2px;">:</td><td style="border: none !important; padding: 2px;">${dataProfil.nama || 'LUKYY'}</td></tr>
                        <tr><td style="border: none !important; padding: 2px;">Kelas</td><td style="border: none !important; padding: 2px;">:</td><td style="border: none !important; padding: 2px;">${dataProfil.kelas || 'XII'}</td></tr>
                        <tr><td style="border: none !important; padding: 2px;">NIS/NISN</td><td style="border: none !important; padding: 2px;">:</td><td style="border: none !important; padding: 2px;">${dataProfil.nis || '/'}</td></tr>
                    </table>

                    <h3 style="font-size: 12pt; font-weight: bold; margin: 0 0 10px 0;">SEKOLAH MENENGAH KEJURUAN NEGERI KUDU JOMBANG</h3>
                    <table style="border: none !important; width: 450px; margin: 0 auto 30px auto; font-size: 10pt; text-align: left; font-weight: bold;">
                        <tr><td style="border: none !important; width: 200px; padding: 2px;">PROGRAM KEAHLIAN</td><td style="border: none !important; width: 10px; padding: 2px;">:</td><td style="border: none !important; padding: 2px;">${(dataProfil.progKeahlian || '').toUpperCase()}</td></tr>
                        <tr><td style="border: none !important; padding: 2px;">KONSENTRASI KEAHLIAN</td><td style="border: none !important; padding: 2px;">:</td><td style="border: none !important; padding: 2px;">${(dataProfil.konsKeahlian || '').toUpperCase()}</td></tr>
                    </table>
                    <h4 style="font-size: 12pt; font-weight: bold; margin-top: 20px;">TAHUN ${dataProfil.tahun || '2026...'}</h4>
                </div>
            `;
        }

        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];
        let htmlTabel = '';

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            let pageBreakCss = (bIdx > 0 || opsiCover === 'tanpa') ? 'page-break-before: always;' : '';

            htmlTabel += `
                <div style="${pageBreakCss} margin-top: 20px;">
                    <div style="font-size: 11pt; font-weight: bold; margin-bottom: 10px;">
                        <p style="margin: 0;">1. Laporan Kegiatan Harian</p>
                        <p style="margin: 0;">b. Bulan ${bulan.toUpperCase()}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 10pt;" border="1">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
                                <th style="width: 5%; padding: 6px; text-align: center;">No</th>
                                <th style="width: 12%; padding: 6px; text-align: left;">Hari</th>
                                <th style="width: 15%; padding: 6px; text-align: left;">Tanggal</th>
                                <th style="width: 48%; padding: 6px; text-align: left;">Uraian Kegiatan</th>
                                <th style="width: 20%; padding: 6px; text-align: center;">Foto</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoHtml = '-';
                if (item.foto && item.foto.trim() !== '') {
                    const compressed = await kompresGambarRingan(item.foto, 250, 0.6);
                    fotoHtml = `<img src="${compressed}" style="max-width: 100px; max-height: 100px; object-fit: contain; display: block; margin: 0 auto;" />`;
                }

                htmlTabel += `
                    <tr>
                        <td style="padding: 6px; text-align: center; vertical-align: top;">${idx + 1}</td>
                        <td style="padding: 6px; vertical-align: top;">${item.hari}</td>
                        <td style="padding: 6px; vertical-align: top;">${item.tanggal}</td>
                        <td style="padding: 6px; vertical-align: top;">${item.uraian}</td>
                        <td style="padding: 6px; text-align: center; vertical-align: top;">${fotoHtml}</td>
                    </tr>
                `;
            }

            htmlTabel += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        const fullDocument = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Laporan PKL</title>
                <!--[if gte mso 9]>
                <xml>
                <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page {
                        size: A4;
                        margin: 20mm 20mm 20mm 20mm;
                    }
                    body {
                        font-family: 'Times New Roman', serif;
                        color: #000000;
                        background-color: #ffffff;
                    }
                    table {
                        border-collapse: collapse;
                    }
                    td, th {
                        border: 1px solid #000000;
                        word-wrap: break-word;
                    }
                </style>
            </head>
            <body>
                ${htmlCover}
                ${htmlTabel}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + fullDocument], {
            type: 'application/msword'
        });

        saveAs(blob, `Laporan_PKL_${dataProfil.nama || 'LUKYY'}.doc`);
        showToast("Dokumen Word berhasil diunduh! 📥");

    } catch (err) {
        console.error(err);
        showToast("❌ Error Word: " + err.message);
    }
}
