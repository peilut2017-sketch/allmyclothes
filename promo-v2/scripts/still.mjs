// רינדור פריימים בודדים לבדיקה: node scripts/still.mjs <CompositionId> <outDir> <frame,frame,...> [scale]
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { browserExecutable } from './browser.mjs';

const [id, outDir, framesArg = '0', scaleArg = '0.5'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const puppeteerInstance = await openBrowser('chrome', { browserExecutable, logLevel: 'error' });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance, logLevel: 'error' });
for (const f of framesArg.split(',').map(Number)) {
  const output = path.join(outDir, `${id}_${String(f).padStart(4, '0')}.png`);
  await renderStill({ serveUrl, composition, output, frame: f, puppeteerInstance, scale: Number(scaleArg), logLevel: 'error' });
  console.log(output);
}
await puppeteerInstance.close({ silent: true });
