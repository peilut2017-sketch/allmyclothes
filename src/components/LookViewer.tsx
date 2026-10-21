import { useData } from '../context/DataContext';
import { FullscreenPager } from './FullscreenPager';
import { FitDots } from './FitDots';
import type { Item, Look } from '../lib/types';

export interface ResolvedLook { look: Look; list: Item[] }

/** פריסת קולאז': מתאימה את הרשת למספר הפריטים כך שהכול ממלא את המסך */
function layoutFor(n: number): { cols: string; rows: string; spans: (string | undefined)[] } {
  if (n <= 1) return { cols: '1fr', rows: '1fr', spans: [] };
  if (n === 2) return { cols: '1fr', rows: '1fr 1fr', spans: [] };
  if (n === 3) return { cols: '1.25fr 1fr', rows: '1fr 1fr', spans: ['1 / span 2'] };
  const rows = Math.ceil(n / 2);
  const spans: (string | undefined)[] = [];
  const odd = n % 2 === 1;
  if (odd) spans[n - 1] = 'span 2';
  return { cols: '1fr 1fr', rows: `repeat(${rows}, 1fr)`, spans };
}

function Collage({ list }: { list: Item[] }) {
  const { imageUrls, children } = useData();
  const { cols, rows, spans } = layoutFor(list.length);
  return (
    <div
      className="absolute inset-x-4 top-[calc(max(1rem,env(safe-area-inset-top))+4.25rem)] bottom-[calc(max(1rem,env(safe-area-inset-bottom))+6.5rem)] grid gap-2.5"
      style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}
    >
      {list.map((item, k) => {
        const url = item.images[0] ? imageUrls[item.images[0]] : null;
        const child = children.find((c) => c.id === item.child_id);
        const first = list.length === 3 && k === 0;
        return (
          <div
            key={item.id}
            data-item-id={item.id}
            className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-card"
            style={{ gridRow: first ? '1 / span 2' : undefined, gridColumn: spans[k] && !first ? spans[k] : undefined }}
          >
            {url ? (
              <img src={url} alt={item.name} draggable={false} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-amber-50 text-6xl dark:bg-amber-500/15">👕</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-2.5 pt-8 text-white">
              <div className="truncate text-sm font-bold">{item.name}</div>
              <div className="flex items-center gap-1.5 text-xs opacity-90">
                {child && <span>{child.emoji}</span>}
                {item.size_label && <span>מידה {item.size_label}</span>}
                <FitDots value={item.size_fit} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface LookViewerProps {
  looks: ResolvedLook[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onOpenItem: (id: string) => void;
  onEdit: (look: Look) => void;
  onDelete: (look: Look) => void;
}

/** הלוק במסך מלא: קולאז' גדול, והחלקה לצדדים מעבר ללוק הבא/הקודם */
export function LookViewer({ looks, index, onIndexChange, onClose, onOpenItem, onEdit, onDelete }: LookViewerProps) {
  return (
    <FullscreenPager
      count={looks.length}
      index={index}
      onIndexChange={onIndexChange}
      onClose={onClose}
      background="rgb(var(--c-cream))"
      onTap={({ x, y }) => {
        const id = document.elementFromPoint(x, y)?.closest('[data-item-id]')?.getAttribute('data-item-id');
        if (id) onOpenItem(id);
      }}
      renderSlide={(i) => <Collage list={looks[i].list} />}
      renderChrome={(i) => {
        const cur = looks[i];
        if (!cur) return null;
        return (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] flex items-center justify-center px-16">
              <div className="text-center">
                <div className="truncate text-lg font-extrabold text-ink">{cur.look.name || 'לוק'}</div>
                <div className="text-xs text-gray-500">{i + 1} / {looks.length} · {cur.list.length} פריטים</div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="סגירה"
              className="glass absolute end-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-ink shadow transition active:scale-90"
            >
              ✕
            </button>
            <div className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] px-4">
              {looks.length > 1 && (
                <div className="pointer-events-none mb-3 flex justify-center gap-1.5">
                  {looks.slice(0, 9).map((_, k) => (
                    <span key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-5 bg-amber-500' : 'w-2 bg-gray-300'}`} />
                  ))}
                </div>
              )}
              <div className="mx-auto flex max-w-md gap-3">
                <button
                  onClick={() => onEdit(cur.look)}
                  className="flex-1 rounded-2xl bg-amber-500 py-3.5 font-bold text-white shadow-md shadow-amber-500/30 transition active:scale-[0.97]"
                >
                  ✏️ עריכה
                </button>
                <button
                  onClick={() => onDelete(cur.look)}
                  className="glass flex-1 rounded-2xl py-3.5 font-bold text-rose-600 shadow transition active:scale-[0.97] dark:text-rose-300"
                >
                  🗑️ מחיקה
                </button>
              </div>
              <p className="mt-2 text-center text-[0.6875rem] text-gray-400">החליקו ימינה ושמאלה בין לוקים · החליקו למטה לסגירה</p>
            </div>
          </>
        );
      }}
    />
  );
}
