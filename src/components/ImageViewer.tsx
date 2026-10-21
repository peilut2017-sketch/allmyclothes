import { useRef, useState } from 'react';
import { FullscreenPager } from './FullscreenPager';

interface ImageViewerProps {
  urls: string[];
  startIndex?: number;
  alt: string;
  onClose: () => void;
}

const ZOOM = 2.5;

/** תצוגה מלאה של תמונות הפריט: החלקה בין תמונות, החלקה למטה לסגירה, ונגיעה כפולה להגדלה */
export function ImageViewer({ urls, startIndex = 0, alt, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState<{ fx: number; fy: number } | null>(null); // נקודת המיקוד (0..1)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  const handleTap = (p: { x: number; y: number }) => {
    const prev = lastTap.current;
    const now = performance.now();
    if (prev && now - prev.t < 320 && Math.hypot(p.x - prev.x, p.y - prev.y) < 40) {
      lastTap.current = null;
      setZoom({ fx: p.x / window.innerWidth, fy: p.y / window.innerHeight });
    } else {
      lastTap.current = { t: now, ...p };
    }
  };

  const zoomedRef = (el: HTMLDivElement | null) => {
    scroller.current = el;
    if (el && zoom) {
      // מגללים כך שנקודת הנגיעה תישאר במקומה
      el.scrollLeft = zoom.fx * el.scrollWidth - zoom.fx * el.clientWidth;
      el.scrollTop = zoom.fy * el.scrollHeight - zoom.fy * el.clientHeight;
    }
  };

  const [dtap, setDtap] = useState(0);

  return (
    <FullscreenPager
      count={urls.length}
      index={index}
      onIndexChange={(i) => { setIndex(i); setZoom(null); }}
      onClose={onClose}
      onTap={handleTap}
      locked={!!zoom}
      renderSlide={(i, active) =>
        active && zoom ? (
          <div
            ref={zoomedRef}
            dir="ltr"
            className="absolute inset-0 overflow-auto overscroll-contain"
            style={{ touchAction: 'pan-x pan-y' }}
            onClick={() => {
              // נגיעה כפולה במצב מוגדל – חזרה לגודל רגיל
              const now = performance.now();
              if (now - dtap < 320) setZoom(null);
              setDtap(now);
            }}
          >
            <img src={urls[i]} alt={alt} draggable={false} className="object-contain" style={{ width: `${ZOOM * 100}vw`, height: `${ZOOM * 100}dvh`, maxWidth: 'none' }} />
          </div>
        ) : (
          <img src={urls[i]} alt={alt} draggable={false} className="h-full w-full object-contain" />
        )
      }
      renderChrome={(i) => (
        <>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="glass absolute end-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-ink shadow transition active:scale-90"
          >
            ✕
          </button>
          {urls.length > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-center gap-1.5">
              {urls.map((_, k) => (
                <span key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-5 bg-white' : 'w-2 bg-white/50'}`} />
              ))}
            </div>
          )}
        </>
      )}
    />
  );
}
