/**
 * מקור המעבר: כשפותחים פריט מכרטיס, זוכרים איפה התמונה של הכרטיס נמצאת,
 * כדי שעמוד הפריט ייפתח "מתוך" הכרטיס ויחזור אליו בסגירה.
 */
export interface MorphSource { id: string; x: number; y: number; w: number; h: number }
let source: MorphSource | null = null;
export const setMorphSource = (s: MorphSource | null) => { source = s; };
export const peekMorphSource = (id: string): MorphSource | null => (source && source.id === id ? source : null);
