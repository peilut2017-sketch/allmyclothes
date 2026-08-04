import { useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ImagePicker } from '../components/ImagePicker';
import { LOCATION_SUGGESTIONS, SEASONS, SEASON_ORDER, STATUSES, STATUS_ORDER, SIZE_SUGGESTIONS } from '../lib/constants';
import type { ItemInput, ItemStatus, Season } from '../lib/types';

export function ItemFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, children, categories, itemTypes, addItem, updateItem, addCategory, addItemType } = useData();

  const editing = id ? items.find((i) => i.id === id) : undefined;
  const navState = location.state as { duplicateOf?: string; shopping?: boolean } | null;
  const duplicateOf = navState?.duplicateOf;
  const fromShopping = navState?.shopping === true;
  const source = editing ?? (duplicateOf ? items.find((i) => i.id === duplicateOf) : undefined);

  const [form, setForm] = useState<ItemInput>(() => ({
    name: source?.name ?? '',
    description: source?.description ?? null,
    child_id: source?.child_id ?? null,
    category_id: source?.category_id ?? null,
    type_id: source?.type_id ?? null,
    // בשכפול לא מעתיקים מידה ותמונה – בדרך כלל קונים אותו פריט במידה אחרת
    size_label: duplicateOf ? null : (source?.size_label ?? null),
    season: source?.season ?? 'all',
    store: source?.store ?? null,
    location: source?.location ?? null,
    price: source?.price ?? null,
    year: source?.year ?? new Date().getFullYear(),
    quantity: source?.quantity ?? 1,
    status: source?.status ?? (fromShopping ? 'to_buy' : 'active'),
    image_path: duplicateOf ? null : (source?.image_path ?? null),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current + 2, current + 1, current, current - 1, current - 2];
  }, []);

  // הצעות מיקום: מיקומים שכבר בשימוש בארון + הצעות ברירת מחדל
  const locationOptions = useMemo(() => {
    const used = items.map((i) => i.location).filter((l): l is string => Boolean(l));
    return [...new Set([...used, ...LOCATION_SUGGESTIONS])];
  }, [items]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form, name: form.name.trim() };
      if (editing) {
        await updateItem(editing.id, payload);
        navigate(`/item/${editing.id}`, { replace: true });
      } else {
        await addItem(payload);
        navigate(fromShopping || payload.status === 'to_buy' ? '/shopping' : '/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השמירה נכשלה, נסו שוב');
      setBusy(false);
    }
  };

  const promptNew = async (kind: 'category' | 'type') => {
    const name = window.prompt(kind === 'category' ? 'שם הקטגוריה החדשה:' : 'שם סוג הפריט החדש:');
    if (!name?.trim()) return;
    try {
      const created = kind === 'category' ? await addCategory(name) : await addItemType(name);
      if (created) set(kind === 'category' ? 'category_id' : 'type_id', created.id);
    } catch {
      setError('ההוספה נכשלה – ייתכן שהשם כבר קיים');
    }
  };

  return (
    <div className="min-h-dvh bg-cream pb-32">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-cream/95 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <button onClick={() => navigate(-1)} className="text-2xl" aria-label="חזרה">→</button>
        <h1 className="text-xl font-extrabold text-ink">
          {editing ? 'עריכת פריט' : duplicateOf ? 'שכפול פריט' : fromShopping ? 'מה צריך לקנות?' : 'פריט חדש'}
        </h1>
      </header>

      <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-lg space-y-5 px-4">
        <ImagePicker imagePath={form.image_path} onChange={(p) => set('image_path', p)} />

        <Field label="שם הפריט *">
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="למשל: חולצת פסים כחולה"
            className="input"
          />
        </Field>

        <Field label="שיוך לילד/ה">
          <div className="flex flex-wrap gap-2">
            <SelectChip active={form.child_id === null} onClick={() => set('child_id', null)}>
              🏠 כללי
            </SelectChip>
            {children.map((c) => (
              <SelectChip
                key={c.id}
                active={form.child_id === c.id}
                activeColor={c.color}
                onClick={() => set('child_id', c.id)}
              >
                {c.emoji} {c.name}
              </SelectChip>
            ))}
          </div>
          {children.length === 0 && (
            <p className="mt-1 text-xs text-gray-400">טרם הוספתם ילדים – אפשר בלשונית ״ילדים״</p>
          )}
        </Field>

        <Field label="עונה">
          <div className="grid grid-cols-4 gap-2">
            {SEASON_ORDER.map((s) => (
              <SeasonButton key={s} season={s} active={form.season === s} onClick={() => set('season', s)} />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="מידה / גיל">
            <input
              type="text"
              list="size-suggestions"
              value={form.size_label ?? ''}
              onChange={(e) => set('size_label', e.target.value || null)}
              placeholder="למשל: 2-3"
              className="input"
            />
            <datalist id="size-suggestions">
              {SIZE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="לאיזו שנה">
            <select
              value={form.year ?? ''}
              onChange={(e) => set('year', e.target.value ? Number(e.target.value) : null)}
              className="input"
            >
              <option value="">ללא</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="קטגוריה"
            action={{ label: '+ חדשה', onClick: () => void promptNew('category') }}
          >
            <select
              value={form.category_id ?? ''}
              onChange={(e) => set('category_id', e.target.value || null)}
              className="input"
            >
              <option value="">ללא</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field
            label="סוג פריט"
            action={{ label: '+ חדש', onClick: () => void promptNew('type') }}
          >
            <select
              value={form.type_id ?? ''}
              onChange={(e) => set('type_id', e.target.value || null)}
              className="input"
            >
              <option value="">ללא</option>
              {itemTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="חנות / יצרן">
            <input
              type="text"
              value={form.store ?? ''}
              onChange={(e) => set('store', e.target.value || null)}
              placeholder="למשל: זארה"
              className="input"
            />
          </Field>
          <Field label="מחיר (₪)">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value ? Number(e.target.value) : null)}
              placeholder="0"
              className="input"
            />
          </Field>
        </div>

        <Field label="מיקום אחסון (איזה ארון / מדף)">
          <input
            type="text"
            list="location-suggestions"
            value={form.location ?? ''}
            onChange={(e) => set('location', e.target.value || null)}
            placeholder="למשל: ארון חדר ילדים – מדף עליון"
            className="input"
          />
          <datalist id="location-suggestions">
            {locationOptions.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="כמות">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('quantity', Math.max(1, form.quantity - 1))}
                className="h-11 w-11 rounded-2xl bg-white text-xl font-bold text-gray-500 shadow-card active:scale-95"
              >
                −
              </button>
              <span className="min-w-8 text-center text-lg font-bold text-ink">{form.quantity}</span>
              <button
                type="button"
                onClick={() => set('quantity', form.quantity + 1)}
                className="h-11 w-11 rounded-2xl bg-white text-xl font-bold text-gray-500 shadow-card active:scale-95"
              >
                +
              </button>
            </div>
          </Field>
          <Field label="סטטוס">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as ItemStatus)}
              className="input"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUSES[s].emoji} {STATUSES[s].label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="תיאור / הערות">
          <textarea
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
            placeholder="למשל: מתנה מסבתא, שמור לחורף הבא..."
            rows={2}
            className="input resize-none"
          />
        </Field>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-cream via-cream to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
          <div className="mx-auto max-w-lg">
            <button
              type="submit"
              disabled={busy || !form.name.trim()}
              className="w-full rounded-2xl bg-amber-500 py-4 text-lg font-bold text-white shadow-lg shadow-amber-500/30 transition active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? 'שומר...' : editing ? 'שמירת שינויים' : 'הוספה לארון 🎉'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, action, children }: {
  label: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-bold text-gray-600">{label}</label>
        {action && (
          <button type="button" onClick={action.onClick} className="text-sm font-semibold text-amber-600">
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function SelectChip({ active, activeColor, onClick, children }: {
  active: boolean;
  activeColor?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
        active ? 'border-transparent text-white' : 'border-gray-200 bg-white text-gray-600'
      }`}
      style={active ? { backgroundColor: activeColor ?? '#2d2a26' } : undefined}
    >
      {children}
    </button>
  );
}

function SeasonButton({ season, active, onClick }: { season: Season; active: boolean; onClick: () => void }) {
  const s = SEASONS[season];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 text-xs font-semibold transition active:scale-95 ${
        active ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-100 bg-white text-gray-500'
      }`}
    >
      <span className="text-xl">{s.emoji}</span>
      {s.label}
    </button>
  );
}
