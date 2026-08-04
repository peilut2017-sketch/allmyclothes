import { Modal } from './Modal';
import { SEASONS, SEASON_ORDER, STATUSES, STATUS_ORDER } from '../lib/constants';
import { useData } from '../context/DataContext';
import type { ItemStatus, Season } from '../lib/types';

export interface Filters {
  seasons: Season[];
  categoryIds: string[];
  typeIds: string[];
  statuses: ItemStatus[];
  sizes: string[];
  years: number[];
}

export const EMPTY_FILTERS: Filters = {
  seasons: [],
  categoryIds: [],
  typeIds: [],
  statuses: ['active', 'waiting'],
  sizes: [],
  years: [],
};

export function countActiveFilters(f: Filters): number {
  return (
    f.seasons.length +
    f.categoryIds.length +
    f.typeIds.length +
    f.sizes.length +
    f.years.length +
    (f.statuses.length === EMPTY_FILTERS.statuses.length &&
    EMPTY_FILTERS.statuses.every((s) => f.statuses.includes(s))
      ? 0
      : 1)
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
  availableSizes: string[];
  availableYears: number[];
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
        active
          ? 'border-amber-500 bg-amber-500 text-white'
          : 'border-gray-200 bg-white text-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-sm font-bold text-gray-500">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function FilterSheet({ open, onClose, filters, onChange, availableSizes, availableYears }: FilterSheetProps) {
  const { categories, itemTypes } = useData();

  return (
    <Modal open={open} onClose={onClose} title="סינון הארון">
      <Section title="עונה">
        {SEASON_ORDER.map((s) => (
          <Chip key={s} active={filters.seasons.includes(s)} onClick={() => onChange({ ...filters, seasons: toggle(filters.seasons, s) })}>
            {SEASONS[s].emoji} {SEASONS[s].label}
          </Chip>
        ))}
      </Section>

      <Section title="סטטוס">
        {STATUS_ORDER.map((s) => (
          <Chip key={s} active={filters.statuses.includes(s)} onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, s) })}>
            {STATUSES[s].emoji} {STATUSES[s].label}
          </Chip>
        ))}
      </Section>

      {categories.length > 0 && (
        <Section title="קטגוריה">
          {categories.map((c) => (
            <Chip key={c.id} active={filters.categoryIds.includes(c.id)} onClick={() => onChange({ ...filters, categoryIds: toggle(filters.categoryIds, c.id) })}>
              {c.name}
            </Chip>
          ))}
        </Section>
      )}

      {itemTypes.length > 0 && (
        <Section title="סוג פריט">
          {itemTypes.map((t) => (
            <Chip key={t.id} active={filters.typeIds.includes(t.id)} onClick={() => onChange({ ...filters, typeIds: toggle(filters.typeIds, t.id) })}>
              {t.name}
            </Chip>
          ))}
        </Section>
      )}

      {availableSizes.length > 0 && (
        <Section title="מידה">
          {availableSizes.map((s) => (
            <Chip key={s} active={filters.sizes.includes(s)} onClick={() => onChange({ ...filters, sizes: toggle(filters.sizes, s) })}>
              {s}
            </Chip>
          ))}
        </Section>
      )}

      {availableYears.length > 0 && (
        <Section title="שנה">
          {availableYears.map((y) => (
            <Chip key={y} active={filters.years.includes(y)} onClick={() => onChange({ ...filters, years: toggle(filters.years, y) })}>
              {y}
            </Chip>
          ))}
        </Section>
      )}

      <div className="mt-2 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-amber-500 py-3 font-semibold text-white active:scale-[0.98]"
        >
          הצגת תוצאות
        </button>
        <button
          onClick={() => onChange({ ...EMPTY_FILTERS })}
          className="rounded-2xl bg-gray-100 px-5 py-3 font-semibold text-gray-600 active:scale-[0.98]"
        >
          איפוס
        </button>
      </div>
    </Modal>
  );
}
