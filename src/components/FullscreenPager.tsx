import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { project, rubberband, SPRING, SPRING_MOMENTUM } from '../lib/motion';

interface PagerProps {
  count: number;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  renderSlide: (i: number, active: boolean) => ReactNode;
  /** שכבת ממשק קבועה מעל השקופיות (כפתורים, כותרת) – מקבלת את האינדקס הנוכחי */
  renderChrome?: (index: number) => ReactNode;
  /** נקישה על המסך (ללא גרירה) */
  onTap?: (e: { x: number; y: number }) => void;
  /** נעילת ההחלקה/סגירה (למשל כשתמונה מוגדלת וגוללים בתוכה) */
  locked?: boolean;
  background?: string;
}

/**
 * מציג מסך מלא עם החלקה בין שקופיות.
 * - החלקה אופקית צמודה לאצבע (1:1), עם התנגדות בקצוות (rubber-band)
 * - ביעד נבחר לפי הקרנת התנופה (לא לפי נקודת השחרור), והאנימציה ממשיכה במהירות האצבע
 * - החלקה למטה סוגרת (אותה הקרנת תנופה), והמסך נראה כמצטמק ונעלם
 * - הסדר מותאם ל-RTL: השקופית הבאה נמצאת משמאל, ולכן מחליקים ימינה כדי להגיע אליה
 */
export function FullscreenPager({
  count, index, onIndexChange, onClose, renderSlide, renderChrome, onTap, locked = false, background = '#000',
}: PagerProps) {
  const reduce = useReducedMotion();
  const [W, setW] = useState(() => window.innerWidth);
  const x = useMotionValue(index * W);
  const y = useMotionValue(0);
  const idx = useRef(index);
  const gesture = useRef<{
    id: number; sx: number; sy: number; axis: 'x' | 'y' | null; base: number;
    hist: { t: number; x: number; y: number }[]; moved: boolean;
  } | null>(null);

  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useEffect(() => { idx.current = index; x.set(index * W); }, [W]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const goTo = (i: number, velocity = 0) => {
    const next = Math.max(0, Math.min(count - 1, i));
    idx.current = next;
    onIndexChange(next);
    animate(x, next * W, reduce ? { duration: 0.15 } : { ...SPRING_MOMENTUM, velocity });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // RTL: חץ שמאלה = השקופית הבאה
      else if (e.key === 'ArrowLeft') goTo(idx.current + 1);
      else if (e.key === 'ArrowRight') goTo(idx.current - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const velocity = (g: NonNullable<typeof gesture.current>) => {
    const now = g.hist[g.hist.length - 1];
    const past = g.hist.find((p) => now.t - p.t <= 100) ?? g.hist[0];
    const dt = Math.max(1, now.t - past.t) / 1000;
    return { vx: (now.x - past.x) / dt, vy: (now.y - past.y) / dt };
  };

  const down = (e: React.PointerEvent) => {
    if (locked || e.button > 0) return;
    // מגע חדש "תופס" את התנועה באמצע: מתחילים מהערך הנוכחי על המסך
    x.stop(); y.stop();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = {
      id: e.pointerId, sx: e.clientX, sy: e.clientY, axis: null, base: x.get(),
      hist: [{ t: performance.now(), x: e.clientX, y: e.clientY }], moved: false,
    };
  };

  const move = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    g.hist.push({ t: performance.now(), x: e.clientX, y: e.clientY });
    if (g.hist.length > 12) g.hist.shift();
    if (!g.axis) {
      if (Math.hypot(dx, dy) < 10) return; // סף קטן לפני שמחליטים על כיוון
      g.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      g.moved = true;
    }
    if (g.axis === 'x') {
      // גרירה ימינה = קדימה (RTL). מעבר לקצוות – התנגדות מתגברת
      let nx = g.base + dx;
      const max = (count - 1) * W;
      if (nx < 0) nx = -rubberband(-nx, W);
      else if (nx > max) nx = max + rubberband(nx - max, W);
      x.set(nx);
    } else {
      y.set(dy > 0 ? dy : -rubberband(-dy, 400));
    }
  };

  const up = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.axis) {
      onTap?.({ x: e.clientX, y: e.clientY });
      return;
    }
    const { vx, vy } = velocity(g);
    if (g.axis === 'x') {
      const projected = x.get() + project(vx, 0.99);
      // עמוד אחד בכל החלקה, לפי היעד המוקרן
      const raw = Math.round(projected / W);
      const target = Math.max(idx.current - 1, Math.min(idx.current + 1, raw));
      goTo(target, vx);
    } else {
      const projected = y.get() + project(vy, 0.99);
      if (projected > 160 || vy > 1000) onClose();
      else animate(y, 0, reduce ? { duration: 0.15 } : { ...SPRING, velocity: vy });
    }
  };

  const opacity = useTransform(y, [0, 320], [1, 0.25]);
  const scale = useTransform(y, [0, 400], [1, 0.88]);
  const visible = [index - 1, index, index + 1].filter((i) => i >= 0 && i < count);

  return (
    <motion.div
      className="fixed inset-0 z-[60] select-none overflow-hidden"
      style={{ touchAction: locked ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.12 : 0.22 }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div className="absolute inset-0" style={{ background, opacity }} />
      <div
        className="absolute inset-0"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <motion.div className="absolute inset-0" style={{ x, y, scale }}>
          {visible.map((i) => (
            <div key={i} className="absolute inset-0" style={{ transform: `translateX(${-i * W}px)` }}>
              {renderSlide(i, i === index)}
            </div>
          ))}
        </motion.div>
      </div>
      {renderChrome?.(index)}
    </motion.div>
  );
}
