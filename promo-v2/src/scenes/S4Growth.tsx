import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Headline } from '../components/Headline';
import { Phone, Tap, lerpPose } from '../components/Phone';
import { CHILDREN_TAPS, COND_TAPS, ChildrenScreen, ConditionSheet, DETAIL_TAPS, DetailScreen, TRANSFER_TAPS, TransferSheet } from '../app/screens';
import { ProductShot } from '../app/ui';
import { KIDS, itemById } from '../app/data';
import { FPS, beat, copy, scene } from '../config';
import { clamp, ease, easeInOut, qbez, spr } from '../anim';
import { C, FONT } from '../theme';
import { POSE } from './shared';

const press = (f: number, at: number) => (f < at ? 0 : f < at + 4 ? (f - at) / 4 : Math.max(0, 1 - (f - at - 4) / 6));

const CARD_X = 596;
const CARD_W = 444;
const Y_OLD = 690;
const Y_NEW = 1170;
const THUMB = 120;
const slotCenter = (top: number) => ({ x: CARD_X + CARD_W - 26 - THUMB / 2, y: top + 10 + 26 + 84 + 20 + THUMB / 2 });

function KidCard({ id, top, p, glow = 0, children }: { id: string; top: number; p: number; glow?: number; children?: React.ReactNode }) {
  const kid = KIDS[id];
  return (
    <div
      style={{
        position: 'absolute',
        left: CARD_X,
        top,
        width: CARD_W,
        height: 296,
        borderRadius: 34,
        background: '#fff',
        overflow: 'hidden',
        boxShadow: `0 0 0 ${glow * 6}px ${kid.color}55, 0 24px 50px rgba(80,50,10,0.16), 0 4px 12px rgba(80,50,10,0.08)`,
        transform: `translateX(${(1 - p) * 120}px) scale(${0.9 + 0.1 * p})`,
        opacity: clamp(p * 1.4),
        direction: 'rtl',
        fontFamily: FONT,
      }}
    >
      <div style={{ height: 10, background: kid.color }} />
      <div style={{ padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, height: 84 }}>
          <span style={{ width: 84, height: 84, borderRadius: 99, background: `${kid.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>{kid.emoji}</span>
          <div>
            <div style={{ fontSize: 44, fontWeight: 800, color: C.ink, lineHeight: 1.1 }}>{kid.name}</div>
            <div style={{ fontSize: 28, color: C.g500 }}>גיל: {kid.age}</div>
          </div>
        </div>
        <div style={{ marginTop: 20, height: THUMB, display: 'flex', alignItems: 'center', gap: 18 }}>{children}</div>
      </div>
    </div>
  );
}

function Thumb() {
  const it = itemById('i3');
  return (
    <div style={{ width: THUMB, height: THUMB, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 20px rgba(80,50,10,0.18)' }}>
      <ProductShot kind={it.kind} color={it.color} accent={it.accent} bg={it.bg} size={100} />
    </div>
  );
}

function BigPill({ bg, fg, children, p = 1 }: { bg: string; fg: string; children: React.ReactNode; p?: number }) {
  if (p <= 0.001) return null;
  return (
    <span style={{ borderRadius: 99, background: bg, color: fg, padding: '6px 16px', fontSize: 25, fontWeight: 700, whiteSpace: 'nowrap', transform: `scale(${p})`, transformOrigin: 'right center', display: 'inline-block' }}>
      {children}
    </span>
  );
}

/** סצנה 4 – גדילה והעברה בין אחים */
export const S4Growth: React.FC = () => {
  const f = useCurrentFrame();
  const dur = scene('growth').dur * FPS;
  const b = (n: string) => beat('growth', n);

  const pose = lerpPose(POSE.closetEnd, POSE.aside, spr(f, b('move'), { damping: 20, stiffness: 80 }));

  // מסכים בטלפון
  const toChildren = ease(f, 0, 10);
  const alertP = spr(f, b('alert'), { damping: 14, stiffness: 150 });
  const push = spr(f, b('detailPush'), { damping: 22, stiffness: 150 });
  const sheetT = f < b('tapChild') + 3 ? spr(f, b('modal'), { damping: 20, stiffness: 160 }) : 1 - ease(f, b('tapChild') + 3, b('tapChild') + 12);
  const transferred = f >= b('tapChild') + 4;
  const condSheet = f < b('tapClose') + 2 ? spr(f, b('condition'), { damping: 20, stiffness: 160 }) : 1 - ease(f, b('tapClose') + 2, b('tapClose') + 11);
  const condVal = 9 * ease(f, b('condition') + 4, b('condition') + 22, easeInOut);
  const status = f >= b('waiting') ? 'waiting' : 'active';

  const taps = [
    { at: b('tapRow'), ...CHILDREN_TAPS.row },
    { at: b('tapTransfer'), ...DETAIL_TAPS.transfer },
    { at: b('tapChild'), ...TRANSFER_TAPS.shira },
    { at: b('tapCond'), ...DETAIL_TAPS.cond },
    { at: b('tapClose'), ...COND_TAPS.close },
    { at: b('tapStatus'), ...DETAIL_TAPS.statusBadge },
  ];

  // כרטיסי הילדים והבגד המעופף
  const pOld = spr(f, b('cards'), { damping: 16, stiffness: 120 });
  const pNew = spr(f, b('cards') + 4, { damping: 16, stiffness: 120 });
  const alertPill = spr(f, b('alert'), { damping: 10, stiffness: 200 });
  const flyT = ease(f, b('fly'), b('landed'), easeInOut);
  const flying = f >= b('fly') && f < b('landed');
  const landed = f >= b('landed');
  const land = spr(f, b('landed'), { damping: 9, stiffness: 220 });
  const A = slotCenter(Y_OLD);
  const B = slotCenter(Y_NEW);
  const ctrl: [number, number] = [A.x + 150, (A.y + B.y) / 2];
  const flyPos = (t: number) => qbez([A.x, A.y], ctrl, [B.x, B.y], t);
  const lift = Math.sin(flyT * Math.PI);

  return (
    <AbsoluteFill>
      <Phone pose={pose}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <DetailScreen item={itemById('i1')} gallery={1} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: toChildren }}>
          <ChildrenScreen alertP={clamp(alertP)} rowPress={press(f, b('tapRow'))} />
        </div>
        {f >= b('detailPush') && (
          <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-(1 - push) * 390}px)`, boxShadow: '0 0 40px rgba(0,0,0,0.2)' }}>
            <DetailScreen
              item={itemById('i3')}
              childId={transferred ? 'shira' : 'yehuda'}
              condition={f >= b('condition') + 22 ? 9 : 9}
              status={status}
              btnPress={f < b('tapChild') ? { k: 'transfer', p: press(f, b('tapTransfer')) } : { k: 'status', p: press(f, b('tapStatus')) }}
              rowFlash={
                f < b('tapCond') - 4
                  ? { k: 'child', p: transferred ? 1 - ease(f, b('tapChild') + 4, b('tapChild') + 26) : 0 }
                  : { k: 'cond', p: press(f, b('tapCond')) }
              }
            />
          </div>
        )}
        <TransferSheet p={clamp(sheetT)} exclude="yehuda" press={{ id: 'shira', p: press(f, b('tapChild')) }} />
        <ConditionSheet p={clamp(condSheet)} value={condVal} sub="" press={0} />
        {taps.map((tp, k) => (
          <Tap key={k} x={tp.x} y={tp.y} f={f - tp.at} />
        ))}
      </Phone>

      <KidCard id="yehuda" top={Y_OLD} p={pOld}>
        {!flying && !landed && (
          <>
            <Thumb />
            <BigPill bg={C.rose100} fg={C.rose700} p={f >= b('alert') ? alertPill : 0}>
              ⏰ {copy('growth', 'alert')}
            </BigPill>
          </>
        )}
        {(flying || landed) && <span style={{ fontSize: 28, color: C.g400, fontWeight: 500 }}>עבר לשירה</span>}
      </KidCard>
      <KidCard id="shira" top={Y_NEW} p={pNew} glow={landed ? Math.max(0, 1 - (f - b('landed')) / 24) : 0}>
        {landed ? (
          <>
            <div style={{ transform: `scale(${0.85 + 0.15 * land})` }}>
              <Thumb />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <BigPill bg={C.blue100} fg={C.blue800} p={f >= b('waiting') ? spr(f, b('waiting'), { damping: 11, stiffness: 200 }) : 0}>
                📦 שמור לגדילה
              </BigPill>
              <BigPill bg={C.emerald100} fg={C.emerald800} p={f >= b('tapClose') ? spr(f, b('tapClose'), { damping: 11, stiffness: 200 }) : 0}>
                🧵 9/10 · כמו חדש
              </BigPill>
            </div>
          </>
        ) : (
          <div style={{ width: THUMB, height: THUMB, borderRadius: 24, border: `3px dashed ${C.g300}`, boxSizing: 'border-box' }} />
        )}
      </KidCard>

      {flying &&
        [0.12, 0.06, 0].map((lag, k) => {
          const [x, y] = flyPos(clamp(flyT - lag));
          const s = 1 + lift * 0.35;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: x - THUMB / 2,
                top: y - THUMB / 2,
                transform: `scale(${s}) rotate(${lift * -10}deg)`,
                opacity: k === 2 ? 1 : 0.18 + k * 0.12,
                filter: k === 2 ? `drop-shadow(0 ${20 * lift}px ${24 * lift}px rgba(80,50,10,0.3))` : 'blur(3px)',
              }}
            >
              <Thumb />
            </div>
          );
        })}

      <Headline text={copy('growth', 'q')} f={f} inAt={b('q')} outAt={b('a') - 10} top={300} size={100} />
      <Headline text={copy('growth', 'a')} f={f} inAt={b('a')} outAt={dur - 14} top={300} size={100} />
    </AbsoluteFill>
  );
};
