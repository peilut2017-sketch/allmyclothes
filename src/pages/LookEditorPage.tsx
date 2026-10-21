import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { matchesQuery, suggestItems, type Suggestion } from '../lib/looks';

/** בניית לוק: בוחרים פריט אחד או יותר – קודם מוצגים אלה שמתאימים לפי מידה, עונה וילד, ואפשר לחפש לפי שם */
export function LookEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, looks, children, itemTypes, imageUrls, addLook, updateLook } = useData();

  const editing = id ? looks.find((l) => l.id === id) : undefined;
  const anchor = (location.state as { anchor?: string } | null)?.anchor;

  const [name, setName] = useState(editing?.name ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const base = editing ? editing.item_ids : anchor ? [anchor] : [];
    return base.filter((x) => items.some((i) => i.id === x));
  });
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => selectedIds.map((x) => items.find((i) => i.id === x)).filter((i): i is NonNullable<typeof i> => Boolean(i)),
    [selectedIds, items],
  );
  const typeNameOf = (typeId: string | null) => itemTypes.find((t) => t.id === typeId)?.name ?? null;

  const ranked = useMemo(
    () => suggestItems(items, selected, itemTypes).filter((s) => matchesQuery(s.item, typeNameOf(s.item.type_id), query)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, selected, itemTypes, query],
  );
  const searching = query.trim().length > 0;
  const recommended = !searching && selected.length > 0 ? ranked.filter((s) => s.reasons.length > 0 && s.score > 1).slice(0, 8) : [];
  const recIds = new Set(recommended.map((s) => s.item.id));
  const rest = ranked.filter((s) => !recIds.has(s.item.id));

  const toggle = (itemId: string) =>
    setSelectedIds((prev) => (prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId]));

  const save = async () => {
    if (selected.length < 2) return;
    setBusy(true);
    setError(null);
    const finalName = name.trim() || `לוק ${selected[0].name}`;
    try {
      if (editing) await updateLook(editing.id, { name: finalName, item_ids: selectedIds });
      else await addLook(finalName, selectedIds);
      navigate('/looks', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השמירה נכשלה – ודאו שהמיגרציה של הלוקים הורצה ב-Supabase');
      setBusy(false);
    }
  };

  const Row = ({ s }: { s: Suggestion }) => {
    const { item, reasons } = s;
    const child = children.find((c) => c.id === item.child_id);
    const url = item.images[0] ? imageUrls[item.images[0]] : null;
    const on = selectedIds.includes(item.id);
    return (
      <button
        type="button"
        onClick={() => toggle(item.id)}
        className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-start transition active:scale-[0.98] ${
          on ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/15' : 'border-transparent bg-card shadow-card'
        }`}
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-2xl">
          {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : '👕'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{item.name}</div>
          <div className="truncate text-xs text-gray-500">
            {[child ? `${child.emoji} ${child.name}` : null, typeNameOf(item.type_id), item.size_label ? `מידה ${item.size_label}` : null]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {reasons.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {reasons.slice(0, 3).map((r) => (
                <span key={r} className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[0.625rem] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
            on ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {on ? '✓' : '+'}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-dvh bg-cream pb-32">
      <header className="sticky top-0 z-30 glass-bar px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-2xl" aria-label="חזרה">→</button>
          <h1 className="text-xl font-extrabold text-ink">{editing ? 'עריכת לוק' : 'לוק חדש'} 👗</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם הלוק – למשל: שבת לנועה"
          className="input"
        />

        <section>
          <h2 className="mb-2 text-sm font-bold text-gray-600">
            בלוק ({selected.length}){selected.length < 2 && <span className="font-normal text-gray-400"> · בחרו לפחות שני פריטים</span>}
          </h2>
          {selected.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-400">
              בחרו פריטים מהרשימה למטה
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selected.map((item) => {
                const url = item.images[0] ? imageUrls[item.images[0]] : null;
                return (
                  <div key={item.id} className="relative w-20 shrink-0">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-2xl shadow-card">
                      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : '👕'}
                    </div>
                    <div className="mt-1 truncate text-center text-[0.6875rem] font-semibold text-gray-600">{item.name}</div>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-label={`הסרת ${item.name}`}
                      className="absolute -top-1.5 -end-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-cream"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש פריט לפי שם, סוג או חנות..."
            className="w-full rounded-2xl border border-gray-200 bg-card py-2.5 pe-4 ps-10 text-sm outline-none focus:border-amber-400"
          />
          <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {recommended.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-600">✨ מתאימים לפי מידה, עונה וילד</h2>
            <div className="space-y-2">{recommended.map((s) => <Row key={s.item.id} s={s} />)}</div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold text-gray-600">
            {searching ? `תוצאות (${rest.length})` : recommended.length > 0 ? 'שאר הפריטים' : 'כל הפריטים'}
          </h2>
          {rest.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">{searching ? 'לא נמצאו פריטים' : 'אין עוד פריטים להוספה'}</p>
          ) : (
            <div className="space-y-2">{rest.map((s) => <Row key={s.item.id} s={s} />)}</div>
          )}
        </section>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-cream via-cream to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => void save()}
            disabled={busy || selected.length < 2}
            className="w-full rounded-2xl bg-amber-500 py-4 text-lg font-bold text-white shadow-lg shadow-amber-500/30 transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? 'שומר...' : `שמירת לוק (${selected.length} פריטים)`}
          </button>
        </div>
      </div>
    </div>
  );
}
