// ============================================================
// EKSPOR WORD (.doc) — Metode Native HTML (Anti Rusak & Rapi di HP)
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
    showToast("⏳ Memproses Dokumen Word...");

    try {
        let logoRaw = dataProfil.logoCatboxUrl || dataProfil.logoSekolah || '';
        let logoBase64 = '';
        if (logoRaw !== '') {
            try {
                // Kompresi logo agar file Word tidak berat
                logoBase64 = await getImageBase64ForPdf(logoRaw, 150, 0.8);
            } catch(e) {
                console.log("Logo error", e);
            }
        }

        let htmlContent = '';

        // 1. BAGIAN COVER
        if (opsiCover === 'dengan') {
            htmlContent += `
                <div style="text-align: center; font-family: 'Times New Roman', serif;">
                    <br><br>
                    <span style="font-size: 18pt; font-weight: bold;">LAPORAN</span><br>
                    <span style="font-size: 18pt; font-weight: bold;">PRAKTEK KERJA LAPANGAN (PKL)</span><br><br><br>
                    <span style="font-size: 14pt; font-weight: bold;">DI</span><br>
                    <span style="font-size: 14pt; font-weight: bold;">${(dataProfil.alamat || 'ALAMAT TEMPAT PKL').toUpperCase()}</span><br><br><br><br>

                    ${logoBase64 ? `<img src="${logoBase64}" width="120" height="120" />` : '<br><br><br>'}
                    
                    <br><br><br><br>
                    <span style="font-size: 12pt;">Disusun Oleh:</span><br><br>

                    <!-- Menggunakan width persentase agar rapi di layar HP -->
                    <table style="width: 70%; margin: 0 auto; font-size: 12pt; text-align: left; border: none;">
                        <tr>
                            <td style="width: 30%; border: none; padding: 5px;">Nama</td>
                            <td style="width: 5%; border: none; padding: 5px;">:</td>
                            <td style="width: 65%; border: none; padding: 5px; font-weight: bold;">${dataProfil.nama || 'LUKYY'}</td>
                        </tr>
                        <tr>
                            <td style="border: none; padding: 5px;">Kelas</td>
                            <td style="border: none; padding: 5px;">:</td>
                            <td style="border: none; padding: 5px;">${dataProfil.kelas || 'XII'}</td>
                        </tr>
                        <tr>
                            <td style="border: none; padding: 5px;">NIS/NISN</td>
                            <td style="border: none; padding: 5px;">:</td>
                            <td style="border: none; padding: 5px;">${dataProfil.nis || '/'}</td>
                        </tr>
                    </table>

                    <br><br><br><br><br>
                    <span style="font-size: 14pt; font-weight: bold;">SEKOLAH MENENGAH KEJURUAN NEGERI KUDU JOMBANG</span><br><br>
                    
                    <table style="width: 90%; margin: 0 auto; font-size: 11pt; text-align: left; font-weight: bold; border: none;">
                        <tr>
                            <td style="width: 45%; border: none; padding: 5px;">PROGRAM KEAHLIAN</td>
                            <td style="width: 5%; border: none; padding: 5px;">:</td>
                            <td style="width: 50%; border: none; padding: 5px;">${(dataProfil.progKeahlian || '').toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td style="border: none; padding: 5px;">KONSENTRASI KEAHLIAN</td>
                            <td style="border: none; padding: 5px;">:</td>
                            <td style="border: none; padding: 5px;">${(dataProfil.konsKeahlian || '').toUpperCase()}</td>
                        </tr>
                    </table>

                    <br><br><br><br>
                    <span style="font-size: 14pt; font-weight: bold;">TAHUN ${dataProfil.tahun || '2026'}</span>
                    
                    <!-- Tag khusus pemisah halaman untuk Microsoft Word -->
                    <br clear="all" style="page-break-before: always;" />
                </div>
            `;
        }

        // 2. BAGIAN TABEL
        const unikBulan = [...new Set(dataLaporan.map(i => i.bulanLabel))];

        for (let bIdx = 0; bIdx < unikBulan.length; bIdx++) {
            const bulan = unikBulan[bIdx];
            const dataBulanIni = dataLaporan.filter(i => i.bulanLabel === bulan);
            if (dataBulanIni.length === 0) continue;

            if (bIdx > 0 || opsiCover === 'tanpa') {
                if (bIdx > 0) htmlContent += `<br clear="all" style="page-break-before: always;" />`;
            }

            htmlContent += `
                <div style="font-family: 'Times New Roman', serif;">
                    <p style="font-size: 12pt; font-weight: bold; margin: 0 0 5px 0;">1. Laporan Kegiatan Harian</p>
                    <p style="font-size: 12pt; font-weight: bold; margin: 0 0 15px 0;">b. Bulan ${bulan.toUpperCase()}</p>
                    
                    <!-- Kunci rapi di HP: width: 100% dan pembagian kolom menggunakan persentase -->
                    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; font-size: 11pt; text-align: left;">
                        <tr style="background-color: #f2f2f2; text-align: center; font-weight: bold;">
                            <td style="width: 5%;">No</td>
                            <td style="width: 15%;">Hari</td>
                            <td style="width: 15%;">Tanggal</td>
                            <td style="width: 45%;">Uraian Kegiatan</td>
                            <td style="width: 20%;">Foto</td>
                        </tr>
            `;

            for (let idx = 0; idx < dataBulanIni.length; idx++) {
                const item = dataBulanIni[idx];
                let fotoHtml = '-';

                if (item.foto && item.foto.trim() !== '') {
                    try {
                        const compressed = await kompresGambarRingan(item.foto, 150, 0.6);
                        fotoHtml = `<img src="${compressed}" style="width: 80px; height: auto;" />`;
                    } catch (e) {
                        fotoHtml = '-';
                    }
                }

                htmlContent += `
                    <tr>
                        <td style="text-align: center; vertical-align: middle;">${idx + 1}</td>
                        <td style="vertical-align: middle;">${item.hari || ''}</td>
                        <td style="vertical-align: middle;">${item.tanggal || ''}</td>
                        <td style="vertical-align: middle;">${item.uraian || ''}</td>
                        <td style="text-align: center; vertical-align: middle;">${fotoHtml}</td>
                    </tr>
                `;
            }

            htmlContent += `
                    </table>
                </div>
            `;
        }

        // 3. PEMBUNGKUS STANDAR MICROSOFT WORD
        const fullDocument = `
            <html xmlns:v="urn:schemas-microsoft-com:vml"
                  xmlns:o="urn:schemas-microsoft-com:office:office"
                  xmlns:w="urn:schemas-microsoft-com:office:word"
                  xmlns:m="http://schemas-microsoft.com/office/2004/12/omml"
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <title>Laporan PKL LUKYY</title>
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
                    /* Setup Margin dan Kertas A4 */
                    @page Section1 {
                        size: 21cm 29.7cm; 
                        margin: 2.5cm 2cm 2.5cm 2cm;
                        mso-page-orientation: portrait;
                    }
                    div.Section1 { page: Section1; }
                </style>
            </head>
            <body>
                <div class="Section1">
                    ${htmlContent}
                </div>
            </body>
            </html>
        `;

        // Format .doc (bukan .docx) dijamin langsung terbaca oleh semua jenis Office Mobile
        const blob = new Blob(['\ufeff' + fullDocument], { type: 'application/msword' });
        saveAs(blob, \`Laporan_PKL_\${dataProfil.nama || 'LUKYY'}.doc\`);
        
        showToast("Dokumen Word berhasil diunduh! 📥");

    } catch (err) {
        console.error(err);
        showToast("❌ Error Word: " + err.message);
    }
}
