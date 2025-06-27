const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.goto('https://in.tradingview.com/markets/stocks-india/market-movers-penny-stocks/', { waitUntil: 'domcontentloaded' });

  // Example scraping logic (adjust selectors as needed)
  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll('.tv-data-table__tbody tr');
    let result = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length > 0) {
        result.push({
          symbol: cells[0].innerText.trim(),
          lastPrice: cells[1]?.innerText.trim() || '',
          changePercent: cells[2]?.innerText.trim() || '',
          volume: cells[3]?.innerText.trim() || '',
          relVolume: cells[4]?.innerText.trim() || '',
          marketCap: cells[5]?.innerText.trim() || '',
          sector: cells[6]?.innerText.trim() || ''
        });
      }
    });

    return result;
  });

  console.log(data);

  fs.writeFileSync('tradingview_data.json', JSON.stringify(data, null, 2));

  await browser.close();
}

run();
