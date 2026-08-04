import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { EmptyState } from '../components/EmptyState';
import { SEASONS } from '../lib/constants';
import { formatPrice } from '../lib/format';
import type { Item, Season } from '../lib/types';

// סוגי פריטים בסיסיים שנבדקים במסך החוסרים, לפי עונה
const CORE_TYPES: Record<'winter' | 'summer', string[]> = {
  winter: ['מעיל', 'סוודר', "קפוצ'ון", 'מכנסיים', "פיג'מה", 'מגפיים'],
  summer: ['חולצה', 'מכנסיים', 'סנדלים', 'בגד ים', 'כובע'],
};

export function ShoppingPage() {
  const { items, children, itemTypes, updateItem } = useData();
  const navigate = useNavigate();
  const [justBought, setJustBought] = useState<string | null>(null);

  const list = useMemo(() => items.filter((i) => i.status === 'to_buy'), [items]);
  const totalEstimate = list.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);

  // ממוינים: קודם לפי ילד (לפי סדר הילדים), ואז כללי
  const sorted = useMemo(() => {
    const order = new Map(children.map((c, idx) => [c.id, idx]));
    return [...list].sort((a, b) => {
      const ai = a.child_id ? (order.get(a.child_id) ?? 99) : 100;
      const bi = b.child_id ? (order.get(b.child_id) ?? 99) : 100;
      return ai - bi;
    });
  }, [list, children]);

  // חוסרים: לכל ילד, סוגי פריטים בסיסיים שאין לו בכלל לעונה הקרובה
  const [dismissedGaps, setDismissedGaps] = useState<string[]>([]);
  const focusSeason: Season = useMemo(() => {
    const m = new Date().getMonth();
    return m >= 8 || m <= 1 ? 'winter' : 'summer';
  }, []);
  const gaps = useMemo(() => {
    const coreNames = CORE_TYPES[focusSeason as 'winter' | 'summer'];
    const relevantTypes = itemTypes.filter((t) => coreNames.includes(t.name));
    const result: { key: string; childId: string; childName: string; emoji: string; color: string; typeId: string; typeName: string }[] = [];
    for (const child of children) {
      for (const type of relevantTypes) {
        const has = items.some(
          (i) =>
            i.child_id === child.id &&
            i.type_id === type.id &&
            (i.status === 'active' || i.status === 'waiting' || i.status === 'to_buy') &&
            (i.season === focusSeason || i.season === 'all'),
        );
        const key = `${child.id}:${type.id}`;
        if (!has && !dismissedGaps.includes(key)) {
          result.push({ key, childId: child.id, childName: child.name, emoji: child.emoji, color: child.color, typeId: type.id, typeName: type.name });
        }
      }
    }
    return result.slice(0, 8);
  }, [children, items, itemTypes, focusSeason, dismissedGaps]);

  const addGapToList = (gap: (typeof gaps)[number]) => {
    navigate('/add', {
      state: {
        shopping: true,
        prefill: {
          name: `${gap.typeName} ל${SEASONS[focusSeason].label}`,
          child_id: gap.childId,
          type_id: gap.typeId,
          season: focusSeason,
          status: 'to_buy',
        },
      },
    });
  };

  const markBought = async (item: Item) => {
    setJustBought(item.id);
    await updateItem(item.id, { status: 'active' });
    setTimeout(() => setJustBought(null), 300);
  };

  const shareList = () => {
    const lines = sorted.map((i) => {
      const child = children.find((c) => c.id === i.child_id)?.name ?? 'כללי';
      const parts = [
        `• ${i.name}`,
        `(${child}${i.size_label ? `, מידה ${i.size_label}` : ''})`,
        i.quantity > 1 ? `×${i.quantity}` : '',
        i.price != null ? `~${formatPrice(i.price)}` : '',
      ].filter(Boolean);
      return parts.join(' ');
    });
    const text = `🛒 רשימת קניות – בגדים:\n${lines.join('\n')}${
      totalEstimate > 0 ? `\n\nסה״כ משוער: ${formatPrice(totalEstimate)}` : ''
    }`;
    if (navigator.share) {
      void navigator.share({ text }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="min-h-dvh bg-cream pb-28">
      <header className="sticky top-0 z-30 bg-cream/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-ink">לקנות 🛒</h1>
            <div className="flex items-center gap-2">
              {list.length > 0 && (
                <button
                  onClick={shareList}
                  className="rounded-2xl bg-card px-3.5 py-2 text-sm font-bold text-ink shadow-card active:scale-95"
                >
                  📤 שיתוף
                </button>
              )}
              <button
                onClick={() => navigate('/add', { state: { shopping: true } })}
                className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-amber-500/30 active:scale-95"
              >
                + הוספה
              </button>
            </div>
          </div>
          {list.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {list.length} פריטים ברשימה
              {totalEstimate > 0 && ` · סה״כ משוער: ${formatPrice(totalEstimate)}`}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-2.5 px-4 pt-1">
        {list.length === 0 ? (
          <EmptyState
            emoji="🛍️"
            title="רשימת הקניות ריקה"
            subtitle="הוסיפו כאן מה שחסר – למשל ״מכנסי חורף לאיתי מידה 3-4״ – וסמנו ✓ אחרי הקנייה"
            action={{ label: '+ מה צריך לקנות?', onClick: () => navigate('/add', { state: { shopping: true } }) }}
          />
        ) : (
          sorted.map((item) => {
            const child = children.find((c) => c.id === item.child_id);
            const type = itemTypes.find((t) => t.id === item.type_id);
            const season = SEASONS[item.season];
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card transition ${
                  justBought === item.id ? 'scale-95 opacity-0' : ''
                }`}
              >
                <button
                  onClick={() => void markBought(item)}
                  aria-label={`נקנה: ${item.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 font-bold text-emerald-500 transition active:scale-90"
                >
                  ✓
                </button>
                <Link to={`/item/${item.id}`} className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">
                    {item.name}
                    {item.quantity > 1 && <span className="ms-1.5 text-sm text-gray-400">×{item.quantity}</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                    <span
                      className="rounded-full px-2 py-0.5 font-medium"
                      style={child ? { backgroundColor: `${child.color}22`, color: child.color } : { backgroundColor: '#f3f4f6' }}
                    >
                      {child ? `${child.emoji} ${child.name}` : '🏠 כללי'}
                    </span>
                    {item.size_label && <span>מידה {item.size_label}</span>}
                    {type && <span>{type.name}</span>}
                    <span>{season.emoji}</span>
                  </div>
                </Link>
                <div className="shrink-0 text-sm font-semibold text-gray-600">
                  {item.price != null ? formatPrice(item.price * item.quantity) : ''}
                </div>
              </div>
            );
          })
        )}

        {list.length > 0 && (
          <p className="pt-3 text-center text-xs text-gray-400">
            לחיצה על ✓ מעבירה את הפריט לארון · לחיצה על השם פותחת לעריכה
          </p>
        )}

        {gaps.length > 0 && (
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <h2 className="mb-1 text-sm font-bold text-amber-800 dark:text-amber-200">
              💡 אולי חסר ל{SEASONS[focusSeason].label}?
            </h2>
            <p className="mb-3 text-xs text-amber-700/80 dark:text-amber-300/80">
              פריטים בסיסיים שלא מצאנו בארון · לחיצה על + מוסיפה לרשימה
            </p>
            <div className="space-y-2">
              {gaps.map((gap) => (
                <div key={gap.key} className="flex items-center gap-2 rounded-xl bg-card p-2.5 shadow-sm">
                  <span className="min-w-0 flex-1 text-sm text-ink">
                    אין ל<b>{gap.childName}</b> {gap.emoji} — <b>{gap.typeName}</b>
                  </span>
                  <button
                    onClick={() => addGapToList(gap)}
                    className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95"
                  >
                    + לרשימה
                  </button>
                  <button
                    onClick={() => setDismissedGaps((d) => [...d, gap.key])}
                    aria-label="הסתרה"
                    className="shrink-0 px-1 text-sm text-gray-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
