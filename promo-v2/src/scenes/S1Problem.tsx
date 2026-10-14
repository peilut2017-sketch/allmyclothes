import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Headline } from '../components/Headline';
import { FPS, beat, copy, scene } from '../config';
import { clamp, rnd, spr } from '../anim';
import { GarmentSprite, SWIRL, SWIRL_CENTER, Tag, swirlState } from './shared';

/** סצנה 1 – הבעיה: בגדים מצטרפים ומסתחררים, תגיות מידה ועונה קופצות סביבם */
export const S1Problem: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const dur = scene('problem').dur;
  const tags = copy<string[]>('problem', 'tags');
  const tagSpawns = scene('problem').tagSpawns!;
  const tones = ['amber', 'sky', 'ink', 'amber', 'rose', 'sky', 'ink', 'amber', 'sky', 'rose'] as const;

  // דחיפת מצלמה עדינה לאורך הסצנה
  const push = 1 + 0.06 * clamp(t / dur);

  const order = SWIRL.map((_, i) => i).sort((a, b) => SWIRL[a].z - SWIRL[b].z);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `${SWIRL_CENTER.x}px ${SWIRL_CENTER.y}px` }}>
        {order.map((i) => {
          const s = swirlState(i, t);
          if (!s.visible) return null;
          // טשטוש תנועה מתון לפי מהירות
          const s2 = swirlState(i, t - 1 / FPS);
          const v = Math.hypot(s.x - s2.x, s.y - s2.y);
          return <GarmentSprite key={i} item={SWIRL[i]} x={s.x} y={s.y} rot={s.rot} scale={s.scale} blur={Math.min(4, v / 9)} />;
        })}
        {tags.map((txt, k) => {
          const sp = tagSpawns[k] * FPS;
          if (f < sp) return null;
          const p = spr(f, sp, { damping: 12, stiffness: 180 }) * (1 - clamp((t - (dur - 0.55)) / 0.35));
          const ang = k * 2.2 + 0.6 + (t - tagSpawns[k]) * 0.25 * (k % 2 ? 1 : -1);
          const r = 300 + rnd(k * 5.3) * 170;
          return (
            <Tag
              key={k}
              text={txt}
              x={SWIRL_CENTER.x + Math.cos(ang) * r * 0.95}
              y={SWIRL_CENTER.y + Math.sin(ang) * r * 1.05}
              p={p}
              rot={(rnd(k) - 0.5) * 14}
              tone={tones[k % tones.length]}
            />
          );
        })}
      </AbsoluteFill>
      <Headline text={copy('problem', 'line1')} f={f} inAt={beat('problem', 'line1')} outAt={beat('problem', 'line2') - 8} top={290} size={100} />
      <Headline text={copy('problem', 'line2')} f={f} inAt={beat('problem', 'line2')} outAt={dur * FPS - 14} top={290} size={100} />
    </AbsoluteFill>
  );
};
