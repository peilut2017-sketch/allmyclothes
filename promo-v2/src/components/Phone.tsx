import React from 'react';

export const SCREEN_W = 390;
export const SCREEN_H = 844;
const BEZEL = 13;
export const PHONE_W = SCREEN_W + BEZEL * 2;
export const PHONE_H = SCREEN_H + BEZEL * 2;

export interface PhonePose {
  x: number; // מרכז, בפיקסלים של הקומפוזיציה
  y: number;
  s: number; // קנה מידה (1 = 416px רוחב)
  ry?: number; // סיבוב תלת-ממדי סביב Y (מעלות)
  rx?: number;
  rz?: number;
  o?: number;
}

export function lerpPose(a: PhonePose, b: PhonePose, t: number): PhonePose {
  const L = (p: number | undefined, q: number | undefined) => (p ?? 0) + ((q ?? 0) - (p ?? 0)) * t;
  return { x: L(a.x, b.x), y: L(a.y, b.y), s: L(a.s, b.s), ry: L(a.ry, b.ry), rx: L(a.rx, b.rx), rz: L(a.rz, b.rz), o: L(a.o ?? 1, b.o ?? 1) };
}

/** סמארטפון מודרני עם מסגרת מתכתית, אי דינמי, השתקפות וצל רך */
export function Phone({ pose, children, shadow = 1 }: { pose: PhonePose; children: React.ReactNode; shadow?: number }) {
  const { x, y, s, ry = 0, rx = 0, rz = 0, o = 1 } = pose;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - PHONE_W / 2,
        top: y - PHONE_H / 2,
        width: PHONE_W,
        height: PHONE_H,
        transform: `perspective(2600px) scale(${s}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
        transformOrigin: '50% 50%',
        opacity: o,
      }}
    >
      {/* צל רך מתחת */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 66,
          boxShadow: `0 ${60 * shadow}px ${110 * shadow}px rgba(70,45,10,${0.28 * shadow}), 0 ${14 * shadow}px ${30 * shadow}px rgba(70,45,10,${0.18 * shadow})`,
        }}
      />
      {/* גוף מתכתי */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 66,
          background: 'linear-gradient(135deg, #5b5751 0%, #2a2724 30%, #1c1a18 60%, #4a4640 100%)',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18), inset 0 0 0 5px #121110',
        }}
      />
      {/* כפתורים בצד */}
      <div style={{ position: 'absolute', right: -3, top: 210, width: 4, height: 96, borderRadius: 3, background: '#3a3632' }} />
      <div style={{ position: 'absolute', left: -3, top: 170, width: 4, height: 54, borderRadius: 3, background: '#3a3632' }} />
      <div style={{ position: 'absolute', left: -3, top: 240, width: 4, height: 54, borderRadius: 3, background: '#3a3632' }} />
      {/* מסך */}
      <div
        style={{
          position: 'absolute',
          left: BEZEL,
          top: BEZEL,
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 54,
          overflow: 'hidden',
          background: '#faf7f2',
          isolation: 'isolate',
        }}
      >
        {children}
        <StatusBar />
        {/* אי דינמי */}
        <div style={{ position: 'absolute', top: 11, left: SCREEN_W / 2 - 62, width: 124, height: 36, borderRadius: 20, background: '#000', zIndex: 100 }} />
        {/* פס בית */}
        <div style={{ position: 'absolute', bottom: 8, left: SCREEN_W / 2 - 68, width: 136, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.85)', zIndex: 100 }} />
        {/* השתקפות זכוכית עדינה */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.06) 100%)',
            pointerEvents: 'none',
            zIndex: 101,
          }}
        />
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 50,
        zIndex: 99,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 34px 0 40px',
        direction: 'ltr',
        fontFamily: 'Heebo, sans-serif',
        fontSize: 16,
        fontWeight: 600,
        color: '#111',
      }}
    >
      <span>9:41</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.4" height={3 + i * 3} rx="1" fill="#111" />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 11.5 L5.6 8.9 Q8 6.9 10.4 8.9 Z" fill="#111" />
          <path d="M3.3 6.6 Q8 2.6 12.7 6.6 L11.3 8 Q8 5.3 4.7 8 Z" fill="#111" />
          <path d="M1 4.2 Q8 -1.6 15 4.2 L13.6 5.6 Q8 1 2.4 5.6 Z" fill="#111" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" fill="none" stroke="#111" strokeOpacity="0.4" />
          <rect x="2" y="2" width="17" height="8" rx="2" fill="#111" />
          <rect x="23.5" y="4" width="1.8" height="4" rx="0.9" fill="#111" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

/** אינדיקטור נגיעה: עיגול לחיצה + גל מתרחב. f = פריים יחסי לרגע הלחיצה */
export function Tap({ x, y, f }: { x: number; y: number; f: number }) {
  if (f < -8 || f > 22) return null;
  const appear = Math.min(1, (f + 8) / 6);
  const press = f < 0 ? 0 : f < 4 ? f / 4 : Math.max(0, 1 - (f - 4) / 6);
  const fade = f > 10 ? Math.max(0, 1 - (f - 10) / 12) : 1;
  const ring = f < 0 ? 0 : Math.min(1, f / 14);
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 120, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: -26,
          top: -26,
          width: 52,
          height: 52,
          borderRadius: 99,
          background: 'rgba(45,42,38,0.22)',
          border: '2px solid rgba(255,255,255,0.85)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          transform: `scale(${(0.7 + 0.3 * appear) * (1 - press * 0.22)})`,
          opacity: appear * fade,
        }}
      />
      {f >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: -26,
            top: -26,
            width: 52,
            height: 52,
            borderRadius: 99,
            border: '3px solid rgba(245,158,11,0.9)',
            transform: `scale(${1 + ring * 1.3})`,
            opacity: (1 - ring) * 0.9,
          }}
        />
      )}
    </div>
  );
}
