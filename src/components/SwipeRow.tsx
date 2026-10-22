import { useRef, type ReactNode } from 'react';
import { animate, useMotionValue, motion } from 'motion/react';
import { project, rubberband, SPRING, SPRING_MOMENTUM } from '../lib/motion';

export interface SwipeAction { label: string; color: string; icon?: ReactNode; onClick: () => void }

/**
 * שורה עם פעולות מהירות בהחלקה: צמודה לאצבע, התנגדות בקצה, ונפתחת/נסגרת לפי היעד המוקרן של התנופה.
 * ההחלקה ימינה חושפת את הפעולות בצד שמאל (כיוון RTL).
 */
export function SwipeRow({ children, actions, onTap }: { children: ReactNode; actions: SwipeAction[]; onTap: () => void }) {
  const OPEN = actions.length * 84;
  const x = useMotionValue(0);
  const g = useRef<{ sx: number; sy: number; base: number; axis: 'x' | 'y' | null; h: [number, number][] } | null>(null);
  const moved = useRef(false);

  const down = (e: React.PointerEvent) => {
    x.stop();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    g.current = { sx: e.clientX, sy: e.clientY, base: x.get(), axis: null, h: [[performance.now(), e.clientX]] };
    moved.current = false;
  };
  const move = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s) return;
    const dx = e.clientX - s.sx, dy = e.clientY - s.sy;
    s.h.push([performance.now(), e.clientX]);
    if (s.h.length > 8) s.h.shift();
    if (!s.axis) {
      if (Math.hypot(dx, dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.axis === 'y') { g.current = null; return; }
    }
    moved.current = true;
    let nx = s.base + dx;
    if (nx < 0) nx = -rubberband(-nx, 200);
    if (nx > OPEN) nx = OPEN + rubberband(nx - OPEN, 200);
    x.set(nx);
  };
  const up = () => {
    const s = g.current;
    if (!s) return;
    g.current = null;
    const a = s.h[0], b = s.h[s.h.length - 1];
    const vx = (b[1] - a[1]) / Math.max(0.016, (b[0] - a[0]) / 1000);
    const target = x.get() + project(vx, 0.99) > OPEN * 0.5 ? OPEN : 0;
    animate(x, target, { ...(Math.abs(vx) > 500 ? SPRING_MOMENTUM : SPRING), velocity: vx });
  };

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      <div className="absolute inset-y-0 start-0 flex" style={{ width: OPEN }}>
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => { animate(x, 0, SPRING); a.onClick(); }}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.75rem] font-bold text-white"
            style={{ backgroundColor: a.color }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClick={() => {
          if (moved.current) { moved.current = false; return; }
          if (x.get() > 4) animate(x, 0, SPRING);
          else onTap();
        }}
        className="relative bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
}
