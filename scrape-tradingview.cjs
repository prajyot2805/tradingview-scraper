// scrape-tradingview.cjs
import fs from 'fs';
import puppeteer from 'puppeteer';

(async () => {
  // figure out which Chrome to launch:
  const possible = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    puppeteer.executablePath(),      // fallback to bundled
  ].filter(Boolean);

  let executablePath = null;
  for (const p of possible) {
    try { fs.accessSync(p); executablePath = p; break; }
    catch {}
  }
  if (!executablePath) {
    console.error('❌ No Chrome binary found at any known path:', possible);
    process.exit(1);
  }

  console.log('▶️  Launching Chrome from:', executablePath);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  // set your cookies file path if you need to load cookies:
  const cookiesPath = './tradingview-cookies.json';
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath));
    await page.setCookie(...cookies);
  }

  await page.goto('https://in.tradingview.com/screener/MITooXHt/', {
    waitUntil: 'networkidle0'
  });
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
