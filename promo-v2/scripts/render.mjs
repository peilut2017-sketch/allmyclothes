// רינדור הסרטון המלא ל-MP4 + נרמול עוצמה לרשתות (-14 LUFS)
// שימוש: npm run render            → out/aron-hamishpacha-promo.mp4 (מוזיקה + אפקטים)
//        npm run render -- --vo    → גם גרסה עם קריינות (דורש public/audio/vo.wav)
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { browserExecutable } from './browser.mjs';

const withVo = process.argv.includes('--vo');
const outDir = path.resolve('out');
fs.mkdirSync(outDir, { recursive: true });

console.log('בונה פסקול...');
execFileSync('python3', ['audio/build_audio.py'], { stdio: 'inherit' });

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });

async function render(name, inputProps) {
  const composition = await selectComposition({ serveUrl, id: 'Promo', inputProps, browserExecutable });
  const raw = path.join(outDir, `${name}.raw.mp4`);
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    crf: 17,
    pixelFormat: 'yuv420p',
    audioCodec: 'aac',
    audioBitrate: '256k',
    outputLocation: raw,
    inputProps,
    browserExecutable,
    concurrency: Math.max(1, os.cpus().length),
    onProgress: ({ renderedFrames }) => {
      const p = Math.floor((renderedFrames / composition.durationInFrames) * 100);
      if (p !== last && p % 5 === 0) console.log(`${name}: ${p}%`);
      last = p;
    },
  });
  // נרמול עוצמה + faststart לצפייה מיידית בוואטסאפ/טלגרם
  const final = path.join(outDir, `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', final]);
  fs.unlinkSync(raw);
  console.log('נוצר:', final);
}

await render('aron-hamishpacha-promo', { withVoiceover: false });
if (withVo) await render('aron-hamishpacha-promo-vo', { withVoiceover: true });
