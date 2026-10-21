import { Easing, interpolate, spring } from 'remotion';
import { FPS } from './config';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** התקדמות ליניארית 0..1 בין שני פריימים */
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);
/** עקומה "יוקרתית" – יציאה רכה ומהירה */
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

export const ease = (f: number, a: number, b: number, fn: (x: number) => number = easeOut) => fn(prog(f, a, b));

/** קפיץ שמתחיל בפריים start */
export function spr(f: number, start: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) {
  return spring({
    frame: f - start,
    fps: FPS,
    config: { damping: cfg.damping ?? 14, stiffness: cfg.stiffness ?? 140, mass: cfg.mass ?? 0.9 },
  });
}

/** קפיץ רך ללא קפיצת יתר */
export function sprSoft(f: number, start: number) {
  return spring({ frame: f - start, fps: FPS, config: { damping: 200, stiffness: 120, mass: 1 } });
}

export const map = (v: number, inR: number[], outR: number[]) =>
  interpolate(v, inR, outR, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** רעש דטרמיניסטי (פסאודו אקראי) */
export function rnd(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** נקודה על עקומת בזייה ריבועית */
export function qbez(p0: [number, number], c: [number, number], p1: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
}
