import { flushSync } from 'react-dom';

/**
 * קבועי תנועה בהשראת Apple (Designing Fluid Interfaces):
 * ברירת מחדל – קפיץ קריטי (ללא קפיצה); קפיצה קלה רק אחרי תנועה שנושאת תנופה (זריקה).
 */
export const SPRING = { type: 'spring', bounce: 0, duration: 0.4 } as const;
export const SPRING_MOMENTUM = { type: 'spring', bounce: 0.18, duration: 0.4 } as const;
export const SPRING_SNAPPY = { type: 'spring', bounce: 0, duration: 0.3 } as const;

/** הקרנת תנופה: לאן התנועה "הולכת" לפי מהירות השחרור (px/s). פונקציית ההקרנה של Apple. */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** התנגדות מתגברת מעבר לגבול (rubber-band) */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * מעבר תצוגה (View Transitions API) לניווט: הכרטיס "נפתח" לעמוד הפריט ונסגר חזרה באותו מסלול.
 * בדפדפן ללא תמיכה, או עם reduced-motion – הניווט מתבצע מיידית וללא אנימציה.
 */
export function withViewTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

const VT_KEY = 'vtItem';
/** זוכרים איזה פריט נלחץ, כדי שהכרטיס/התמונה שלו יקבלו שם מעבר משותף גם בחזרה */
export const markTransitionItem = (id: string) => {
  try { sessionStorage.setItem(VT_KEY, id); } catch { /* ignore */ }
};
export const isTransitionItem = (id: string) => {
  try { return sessionStorage.getItem(VT_KEY) === id; } catch { return false; }
};
