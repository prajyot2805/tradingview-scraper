// scrape-tradingview.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

;(async () => {
  console.log('▶️  Launching headless Chromium…');

  // Let Puppeteer use its own downloaded Chromium
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Load cookies if you have them
  const cookiesFile = path.join(__dirname, 'tradingview-cookies.json');
  if (fs.existsSync(cookiesFile)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesFile, 'utf8'));
    await page.setCookie(...cookies);
  }

  // Go to your private screener
  await page.goto('https://in.tradingview.com/screener/MITooXHt/', {
    waitUntil: 'networkidle0'
  });
  await page.waitForTimeout(10_000);
  await page.waitForSelector('table.table-Ngq2xrcG tbody tr', {
    timeout: 60_000
  });

  // Scrape rows
  const data = await page.$$eval(
    'table.table-Ngq2xrcG tbody tr',
    rows => rows.map(row => {
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
    })
  );

  // Save JSON
  fs.writeFileSync(
    path.join(__dirname, 'tradingview_data.json'),
    JSON.stringify(data, null, 2)
  );
  console.log('✅ Data saved successfully.');

  await browser.close();
})();
