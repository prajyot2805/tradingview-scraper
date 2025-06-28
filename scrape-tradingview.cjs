// scrape-tradingview.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  // 1. Decide whether to connect or launch
  const wsEndpoint = process.env.BROWSERLESS_WS_URL; 
  let browser;
  if (wsEndpoint) {
    console.log('▶️  Connecting to Browserless at', wsEndpoint);
    browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
  } else {
    console.log('▶️  Launching local headless Chrome');
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null
    });
  }

  const page = await browser.newPage();

  // 2. If you use cookies to stay logged in, load them
  if (fs.existsSync('tradingview-cookies.json')) {
    const cookies = JSON.parse(fs.readFileSync('tradingview-cookies.json', 'utf8'));
    await page.setCookie(...cookies);
    console.log('🍪  Loaded cookies');
  }

  // 3. Go to your private screener
  const url = 'https://in.tradingview.com/screener/MITooXHt/';
  await page.goto(url, { waitUntil: 'networkidle0' });
  console.log('🌐  Page loaded');

  // 4. Wait for the table to appear
  await page.waitForSelector('.table-Ngq2xrcG', { timeout: 60000 });
  console.log('✅  Table found, scraping…');

  // 5. Scrape rows
  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table.table-Ngq2xrcG tbody tr'));
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

  // 6. Save to file
  fs.writeFileSync('tradingview_data.json', JSON.stringify(data, null, 2));
  console.log('✅  Data saved to tradingview_data.json');

  // 7. Done
  await browser.close();
  console.log('👋  Browser closed');
})();
