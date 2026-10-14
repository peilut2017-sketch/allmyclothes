import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Headline } from '../components/Headline';
import { Phone, Tap, lerpPose } from '../components/Phone';
import { ClosetScreen, ShoppingScreen, cardPos } from '../app/screens';
import { ProductShot } from '../app/ui';
import { CLOSET_ALL, GAP_ROW, SHOP_LIST, itemById } from '../app/data';
import { FPS, beat, copy, scene } from '../config';
import { clamp, ease, easeInOut, qbez, spr } from '../anim';
import { POSE } from './shared';

const press = (f: number, at: number) => (f < at ? 0 : f < at + 4 ? (f - at) / 4 : Math.max(0, 1 - (f - at - 4) / 6));
const BASE = CLOSET_ALL.slice(0, 8);

/** הארון עם פריט חדש שנכנס למקום הראשון והשאר זזים מקום אחד */
function SharedCloset({ f, addAt, fabPress = 0 }: { f: number; addAt: number; fabPress?: number }) {
  const added = f >= addAt;
  const ids = added ? ['n1', ...BASE] : BASE;
  const p = spr(f, addAt, { damping: 15, stiffness: 150 });
  return (
    <ClosetScreen
      ids={ids}
      fabPress={fabPress}
      cardAnim={(id, idx) => {
        if (!added) return { o: 1, s: 1 };
        if (id === 'n1') return { o: clamp(p * 1.5), s: 0.6 + 0.4 * p, highlight: 1 - ease(f, addAt + 14, addAt + 40) };
        const from = cardPos(idx - 1);
        const to = cardPos(idx);
        return { o: 1, s: 1, dx: (from.x - to.x) * (1 - p), dy: (from.y - to.y) * (1 - p) };
      }}
    />
  );
}

/** סצנה 7 – ארון משפחתי משותף: מוסיפים בטלפון אחד, הפריט מופיע בארון המשותף בטלפון השני */
export const S7Shared: React.FC = () => {
  const f = useCurrentFrame();
  const dur = scene('shared').dur * FPS;
  const b = (n: string) => beat('shared', n);

  const pIn = spr(f, b('phones'), { damping: 20, stiffness: 85 });
  const right = lerpPose(POSE.shop, POSE.sharedR, pIn);
  const left = lerpPose({ ...POSE.sharedL, x: -420, ry: 30 }, POSE.sharedL, spr(f, b('phones') + 3, { damping: 20, stiffness: 85 }));
  const toCloset = ease(f, 0, 10);

  // קו החיבור בין המכשירים
  const A: [number, number] = [left.x + 120, left.y - 330];
  const B: [number, number] = [right.x - 120, right.y - 330];
  const Cc: [number, number] = [540, left.y - 560];
  const draw = ease(f, b('line'), b('line') + 18, easeInOut);
  const pulseT = ease(f, b('pulse'), b('arrived'), easeInOut);
  const pulsing = f >= b('pulse') && f <= b('arrived') + 2;
  const pts = Array.from({ length: 40 }, (_, i) => qbez(A, Cc, B, i / 39));
  const path = 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L');
  const [px, py] = qbez(A, Cc, B, pulseT);
  const arriveGlow = f >= b('arrived') ? Math.max(0, 1 - (f - b('arrived')) / 20) : 0;
  const sentGlow = f >= b('added') ? Math.max(0, 1 - (f - b('added')) / 20) : 0;
  const it = itemById('n1');

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="lineG" x1="0" x2="1">
            <stop offset="0" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#lineG)" strokeWidth={8} strokeLinecap="round" strokeDasharray="2 22" pathLength={1000} style={{ strokeDashoffset: -f * 2 }} opacity={draw * 0.9} />
        <circle cx={A[0]} cy={A[1]} r={14 + sentGlow * 16} fill="#f59e0b" opacity={draw * (0.9 - sentGlow * 0.4)} />
        <circle cx={B[0]} cy={B[1]} r={14 + arriveGlow * 16} fill="#f59e0b" opacity={draw * (0.9 - arriveGlow * 0.4)} />
      </svg>

      <Phone pose={left}>
        <SharedCloset f={f} addAt={b('added')} fabPress={press(f, b('tapAdd'))} />
        <Tap x={195} y={790} f={f - b('tapAdd')} />
      </Phone>
      <Phone pose={right}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <ShoppingScreen rows={[GAP_ROW, SHOP_LIST[2]]} gapsShown={['g2']} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: toCloset }}>
          <SharedCloset f={f} addAt={b('arrived')} />
        </div>
      </Phone>

      {pulsing && (
        <div style={{ position: 'absolute', left: px - 55, top: py - 55, width: 110, height: 110, borderRadius: 26, overflow: 'hidden', boxShadow: '0 0 0 6px rgba(245,158,11,0.35), 0 16px 34px rgba(80,50,10,0.3)', transform: `scale(${0.7 + 0.3 * Math.sin(pulseT * Math.PI)})` }}>
          <ProductShot kind={it.kind} color={it.color} accent={it.accent} bg={it.bg} size={96} />
        </div>
      )}

      <Headline text={copy('shared', 'title')} f={f} inAt={b('title')} outAt={dur - 12} top={300} size={96} />
    </AbsoluteFill>
  );
};
