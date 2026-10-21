import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TitleBlock } from '../components/Headline';
import { Phone, Tap, lerpPose } from '../components/Phone';
import { CLOSET_LAYOUT, ClosetScreen, DetailScreen, FILTER_TAPS, FilterSheetView, cardPos, chipCenter } from '../app/screens';
import { CLOSET_ALL, CLOSET_SHIRA, CLOSET_SHIRA_WINTER, CLOSET_SHIRA_WINTER_56, itemById } from '../app/data';
import { FPS, beat, copy, scene } from '../config';
import { clamp, ease, easeInOut, prog, spr } from '../anim';
import { POSE } from './shared';

const press = (f: number, at: number) => (f < at ? 0 : f < at + 4 ? (f - at) / 4 : Math.max(0, 1 - (f - at - 4) / 6));

/** סצנה 3 – הארון הדיגיטלי: גלילה, בחירת ילד, סינון לחורף ולמידה, פתיחת כרטיס */
export const S3Closet: React.FC = () => {
  const f = useCurrentFrame();
  const dur = scene('closet').dur * FPS;
  const b = (n: string) => beat('closet', n);

  const pose = lerpPose(POSE.closet, POSE.closetEnd, ease(f, 0, dur, easeInOut));

  // מצב הרשת לפי הפעולות
  let ids = CLOSET_ALL;
  let changeAt = -100;
  if (f >= b('tapChild') + 3) {
    ids = CLOSET_SHIRA;
    changeAt = b('tapChild') + 3;
  }
  if (f >= b('tapWinter') + 3) {
    ids = CLOSET_SHIRA_WINTER;
    changeAt = b('tapWinter') + 3;
  }
  if (f >= b('tapSize') + 3) {
    ids = CLOSET_SHIRA_WINTER_56;
    changeAt = b('tapSize') + 3;
  }
  const scroll = f < b('tapChild') + 3 ? 300 * ease(f, b('scroll'), b('scroll') + 30, easeInOut) * (1 - ease(f, b('scroll') + 32, b('tapChild'), easeInOut) * 0.85) : 0;

  const cardAnim = (_id: string, idx: number) => {
    const p = spr(f, changeAt + idx * 2, { damping: 16, stiffness: 170 });
    const hl = _id === 'i1' ? press(f, b('tapCard')) : 0;
    return { o: clamp(p * 1.5), s: (0.9 + 0.1 * p) * (1 - hl * 0.04), dy: (1 - p) * 18, highlight: hl };
  };

  const sheetP = f < b('tapShow') ? spr(f, b('sheet'), { damping: 20, stiffness: 160 }) : 1 - ease(f, b('tapShow') + 2, b('tapShow') + 12);
  const filterCount = (f >= b('tapWinter') + 3 ? 1 : 0) + (f >= b('tapSize') + 3 ? 1 : 0);

  // מעבר לעמוד הפריט – הכרטיס מתרחב למסך מלא
  const dp = spr(f, b('detail'), { damping: 22, stiffness: 140 });
  const c = cardPos(0, 0);
  const dScale = 0.4436 + (1 - 0.4436) * dp; // 173/390
  const dX = c.x * (1 - dp);
  const dY = c.y * (1 - dp);
  const gallery = ease(f, b('gallery'), b('gallery') + 14, easeInOut);

  // נגיעות
  const chip = chipCenter(2);
  const taps = [
    { at: b('tapChild'), ...chip },
    { at: b('tapFilter'), ...CLOSET_LAYOUT.filterBtn },
    { at: b('tapWinter'), ...FILTER_TAPS.winter },
    { at: b('tapSize'), ...FILTER_TAPS.size },
    { at: b('tapShow'), ...FILTER_TAPS.show },
    { at: b('tapCard'), x: c.x + 86, y: c.y + 110 },
  ];
  // גרירה בגלריה
  const dragF = f - b('gallery');
  const drag = dragF > -6 && dragF < 22 ? { x: 120 + 170 * clamp(prog(dragF, 0, 14)), y: 230 } : null;

  return (
    <AbsoluteFill>
      <Phone pose={pose}>
        <ClosetScreen
          ids={ids}
          scroll={scroll}
          activeChild={f >= b('tapChild') + 2 ? 'shira' : null}
          chipPress={{ i: 2, p: press(f, b('tapChild')) }}
          filterCount={filterCount}
          filterPress={press(f, b('tapFilter'))}
          cardAnim={cardAnim}
          countLabel={`${ids.length} פריטים`}
        />
        <FilterSheetView
          p={clamp(sheetP)}
          winter={f >= b('tapWinter') + 2}
          size56={f >= b('tapSize') + 2}
          press={
            f < b('tapSize') ? { k: 'winter', p: press(f, b('tapWinter')) } : f < b('tapShow') ? { k: 'size', p: press(f, b('tapSize')) } : { k: 'show', p: press(f, b('tapShow')) }
          }
        />
        {f >= b('detail') && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 390,
              height: 844,
              transformOrigin: '0 0',
              transform: `translate(${dX}px, ${dY}px) scale(${dScale})`,
              borderRadius: 16 / dScale * (1 - dp) + 1,
              overflow: 'hidden',
              opacity: clamp(dp * 3),
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <DetailScreen item={itemById('i1')} gallery={gallery} />
          </div>
        )}
        {taps.map((tp, k) => (
          <Tap key={k} x={tp.x} y={tp.y} f={f - tp.at} />
        ))}
        {drag && (
          <div style={{ position: 'absolute', left: drag.x - 26, top: drag.y - 26, width: 52, height: 52, borderRadius: 99, background: 'rgba(45,42,38,0.22)', border: '2px solid rgba(255,255,255,0.85)', opacity: clamp((dragF + 6) / 6) * (1 - clamp((dragF - 14) / 8)), zIndex: 120 }} />
        )}
      </Phone>
      <TitleBlock title={copy('closet', 'title')} sub={copy('closet', 'sub')} f={f} inAt={beat('closet', 'title')} subAt={beat('closet', 'sub')} outAt={dur - 14} />
    </AbsoluteFill>
  );
};
