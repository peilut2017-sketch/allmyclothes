import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { EmptyState } from '../components/EmptyState';
import { SEASONS } from '../lib/constants';
import { formatPrice } from '../lib/format';
import type { Item } from '../lib/types';

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
                  className="rounded-2xl bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-card active:scale-95"
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
                className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card transition ${
                  justBought === item.id ? 'scale-95 opacity-0' : ''
                }`}
              >
                <button
                  onClick={() => void markBought(item)}
                  aria-label={`נקנה: ${item.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-50 font-bold text-emerald-500 transition active:scale-90"
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
      </main>
    </div>
  );
}
