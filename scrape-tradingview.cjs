// scrape-tradingview.cjs
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  // 1️⃣ Show us the Chromium path
  const chromePath = puppeteer.executablePath();
  console.log('▶️  Launching bundled Chromium:', chromePath);

  // 2️⃣ Launch headless
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  // 3️⃣ If you have cookies, load them
  const cookiesPath = './tradingview-cookies.json';
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    await page.setCookie(...cookies);
  }

  // 4️⃣ Go scrape
  await page.goto('https://in.tradingview.com/screener/MITooXHt/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('table.table-Ngq2xrcG tbody tr', { timeout: 60000 });

  const data = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('table.table-Ngq2xrcG tbody tr'),
      row => {
        const c = row.querySelectorAll('td');
        return {
          symbol: c[0]?.innerText.trim(),
          price: c[1]?.innerText.trim(),
          changePercent: c[2]?.innerText.trim(),
          volume: c[3]?.innerText.trim(),
          relVolume: c[4]?.innerText.trim(),
          marketCap: c[5]?.innerText.trim(),
          pe: c[6]?.innerText.trim(),
          eps: c[7]?.innerText.trim(),
          epsGrowth: c[8]?.innerText.trim(),
          divYield: c[9]?.innerText.trim(),
          sector: c[10]?.innerText.trim(),
          analystRating: c[11]?.innerText.trim(),
          avgVolume10d: c[12]?.innerText.trim(),
          high52w: c[14]?.innerText.trim(),
          low52w: c[15]?.innerText.trim(),
          rsi: c[16]?.innerText.trim(),
          macdHistogram: c[17]?.innerText.trim(),
          adx: c[18]?.innerText.trim(),
          atr: c[19]?.innerText.trim(),
        };
      }
    );
  });

  fs.writeFileSync('tradingview_data.json', JSON.stringify(data, null, 2));
  console.log('✅ Data saved successfully.');

  await browser.close();
})();
