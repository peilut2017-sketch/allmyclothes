import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ItemCard, useOpenItem } from '../components/ItemCard';
import { FilterIcon, GridIcon, ListIcon, SearchIcon, SlidersIcon } from '../components/Icons';
import { PageHeader, RoundButton } from '../components/PageHeader';
import { SegmentedControl } from '../components/SegmentedControl';
import { SwipeRow } from '../components/SwipeRow';
import { FitDots } from '../components/FitDots';
import { useToast } from '../context/ToastContext';
import { outgrowStatus } from '../lib/sizes';
import { EmptyState } from '../components/EmptyState';
import { FilterSheet, EMPTY_FILTERS, countActiveFilters, type Filters } from '../components/FilterSheet';
import { compareSizes } from '../lib/sizes';
import { formatPrice } from '../lib/format';

type SortKey = 'newest' | 'name' | 'price' | 'size';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'חדש בארון',
  name: 'לפי שם',
  price: 'לפי מחיר',
  size: 'לפי מידה',
};

export function ClosetPage() {
  const { items, children, loading, error, reload, updateItem } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [childFilter, setChildFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');
  const [view, setViewState] = useState<'grid' | 'list'>(() => {
    try { return localStorage.getItem('closetView') === 'list' ? 'list' : 'grid'; } catch { return 'grid'; }
  });
  const setView = (v: 'grid' | 'list') => {
    setViewState(v);
    try { localStorage.setItem('closetView', v); } catch { /* ignore */ }
  };

  const availableSizes = useMemo(
    () => [...new Set(items.map((i) => i.size_label).filter((s): s is string => Boolean(s)))].sort(compareSizes),
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
        result.sort((a, b) => compareSizes(a.size_label ?? '', b.size_label ?? ''));
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
      <div className="min-h-dvh bg-cream pb-28">
        <PageHeader title="הארון שלנו" subtitle=" " />
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-x-3 gap-y-5 px-4 pt-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <div className="skeleton aspect-square rounded-card" />
              <div className="skeleton mt-3 h-3.5 w-3/4 rounded-full" />
              <div className="skeleton mt-2 h-3 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const childOptions = [
    { key: 'all', label: 'כולם' },
    ...children.map((c) => ({ key: c.id, label: c.name, color: c.color })),
    ...(items.some((i) => i.child_id === null) ? [{ key: 'general', label: 'כללי' }] : []),
  ];
  const childValue = childFilter ?? 'all';
  const setChild = (k: string) => setChildFilter(k === 'all' ? null : k);

  const swipeOut = (id: string, status: 'outgrown' | 'given', label: string) => {
    const prev = items.find((i) => i.id === id)?.status;
    void updateItem(id, { status });
    toast(label, prev ? { label: 'ביטול', onClick: () => void updateItem(id, { status: prev }) } : undefined);
  };

  return (
    <div className="min-h-dvh bg-cream pb-32">
      <PageHeader
        title="הארון שלנו"
        subtitle={`${filtered.length} פריטים${totalValue > 0 ? ` · ${formatPrice(totalValue)}` : ''}`}
        right={
          <Link to="/settings" aria-label="הגדרות" className="glass-circle flex h-10 w-10 items-center justify-center rounded-full text-ink transition-transform duration-150 ease-out active:scale-90">
            <SlidersIcon />
          </Link>
        }
      />

      <main className="mx-auto max-w-lg px-4">
        <label className="mt-4 flex h-11 items-center gap-2 rounded-[14px] bg-gray-100 px-3 text-gray-500 focus-within:ring-2 focus-within:ring-amber-500">
          <SearchIcon />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש בארון"
            aria-label="חיפוש בארון"
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-gray-500"
          />
        </label>

        <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 -mx-4 mt-2 bg-cream/85 px-4 pb-2 pt-1.5 backdrop-blur-xl">
          {childOptions.length <= 4 ? (
            <SegmentedControl label="סינון לפי ילד" options={childOptions} value={childValue} onChange={setChild} />
          ) : (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {childOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setChild(o.key)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors duration-200 active:scale-95 ${
                    childValue === o.key ? 'bg-ink text-cream' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setSheetOpen(true)}
              className="relative flex h-9 items-center gap-1.5 rounded-xl bg-gray-100 px-3 text-sm font-semibold text-ink transition-transform duration-150 ease-out active:scale-95"
              aria-label="סינון"
            >
              <FilterIcon size={18} />
              סינון
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.625rem] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 min-w-0 flex-1 rounded-xl bg-gray-100 px-3 text-base font-semibold text-ink outline-none"
              aria-label="מיון"
            >
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <RoundButton
              label={view === 'grid' ? 'תצוגת רשימה' : 'תצוגת רשת'}
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="!h-9 !w-9 !rounded-xl !bg-gray-100 !shadow-none"
            >
              {view === 'grid' ? <ListIcon size={20} /> : <GridIcon size={20} />}
            </RoundButton>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 p-4 text-sm text-rose-700 dark:text-rose-300">
            שגיאה בטעינת הנתונים: {error}
            <button onClick={() => void reload()} className="ms-2 font-semibold underline">רענון</button>
          </div>
        )}

        <div className="pt-2">
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
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
              {filtered.map((item, i) => (
                <ItemCard key={item.id} item={item} index={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-2.5">
              {filtered.map((item, i) => (
                <ListRow key={item.id} item={item} index={i} onSwipeOut={swipeOut} />
              ))}
            </div>
          )}
        </div>
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

function ListRow({ item, index, onSwipeOut }: { item: import('../lib/types').Item; index: number; onSwipeOut: (id: string, status: 'outgrown' | 'given', label: string) => void }) {
  const { children, imageUrls } = useData();
  const navigate = useNavigate();
  const open = useOpenItem(item);
  const child = children.find((c) => c.id === item.child_id);
  const url = item.images[0] ? imageUrls[item.images[0]] : null;
  const outgrow = outgrowStatus(item, child);
  return (
    <div className="rise" style={{ ['--i' as string]: index }}>
      <SwipeRow
        onTap={() => { open.onClick(); navigate(open.to, { state: open.state }); }}
        actions={[
          { label: 'קטן מדי', color: 'rgb(var(--c-warn))', onClick: () => onSwipeOut(item.id, 'outgrown', 'סומן כקטן מדי') },
          { label: 'הועבר הלאה', color: '#0a84ff', onClick: () => onSwipeOut(item.id, 'given', 'הועבר הלאה') },
        ]}
      >
        <div className="flex items-center gap-3 p-2.5 shadow-card">
          <div ref={open.imgRef} className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-2xl">
            {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : '👕'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">{item.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[0.8125rem] text-gray-500">
              {child && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: child.color }} />}
              <span className="truncate">{child?.name ?? 'כללי'}</span>
              {outgrow && <span className="font-bold text-[rgb(var(--c-warn))]">· {outgrow === 'past' ? 'קטן' : 'בקרוב קטן'}</span>}
              {item.size_label && (
                <span className="ms-auto inline-flex shrink-0 items-center gap-1.5 rounded-[7px] bg-gray-100 px-[7px] py-px text-xs font-bold tabular-nums text-ink">
                  {item.size_label}
                  <FitDots value={item.size_fit} />
                </span>
              )}
            </div>
          </div>
        </div>
      </SwipeRow>
    </div>
  );
}
