// ============================================================
// EKSPOR WORD (.doc) — Metode HTML Klasik (Anti Berantakan)
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
            // Kompresi logo untuk Word
            logoBase64 = await getImageBase64ForPdf(logoRaw, 150, 0.7);
        }

        let htmlCover = '';
        if (opsiCover === 'dengan') {
            // Kover menggunakan tag HTML murni (br, b, center) agar stabil di Word HP
            htmlCover = `
                <div style="text-align: center; page-break-after: always; font-family: 'Times New Roman', serif;">
                    <br><br>
                    <b style="font-size: 18pt;">LAPORAN</b><br>
                    <b style="font-size: 18pt;">PRAKTEK KERJA LAPANGAN (PKL)</b><br><br><br>
                    <b style="font-size: 14pt;">DI</b><br>
                    <span style="font-size: 14pt;">${(dataProfil.alamat || 'Alamat Tempat PKL').toUpperCase()}</span><br><br><br><br>

                    ${logoBase64 ? `<img src="${logoBase64}" width="120" height="120" />` : '<br><br><br><br><br>'}
                    <br><br><br><br>

                    <span style="font-size: 12pt;">Disusun Oleh:</span><br><br>

                    <table border="0" width="350" align="center" style="font-size: 12pt; text-align: left;">
                        <tr>
                            <td width="100">Nama</td>
                            <td width="20">:</td>
                            <td>${dataProfil.nama || 'LUKYY'}</td>
                        </tr>
                        <tr>
                            <td>Kelas</td>
                            <td>:</td>
                            <td>${dataProfil.kelas || 'XII'}</td>
                        </tr>
                        <tr>
                            <td>NIS/NISN</td>
                            <td>:</td>
                            <td>${dataProfil.nis || '/'}</td>
                        </tr>
                    </table>

                    <br><br><br><br>

                    <b style="font-size: 14pt;">SEKOLAH MENENGAH KEJURUAN NEGERI KUDU JOMBANG</b><br><br>
                    
                    <table border="0" width="550" align="center" style="font-size: 11pt; text-align: left; font-weight: bold;">
                        <tr>
                            <td width="230">PROGRAM KEAHLIAN</td>
                            <td width="20">:</td>
                            <td>${(dataProfil.progKeahlian || '').toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td>KONSENTRASI KEAHLIAN</td>
                            <td>:</td>
                            <td>${(dataProfil.konsKeahlian || '').toUpperCase()}</td>
                        </tr>
                    </table>

                    <br><br><br>
                    <b style="font-size: 14pt;">TAHUN ${dataProfil.tahun || '2026...'}</b>
                </div>
            `;
        }

        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];
        let htmlTabel = '';

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            let pageBreak = (bIdx > 0 || opsiCover === 'tanpa') ? 'page-break-before: always;' : '';

            htmlTabel += `
                <div style="${pageBreak} font-family: 'Times New Roman', serif;">
                    <p style="font-size: 12pt; font-weight: bold; margin-bottom: 15px;">
                        1. Laporan Kegiatan Harian<br>
                        b. Bulan ${bulan.toUpperCase()}
                    </p>
                    
                    <!-- Tabel diset lebar mutlak 650 (Standar A4 Margin) agar tidak mengecil di HP -->
                    <table border="1" width="650" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-size: 11pt; text-align: left;">
                        <tr style="background-color: #f2f2f2; text-align: center; font-weight: bold;">
                            <td width="30">No</td>
                            <td width="80">Hari</td>
                            <td width="90">Tanggal</td>
                            <td width="330">Uraian Kegiatan</td>
                            <td width="120">Foto</td>
                        </tr>
            `;

            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoHtml = '-';
                if (item.foto && item.foto.trim() !== '') {
                    // Kompresi agar foto Word tidak berat
                    const compressed = await kompresGambarRingan(item.foto, 200, 0.6);
                    // Gunakan HTML property width="90" bukan CSS
                    fotoHtml = `<img src="${compressed}" width="90" />`;
                }

                htmlTabel += `
                    <tr>
                        <td align="center" valign="top">${idx + 1}</td>
                        <td valign="top">${item.hari}</td>
                        <td valign="top">${item.tanggal}</td>
                        <td valign="top">${item.uraian}</td>
                        <td align="center" valign="top">${fotoHtml}</td>
                    </tr>
                `;
            }

            htmlTabel += `
                    </table>
                </div>
            `;
        }

        // Tag khusus pembungkus Word
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
                        mso-page-orientation: portrait;
                        size: 21cm 29.7cm; /* Ukuran A4 */
                        margin: 2.5cm 2cm 2.5cm 2cm;
                    }
                    body {
                        font-family: 'Times New Roman', serif;
                        color: #000000;
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