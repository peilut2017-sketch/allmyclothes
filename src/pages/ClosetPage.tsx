import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/EmptyState';
import { FilterSheet, EMPTY_FILTERS, countActiveFilters, type Filters } from '../components/FilterSheet';
import { formatPrice } from '../lib/format';

type SortKey = 'newest' | 'name' | 'price' | 'size';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'חדש בארון',
  name: 'לפי שם',
  price: 'לפי מחיר',
  size: 'לפי מידה',
};

export function ClosetPage() {
  const { items, children, loading, error, reload } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [childFilter, setChildFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');

  const availableSizes = useMemo(
    () => [...new Set(items.map((i) => i.size_label).filter((s): s is string => Boolean(s)))].sort((a, b) => a.localeCompare(b, 'he', { numeric: true })),
    [items],
  );
  const availableYears = useMemo(
    () => [...new Set(items.map((i) => i.year).filter((y): y is number => y != null))].sort((a, b) => b - a),
    [items],
  );
  const availableLocations = useMemo(
    () => [...new Set(items.map((i) => i.location).filter((l): l is string => Boolean(l)))].sort((a, b) => a.localeCompare(b, 'he')),
    [items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = items.filter((item) => {
      if (childFilter === 'general' && item.child_id !== null) return false;
      if (childFilter && childFilter !== 'general' && item.child_id !== childFilter) return false;
      if (filters.seasons.length && !filters.seasons.includes(item.season)) return false;
      if (filters.statuses.length && !filters.statuses.includes(item.status)) return false;
      if (filters.categoryIds.length && (!item.category_id || !filters.categoryIds.includes(item.category_id))) return false;
      if (filters.typeIds.length && (!item.type_id || !filters.typeIds.includes(item.type_id))) return false;
      if (filters.sizes.length && (!item.size_label || !filters.sizes.includes(item.size_label))) return false;
      if (filters.years.length && (item.year == null || !filters.years.includes(item.year))) return false;
      if (filters.locations.length && (!item.location || !filters.locations.includes(item.location))) return false;
      if (q) {
        const haystack = `${item.name} ${item.description ?? ''} ${item.store ?? ''} ${item.size_label ?? ''} ${item.location ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    switch (sort) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'he'));
        break;
      case 'price':
        result.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
        break;
      case 'size':
        result.sort((a, b) => (a.size_label ?? '').localeCompare(b.size_label ?? '', 'he', { numeric: true }));
        break;
      default:
        break; // כבר ממוין מהחדש לישן
    }
    return result;
  }, [items, search, childFilter, filters, sort]);

  const totalValue = useMemo(
    () => filtered.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0),
    [filtered],
  );
  const activeFilterCount = countActiveFilters(filters);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="animate-pulse text-5xl">👕</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream pb-28">
      <header className="sticky top-0 z-30 bg-cream/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-ink">הארון שלנו 👕</h1>
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-gray-500">
                {filtered.length} פריטים
                {totalValue > 0 && ` · ${formatPrice(totalValue)}`}
              </span>
              <Link to="/settings" aria-label="הגדרות" className="text-lg text-gray-400">
                ⚙️
              </Link>
            </div>
          </div>

          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש: שם, תיאור, חנות..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pe-4 ps-10 text-sm outline-none focus:border-amber-400"
              />
              <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="relative rounded-2xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-600 active:scale-95"
              aria-label="סינון"
            >
              סינון
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-2xl border border-gray-200 bg-white px-2 text-sm text-gray-600 outline-none"
              aria-label="מיון"
            >
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            <ChildChip label="👨‍👩‍👧‍👦 כולם" active={childFilter === null} onClick={() => setChildFilter(null)} />
            {children.map((c) => (
              <ChildChip
                key={c.id}
                label={`${c.emoji} ${c.name}`}
                color={c.color}
                active={childFilter === c.id}
                onClick={() => setChildFilter(childFilter === c.id ? null : c.id)}
              />
            ))}
            <ChildChip label="🏠 כללי" active={childFilter === 'general'} onClick={() => setChildFilter(childFilter === 'general' ? null : 'general')} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-2">
        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            שגיאה בטעינת הנתונים: {error}
            <button onClick={() => void reload()} className="ms-2 font-semibold underline">רענון</button>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            emoji="🧺"
            title="הארון עדיין ריק"
            subtitle="מתחילים? הוסיפו את הילדים בלשונית ״ילדים״, ואז הוסיפו את הפריט הראשון"
            action={{ label: '+ הוספת פריט ראשון', onClick: () => navigate('/add') }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="לא נמצאו פריטים"
            subtitle="נסו לשנות את החיפוש או הסינון"
            action={{ label: 'איפוס סינון', onClick: () => { setFilters({ ...EMPTY_FILTERS }); setSearch(''); setChildFilter(null); } }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        onChange={setFilters}
        availableSizes={availableSizes}
        availableYears={availableYears}
        availableLocations={availableLocations}
      />
    </div>
  );
}

function ChildChip({ label, color, active, onClick }: { label: string; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
        active ? 'border-transparent text-white' : 'border-gray-200 bg-white text-gray-600'
      }`}
      style={active ? { backgroundColor: color ?? '#2d2a26' } : undefined}
    >
      {label}
    </button>
  );
}
