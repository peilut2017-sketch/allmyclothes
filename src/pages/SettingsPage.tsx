import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ConfirmDialog } from '../components/Modal';
import { SEASONS, STATUSES } from '../lib/constants';

export function SettingsPage() {
  const { session, signOut } = useAuth();
  const {
    items, children, categories, itemTypes,
    addCategory, renameCategory, deleteCategory,
    addItemType, renameItemType, deleteItemType,
  } = useData();
  const [confirm, setConfirm] = useState<{ kind: 'category' | 'type'; id: string; name: string } | null>(null);
  const navigate = useNavigate();

  const exportCsv = () => {
    const header = ['שם', 'תיאור', 'ילד/ה', 'מידה', 'עונה', 'קטגוריה', 'סוג', 'חנות/יצרן', 'מיקום', 'מחיר', 'שנה', 'כמות', 'סטטוס'];
    const lines = items.map((i) => {
      const child = children.find((c) => c.id === i.child_id)?.name ?? 'כללי';
      const cat = categories.find((c) => c.id === i.category_id)?.name ?? '';
      const type = itemTypes.find((t) => t.id === i.type_id)?.name ?? '';
      return [
        i.name, i.description ?? '', child, i.size_label ?? '', SEASONS[i.season].label,
        cat, type, i.store ?? '', i.location ?? '', i.price ?? '', i.year ?? '', i.quantity, STATUSES[i.status].label,
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(',');
    });
    const csv = '﻿' + [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family-closet.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-dvh bg-cream pb-28">
      <header className="sticky top-0 z-30 bg-cream/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-2xl" aria-label="חזרה">→</button>
          <h1 className="text-2xl font-extrabold text-ink">הגדרות ⚙️</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 pt-1">
        <NameListCard
          title="קטגוריות"
          hint="שבת, חול, פיג'מות... איך שנוח לכם לחלק את הארון"
          entries={categories}
          onAdd={(name) => void addCategory(name).catch(() => {})}
          onRename={(id, name) => void renameCategory(id, name)}
          onDelete={(id, name) => setConfirm({ kind: 'category', id, name })}
        />

        <NameListCard
          title="סוגי פריטים"
          hint="מכנסיים, אוברול, שמלה... סוגי הבגדים עצמם"
          entries={itemTypes}
          onAdd={(name) => void addItemType(name).catch(() => {})}
          onRename={(id, name) => void renameItemType(id, name)}
          onDelete={(id, name) => setConfirm({ kind: 'type', id, name })}
        />

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-1 text-sm font-bold text-gray-600">גיבוי</h2>
          <p className="mb-3 text-xs text-gray-400">הורדת כל הפריטים כקובץ אקסל (CSV)</p>
          <button
            onClick={exportCsv}
            disabled={items.length === 0}
            className="w-full rounded-2xl bg-gray-100 py-3 font-semibold text-ink active:scale-[0.98] disabled:opacity-50"
          >
            📥 ייצוא הארון לקובץ
          </button>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-1 text-sm font-bold text-gray-600">החשבון שלי</h2>
          <p className="mb-3 text-sm text-gray-500" dir="ltr">{session?.user.email}</p>
          <button
            onClick={() => void signOut()}
            className="w-full rounded-2xl bg-rose-50 py-3 font-semibold text-rose-600 active:scale-[0.98]"
          >
            התנתקות
          </button>
        </section>

        <p className="pb-2 text-center text-xs text-gray-300">ארון המשפחה · הבגדים של כולם, במקום אחד 👕</p>
      </main>

      <ConfirmDialog
        open={confirm !== null}
        title={`מחיקת ״${confirm?.name ?? ''}״`}
        message="פריטים שמשויכים אליה לא יימחקו – השיוך פשוט יוסר. להמשיך?"
        onConfirm={() => {
          if (confirm) {
            if (confirm.kind === 'category') void deleteCategory(confirm.id);
            else void deleteItemType(confirm.id);
          }
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function NameListCard({ title, hint, entries, onAdd, onRename, onDelete }: {
  title: string;
  hint: string;
  entries: { id: string; name: string }[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [newName, setNewName] = useState('');

  const submit = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName('');
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-1 text-sm font-bold text-gray-600">{title}</h2>
      <p className="mb-3 text-xs text-gray-400">{hint}</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {entries.map((entry) => (
          <span key={entry.id} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pe-1.5 ps-3 text-sm font-medium text-ink">
            <button
              onClick={() => {
                const name = window.prompt('שם חדש:', entry.name);
                if (name?.trim() && name.trim() !== entry.name) onRename(entry.id, name.trim());
              }}
            >
              {entry.name}
            </button>
            <button
              onClick={() => onDelete(entry.id, entry.name)}
              aria-label={`מחיקת ${entry.name}`}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500"
            >
              ✕
            </button>
          </span>
        ))}
        {entries.length === 0 && <span className="text-sm text-gray-400">הרשימה ריקה</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="הוספה חדשה..."
          className="input flex-1"
        />
        <button
          onClick={submit}
          disabled={!newName.trim()}
          className="rounded-2xl bg-amber-500 px-4 font-bold text-white active:scale-95 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </section>
  );
}
