const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // LOAD YOUR COOKIES HERE
  const cookies = JSON.parse(fs.readFileSync('tradingview-cookies.json', 'utf8'));
  await page.setCookie(...cookies);

  // Now go directly to your private screener
  const url = 'https://in.tradingview.com/screener/MITooXHt/';
  await page.goto(url, { waitUntil: 'networkidle0' });

  await new Promise(resolve => setTimeout(resolve, 10000));


  // Wait for TradingView table selector
  await page.waitForSelector('.table-Ngq2xrcG', { timeout: 60000 });



  // Scrape table rows into JSON
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


  console.log(data);

  // Write scraped data to JSON file
  fs.writeFileSync('tradingview_data.json', JSON.stringify(data, null, 2));

  console.log('✅ Data saved successfully.');

  await browser.close();
})();
