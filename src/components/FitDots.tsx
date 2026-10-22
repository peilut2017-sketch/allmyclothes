import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { SIZE_FITS } from '../lib/constants';
import { project, SPRING_MOMENTUM, SPRING_SNAPPY } from '../lib/motion';
import type { SizeFit } from '../lib/types';

const FITS: SizeFit[] = [-1, 0, 1];
const meta = (f: SizeFit) => SIZE_FITS[String(f) as keyof typeof SIZE_FITS];

/** שלוש נקודות קטנות: שמאל = גזרה קטנה, אמצע = במידה, ימין = גזרה גדולה */
export function FitDots({ value, className = '' }: { value: SizeFit | null; className?: string }) {
  if (value == null) return null;
  return (
    <span dir="ltr" className={`inline-flex items-center gap-[3px] ${className}`} title={meta(value).label} aria-label={meta(value).label}>
      {FITS.map((f) => (
        <span key={f} className={`h-[5px] w-[5px] rounded-full ${f === value ? 'bg-amber-500' : 'bg-gray-300'}`} />
      ))}
    </span>
  );
}

/**
 * בורר גזרה: ידית שנגררת בין שלוש נקודות ונצמדת בקפיץ (או נוגעים בנקודה).
 * היעד נבחר לפי הקרנת התנופה, וההסבר מתחלף עם טשטוש קל.
 */
export function FitPicker({ value, onChange }: { value: SizeFit | null; onChange: (v: SizeFit | null) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [stop, setStop] = useState(0);
  const drag = useRef<{ sx: number; base: number; h: [number, number][] } | null>(null);
  const justDragged = useRef(false);
  const idx = value == null ? null : value + 1;

  // רוחב כל "תחנה" – נמדד מהמסלול
  useEffect(() => {
    const measure = () => { if (track.current) setStop((track.current.clientWidth - 10) / 3); };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (idx != null && !drag.current) animate(x, idx * stop, SPRING_SNAPPY);
  }, [idx, stop, x]);

  const select = (i: number) => onChange((i - 1) as SizeFit);

  const down = (e: React.PointerEvent) => {
    x.stop();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, base: x.get(), h: [[performance.now(), e.clientX]] };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    d.h.push([performance.now(), e.clientX]);
    if (d.h.length > 8) d.h.shift();
    // המסלול LTR: שמאל = קטנה. תנועת האצבע בפיקסלים מתורגמת ישירות.
    x.set(Math.min(2 * stop + 12, Math.max(-12, d.base + e.clientX - d.sx)));
    const ni = Math.min(2, Math.max(0, Math.round(x.get() / stop)));
    if (ni !== idx) select(ni);
  };
  const up = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    justDragged.current = true;
    setTimeout(() => { justDragged.current = false; }, 0);
    const a = d.h[0], b = d.h[d.h.length - 1];
    const vx = (b[1] - a[1]) / Math.max(0.016, (b[0] - a[0]) / 1000);
    const ni = Math.min(2, Math.max(0, Math.round((x.get() + project(vx, 0.99)) / stop)));
    if (ni !== idx) select(ni);
    animate(x, ni * stop, { ...SPRING_MOMENTUM, velocity: vx });
  };

  return (
    <div>
      <div
        ref={track}
        dir="ltr"
        className="relative h-[52px] touch-pan-y rounded-2xl bg-gray-100 shadow-[inset_0_0_0_0.5px_rgb(var(--c-line)/0.14)]"
        onClick={(e) => {
          if (justDragged.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.min(2, Math.max(0, Math.floor((e.clientX - r.left - 5) / stop)));
          if (i !== idx) select(i);
        }}
      >
        <div className="absolute inset-0 grid grid-cols-3 place-items-center">
          {FITS.map((f) => <i key={f} className="h-2 w-2 rounded-full bg-gray-300" />)}
        </div>
        {idx != null && (
          <motion.div
            style={{ x, width: stop || undefined }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className="absolute inset-y-[5px] left-[5px] z-[1] flex cursor-grab touch-none items-center justify-center rounded-xl bg-amber-500 shadow-[0_4px_12px_rgb(var(--c-accent)/0.45)] active:cursor-grabbing"
          >
            <span className="inline-flex gap-1">
              {FITS.map((f) => <i key={f} className={`h-1.5 w-1.5 rounded-full ${f === value ? 'bg-white' : 'bg-white/50'}`} />)}
            </span>
          </motion.div>
        )}
      </div>
      <div dir="ltr" className="mt-2 grid grid-cols-3 text-center text-[0.8125rem] font-semibold">
        {FITS.map((f) => (
          <span key={f} className={`transition-colors duration-200 ${f === value ? 'text-ink' : 'text-gray-500'}`}>{meta(f).label}</span>
        ))}
      </div>
      <div className="mt-2 flex min-h-[1.75rem] items-center justify-between gap-3 text-[0.9375rem]">
        <motion.span
          key={value ?? 'none'}
          initial={{ opacity: 0, filter: 'blur(3px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.2 }}
          className={value == null ? 'text-gray-500' : 'text-ink'}
        >
          {value == null ? 'לא חובה – משפיע על התראת ״בקרוב קטן״' : meta(value).hint}
        </motion.span>
        {value != null && (
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-sm font-semibold text-gray-500 underline-offset-2 active:opacity-60">
            ניקוי
          </button>
        )}
      </div>
    </div>
  );
}
