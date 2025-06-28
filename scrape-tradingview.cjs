// scrape-tradingview.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('▶️  Launching local headless Chrome');

  // point at Puppeteer’s downloaded Chromium
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // LOAD COOKIES
  const cookiesPath = path.resolve(__dirname, 'tradingview-cookies.json');
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    await page.setCookie(...cookies);
  }

  // NAVIGATE & WAIT
  const url = 'https://in.tradingview.com/screener/MITooXHt/';
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(10_000);
  await page.waitForSelector('table.table-Ngq2xrcG tbody tr', { timeout: 60_000 });

  // SCRAPE
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

  // WRITE OUT
  fs.writeFileSync(
    path.resolve(__dirname, 'tradingview_data.json'),
    JSON.stringify(data, null, 2)
  );
  console.log('✅ Data saved successfully.');

  await browser.close();
})();
