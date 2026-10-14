import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Headline, TitleBlock } from '../components/Headline';
import { Phone, lerpPose } from '../components/Phone';
import { ClosetScreen, SplashScreen } from '../app/screens';
import { CLOSET_ALL } from '../app/data';
import { FPS, beat, copy, scene } from '../config';
import { clamp, easeIn, easeInOut, ease, qbez, spr } from '../anim';
import { GarmentSprite, POSE, SWIRL, SWIRL_CENTER, swirlState } from './shared';

/** סצנה 2 – הפתרון: הבגדים קופאים, נשאבים אל הטלפון, והמותג נחשף */
export const S2Solution: React.FC = () => {
  const f = useCurrentFrame();
  const dur = scene('solution').dur * FPS;
  const tEnd = scene('problem').dur; // מצב הקפיאה = סוף הפתיחה

  // כניסת הטלפון מלמטה
  const pin = spr(f, beat('solution', 'phoneIn'), { damping: 18, stiffness: 90 });
  const startPose = { x: 540, y: 2500, s: 1.05, rx: 18 };
  let pose = lerpPose(startPose, POSE.solution, pin);
  // מעבר לתנוחת הארון בסוף הסצנה
  const toCloset = ease(f, beat('solution', 'toCloset'), dur, easeInOut);
  pose = lerpPose(pose, POSE.closet, toCloset);

  const suck0 = beat('solution', 'suck');
  const target = { x: POSE.solution.x, y: POSE.solution.y - 40 };
  const push = 1.06 - 0.06 * ease(f, suck0, suck0 + 20);

  const order = SWIRL.map((_, i) => i).sort((a, b) => SWIRL[a].z - SWIRL[b].z);

  const splashP = spr(f, beat('solution', 'suck') + SWIRL.length * 1.1 + 8, { damping: 16, stiffness: 110 });
  const screenSwap = ease(f, beat('solution', 'toCloset'), beat('solution', 'toCloset') + 12);

  return (
    <AbsoluteFill>
      <Phone pose={pose}>
        <SplashScreen p={clamp(splashP)} />
        {screenSwap > 0 && (
          <div style={{ position: 'absolute', inset: 0, opacity: screenSwap, transform: `scale(${1.04 - 0.04 * screenSwap})` }}>
            <ClosetScreen ids={CLOSET_ALL} />
          </div>
        )}
      </Phone>

      {/* הבגדים: קפואים, ואז נשאבים בקשת אל מרכז המסך */}
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `${SWIRL_CENTER.x}px ${SWIRL_CENTER.y}px` }}>
        {order.map((i, k) => {
          const s0 = swirlState(i, tEnd);
          const hover = Math.sin(f / 6 + i) * 3;
          const st = suck0 + k * 1.1;
          const p = easeIn(clamp((f - st) / 16));
          if (p >= 1) return null;
          const ctrl: [number, number] = [s0.x + (s0.y - target.y) * 0.45, s0.y - (s0.x - target.x) * 0.45];
          const [x, y] = qbez([s0.x, s0.y + hover], ctrl, [target.x, target.y], p);
          return (
            <GarmentSprite
              key={i}
              item={SWIRL[i]}
              x={x}
              y={y}
              rot={s0.rot + p * 220}
              scale={s0.scale * (1 - 0.9 * p)}
              opacity={1 - Math.pow(p, 3)}
              blur={p * 5}
            />
          );
        })}
      </AbsoluteFill>

      <Headline text={copy('solution', 'intro')} f={f} inAt={beat('solution', 'intro')} outAt={beat('solution', 'logo') - 12} top={300} size={92} weight={800} />
      <TitleBlock title={copy('solution', 'brand')} sub={copy('solution', 'sub')} f={f} inAt={beat('solution', 'logo')} subAt={beat('solution', 'sub')} outAt={dur - 16} top={270} size={132} subSize={54} />
    </AbsoluteFill>
  );
};
