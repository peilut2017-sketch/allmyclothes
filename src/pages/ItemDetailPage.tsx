import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useData } from '../context/DataContext';
import { ConfirmDialog, Modal } from '../components/Modal';
import { ConditionPicker } from '../components/ConditionPicker';
import { FitPicker } from '../components/FitDots';
import { ImageViewer } from '../components/ImageViewer';
import { LookCollage } from '../components/LookCollage';
import { RoundButton } from '../components/PageHeader';
import { BackIcon, ClockIcon, EditIcon } from '../components/Icons';
import { SeasonBadge, StatusBadge } from '../components/Badges';
import { useToast } from '../context/ToastContext';
import { STATUSES, STATUS_ORDER } from '../lib/constants';
import { formatDate, formatPrice } from '../lib/format';
import { looksOfItem } from '../lib/looks';
import { outgrowStatus } from '../lib/sizes';
import { peekMorphSource, setMorphSource } from '../lib/morph';
import { project, SPRING } from '../lib/motion';
import type { Item, SizeFit } from '../lib/types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * עמוד פריט: שכבה במסך מלא שנפתחת מתוך כרטיס הפריט (כמו ב-App Store) ונסגרת באותו מסלול.
 * גוררים את התמונה כלפי מטה כדי לסגור: השכבה מתכווצת חזרה אל הכרטיס לפי האצבע, והיעד נקבע לפי התנופה.
 * בכניסה ישירה (קישור, או מעמוד אחר) אין כרטיס מקור, והעמוד פשוט נפתח במסך מלא.
 */
export function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { items, looks, children, categories, itemTypes, imageUrls, updateItem, deleteItem } = useData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const item = items.find((i) => i.id === id);

  /* ---------- מעבר פתיחה/סגירה ---------- */
  const src = useMemo(() => (id ? peekMorphSource(id) : null), [id]);
  const p = useMotionValue(src ? 0 : 1);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const geo = useMemo(() => {
    if (!src) return null;
    const s0 = src.w / vw;
    return { s0, x0: src.x, y0: src.y, h0: src.h / s0 };
  }, [src, vw]);
  const x = useTransform(p, (v) => (geo ? lerp(geo.x0, 0, v) : 0));
  const y = useTransform(p, (v) => (geo ? lerp(geo.y0, 0, v) : 0));
  const scale = useTransform(p, (v) => (geo ? lerp(geo.s0, 1, v) : 1));
  const clip = useTransform(p, (v) => {
    if (!geo || v >= 0.999) return 'none';
    const visible = lerp(geo.h0, vh, v);
    return `inset(0 0 ${Math.max(0, vh - visible)}px 0 round ${lerp(22 / geo.s0, 0, v)}px)`;
  });
  const content = useTransform(p, [0.45, 0.85], [0, 1]);
  const dim = useTransform(p, [0, 1], [0, 0.32]);

  useLayoutEffect(() => {
    if (!src) return;
    const controls = animate(p, 1, SPRING);
    return () => controls.stop();
  }, [src, p]);

  const finishClose = () => {
    setMorphSource(null);
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  };
  const close = () => {
    if (!src) return finishClose();
    animate(p, 0, { ...SPRING, onComplete: finishClose });
  };

  /* גרירת התמונה למטה לסגירה: במגע (touch events, כדי לא להפריע לגלילה כשלא בראש העמוד) ובעכבר */
  const scroller = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; axis: 'x' | 'y' | null; h: [number, number][]; active: boolean } | null>(null);
  const didDrag = useRef(false);
  useEffect(() => {
    const el = hero.current;
    if (!el || !src) return;
    const begin = (cx: number, cy: number) => {
      drag.current = { sx: cx, sy: cy, axis: null, h: [[performance.now(), cy]], active: false };
      didDrag.current = false;
    };
    const move = (cx: number, cy: number, prevent: () => void) => {
      const d = drag.current;
      if (!d) return;
      const dx = cx - d.sx, dy = cy - d.sy;
      d.h.push([performance.now(), cy]);
      if (d.h.length > 8) d.h.shift();
      if (!d.axis) {
        if (Math.hypot(dx, dy) < 8) return;
        d.axis = Math.abs(dy) > Math.abs(dx) && dy > 0 && (scroller.current?.scrollTop ?? 0) <= 0 ? 'y' : 'x';
      }
      if (d.axis !== 'y') return;
      prevent();
      d.active = true;
      didDrag.current = true;
      p.stop();
      p.set(Math.min(1, Math.max(0.25, 1 - Math.max(0, dy) / (vh * 0.55))));
    };
    const end = () => {
      const d = drag.current;
      drag.current = null;
      if (!d || !d.active) return;
      const a = d.h[0], b = d.h[d.h.length - 1];
      const vy = (b[1] - a[1]) / Math.max(0.016, (b[0] - a[0]) / 1000);
      const dy = (1 - p.get()) * vh * 0.55;
      if (dy + project(vy, 0.99) > 150 || vy > 900) animate(p, 0, { ...SPRING, onComplete: finishClose });
      else animate(p, 1, { ...SPRING, velocity: vy / 600 });
      setTimeout(() => { didDrag.current = false; }, 0);
    };
    const ts = (e: TouchEvent) => begin(e.touches[0].clientX, e.touches[0].clientY);
    const tm = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY, () => e.cancelable && e.preventDefault());
    const ps = (e: PointerEvent) => { if (e.pointerType === 'mouse') { el.setPointerCapture(e.pointerId); begin(e.clientX, e.clientY); } };
    const pm = (e: PointerEvent) => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY, () => {}); };
    const pu = (e: PointerEvent) => { if (e.pointerType === 'mouse') end(); };
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    el.addEventListener('pointerdown', ps);
    el.addEventListener('pointermove', pm);
    el.addEventListener('pointerup', pu);
    return () => {
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
      el.removeEventListener('pointerdown', ps);
      el.removeEventListener('pointermove', pm);
      el.removeEventListener('pointerup', pu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, item?.id]);

  /* אפקט פרלקסה קל לתמונה בגלילה */
  const heroBg = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    if (heroBg.current && scroller.current) heroBg.current.style.transform = `translateY(${scroller.current.scrollTop * 0.4}px)`;
  };

  /* מצב הבגד נשמר אחרי שהאצבע נחה (בלי בקשה על כל פס) */
  const [cond, setCond] = useState<number | null>(item?.condition ?? null);
  useEffect(() => setCond(item?.condition ?? null), [item?.id, item?.condition]);
  const condTimer = useRef(0);
  const changeCond = (v: number | null) => {
    setCond(v);
    window.clearTimeout(condTimer.current);
    if (item) condTimer.current = window.setTimeout(() => void updateItem(item.id, { condition: v }), 500);
  };

  if (!item) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream text-gray-500">
        הפריט לא נמצא
        <button onClick={() => navigate('/', { replace: true })} className="mt-3 font-semibold text-amber-600">חזרה לארון</button>
      </div>
    );
  }

  const child = children.find((c) => c.id === item.child_id);
  const category = categories.find((c) => c.id === item.category_id);
  const type = itemTypes.find((t) => t.id === item.type_id);
  const galleryUrls = item.images.map((u) => imageUrls[u]).filter((u): u is string => Boolean(u));
  const itemLooks = looksOfItem(looks, item.id);
  const outgrow = outgrowStatus(item, child);

  const rows: [string, string][] = [
    ['מחיר', item.price != null ? formatPrice(item.price) : '—'],
    ['חנות / יצרן', item.store ?? '—'],
    ['קטגוריה', category?.name ?? '—'],
    ['סוג פריט', type?.name ?? '—'],
    ['מיקום אחסון', item.location ?? '—'],
    ['כמות', String(item.quantity)],
    ['לשנה', item.year != null ? String(item.year) : '—'],
    ['נוסף בתאריך', formatDate(item.created_at)],
  ];

  const changeFit = (v: SizeFit | null) => void updateItem(item.id, { size_fit: v });

  return (
    <>
      {src && <motion.div className="pointer-events-none fixed inset-0 z-[45] bg-black" style={{ opacity: dim }} />}
      <motion.div
        className="fixed inset-0 z-50 overflow-hidden bg-cream"
        style={{ x, y, scale, clipPath: clip, transformOrigin: '0 0' }}
      >
        <div ref={scroller} onScroll={onScroll} className="absolute inset-0 overflow-y-auto overscroll-contain">
          <motion.div style={{ opacity: content }} className="pointer-events-none sticky top-0 z-[3] order-first h-0">
            <div className="mx-auto flex max-w-lg justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
              <RoundButton label="חזרה" onClick={close} className="pointer-events-auto">
                <BackIcon />
              </RoundButton>
              <RoundButton label="עריכה" onClick={() => navigate(`/edit/${item.id}`)} className="pointer-events-auto">
                <EditIcon />
              </RoundButton>
            </div>
          </motion.div>

          <div
            ref={hero}
            className="relative aspect-square overflow-hidden bg-gray-100 sm:mx-auto sm:max-w-lg"
            style={{ touchAction: 'pan-x pan-y' }}
          >
            <div ref={heroBg} className="absolute inset-0 will-change-transform">
              {galleryUrls.length > 1 ? (
                <Gallery urls={galleryUrls} alt={item.name} index={galleryIndex} onIndexChange={setGalleryIndex} onOpen={() => !didDrag.current && setViewerOpen(true)} />
              ) : galleryUrls.length === 1 ? (
                <img
                  src={galleryUrls[0]}
                  alt={item.name}
                  onClick={() => !didDrag.current && setViewerOpen(true)}
                  className="h-full w-full cursor-zoom-in object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-amber-500/10 text-8xl">👕</div>
              )}
            </div>
          </div>

          <motion.div
            style={{ opacity: content }}
            className="relative z-[1] mx-auto -mt-7 min-h-[60dvh] max-w-lg rounded-t-[30px] bg-cream px-4 pb-[calc(env(safe-area-inset-bottom)+3rem)] pt-3 shadow-[0_-12px_32px_rgba(0,0,0,0.1)]"
          >
            <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-gray-200" />
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SeasonBadge season={item.season} />
              <button onClick={() => setStatusOpen(true)} className="transition-transform duration-150 active:scale-95">
                <StatusBadge status={item.status} />
              </button>
              {outgrow && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--c-warn)/0.14)] px-2.5 py-0.5 text-xs font-bold text-[rgb(var(--c-warn))]">
                  <ClockIcon size={12} /> {outgrow === 'past' ? 'כנראה כבר קטן' : 'בקרוב קטן'}
                </span>
              )}
            </div>
            <h1 className="text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink">{item.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-[0.9375rem] text-gray-500">
              {child ? (
                <>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: child.color }} />
                  {child.name}
                </>
              ) : (
                'כללי'
              )}
            </div>
            {item.description && <p className="mt-2 text-gray-600">{item.description}</p>}

            <Group title="מידה וגזרה">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-[2.125rem] font-extrabold tabular-nums tracking-[-0.03em] text-ink">{item.size_label ?? '—'}</span>
                <button onClick={() => navigate(`/edit/${item.id}`)} className="text-sm font-semibold text-amber-600 active:opacity-60">שינוי מידה</button>
              </div>
              <FitPicker value={item.size_fit} onChange={changeFit} />
            </Group>

            <Group title="מצב הבגד">
              <ConditionPicker value={cond} onChange={changeCond} allowClear={false} />
            </Group>

            <div className="mt-5 divide-y divide-[rgb(var(--c-line)/0.14)] overflow-hidden rounded-card bg-card shadow-card">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-3.5 text-[0.96875rem]">
                  <span className="text-gray-500">{label}</span>
                  <b className="font-semibold tabular-nums text-ink">{value}</b>
                </div>
              ))}
            </div>

            <Group title="לוקים עם הפריט">
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" style={{ scrollSnapType: 'x proximity' }}>
                <button
                  onClick={() => navigate('/looks/new', { state: { anchor: item.id } })}
                  className="flex aspect-square w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-gray-300 text-sm font-semibold text-gray-500 transition-transform duration-150 active:scale-95"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <span className="text-2xl leading-none">+</span>
                  לוק חדש
                </button>
                {itemLooks.map((l) => (
                  <Link
                    key={l.id}
                    to={`/looks?open=${l.id}`}
                    className="w-28 shrink-0 transition-transform duration-150 active:scale-95"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <LookCollage items={l.item_ids.map((i) => items.find((x) => x.id === i)).filter((x): x is Item => Boolean(x))} className="rounded-2xl shadow-card" />
                    <div className="mt-1.5 truncate text-[0.8125rem] font-semibold text-ink">{l.name || 'לוק'}</div>
                  </Link>
                ))}
              </div>
            </Group>

            <div className="mt-6 grid gap-2.5">
              {item.status === 'to_buy' ? (
                <button
                  onClick={() => { void updateItem(item.id, { status: 'active' }); toast('הועבר לארון'); }}
                  className="h-[54px] rounded-[18px] bg-[rgb(var(--c-ok))] text-[1.0625rem] font-bold text-white shadow-[0_8px_20px_rgb(var(--c-ok)/0.35)] transition-transform duration-150 ease-out active:scale-[0.975]"
                >
                  קניתי! העברה לארון
                </button>
              ) : (
                <button
                  onClick={() => navigate('/looks/new', { state: { anchor: item.id } })}
                  className="h-[54px] rounded-[18px] bg-amber-500 text-[1.0625rem] font-bold text-white shadow-[0_8px_20px_rgb(var(--c-accent)/0.35)] transition-transform duration-150 ease-out active:scale-[0.975]"
                >
                  הוספה ללוק
                </button>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <Ghost onClick={() => setStatusOpen(true)}>שינוי סטטוס</Ghost>
                <Ghost onClick={() => setTransferOpen(true)}>העברה לילד אחר</Ghost>
              </div>
              <Ghost onClick={() => navigate('/add', { state: { duplicateOf: item.id } })}>שכפול (מידה נוספת)</Ghost>
              <button
                onClick={() => setConfirmDelete(true)}
                className="py-3 text-[0.9375rem] font-semibold text-[rgb(var(--c-warn))] transition-opacity active:opacity-60"
              >
                מחיקת הפריט
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {viewerOpen && (
          <ImageViewer urls={galleryUrls} startIndex={galleryIndex} alt={item.name} onClose={() => setViewerOpen(false)} />
        )}
      </AnimatePresence>

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="לאן עבר הפריט?">
        <div className="space-y-2">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => {
                void updateItem(item.id, { status: s });
                setStatusOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold ring-1 ring-inset transition-transform duration-150 active:scale-[0.98] ${
                item.status === s ? 'bg-amber-500/10 text-amber-600 ring-amber-500' : 'bg-card text-ink ring-gray-200'
              }`}
            >
              <span className="text-xl">{STATUSES[s].emoji}</span>
              {STATUSES[s].label}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="למי להעביר את הפריט?">
        <p className="mb-3 text-sm text-gray-500">
          מושלם לבגדים שעוברים בין אחים. הפריט יסומן ״בארון״ אצל היעד החדש.
        </p>
        <div className="space-y-2">
          {children
            .filter((c) => c.id !== item.child_id)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  void updateItem(item.id, { child_id: c.id, status: 'active' });
                  setTransferOpen(false);
                  toast(`הועבר ל${c.name}`);
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3.5 font-semibold text-ink ring-1 ring-inset ring-gray-200 transition-transform duration-150 active:scale-[0.98]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg" style={{ backgroundColor: `${c.color}22` }}>
                  {c.emoji}
                </span>
                {c.name}
              </button>
            ))}
          {item.child_id !== null && (
            <button
              onClick={() => {
                void updateItem(item.id, { child_id: null });
                setTransferOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3.5 font-semibold text-ink ring-1 ring-inset ring-gray-200 transition-transform duration-150 active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg">🏠</span>
              ללא שיוך (כללי)
            </button>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="מחיקת הפריט"
        message={`למחוק את ״${item.name}״ מהארון? אי אפשר לשחזר.`}
        onConfirm={() => {
          void deleteItem(item.id).then(() => navigate('/', { replace: true }));
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-card bg-card p-4 shadow-card">
      <h2 className="mb-3 text-[0.8125rem] font-bold tracking-[0.01em] text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function Ghost({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="h-12 rounded-2xl bg-gray-100 text-[0.9375rem] font-semibold text-ink transition-transform duration-150 ease-out active:scale-[0.975]"
    >
      {children}
    </button>
  );
}

function Gallery({ urls, alt, index, onIndexChange, onOpen }: {
  urls: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
  onOpen: () => void;
}) {
  return (
    <div className="relative h-full w-full">
      <div
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
          if (i !== index && i >= 0 && i < urls.length) onIndexChange(i);
        }}
      >
        {urls.map((url) => (
          <img key={url} src={url} alt={alt} onClick={onOpen} className="h-full w-full shrink-0 cursor-zoom-in snap-center object-cover" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-9 flex justify-center gap-1.5">
        {urls.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ease-out ${i === index ? 'w-5 bg-white shadow' : 'w-1.5 bg-white/60'}`} />
        ))}
      </div>
    </div>
  );
}
