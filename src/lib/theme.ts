export type Theme = 'light' | 'dark' | 'system';

const KEY = 'theme';

export function getTheme(): Theme {
  const stored = localStorage.getItem(KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
}

export function setTheme(theme: Theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

/** מאזין לשינוי ערכת הנושא של המערכת כשנבחר מצב אוטומטי */
export function watchSystemTheme() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });
}
