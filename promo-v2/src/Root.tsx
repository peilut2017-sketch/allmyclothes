import React from 'react';
import { Composition, Folder } from 'remotion';
import { Promo, SCENES, SingleScene } from './Promo';
import { FPS, H, TOTAL_FRAMES, W, sceneFrames } from './config';
import { ScreensTest } from './dev/ScreensTest';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* הסרטון המלא: מוזיקה + אפקטים (+ קריינות כשהיא מופעלת ב-video.config.json) */}
      <Composition id="Promo" component={Promo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{ withVoiceover: undefined as boolean | undefined }} />
      <Folder name="Scenes">
        {SCENES.map(({ id }) => (
          <Composition key={id} id={`Scene-${id}`} component={SingleScene} durationInFrames={sceneFrames(id)} fps={FPS} width={W} height={H} defaultProps={{ id }} />
        ))}
      </Folder>
      <Folder name="Dev">
        <Composition id="ScreensTest" component={ScreensTest} durationInFrames={1} fps={30} width={1800} height={1800} />
      </Folder>
    </>
  );
};
