import React from 'react';
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { useFonts } from './fonts';
import { Backdrop } from './components/Backdrop';
import { CFG, SceneId, sceneFrames, sceneStart } from './config';
import { ease } from './anim';
import { S1Problem } from './scenes/S1Problem';
import { S2Solution } from './scenes/S2Solution';
import { S3Closet } from './scenes/S3Closet';
import { S4Growth } from './scenes/S4Growth';
import { S5Season } from './scenes/S5Season';
import { S6Shopping } from './scenes/S6Shopping';
import { S7Shared } from './scenes/S7Shared';
import { S8Cta } from './scenes/S8Cta';

export const SCENES: { id: SceneId; C: React.FC }[] = [
  { id: 'problem', C: S1Problem },
  { id: 'solution', C: S2Solution },
  { id: 'closet', C: S3Closet },
  { id: 'growth', C: S4Growth },
  { id: 'season', C: S5Season },
  { id: 'shopping', C: S6Shopping },
  { id: 'shared', C: S7Shared },
  { id: 'cta', C: S8Cta },
];

const WARM = ['#fde68a', '#fbcfe8', '#bae6fd'];
const COOL = ['#bae6fd', '#c7d2fe', '#e0f2fe'];

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('');
}

/** הרקע משותף לכל הסרטון – הגוון מתקרר בהחלפת העונה וחוזר לחום אחריה */
function GlobalBackdrop() {
  const f = useCurrentFrame();
  const s5 = sceneStart('season');
  const s6 = sceneStart('shopping');
  const cool = ease(f, s5, s5 + 30) * (1 - ease(f, s6, s6 + 30));
  return <Backdrop f={f} tint={WARM.map((w, i) => mix(w, COOL[i], cool))} />;
}

export type PromoProps = { withVoiceover?: boolean };

export const Promo: React.FC<PromoProps> = ({ withVoiceover }) => {
  useFonts();
  const vo = withVoiceover ?? CFG.voiceover.enabled;
  return (
    <AbsoluteFill style={{ background: '#faf7f2' }}>
      <GlobalBackdrop />
      {SCENES.map(({ id, C }) => (
        <Sequence key={id} from={sceneStart(id)} durationInFrames={sceneFrames(id)} name={id}>
          <C />
        </Sequence>
      ))}
      {/* ערוצי אודיו נפרדים: מוזיקה, אפקטים, קריינות (נבנים ב-audio/build_audio.py) */}
      <Html5Audio src={staticFile(vo ? 'audio/music_ducked.wav' : 'audio/music.wav')} name="music" />
      <Html5Audio src={staticFile('audio/sfx.wav')} name="sfx" />
      {vo && <Html5Audio src={staticFile(CFG.voiceover.file)} name="voiceover" />}
    </AbsoluteFill>
  );
};

/** סצנה בודדת לעבודה ב-Studio */
export const SingleScene: React.FC<{ id: SceneId }> = ({ id }) => {
  useFonts();
  const s = SCENES.find((x) => x.id === id)!;
  return (
    <AbsoluteFill>
      <Backdrop f={0} />
      <s.C />
    </AbsoluteFill>
  );
};
