import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { SEASONS, SEASON_ORDER } from '../lib/constants';
import type { Item, Season } from '../lib/types';

type Decision = 'keep' | 'transfer' | 'outgrown';

/**
 * מצב החלפת עונה: מעבר מודרך, פריט-פריט, על בגדי עונה שמסתיימת –
 * לכל בגד מחליטים: נשאר / עובר לאח / קטן מדי.
 */
export function SeasonSwapPage() {
  const { items, children, imageUrls, updateItem } = useData();
  const navigate = useNavigate();

  const [season, setSeason] = useState<Season | null>(null);
  const [childFilter, setChildFilter] = useState<string | null>(null);
  const [queue, setQueue] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [transferFor, setTransferFor] = useState<Item | null>(null);
  const [summary, setSummary] = useState({ keep: 0, transfer: 0, outgrown: 0 });

  const candidates = useMemo(
    () =>
      items.filter(
        (i) =>
          i.status === 'active' &&
          (season === null || i.season === season) &&
          (childFilter === null || i.child_id === childFilter),
      ),
    [items, season, childFilter],
  );

  const start = () => {
    setQueue(candidates);
    setIndex(0);
    setSummary({ keep: 0, transfer: 0, outgrown: 0 });
  };

  const advance = (decision: Decision) => {
    setSummary((s) => ({ ...s, [decision]: s[decision] + 1 }));
    setIndex((i) => i + 1);
  };

  const decide = (item: Item, decision: Decision) => {
    if (decision === 'outgrown') {
      void updateItem(item.id, { status: 'outgrown' });
      advance(decision);
    } else if (decision === 'transfer') {
      setTransferFor(item);
    } else {
      advance('keep');
    }
  };

  const doTransfer = (item: Item, childId: string | null) => {
    void updateItem(item.id, { child_id: childId, status: 'active' });
    setTransferFor(null);
    advance('transfer');
  };

  // ---------- מסך סיכום ----------
  if (queue && index >= queue.length) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-8 text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="mb-2 text-2xl font-extrabold text-ink">סיימתם את החלפת העונה!</h1>
        <p className="mb-6 text-gray-500">
          עברתם על {queue.length} פריטים:
          <br />✅ {summary.keep} נשארו בארון · 🎁 {summary.transfer} הועברו · 📏 {summary.outgrown} סומנו כקטנים
        </p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="rounded-2xl bg-amber-500 px-8 py-3.5 font-bold text-white shadow-md shadow-amber-500/30 active:scale-[0.98]"
        >
          חזרה לארון
        </button>
      </div>
    );
  }

  // ---------- מסך המעבר על הפריטים ----------
  if (queue) {
    const item = queue[index];
    const child = children.find((c) => c.id === item.child_id);
    const url = item.images[0] ? imageUrls[item.images[0]] : null;
    const siblings = children.filter((c) => c.id !== item.child_id);

    return (
      <div className="flex min-h-dvh flex-col bg-cream">
        <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate(-1)} className="text-2xl" aria-label="יציאה">✕</button>
              <span className="text-sm font-semibold text-gray-500" dir="ltr">
                {index + 1} / {queue.length}
              </span>
              <button onClick={() => setIndex((i) => i + 1)} className="text-sm font-semibold text-gray-500">
                דילוג
              </button>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${(index / queue.length) * 100}%` }}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-4">
          <div className="overflow-hidden rounded-3xl bg-card shadow-card">
            {url ? (
              <img src={url} alt={item.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-amber-50 text-8xl dark:bg-amber-500/15">👕</div>
            )}
            <div className="p-4 text-center">
              <div className="text-xl font-extrabold text-ink">{item.name}</div>
              <div className="mt-1 text-sm text-gray-500">
                {child ? `${child.emoji} ${child.name}` : '🏠 כללי'}
                {item.size_label && ` · מידה ${item.size_label}`}
                {' · '}
                {SEASONS[item.season].emoji} {SEASONS[item.season].label}
              </div>
            </div>
          </div>
        </main>

        <footer className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto grid max-w-lg grid-cols-3 gap-3">
            <SwapButton emoji="📏" label="קטן מדי" color="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" onClick={() => decide(item, 'outgrown')} />
            <SwapButton
              emoji="🎁"
              label="עובר הלאה"
              color="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
              onClick={() => decide(item, 'transfer')}
              disabled={siblings.length === 0 && item.child_id === null}
            />
            <SwapButton emoji="✅" label="נשאר" color="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" onClick={() => decide(item, 'keep')} />
          </div>
        </footer>

        {transferFor && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setTransferFor(null)} />
            <div className="relative z-10 w-full rounded-t-3xl bg-card p-5 pb-8 shadow-sheet sm:max-w-md sm:rounded-3xl">
              <h2 className="mb-3 text-lg font-bold text-ink">למי עובר ״{transferFor.name}״?</h2>
              <div className="space-y-2">
                {children
                  .filter((c) => c.id !== transferFor.child_id)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => doTransfer(transferFor, c.id)}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-100 bg-card px-4 py-3 font-semibold text-gray-700 active:scale-[0.98]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg" style={{ backgroundColor: `${c.color}22` }}>
                        {c.emoji}
                      </span>
                      {c.name}
                    </button>
                  ))}
                <button
                  onClick={() => doTransfer(transferFor, null)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-100 bg-card px-4 py-3 font-semibold text-gray-700 active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg">🏠</span>
                  לכללי (בהמתנה)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- מסך הגדרת המעבר ----------
  return (
    <div className="min-h-dvh bg-cream pb-28">
      <header className="sticky top-0 z-30 bg-cream/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-2xl" aria-label="חזרה">→</button>
          <h1 className="text-2xl font-extrabold text-ink">החלפת עונה 🔄</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-4 pt-1">
        <p className="text-sm text-gray-500">
          סוף עונה? עוברים יחד על הבגדים, פריט-פריט, ומחליטים על כל אחד:
          נשאר בארון ✅, עובר לאח/ות 🎁, או קטן מדי 📏
        </p>

        <div>
          <h2 className="mb-2 text-sm font-bold text-gray-600">אילו בגדים עוברים בדיקה?</h2>
          <div className="grid grid-cols-4 gap-2">
            {SEASON_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setSeason(season === s ? null : s)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 text-xs font-semibold transition active:scale-95 ${
                  season === s ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' : 'border-gray-100 bg-card text-gray-500'
                }`}
              >
                <span className="text-xl">{SEASONS[s].emoji}</span>
                {SEASONS[s].label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-400">בלי בחירה – עוברים על כל הארון</p>
        </div>

        {children.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-bold text-gray-600">של מי?</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setChildFilter(null)}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
                  childFilter === null ? 'border-transparent bg-ink text-cream' : 'border-gray-200 bg-card text-gray-600'
                }`}
              >
                👨‍👩‍👧‍👦 כולם
              </button>
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChildFilter(childFilter === c.id ? null : c.id)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
                    childFilter === c.id ? 'border-transparent text-white' : 'border-gray-200 bg-card text-gray-600'
                  }`}
                  style={childFilter === c.id ? { backgroundColor: c.color } : undefined}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={start}
          disabled={candidates.length === 0}
          className="w-full rounded-2xl bg-amber-500 py-4 text-lg font-bold text-white shadow-lg shadow-amber-500/30 transition active:scale-[0.98] disabled:opacity-50"
        >
          {candidates.length === 0 ? 'אין פריטים מתאימים' : `התחלה – ${candidates.length} פריטים`}
        </button>
      </main>
    </div>
  );
}

function SwapButton({ emoji, label, color, onClick, disabled }: {
  emoji: string;
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-2xl py-3.5 font-bold shadow-card transition active:scale-[0.96] disabled:opacity-40 ${color}`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}
