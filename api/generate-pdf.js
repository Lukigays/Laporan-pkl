import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { htmlContent } = req.body;

    if (!htmlContent) {
        return res.status(400).json({ error: 'Data HTML tidak boleh kosong!' });
    }

    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Menggunakan domcontentloaded agar loading Vercel sangat cepat
        await page.setContent(htmlContent, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            },
            preferCSSPageSize: true
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Laporan_PKL.pdf');
        return res.status(200).send(pdfBuffer);

    } catch (error) {
        console.error('Error Vercel PDF:', error);
        if (browser) await browser.close();
        return res.status(500).json({ error: 'Gagal generate PDF: ' + error.message });
    }
}
