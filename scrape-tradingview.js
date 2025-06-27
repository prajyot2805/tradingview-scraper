import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://in.tradingview.com/markets/stocks-india/market-movers-penny-stocks/', {
    waitUntil: 'networkidle2'
  });

  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return Array.from(rows).map(row => {
      const columns = row.querySelectorAll('td');
      return {
        symbol: columns[0]?.innerText.trim(),
        price: columns[1]?.innerText.trim(),
        changePercent: columns[2]?.innerText.trim(),
        volume: columns[3]?.innerText.trim(),
        relVolume: columns[4]?.innerText.trim(),
        marketCap: columns[5]?.innerText.trim(),
        pe: columns[6]?.innerText.trim(),
        eps: columns[7]?.innerText.trim(),
        epsGrowth: columns[8]?.innerText.trim(),
        divYield: columns[9]?.innerText.trim(),
        sector: columns[10]?.innerText.trim(),
        analystRating: columns[11]?.innerText.trim(),
        avgVolume10d: columns[12]?.innerText.trim(),
        high52w: columns[13]?.innerText.trim(),
        low52w: columns[14]?.innerText.trim(),
        rsi: columns[15]?.innerText.trim(),
        macdHistogram: columns[16]?.innerText.trim(),
        adx: columns[17]?.innerText.trim(),
        atr: columns[18]?.innerText.trim(),
      };
    });
  });

  writeFileSync('tradingview_data.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ Data saved successfully.');
  await browser.close();
}

run().catch(console.error);
