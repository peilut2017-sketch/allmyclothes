import React from 'react';
import { AbsoluteFill } from 'remotion';

/** רקע בהיר ואופטימי עם כתמי צבע רכים שנעים לאט (פרלקסה). tint משנה את גוון הכתמים לפי סצנה */
export function Backdrop({ f, tint = ['#fde68a', '#bae6fd', '#fbcfe8'], drift = 1 }: { f: number; tint?: string[]; drift?: number }) {
  const t = f / 30;
  const blobs = [
    { x: 160, y: 300, r: 520, c: tint[0], sx: 40, sy: 30, p: 0 },
    { x: 940, y: 820, r: 560, c: tint[1], sx: 50, sy: 40, p: 2 },
    { x: 260, y: 1600, r: 600, c: tint[2], sx: 45, sy: 35, p: 4 },
  ];
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #fdfbf7 0%, #faf5ec 55%, #f8efe0 100%)', overflow: 'hidden' }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x - b.r / 2 + Math.sin(t * 0.5 * drift + b.p) * b.sx,
            top: b.y - b.r / 2 + Math.cos(t * 0.4 * drift + b.p) * b.sy,
            width: b.r,
            height: b.r,
            borderRadius: '50%',
            background: b.c,
            opacity: 0.38,
            filter: 'blur(90px)',
          }}
        />
      ))}
      {/* גרעיניות עדינה של נייר – מונעת banding בגרדיאנטים */}
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'multiply' }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={3} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
}

/** אייקון האפליקציה (public/icon.svg באפליקציה): ריבוע ענבר מעוגל עם חולצה */
export function AppIcon({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: 'linear-gradient(160deg, #fbbf24 0%, #f59e0b 55%, #e98a06 100%)',
        boxShadow: `0 ${size * 0.12}px ${size * 0.3}px rgba(217,119,6,0.35), inset 0 ${size * 0.02}px 0 rgba(255,255,255,0.35)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.52,
        lineHeight: 1,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <span style={{ transform: `translateY(${size * 0.02}px)` }}>👕</span>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 45%)' }} />
    </div>
  );
}
