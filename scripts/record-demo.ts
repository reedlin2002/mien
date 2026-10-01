// Records public/demo.gif, which the site serves and the README shows: drives the live
// editor in headless Chrome, captures frames with the DevTools screencast, and encodes
// them into a GIF. Uses the Chrome already installed (set CHROME_PATH if it is elsewhere).
//
//   npm run demo
import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;
import jpeg from 'jpeg-js';

const URL = process.env.EDITOR_URL ?? 'https://mien.kanewolf98.workers.dev/editor/';
const OUT = process.argv[2] ?? 'public/demo.gif';
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '/usr/bin/google-chrome');
const VIEW = { width: 1440, height: 900 };
const GIF_W = 960;
const GIF_H = 600;
const FPS = 10;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { ...VIEW, deviceScaleFactor: 1 },
  args: ['--lang=en-US', `--window-size=${VIEW.width},${VIEW.height}`, '--hide-scrollbars']
});
const page = await browser.newPage();

// English UI, light preview, and a visible cursor that follows the real mouse.
await page.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem('mien:prefs', JSON.stringify({ mode: 'light', lang: 'en' }));
  } catch {}
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#1b1a17" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(-100px,-100px)', transition: 'scale .12s' });
    document.body.append(c);
    const ring = document.createElement('div');
    Object.assign(ring.style, { position: 'fixed', width: '34px', height: '34px', marginLeft: '-17px', marginTop: '-17px', borderRadius: '999px', background: 'rgba(242,107,58,.35)', zIndex: '2147483646', pointerEvents: 'none', opacity: '0', transition: 'opacity .15s' });
    document.body.append(ring);
    const move = (e) => {
      c.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 2}px)`;
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
    };
    addEventListener('pointermove', move, true);
    addEventListener('pointerdown', (e) => { move(e); ring.style.opacity = '1'; c.style.scale = '0.85'; }, true);
    addEventListener('pointerup', () => { ring.style.opacity = '0'; c.style.scale = '1'; }, true);
  });
});

await page.goto(URL, { waitUntil: 'networkidle2' });
await sleep(800);

// ---- capture
const cdp = await page.createCDPSession();
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  frames.push({ data, t: metadata.timestamp });
  try {
    await cdp.send('Page.screencastFrameAck', { sessionId });
  } catch {}
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: GIF_W, maxHeight: GIF_H, everyNthFrame: 1 });

// ---- helpers
let mouse = { x: VIEW.width / 2, y: VIEW.height - 120 };
async function moveTo(x, y, ms = 500) {
  const steps = Math.max(8, Math.round(ms / 16));
  const from = { ...mouse };
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await sleep(16);
  }
  mouse = { x, y };
}
async function center(selector, textMatch) {
  const box = await page.evaluate(
    (sel, txt) => {
      const els = Array.from(document.querySelectorAll(sel));
      const el = txt ? els.find((e) => e.textContent.trim().includes(txt)) : els[0];
      if (!el) return null;
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, right: r.right, bottom: r.bottom, top: r.top, left: r.left };
    },
    selector,
    textMatch
  );
  if (!box) throw new Error(`not found: ${selector} ${textMatch ?? ''}`);
  return box;
}
async function click(selector, textMatch, ms = 500) {
  const b = await center(selector, textMatch);
  await moveTo(b.x, b.y, ms);
  await page.mouse.down();
  await sleep(90);
  await page.mouse.up();
  await sleep(250);
}
async function drag(from, to, ms = 900) {
  await moveTo(from.x, from.y, 450);
  await page.mouse.down();
  await sleep(120);
  await moveTo(from.x + 12, from.y + 6, 120);
  await moveTo(to.x, to.y, ms);
  await sleep(450);
  await page.mouse.up();
  await sleep(300);
}

// ---- the story
await sleep(700);
const input = await center('#welcome-user');
await moveTo(input.x, input.y, 600);
await page.mouse.down();
await page.mouse.up();
await page.keyboard.type('octocat', { delay: 110 });
await sleep(900);
await click('[role=dialog] button', 'Start with an empty page', 700);
await sleep(700);

// Banner onto the empty page
await click('nav button', 'Headers', 600);
await sleep(300);
const banner = await center('aside button', 'Banner');
let pageBox = await center('main .markdown-body');
await drag(banner, { x: pageBox.x, y: pageBox.top + 140 });
await sleep(2200);

// GitHub Stats below it
await click('nav button', 'Stats', 600);
await sleep(300);
const stats = await center('aside button', 'GitHub Stats');
let rows = await page.evaluate(() => Array.from(document.querySelectorAll('main [data-row-id]')).map((r) => r.getBoundingClientRect().toJSON()));
await drag(stats, { x: rows[0].left + rows[0].width / 2, y: rows[0].bottom + 40 });
await sleep(2400);

// Top Languages beside the stats card
const langs = await center('aside button', 'Top Languages');
rows = await page.evaluate(() =>
  Array.from(document.querySelectorAll('main [data-row-id]')).map((r) => {
    const cell = r.querySelector('[data-cell-id]').getBoundingClientRect();
    return { row: r.getBoundingClientRect().toJSON(), cell: cell.toJSON() };
  })
);
const statsRow = rows[1];
await drag(langs, { x: statsRow.cell.right + 50, y: statsRow.cell.top + statsRow.cell.height / 2 }, 1100);
await sleep(2400);

// Pull its corner to make it wider
const handle = await page.evaluate(() => {
  const hs = Array.from(document.querySelectorAll('main [data-cell-id] span.cursor-nwse-resize'));
  const se = hs[hs.length - 1];
  if (!se) return null;
  const r = se.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
if (handle) {
  await moveTo(handle.x, handle.y, 700);
  await page.mouse.down();
  await sleep(150);
  await moveTo(handle.x + 70, handle.y + 4, 900);
  await sleep(700);
  await page.mouse.up();
  await sleep(900);
}

// Dark mode
await click('header button[aria-label="Preview dark mode"]', null, 800);
await sleep(2200);

// Export
await click('header button', 'Copy to GitHub', 800);
await sleep(3200);

await cdp.send('Page.stopScreencast');
await browser.close();
console.log(`captured ${frames.length} frames`);

// ---- encode
const start = frames[0].t;
const end = frames[frames.length - 1].t + 1.2;
const samples = [];
let fi = 0;
for (let t = start; t <= end; t += 1 / FPS) {
  while (fi + 1 < frames.length && frames[fi + 1].t <= t) fi++;
  const last = samples[samples.length - 1];
  if (last && last.frame === fi) last.delay += 1000 / FPS;
  else samples.push({ frame: fi, delay: 1000 / FPS });
}

const gif = GIFEncoder();
let prev = null;
for (const s of samples) {
  const img = jpeg.decode(Buffer.from(frames[s.frame].data, 'base64'), { useTArray: true });
  const { width, height } = img;
  const rgba = img.data;
  if (!prev) {
    const palette = quantize(rgba, 256);
    gif.writeFrame(applyPalette(rgba, palette), width, height, { palette, delay: s.delay });
  } else {
    // Pixels that barely changed become transparent, so the GIF stores only what moved.
    const palette = quantize(rgba, 255);
    const index = applyPalette(rgba, palette);
    const out = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < out.length; i++, p += 4) {
      const d = Math.abs(rgba[p] - prev[p]) + Math.abs(rgba[p + 1] - prev[p + 1]) + Math.abs(rgba[p + 2] - prev[p + 2]);
      if (d < 30) {
        out[i] = 0;
        rgba[p] = prev[p];
        rgba[p + 1] = prev[p + 1];
        rgba[p + 2] = prev[p + 2];
      } else out[i] = index[i] + 1;
    }
    gif.writeFrame(out, width, height, { palette: [[0, 0, 0], ...palette], delay: s.delay, transparent: true, transparentIndex: 0, dispose: 1 });
  }
  prev = rgba;
}
gif.finish();
writeFileSync(OUT, gif.bytes());
console.log(`${samples.length} gif frames, ${(gif.bytes().length / 1024 / 1024).toFixed(2)} MB -> ${OUT}`);
