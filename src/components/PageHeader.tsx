import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from './Icons';

export function RoundButton({ onClick, label, children, className = '' }: { onClick?: () => void; label: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`glass-circle flex h-10 w-10 items-center justify-center rounded-full text-ink transition-transform duration-150 ease-out active:scale-90 ${className}`}
    >
      {children}
    </button>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** כפתור חזרה (חץ) בצד ההתחלה, או פעולה מותאמת */
  back?: boolean | (() => void);
  right?: ReactNode;
  left?: ReactNode;
}

/**
 * כותרת גדולה שמתכווצת לסרגל זכוכית בגלילה (בהשראת iOS):
 * הכותרת הגדולה מתעמעמת ומצטמצמת, הכותרת הקטנה נכנסת, והסרגל נהיה שקוף-מטושטש.
 * העדכון נעשה ישירות על האלמנטים (transform/opacity), בלי state בכל פריים.
 */
export function PageHeader({ title, subtitle, back, right, left }: PageHeaderProps) {
  const navigate = useNavigate();
  const bg = useRef<HTMLDivElement>(null);
  const small = useRef<HTMLDivElement>(null);
  const big = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const y = Math.max(0, window.scrollY);
      const p = Math.min(1, y / 54);
      if (big.current) {
        big.current.style.opacity = String(Math.max(0, 1 - (y - 8) / 44));
        big.current.style.transform = `scale(${1 - p * 0.14})`;
      }
      const t = Math.min(1, Math.max(0, (y - 32) / 26));
      if (small.current) {
        small.current.style.opacity = String(t);
        small.current.style.transform = `translateY(${(1 - t) * 6}px)`;
      }
      if (bg.current) bg.current.style.opacity = String(Math.min(1, Math.max(0, (y - 26) / 28)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const goBack = typeof back === 'function' ? back : () => navigate(-1);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[calc(env(safe-area-inset-top)+3.5rem)]">
        <div ref={bg} className="glass-bar-edge absolute inset-0 opacity-0" />
        <div className="relative mx-auto flex h-full max-w-lg items-end justify-between px-4 pb-2">
          <div className="pointer-events-auto flex min-w-10 items-center gap-2">
            {back ? (
              <RoundButton label="חזרה" onClick={goBack}>
                <BackIcon />
              </RoundButton>
            ) : null}
            {left}
          </div>
          <div ref={small} className="absolute inset-x-16 bottom-3 truncate text-center text-[1.0625rem] font-bold opacity-0">
            {title}
          </div>
          <div className="pointer-events-auto flex min-w-10 items-center justify-end gap-2">{right}</div>
        </div>
      </div>
      <div className="mx-auto max-w-lg px-5 pb-1 pt-[calc(env(safe-area-inset-top)+4.5rem)]">
        <div ref={big} style={{ transformOrigin: 'right center' }}>
          <h1 className="text-[2.25rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-[0.9375rem] text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </>
  );
}
