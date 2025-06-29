// scrape-tradingview.cjs
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  // 1. Find a system Chrome binary
  const possible = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    puppeteer.executablePath(), // fallback to bundled
  ].filter(Boolean);

  let chromePath = null;
  for (const p of possible) {
    try { fs.accessSync(p); chromePath = p; break; }
    catch {}
  }
  if (!chromePath) {
    console.error('❌ No Chrome binary found at any known path:', possible);
    process.exit(1);
  }
  console.log('▶️  Launching Chrome from:', chromePath);

  // 2. Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  // 3. Load cookies if you have them
  const cookiesPath = './tradingview-cookies.json';
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    await page.setCookie(...cookies);
  }

  // 4. Go scrape
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
