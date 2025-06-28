// scrape-tradingview.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');

// Debug: confirm Puppeteer version and that Chromium is bundled
console.log('Launching Puppeteer, version:', puppeteer.version());

(async () => {
  // Launch the bundled Chromium
  const browser = await puppeteer.launch({
    headless: 'new'
  });

  const page = await browser.newPage();

  // Load your saved TradingView cookies
  const cookies = JSON.parse(
    fs.readFileSync('tradingview-cookies.json', 'utf8')
  );
  await page.setCookie(...cookies);

  // Go directly to your private screener
  const url = 'https://in.tradingview.com/screener/MITooXHt/';
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Give the page a moment to fully render
  await page.waitForTimeout(10_000);

  // Wait for your table to appear
  await page.waitForSelector('table.table-Ngq2xrcG', { timeout: 60_000 });

  // Scrape the rows into JSON
  const data = await page.evaluate(() => {
    const rows = Array.from(
      document.querySelectorAll('table.table-Ngq2xrcG tbody tr')
    );
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
        high52w: cells[14]?.innerText.trim(),
        low52w: cells[15]?.innerText.trim(),
        rsi: cells[16]?.innerText.trim(),
        macdHistogram: cells[17]?.innerText.trim(),
        adx: cells[18]?.innerText.trim(),
        atr: cells[19]?.innerText.trim(),
      };
    });
  });

  console.log('📊  Scraped rows:', data.length);
  console.log(data);

  // Save to file
  fs.writeFileSync(
    'tradingview_data.json',
    JSON.stringify(data, null, 2),
    'utf8'
  );
  console.log('✅  Data saved successfully.');

  await browser.close();
})().catch(err => {
  console.error('❌  Unhandled error:', err);
  process.exit(1);
});
