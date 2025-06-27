import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ],
  });

  const page = await browser.newPage();

  // Increase timeout for slow cloud deploys
  await page.goto('https://in.tradingview.com/screener/MITooXHt/', {
    waitUntil: 'networkidle2',
    timeout: 120_000
  });

  await page.waitForSelector('table', { timeout: 120_000 });

  await page.evaluate(() => {
    const tableContainer = document.querySelector('table')?.parentElement;
    if (tableContainer) {
      tableContainer.scrollLeft = 99999;
    }
  });

  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td')).map(cell => cell.innerText.trim());
      return {
        symbol: cells[0] || '',
        price: cells[1] || '',
        changePercent: cells[2] || '',
        volume: cells[3] || '',
        relVolume: cells[4] || '',
        marketCap: cells[5] || '',
        pe: cells[6] || '',
        eps: cells[7] || '',
        epsGrowth: cells[8] || '',
        divYield: cells[9] || '',
        sector: cells[10] || '',
        analystRating: cells[11] || '',
        avgVolume10d: cells[12] || '',
        high52w: cells[13] || '',
        low52w: cells[14] || '',
        rsi: cells[15] || '',
        macdHistogram: cells[16] || '',
        adx: cells[17] || '',
        atr: cells[18] || ''
      };
    });
  });

  console.log(data);

  fs.writeFileSync('tradingview_data.json', JSON.stringify(data, null, 2));
  console.log('✅ Data saved successfully.');

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
