import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Headline, SubLine } from '../components/Headline';
import { Phone, lerpPose } from '../components/Phone';
import { AppIcon } from '../components/Backdrop';
import { ClosetScreen } from '../app/screens';
import { CLOSET_ALL } from '../app/data';
import { CFG, FPS, beat, copy, scene } from '../config';
import { clamp, ease, easeIn, easeInOut, lerp, rnd, spr } from '../anim';
import { C, FONT } from '../theme';
import { GarmentSprite, POSE } from './shared';
import { GarmentKind } from '../components/Garment';

const RING: { kind: GarmentKind; color: string; accent?: string }[] = [
  { kind: 'dress', color: '#f9a8c4', accent: '#ffffff' },
  { kind: 'sweater', color: '#e0a83a', accent: '#fef3c7' },
  { kind: 'coat', color: '#60a5fa', accent: '#fde68a' },
  { kind: 'tshirt', color: '#34d399', accent: '#ffffff' },
  { kind: 'pajama', color: '#a5b4fc', accent: '#ffffff' },
  { kind: 'hoodie', color: '#fb923c', accent: '#ffffff' },
  { kind: 'boots', color: '#b08968', accent: '#fff7ed' },
];
// זוויות סופיות (מעלות, 0 = ימין, נגד כיוון השעון)
const ANGLES = [195, 160, 125, 90, 55, 20, -15];

/** סצנה 8 – קריאה לפעולה */
export const S8Cta: React.FC = () => {
  const f = useCurrentFrame();
  const dur = scene('cta').dur * FPS;
  const b = (n: string) => beat('cta', n);

  // מכשירי הסצנה הקודמת נעלמים בהדרגה
  const fadeOld = ease(f, 0, 18);
  const oldL = lerpPose(POSE.sharedL, { ...POSE.sharedL, x: 200, s: 0.7 }, fadeOld);
  const oldR = lerpPose(POSE.sharedR, { ...POSE.sharedR, x: 880, s: 0.7 }, fadeOld);

  // מכשיר מרכזי, ואז "מורפינג" לאייקון האפליקציה
  const pin = spr(f, 2, { damping: 18, stiffness: 90 });
  const morph = ease(f, b('morph'), b('morph') + 18, easeIn);
  const phonePose = lerpPose({ ...POSE.cta, y: 1300, s: 0.85 }, POSE.cta, pin);
  const phoneMorph = lerpPose(phonePose, { x: 540, y: 800, s: 0.25 }, morph);
  const iconP = spr(f, b('morph') + 12, { damping: 13, stiffness: 140 });

  // טבעת הבגדים: מתנועה חופשית לסידור מסודר סביב הטלפון, ואז סביב האייקון
  const settle = ease(f, 6, b('morph') - 4, easeInOut);
  const toIcon = ease(f, b('morph'), b('morph') + 22, easeInOut);

  const brandP = spr(f, b('brand'), { damping: 15, stiffness: 120 });
  const btnP = spr(f, b('button'), { damping: 12, stiffness: 150 });
  const shine = ease(f, b('shine'), b('shine') + 22, easeInOut);
  const breathe = 1 + Math.sin(Math.max(0, f - b('button') - 20) / 9) * 0.012;
  const url = CFG.signupUrl;

  return (
    <AbsoluteFill>
      {fadeOld < 1 && (
        <>
          <Phone pose={{ ...oldL, o: 1 - fadeOld }}>
            <ClosetScreen ids={['n1', ...CLOSET_ALL.slice(0, 8)]} />
          </Phone>
          <Phone pose={{ ...oldR, o: 1 - fadeOld }}>
            <ClosetScreen ids={['n1', ...CLOSET_ALL.slice(0, 8)]} />
          </Phone>
        </>
      )}

      {RING.map((g, i) => {
        const a = (ANGLES[i] * Math.PI) / 180;
        // מסלול חופשי
        const t = f / FPS;
        const fa = a + t * 0.9 * (i % 2 ? 1 : -1) + rnd(i) * 2;
        const free = { x: 540 + Math.cos(fa) * (330 + rnd(i * 3) * 140), y: 1180 - Math.sin(fa) * (520 + rnd(i * 5) * 140) };
        const ringPhone = { x: 540 + Math.cos(a) * 455, y: 1150 - Math.sin(a) * 600 };
        const ringIcon = { x: 540 + Math.cos(a) * 400, y: 800 - Math.sin(a) * 330 };
        const x = lerp(lerp(free.x, ringPhone.x, settle), ringIcon.x, toIcon);
        const y = lerp(lerp(free.y, ringPhone.y, settle), ringIcon.y, toIcon) + Math.sin(f / 14 + i) * 8;
        const appear = spr(f, 4 + i * 2, { damping: 14, stiffness: 120 });
        const rot = lerp(Math.sin(t * 2 + i) * 30, Math.sin(f / 20 + i) * 4, settle);
        const sc = lerp(0.62, 0.5, toIcon) * appear;
        return <GarmentSprite key={i} item={{ ...g, size: 270 }} x={x} y={y} rot={rot} scale={sc} opacity={clamp(appear * 1.4)} />;
      })}

      {morph < 1 && (
        <Phone pose={{ ...phoneMorph, o: clamp(pin * 1.5) * (1 - clamp(morph * 1.3)) }}>
          <ClosetScreen ids={['n1', ...CLOSET_ALL.slice(0, 8)]} />
        </Phone>
      )}

      {f >= b('morph') + 8 && (
        <div style={{ position: 'absolute', left: 540 - 120, top: 800 - 120, transform: `scale(${0.3 + 0.7 * iconP})`, opacity: clamp(iconP * 2) }}>
          <AppIcon size={240} />
        </div>
      )}

      <Headline text={copy('cta', 'line1')} f={f} inAt={b('line1')} outAt={b('line2') - 8} top={300} size={104} />
      <Headline text={copy('cta', 'line2')} f={f} inAt={b('line2')} outAt={b('morph') - 4} top={300} size={104} />

      {f >= b('brand') - 2 && (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 1000, textAlign: 'center', fontFamily: FONT, fontSize: 124, fontWeight: 900, color: C.ink, letterSpacing: -2, opacity: clamp(brandP * 1.5), transform: `translateY(${(1 - brandP) * 40}px)`, direction: 'rtl' }}>
          {copy('cta', 'brand')}
        </div>
      )}
      <SubLine text={copy('cta', 'ask')} f={f} inAt={b('ask')} top={1180} size={58} color={C.g700} weight={600} />

      {f >= b('button') - 2 && (
        <div
          style={{
            position: 'absolute',
            left: 100,
            right: 100,
            top: 1300,
            height: 150,
            borderRadius: 999,
            background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 60%, #ea8a06 100%)',
            boxShadow: '0 24px 50px rgba(217,119,6,0.4), inset 0 3px 0 rgba(255,255,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
            fontSize: 52,
            fontWeight: 800,
            color: '#fff',
            direction: 'rtl',
            overflow: 'hidden',
            transform: `scale(${(0.6 + 0.4 * btnP) * breathe})`,
            opacity: clamp(btnP * 2),
          }}
        >
          {copy('cta', 'button')}
          <div style={{ position: 'absolute', top: -40, bottom: -40, width: 120, left: lerp(-200, 1000, shine), transform: 'skewX(-20deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)' }} />
        </div>
      )}
      {url ? <SubLine text={url} f={f} inAt={b('button') + 6} top={1476} size={42} color={C.amber700} weight={700} /> : null}
      <SubLine text={copy('cta', 'tagline')} f={f} inAt={b('tagline')} top={url ? 1550 : 1500} size={46} color={C.g500} />
    </AbsoluteFill>
  );
};
