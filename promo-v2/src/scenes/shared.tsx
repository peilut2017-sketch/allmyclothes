import React from 'react';
import { PhonePose } from '../components/Phone';
import { Garment, GarmentKind } from '../components/Garment';
import { clamp, easeInOut, rnd, spr } from '../anim';
import { FPS, scene } from '../config';

/** תנוחות הטלפון – כל סצנה מסתיימת בתנוחה שבה הבאה מתחילה, כך שהמעבר רציף */
export const POSE = {
  solution: { x: 540, y: 1175, s: 1.2 } as PhonePose,
  closet: { x: 540, y: 1200, s: 1.27 } as PhonePose,
  closetEnd: { x: 540, y: 1190, s: 1.33, ry: -3 } as PhonePose,
  aside: { x: 322, y: 1185, s: 1.16, ry: 8 } as PhonePose,
  season: { x: 540, y: 1215, s: 1.25 } as PhonePose,
  shop: { x: 700, y: 1190, s: 1.14, ry: -8 } as PhonePose,
  sharedL: { x: 290, y: 1170, s: 0.84, ry: 12 } as PhonePose,
  sharedR: { x: 790, y: 1170, s: 0.84, ry: -12 } as PhonePose,
  cta: { x: 540, y: 1180, s: 1.0 } as PhonePose,
};

/* ---------------- ענן הבגדים של הפתיחה ---------------- */

export interface SwirlItem {
  kind: GarmentKind;
  color: string;
  accent?: string;
  r: number; // רדיוס מסלול
  a0: number; // זווית התחלה
  w: number; // מהירות זוויתית
  z: number; // עומק 0..1
  size: number;
}

const PALETTE: [GarmentKind, string, string?][] = [
  ['tshirt', '#fbbf24', '#ffffff'],
  ['dress', '#f9a8c4', '#ffffff'],
  ['pants', '#60a5fa'],
  ['coat', '#34d399', '#fde68a'],
  ['pajama', '#a5b4fc', '#ffffff'],
  ['boots', '#b08968', '#fff7ed'],
  ['hoodie', '#fb923c', '#ffffff'],
  ['skirt', '#64748b'],
  ['sweater', '#e0a83a', '#fef3c7'],
  ['hat', '#f87171', '#ffffff'],
  ['shirt', '#f1f5f9', '#cbd5e1'],
  ['tights', '#c4b5fd', '#ffffff'],
];

export const SWIRL: SwirlItem[] = scene('problem').spawns!.map((_, i) => {
  const [kind, color, accent] = PALETTE[i % PALETTE.length];
  const z = i === 0 ? 0.85 : rnd(i * 3.1 + 1);
  return {
    kind,
    color,
    accent,
    r: i === 0 ? 110 : 240 + rnd(i * 7.7) * 250,
    a0: i * 2.39996, // זווית הזהב – פיזור אחיד
    w: (0.35 + rnd(i * 1.3) * 0.35) * (i % 3 === 0 ? -1 : 1),
    z,
    size: i === 0 ? 330 : 220 + z * 150,
  };
});

export const SWIRL_CENTER = { x: 540, y: 1150 };

/** מצב בגד i בזמן t (שניות מתחילת הסרטון) */
export function swirlState(i: number, t: number) {
  const it = SWIRL[i];
  const sp = scene('problem').spawns![i];
  const local = Math.max(0, t - sp);
  // התאוצה גוברת ככל שמתקרבים לסוף הפתיחה – תחושת עומס
  const accel = 1 + Math.pow(clamp(t / 6), 2) * 1.6;
  const ang = it.a0 + it.w * local * accel;
  const out = easeInOut(clamp(local / 0.7));
  const rx = it.r * 1.0;
  const ry = it.r * 1.3;
  const x = SWIRL_CENTER.x + Math.cos(ang) * rx * out;
  const y = SWIRL_CENTER.y + Math.sin(ang) * ry * out * 0.85 + Math.sin(t * 1.7 + i) * 10;
  const pop = spr(t * FPS, sp * FPS, { damping: 11, stiffness: 160 });
  const rot = Math.sin(t * 1.3 + i * 0.7) * 18 + it.w * local * 20;
  const scale = (0.62 + it.z * 0.5) * pop;
  return { x, y, rot, scale, visible: t >= sp, z: it.z };
}

export function GarmentSprite({ item, x, y, rot, scale, opacity = 1, blur = 0 }: { item: { kind: GarmentKind; color: string; accent?: string; size: number }; x: number; y: number; rot: number; scale: number; opacity?: number; blur?: number }) {
  const s = item.size;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - s / 2,
        top: y - s / 2,
        width: s,
        height: s,
        transform: `rotate(${rot}deg) scale(${scale})`,
        opacity,
        filter: `drop-shadow(0 ${18 * scale}px ${22 * scale}px rgba(90,60,20,0.22))${blur > 0.3 ? ` blur(${blur}px)` : ''}`,
      }}
    >
      <Garment kind={item.kind} color={item.color} accent={item.accent} size={s} depth={6} />
    </div>
  );
}

/** תגית מידה/עונה מעוצבת (לא אימוג'י) */
export function Tag({ text, x, y, p, rot = 0, tone = 'amber', size = 38 }: { text: string; x: number; y: number; p: number; rot?: number; tone?: 'amber' | 'sky' | 'rose' | 'ink' | 'emerald' | 'blue'; size?: number }) {
  if (p <= 0.001) return null;
  const tones = {
    amber: ['#fff7e6', '#b45309', '#f59e0b'],
    sky: ['#eaf6ff', '#075985', '#38bdf8'],
    rose: ['#fff0f3', '#9f1239', '#f43f5e'],
    ink: ['#ffffff', '#2d2a26', '#9ca3af'],
    emerald: ['#ecfdf5', '#065f46', '#10b981'],
    blue: ['#eff6ff', '#1e40af', '#3b82f6'],
  }[tone];
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${p})`,
        background: tones[0],
        color: tones[1],
        borderRadius: 999,
        padding: '14px 30px 14px 26px',
        fontFamily: 'Heebo',
        fontSize: size,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        direction: 'rtl',
        boxShadow: '0 10px 30px rgba(80,50,10,0.14), 0 2px 6px rgba(80,50,10,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 99, background: tones[2] }} />
      {text}
    </div>
  );
}
