import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TitleBlock } from '../components/Headline';
import { Phone, Tap, lerpPose } from '../components/Phone';
import { COND_TAPS, ConditionSheet, SWAP_TAPS, SwapScreen, TRANSFER_TAPS, TransferSheet } from '../app/screens';
import { itemById } from '../app/data';
import { FPS, beat, copy, scene } from '../config';
import { clamp, ease, easeInOut, lerp, rnd, spr } from '../anim';
import { POSE, Tag } from './shared';

const press = (f: number, at: number) => (f < at ? 0 : f < at + 4 ? (f - at) / 4 : Math.max(0, 1 - (f - at - 4) / 6));

/** שמש שהופכת לפתית שלג – 8 קרניים מתארכות לזרועות */
function SunToSnow({ p, x, y, size }: { p: number; x: number; y: number; size: number }) {
  const col = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], p))).join(',')})`;
  const c = col([245, 158, 11], [56, 189, 248]);
  const coreR = lerp(30, 9, p);
  const inner = lerp(44, 14, p);
  const outer = lerp(62, 74, p);
  const branch = p;
  return (
    <svg width={size} height={size} viewBox="-90 -90 180 180" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible', filter: 'drop-shadow(0 12px 22px rgba(80,60,20,0.18))' }}>
      <g transform={`rotate(${p * 90})`}>
        <circle r={coreR + 8 * (1 - p)} fill={c} opacity={0.22 * (1 - p)} />
        <circle r={coreR} fill={c} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const bx = ca * outer * 0.62;
          const by = sa * outer * 0.62;
          const bl = 18 * branch;
          return (
            <g key={i}>
              <line x1={ca * inner} y1={sa * inner} x2={ca * outer} y2={sa * outer} stroke={c} strokeWidth={lerp(10, 7, p)} strokeLinecap="round" />
              {branch > 0.02 && (
                <>
                  <line x1={bx} y1={by} x2={bx + Math.cos(a + 0.8) * bl} y2={by + Math.sin(a + 0.8) * bl} stroke={c} strokeWidth={6} strokeLinecap="round" />
                  <line x1={bx} y1={by} x2={bx + Math.cos(a - 0.8) * bl} y2={by + Math.sin(a - 0.8) * bl} stroke={c} strokeWidth={6} strokeLinecap="round" />
                </>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** סצנה 5 – החלפת עונה: מעבר מודרך פריט-פריט */
export const S5Season: React.FC = () => {
  const f = useCurrentFrame();
  const dur = scene('season').dur * FPS;
  const b = (n: string) => beat('season', n);

  const pose = lerpPose(POSE.aside, POSE.season, spr(f, 0, { damping: 20, stiffness: 80 }));
  const morph = ease(f, b('morph'), b('morph') + 26, easeInOut);
  const iconIn = spr(f, 0, { damping: 13, stiffness: 140 });

  const queue = [itemById('i7'), itemById('i13'), itemById('i12'), itemById('i1')];
  const nexts = [b('next1'), b('next2'), b('next3')];
  const dirs = [-1, 1, -1];
  let index = 0;
  nexts.forEach((n) => {
    if (f >= n) index++;
  });
  const lastNext = index > 0 ? nexts[index - 1] : b('screen');
  const inP = spr(f, lastNext, { damping: 16, stiffness: 150 });
  const out = index > 0 ? { item: queue[index - 1], p: ease(f, lastNext, lastNext + 12), dir: dirs[index - 1] } : undefined;
  const total = 9;

  const screenIn = ease(f, b('screen') - 6, b('screen') + 6);
  const cond1 = f < b('next1') ? spr(f, b('condSheet'), { damping: 20, stiffness: 170 }) : 1 - ease(f, b('next1') - 2, b('next1') + 6);
  const transferS = f < b('tapChild') + 3 ? spr(f, b('transferSheet'), { damping: 20, stiffness: 170 }) : 1 - ease(f, b('tapChild') + 3, b('tapChild') + 10);
  const cond2 = f < b('next2') ? spr(f, b('condSheet2'), { damping: 20, stiffness: 170 }) : 1 - ease(f, b('next2') - 2, b('next2') + 6);

  const btnPress =
    f < b('tapTransfer') - 6 ? { k: 'keep' as const, p: press(f, b('tapKeep')) } : f < b('tapOutgrown') - 6 ? { k: 'transfer' as const, p: press(f, b('tapTransfer')) } : { k: 'outgrown' as const, p: press(f, b('tapOutgrown')) };

  const taps = [
    { at: b('tapKeep'), ...SWAP_TAPS.keep },
    { at: b('tapCond'), ...COND_TAPS.n(8) },
    { at: b('tapTransfer'), ...SWAP_TAPS.transfer },
    { at: b('tapChild'), ...TRANSFER_TAPS.moishi },
    { at: b('tapSkip'), ...COND_TAPS.close },
    { at: b('tapOutgrown'), ...SWAP_TAPS.outgrown },
  ];

  // תוויות החלטה שצצות ליד הטלפון
  const decisions = [
    { at: b('next1'), text: 'נשאר בארון', tone: 'emerald' as const, x: 905, y: 960 },
    { at: b('next2'), text: 'עובר למוישי', tone: 'blue' as const, x: 190, y: 1080 },
    { at: b('next3'), text: 'קטן מדי', tone: 'rose' as const, x: 920, y: 1200 },
  ];

  return (
    <AbsoluteFill>
      {/* פתיתי שלג עדינים ברקע */}
      {Array.from({ length: 26 }, (_, i) => {
        const appear = ease(f, b('morph') + 10, b('morph') + 40);
        if (appear <= 0) return null;
        const sp = 40 + rnd(i * 2.3) * 60;
        const x = rnd(i * 9.1) * 1080 + Math.sin(f / 20 + i) * 20;
        const y = ((rnd(i * 4.7) * 1920 + (f * sp) / 30) % 2000) - 40;
        const r = 4 + rnd(i * 1.7) * 7;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: 99, background: '#ffffff', boxShadow: '0 0 10px rgba(125,180,230,0.6)', opacity: appear * (0.5 + rnd(i) * 0.4) * (1 - ease(f, dur - 12, dur)) }} />;
      })}

      <Phone pose={pose}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: '#faf7f2' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: screenIn }}>
          <SwapScreen index={index} total={total} item={queue[index]} out={out} inP={index === 0 ? spr(f, b('screen'), { damping: 16, stiffness: 150 }) : inP} press={btnPress} />
        </div>
        <ConditionSheet p={clamp(cond1)} value={f >= b('tapCond') + 2 ? 8 : 0} sub="עוד לא דורג – לחיצה על מספר שומרת וממשיכה" press={press(f, b('tapCond'))} skip />
        <TransferSheet p={clamp(transferS)} exclude="yehuda" title="למי עובר ״מעיל רוח״?" swap press={{ id: 'moishi', p: press(f, b('tapChild')) }} />
        <ConditionSheet p={clamp(cond2)} value={0} sub="עוד לא דורג – לחיצה על מספר שומרת וממשיכה" skip skipPress={press(f, b('tapSkip'))} />
        {taps.map((tp, k) => (
          <Tap key={k} x={tp.x} y={tp.y} f={f - tp.at} />
        ))}
      </Phone>

      {decisions.map((d, k) => {
        if (f < d.at) return null;
        const p = spr(f, d.at, { damping: 11, stiffness: 190 }) * (1 - ease(f, d.at + 34, d.at + 44));
        return <Tag key={k} text={d.text} x={d.x} y={d.y - (f - d.at) * 1.2} p={p} tone={d.tone} size={34} rot={k === 1 ? -4 : 4} />;
      })}

      <div style={{ position: 'absolute', inset: 0, transform: `scale(${iconIn})`, transformOrigin: '540px 215px', opacity: clamp(iconIn * 1.5) * (1 - ease(f, dur - 14, dur - 2)) }}>
        <SunToSnow p={morph} x={540} y={215} size={170} />
      </div>
      <TitleBlock title={copy('season', 'title')} sub={copy('season', 'sub')} f={f} inAt={b('title')} subAt={b('sub')} outAt={dur - 14} top={330} hl="#0ea5e9" />
    </AbsoluteFill>
  );
};
