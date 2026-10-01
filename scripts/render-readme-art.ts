// Renders the README's title block (the cat mark and the mien wordmark on orange) to
// public/readme/header.png. GitHub can't load web fonts in a README, so the wordmark
// has to arrive as a picture; headless Chrome draws it with the real fonts at 2x.
//
//   npm run readme:art
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '/usr/bin/google-chrome');

const HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Geist:wght@500&display=swap" rel="stylesheet">
<style>
  body { margin: 0; background: transparent; }
  #art { width: 850px; height: 230px; box-sizing: border-box; border-radius: 16px; background: #F26B3A; color: #2A1206;
         display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
  .lockup { display: flex; align-items: center; gap: 18px; }
  .word { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 104px; line-height: 1; letter-spacing: -0.05em; }
  .tag { font-family: 'Geist', sans-serif; font-size: 20px; font-weight: 500; }
</style></head>
<body><div id="art">
  <div class="lockup">
    <svg width="80" height="80" viewBox="0 0 24 24"><path d="M3 9 5 2l5 5h4l5-5 2 7v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill="#2A1206"/><rect x="7" y="12" width="4" height="4" rx="1" fill="#F26B3A"/><rect x="13" y="12" width="4" height="4" rx="1" fill="#F26B3A"/></svg>
    <span class="word">mien</span>
  </div>
  <span class="tag">A drag-and-drop editor for your GitHub profile README.</span>
</div></body></html>`;

mkdirSync('public/readme', { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 900, height: 300, deviceScaleFactor: 2 } });
try {
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const art = await page.$('#art');
  await art!.screenshot({ path: 'public/readme/header.png', omitBackground: true });
  console.log('public/readme/header.png');
} finally {
  await browser.close();
}
