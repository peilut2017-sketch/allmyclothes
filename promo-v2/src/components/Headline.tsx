import React from 'react';
import { C, FONT } from '../theme';
import { clamp, spr } from '../anim';

/**
 * כותרת מונפשת מילה-מילה (RTL). מילים בין כוכביות *כך* מודגשות בצבע המותג.
 * f: פריים מקומי. in/out: פריימי כניסה ויציאה.
 */
export function Headline({
  text,
  f,
  inAt,
  outAt,
  top,
  size = 96,
  weight = 900,
  color = C.ink,
  hl = C.amber500,
  stagger = 3,
  lineHeight = 1.12,
  side = 60,
  relative = false,
}: {
  text: string;
  f: number;
  inAt: number;
  outAt?: number;
  top: number;
  size?: number;
  weight?: number;
  color?: string;
  hl?: string;
  stagger?: number;
  lineHeight?: number;
  side?: number;
  relative?: boolean;
}) {
  const tokens: { w: string; h: boolean }[] = [];
  let h = false;
  for (const tok of text.split(' ')) {
    const starts = tok.startsWith('*');
    if (starts) h = true;
    const clean = tok.replace(/\*/g, '');
    tokens.push({ w: clean, h });
    if (tok.endsWith('*') && (tok.length > 1 || !starts)) h = false;
  }
  if (f < inAt - 2) return null;
  if (outAt !== undefined && f > outAt + 20 + tokens.length * 2) return null;

  return (
    <div
      style={{
        ...(relative ? { position: 'relative' as const } : { position: 'absolute' as const, left: side, right: side, top }),
        textAlign: 'center',
        direction: 'rtl',
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        lineHeight,
        color,
        letterSpacing: size > 70 ? -1.5 : 0,
      }}
    >
      {tokens.map((t, i) => {
        const pin = spr(f, inAt + i * stagger, { damping: 15, stiffness: 150 });
        const pout = outAt === undefined ? 0 : clamp((f - outAt - i * 2) / 10);
        const y = (1 - pin) * size * 0.5 - pout * size * 0.35;
        const blur = (1 - clamp(pin * 1.4)) * 10 + pout * 10;
        const o = clamp(pin * 1.6) * (1 - pout);
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: 'inline-block',
                color: t.h ? hl : color,
                transform: `translateY(${y}px) scale(${0.92 + 0.08 * clamp(pin)})`,
                filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
                opacity: o,
              }}
            >
              {t.w}
            </span>
            {i < tokens.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** כותרת משנה – כניסה אחידה עם טשטוש */
export function SubLine({ text, f, inAt, outAt, top = 0, size = 50, color = C.g600, weight = 500, relative = false }: { text: string; f: number; inAt: number; outAt?: number; top?: number; size?: number; color?: string; weight?: number; relative?: boolean }) {
  if (f < inAt - 2) return relative ? <div style={{ height: size * 1.25 }} /> : null;
  const p = spr(f, inAt, { damping: 20, stiffness: 120 });
  const pout = outAt === undefined ? 0 : clamp((f - outAt) / 10);
  return (
    <div
      style={{
        ...(relative ? { position: 'relative' as const } : { position: 'absolute' as const, left: 70, right: 70, top }),
        textAlign: 'center',
        direction: 'rtl',
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight: 1.25,
        opacity: clamp(p * 1.4) * (1 - pout),
        transform: `translateY(${(1 - p) * 24 - pout * 16}px)`,
        filter: p < 0.7 || pout > 0 ? `blur(${(1 - clamp(p / 0.7)) * 6 + pout * 6}px)` : undefined,
      }}
    >
      {text}
    </div>
  );
}

/** כותרת + כותרת משנה בעמודה אחת – כותרת המשנה תמיד יורדת מתחת לכותרת גם אם זו נשברת לשתי שורות */
export function TitleBlock({
  title,
  sub,
  f,
  inAt,
  subAt,
  outAt,
  top = 290,
  size = 100,
  subSize = 52,
  hl,
}: {
  title: string;
  sub?: string;
  f: number;
  inAt: number;
  subAt?: number;
  outAt?: number;
  top?: number;
  size?: number;
  subSize?: number;
  hl?: string;
}) {
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Headline relative text={title} f={f} inAt={inAt} outAt={outAt} top={0} size={size} hl={hl} />
      {sub ? <SubLine relative text={sub} f={f} inAt={subAt ?? inAt + 12} outAt={outAt} size={subSize} /> : null}
    </div>
  );
}
