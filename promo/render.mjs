// רינדור הסרטון: צילום פריימים עם Playwright (Chromium) ל-JPEG, בכמה תהליכים במקביל
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? 'playwright');
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2];
const workers = Number(process.argv[3] ?? 4);
const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null; // רשימת זמנים לבדיקה
const FPS = 30;
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const open = async () => {
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('file://' + path.join(here, 'promo.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  return page;
};

const first = await open();
const duration = await first.evaluate(() => window.DURATION);
const events = await first.evaluate(() => window.EVENTS);
fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify({ duration, events }, null, 1));

if (only) {
  for (const t of only) {
    await first.evaluate(t => window.renderAt(t), t);
    await first.screenshot({ path: path.join(outDir, `t_${String(t).replace('.', '_')}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const total = Math.round(duration * FPS);
let next = 0;
const run = async page => {
  for (;;) {
    const i = next++;
    if (i >= total) return;
    await page.evaluate(t => window.renderAt(t), i / FPS);
    await page.screenshot({ path: path.join(outDir, `f_${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
  }
};
const pages = [first];
for (let i = 1; i < workers; i++) pages.push(await open());
await Promise.all(pages.map(run));
await browser.close();
console.log('frames', total);
