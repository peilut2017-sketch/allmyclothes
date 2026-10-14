// דפדפן לרינדור: משתמשים ב-REMOTION_BROWSER אם הוגדר, אחרת ב-Chromium מקומי אם קיים, ואחרת Remotion מוריד דפדפן בעצמו
import fs from 'fs';

const candidates = [
  process.env.REMOTION_BROWSER,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
].filter(Boolean);

export const browserExecutable = candidates.find((p) => fs.existsSync(p)) ?? null;
