import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Login URL if you need cookies, otherwise directly load your screener URL
  await page.goto('https://in.tradingview.com/screener/MITooXHt/', { waitUntil: 'networkidle0' });

  // Scroll to ensure all columns are visible
  await page.evaluate(() => {
    const tableWrapper = document.querySelector('table');
    if (tableWrapper) {
      tableWrapper.scrollLeft = 10000;
    }
  });

  // Wait a bit in case rendering lags
  await page.waitForTimeout(3000);

  // Extract data
  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        symbol: cells[0]?.innerText.trim(),
        price: cells[1]?.innerText.trim(),
        changePercent: cells[2]?.innerText.trim(),
        volume: cells[3]?.innerText.trim(),
        relVolume: cells[4]?.innerText.trim(),
        marketCap: cells[5]?.innerText.trim(),
        pe: cells[6]?.innerText.trim(),
        eps: cells[7]?.innerText.trim(),
        epsGrowth: cells[8]?.innerText.trim(),
        divYield: cells[9]?.innerText.trim(),
        sector: cells[10]?.innerText.trim(),
        analystRating: cells[11]?.innerText.trim(),
        avgVolume10d: cells[12]?.innerText.trim(),
        high52w: cells[13]?.innerText.trim(),
        low52w: cells[14]?.innerText.trim(),
        rsi: cells[15]?.innerText.trim(),
        macdHistogram: cells[16]?.innerText.trim(),
        adx: cells[17]?.innerText.trim(),
        atr: cells[18]?.innerText.trim(),
      };
    });
  });

  console.log(data);

  // Save to file
  fs.writeFileSync('tradingview_data.json', JSON.stringify(data, null, 2));

  await browser.close();
}

run().then(() => {
  console.log('✅ Data saved successfully.');
}).catch(e => {
  console.error(e);
  process.exit(1);
});
