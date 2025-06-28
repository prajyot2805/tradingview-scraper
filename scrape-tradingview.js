/**
 * scrape-tradingview.js
 * ES-module script (package.json contains "type": "module")
 * Connects to Browserless via WebSocket and scrapes the TradingView screener.
 *
 * ─────────────────────────────────────────────────────────
 * prerequisites:
 *   • ENV var  BROWSERLESS_WS   →  wss://chrome.browserless.io?token=YOUR_TOKEN
 *   • npm i puppeteer-core      (smaller because we never launch locally)
 * build command on Render:
 *   npm install                (no Chrome download step)
 * ─────────────────────────────────────────────────────────
 */

import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';

// ① read the Browserless websocket URL from env
const WS_ENDPOINT = process.env.BROWSERLESS_WS;
if (!WS_ENDPOINT) {
  console.error('❌  BROWSERLESS_WS environment variable not set');
  process.exit(1);
}

async function run() {
  // ② connect (do NOT launch) ────────────────
  const browser = await puppeteer.connect({
    browserWSEndpoint: WS_ENDPOINT,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // ③ navigate to your private screener
  const URL = 'https://in.tradingview.com/screener/MITooXHt/';
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 120_000 });

  // ④ make sure all columns are visible (scroll to far right)
  await page.evaluate(() => {
    const tbl = document.querySelector('table');
    if (tbl && tbl.parentElement) tbl.parentElement.scrollLeft = 10_000;
  });
  await page.waitForTimeout(2500);

  // ⑤ scrape every row into an object
  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(tr => {
      const td = Array.from(tr.querySelectorAll('td')).map(el => el.innerText.trim());
      return {
        symbol:        td[0]  ?? '',
        price:         td[1]  ?? '',
        changePercent: td[2]  ?? '',
        volume:        td[3]  ?? '',
        relVolume:     td[4]  ?? '',
        marketCap:     td[5]  ?? '',
        pe:            td[6]  ?? '',
        eps:           td[7]  ?? '',
        epsGrowth:     td[8]  ?? '',
        divYield:      td[9]  ?? '',
        sector:        td[10] ?? '',
        analystRating: td[11] ?? '',
        avgVolume10d:  td[12] ?? '',
        high52w:       td[13] ?? '',
        low52w:        td[14] ?? '',
        rsi:           td[15] ?? '',
        macdHistogram: td[16] ?? '',
        adx:           td[17] ?? '',
        atr:           td[18] ?? ''
      };
    });
  });

  console.log('📊  scraped rows:', data.length);
  writeFileSync('tradingview_data.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅  Data saved to tradingview_data.json');

  await browser.close();
}

run().catch(err => {
  console.error('❌  Unhandled error:', err);
  process.exit(1);
});
