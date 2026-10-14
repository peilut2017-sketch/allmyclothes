import raw from './video.config.json';

export const CFG = raw;
export const FPS = raw.fps;
export const W = raw.width;
export const H = raw.height;

export type SceneId = 'problem' | 'solution' | 'closet' | 'growth' | 'season' | 'shopping' | 'shared' | 'cta';

export interface SceneCfg {
  id: string;
  dur: number;
  copy: Record<string, unknown>;
  beats: Record<string, number>;
  spawns?: number[];
  tagSpawns?: number[];
  vo?: { t: number; dur: number; text: string };
}
const SCENES = raw.scenes as unknown as SceneCfg[];

export function scene(id: SceneId): SceneCfg {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`scene ${id} missing in video.config.json`);
  return s;
}

/** תחילת סצנה בפריימים מתחילת הסרטון */
export function sceneStart(id: SceneId): number {
  let t = 0;
  for (const s of raw.scenes) {
    if (s.id === id) return Math.round(t * FPS);
    t += s.dur;
  }
  throw new Error(id);
}

export function sceneFrames(id: SceneId): number {
  return Math.round(scene(id).dur * FPS);
}

export const TOTAL_FRAMES = Math.round(raw.scenes.reduce((a, s) => a + s.dur, 0) * FPS);

/** זמן פעולה (beat) בתוך סצנה, בפריימים יחסית לתחילת הסצנה */
export function beat(id: SceneId, name: string): number {
  const b = scene(id).beats[name];
  if (b === undefined) throw new Error(`beat ${id}.${name} missing`);
  return b * FPS;
}

export function copy<T = string>(id: SceneId, key: string): T {
  return scene(id).copy[key] as T;
}
