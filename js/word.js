// ============================================================
// EKSPOR WORD (.docx) — Menggunakan html-docx-js (Anti Berantakan)
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
        let logoRaw = dataProfil.logoCatboxUrl || dataProfil.logoSekolah || '';
        let logoBase64 = '';
        if (logoRaw !== '') {
            try {
                logoBase64 = await getImageBase64ForPdf(logoRaw, 150, 0.8);
            } catch (e) {
                console.warn("Gagal memuat logo:", e);
            }
        }

        // 1. DRAFT COVER (Layout Khusus Word)
        let htmlCover = '';
        if (opsiCover === 'dengan') {
            htmlCover = `
                <div style="text-align: center; page-break-after: always; font-family: 'Times New Roman', serif;">
                    <p style="margin: 0; font-size: 18pt; font-weight: bold;">LAPORAN</p>
                    <p style="margin: 5px 0 20px 0; font-size: 18pt; font-weight: bold;">PRAKTEK KERJA LAPANGAN (PKL)</p>
                    <p style="margin: 10px 0; font-size: 14pt; font-weight: bold;">DI</p>
                    <p style="margin: 0 0 30px 0; font-size: 14pt; font-weight: bold;">${(dataProfil.alamat || 'ALAMAT TEMPAT PKL').toUpperCase()}</p>

                    <p style="margin: 20px 0;">
                        ${logoBase64 ? `<img src="${logoBase64}" width="120" height="120" style="display: block; margin: 0 auto;" />` : ''}
                    </p>

                    <p style="margin: 30px 0 10px 0; font-size: 12pt;">Disusun Oleh:</p>

                    <table align="center" style="border: none; margin: 0 auto; width: 60%; font-size: 12pt; text-align: left;">
                        <tr>
                            <td style="border: none; width: 30%; padding: 3px 0;">Nama</td>
                            <td style="border: none; width: 5%; padding: 3px 0;">:</td>
                            <td style="border: none; width: 65%; padding: 3px 0; font-weight: bold;">${dataProfil.nama || 'LUKYY'}</td>
                        </tr>
                        <tr>
                            <td style="border: none; padding: 3px 0;">Kelas</td>
                            <td style="border: none; padding: 3px 0;">:</td>
                            <td style="border: none; padding: 3px 0;">${dataProfil.kelas || 'XII'}</td>
                        </tr>
                        <tr>
                            <td style="border: none; padding: 3px 0;">NIS/NISN</td>
                            <td style="border: none; padding: 3px 0;">:</td>
                            <td style="border: none; padding: 3px 0;">${dataProfil.nis || '/'}</td>
                        </tr>
                    </table>

                    <p style="margin-top: 50px; font-size: 13pt; font-weight: bold;">SEKOLAH MENENGAH KEJURUAN NEGERI KUDU JOMBANG</p>
                    
                    <table align="center" style="border: none; margin: 15px auto; width: 85%; font-size: 11pt; text-align: left; font-weight: bold;">
                        <tr>
                            <td style="border: none; width: 45%; padding: 3px 0;">PROGRAM KEAHLIAN</td>
                            <td style="border: none; width: 5%; padding: 3px 0;">:</td>
                            <td style="border: none; width: 50%; padding: 3px 0;">${(dataProfil.progKeahlian || '').toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td style="border: none; padding: 3px 0;">KONSENTRASI KEAHLIAN</td>
                            <td style="border: none; padding: 3px 0;">:</td>
                            <td style="border: none; padding: 3px 0;">${(dataProfil.konsKeahlian || '').toUpperCase()}</td>
                        </tr>
                    </table>

                    <p style="margin-top: 30px; font-size: 13pt; font-weight: bold;">TAHUN ${dataProfil.tahun || '2026'}</p>
                </div>
            `;
        }

        // 2. DRAFT TABEL KEGIATAN HARIAN
        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];
        let htmlTabel = '';

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            let pageBreak = (bIdx > 0 || opsiCover === 'tanpa') ? 'page-break-before: always;' : '';

            htmlTabel += `
                <div style="${pageBreak} font-family: 'Times New Roman', serif;">
                    <p style="font-size: 12pt; font-weight: bold; margin: 0 0 5px 0;">1. Laporan Kegiatan Harian</p>
                    <p style="font-size: 12pt; font-weight: bold; margin: 0 0 15px 0;">b. Bulan ${bulan.toUpperCase()}</p>
                    
                    <table border="1" style="width: 100%; border-collapse: collapse; font-size: 11pt;" cellpadding="6">
                        <thead>
                            <tr style="background-color: #f2f2f2; text-align: center; font-weight: bold;">
                                <th style="width: 6%; border: 1px solid #000;">No</th>
                                <th style="width: 14%; border: 1px solid #000;">Hari</th>
                                <th style="width: 16%; border: 1px solid #000;">Tanggal</th>
                                <th style="width: 44%; border: 1px solid #000;">Uraian Kegiatan</th>
                                <th style="width: 20%; border: 1px solid #000;">Foto</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoHtml = '-';

                if (item.foto && item.foto.trim() !== '') {
                    try {
                        const compressed = await kompresGambarRingan(item.foto, 200, 0.6);
                        fotoHtml = `<img src="${compressed}" width="90" style="display: block; margin: 0 auto;" />`;
                    } catch (e) {
                        fotoHtml = '-';
                    }
                }

                htmlTabel += `
                    <tr>
                        <td align="center" valign="middle" style="border: 1px solid #000;">${idx + 1}</td>
                        <td valign="middle" style="border: 1px solid #000;">${item.hari || ''}</td>
                        <td valign="middle" style="border: 1px solid #000;">${item.tanggal || ''}</td>
                        <td valign="middle" style="border: 1px solid #000;">${item.uraian || ''}</td>
                        <td align="center" valign="middle" style="border: 1px solid #000;">${fotoHtml}</td>
                    </tr>
                `;
            }

            htmlTabel += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        // 3. Waktu Pembungkusan HTML Standar Word
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 2.54cm 2cm 2.54cm 2cm;
                    }
                    body {
                        font-family: 'Times New Roman', serif;
                        color: #000000;
                    }
                    table {
                        width: 100%;
                    }
                </style>
            </head>
            <body>
                ${htmlCover}
                ${htmlTabel}
            </body>
            </html>
        `;

        // Konversi langsung HTML ke Blob Word (.docx) murni
        const converted = htmlDocx.asBlob(content, {
            orientation: 'portrait',
            margins: { top: 1440, right: 1152, bottom: 1440, left: 1152 }
        });

        saveAs(converted, `Laporan_PKL_${dataProfil.nama || 'LUKYY'}.docx`);
        showToast("Dokumen Word (.docx) berhasil diunduh! 📥");

    } catch (err) {
        console.error(err);
        showToast("❌ Error Word: " + err.message);
    }
}
