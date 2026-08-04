import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SEASONS, SEASON_ORDER, STATUSES, STATUS_ORDER } from '../lib/constants';
import { formatPrice } from '../lib/format';

interface BarRow {
  key: string;
  label: string;
  value: number;
  color: string;
  extra?: string;
}

export function StatsPage() {
  const { items, children, categories } = useData();

  const activeItems = useMemo(() => items.filter((i) => i.status === 'active'), [items]);
  const qty = (list: typeof items) => list.reduce((s, i) => s + i.quantity, 0);

  const totalActive = qty(activeItems);
  const totalWaiting = qty(items.filter((i) => i.status === 'waiting'));
  const totalSpent = items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);

  const byChild: BarRow[] = useMemo(() => {
    const rows: BarRow[] = children.map((c) => {
      const list = activeItems.filter((i) => i.child_id === c.id);
      return {
        key: c.id,
        label: `${c.emoji} ${c.name}`,
        value: qty(list),
        color: c.color,
        extra: formatPrice(list.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0)) || undefined,
      };
    });
    const general = activeItems.filter((i) => i.child_id === null);
    if (general.length > 0) {
      rows.push({ key: 'general', label: '🏠 כללי', value: qty(general), color: '#9ca3af' });
    }
    return rows.sort((a, b) => b.value - a.value);
  }, [children, activeItems]);

  const seasonHex: Record<string, string> = {
    winter: '#38bdf8',
    summer: '#fbbf24',
    mid: '#fb923c',
    all: '#a78bfa',
  };
  const bySeason: BarRow[] = SEASON_ORDER.map((s) => ({
    key: s,
    label: `${SEASONS[s].emoji} ${SEASONS[s].label}`,
    value: qty(activeItems.filter((i) => i.season === s)),
    color: seasonHex[s],
  }));

  const byCategory: BarRow[] = useMemo(
    () =>
      categories
        .map((c) => ({
          key: c.id,
          label: c.name,
          value: qty(activeItems.filter((i) => i.category_id === c.id)),
          color: '#f59e0b',
        }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value),
    [categories, activeItems],
  );

  const byYear: BarRow[] = useMemo(() => {
    const years = [...new Set(items.map((i) => i.year).filter((y): y is number => y != null))].sort((a, b) => b - a);
    return years.map((y) => {
      const list = items.filter((i) => i.year === y);
      return {
        key: String(y),
        label: String(y),
        value: list.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0),
        color: '#f59e0b',
        extra: `${qty(list)} פריטים`,
      };
    }).filter((r) => r.value > 0);
  }, [items]);

  const byStatus: BarRow[] = STATUS_ORDER.map((s) => ({
    key: s,
    label: `${STATUSES[s].emoji} ${STATUSES[s].label}`,
    value: qty(items.filter((i) => i.status === s)),
    color: '#f59e0b',
  })).filter((r) => r.value > 0);

  return (
    <div className="min-h-dvh bg-cream pb-28">
      <header className="sticky top-0 z-30 bg-cream/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <h1 className="mx-auto max-w-lg text-2xl font-extrabold text-ink">סיכום הארון 📊</h1>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 pt-1">
        <div className="grid grid-cols-3 gap-3">
          <StatTile value={String(totalActive)} label="בגדים בארון" />
          <StatTile value={String(totalWaiting)} label="שמורים לגדילה" />
          <StatTile value={totalSpent > 0 ? formatPrice(totalSpent) : '—'} label="סה״כ הושקע" />
        </div>

        {byChild.length > 0 && <BarCard title="מי מלביש את הארון? (פריטים בארון)" rows={byChild} />}
        <BarCard title="לפי עונה (פריטים בארון)" rows={bySeason} />
        {byCategory.length > 0 && <BarCard title="לפי קטגוריה" rows={byCategory} />}
        {byYear.length > 0 && <BarCard title="הוצאות לפי שנה" rows={byYear} money />}
        {byStatus.length > 1 && <BarCard title="לפי סטטוס (כל הפריטים)" rows={byStatus} />}

        {items.length === 0 && (
          <p className="pt-10 text-center text-gray-400">אין עדיין נתונים – הוסיפו בגדים לארון 👕</p>
        )}
      </main>
    </div>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-card">
      <div className="text-xl font-extrabold text-ink">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-gray-500">{label}</div>
    </div>
  );
}

function BarCard({ title, rows, money }: { title: string; rows: BarRow[]; money?: boolean }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-3 text-sm font-bold text-gray-600">{title}</h2>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-ink">{row.label}</span>
              <span className="font-semibold text-gray-600">
                {money ? formatPrice(row.value) : row.value}
                {row.extra && <span className="ms-1.5 text-xs font-normal text-gray-400">{row.extra}</span>}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
