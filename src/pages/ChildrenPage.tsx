import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ConfirmDialog, Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { CHILD_COLORS, CHILD_EMOJIS, SEASONS } from '../lib/constants';
import { childAge } from '../lib/format';
import type { Child } from '../lib/types';

interface ChildForm {
  name: string;
  birth_date: string;
  color: string;
  emoji: string;
}

const emptyForm: ChildForm = { name: '', birth_date: '', color: CHILD_COLORS[0], emoji: CHILD_EMOJIS[1] };

export function ChildrenPage() {
  const { children, items, addChild, updateChild, deleteChild } = useData();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Child | null>(null);
  const [form, setForm] = useState<ChildForm>(emptyForm);
  const [deleting, setDeleting] = useState<Child | null>(null);
  const [busy, setBusy] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, color: CHILD_COLORS[children.length % CHILD_COLORS.length] });
    setModalOpen(true);
  };

  const openEdit = (child: Child) => {
    setEditing(child);
    setForm({
      name: child.name,
      birth_date: child.birth_date ?? '',
      color: child.color,
      emoji: child.emoji,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        birth_date: form.birth_date || null,
        color: form.color,
        emoji: form.emoji,
      };
      if (editing) await updateChild(editing.id, payload);
      else await addChild(payload);
      setModalOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-cream pb-28">
      <header className="sticky top-0 z-30 bg-cream/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink">הילדים שלנו 🧒</h1>
          <button
            onClick={openAdd}
            className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-amber-500/30 active:scale-95"
          >
            + הוספה
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-4 pt-2">
        {children.length === 0 && (
          <EmptyState
            emoji="👶"
            title="עוד לא הוספתם ילדים"
            subtitle="הוסיפו את הילדים כדי לשייך אליהם בגדים ולראות מה יש לכל אחד"
            action={{ label: '+ הוספת ילד/ה', onClick: openAdd }}
          />
        )}

        {children.map((child) => {
          const childItems = items.filter((i) => i.child_id === child.id);
          const activeCount = childItems.filter((i) => i.status === 'active').reduce((s, i) => s + i.quantity, 0);
          const waitingCount = childItems.filter((i) => i.status === 'waiting').reduce((s, i) => s + i.quantity, 0);
          const age = childAge(child.birth_date);
          const seasonCounts = (['winter', 'summer'] as const).map((s) => ({
            season: s,
            count: childItems.filter((i) => i.status === 'active' && i.season === s).reduce((sum, i) => sum + i.quantity, 0),
          }));

          return (
            <div key={child.id} className="overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="h-1.5" style={{ backgroundColor: child.color }} />
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                    style={{ backgroundColor: `${child.color}22` }}
                  >
                    {child.emoji}
                  </span>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-ink">{child.name}</div>
                    {age && <div className="text-sm text-gray-500">גיל: {age}</div>}
                  </div>
                  <button
                    onClick={() => openEdit(child)}
                    className="rounded-xl bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-500 active:scale-95"
                  >
                    עריכה
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    ✅ {activeCount} בארון
                  </span>
                  {waitingCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                      📦 {waitingCount} שמורים לגדילה
                    </span>
                  )}
                  {seasonCounts.map(({ season, count }) => (
                    <span key={season} className={`rounded-full px-2.5 py-1 ${SEASONS[season].chip}`}>
                      {SEASONS[season].emoji} {count} ל{SEASONS[season].label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `עריכת ${editing.name}` : 'הוספת ילד/ה'}
      >
        <div className="space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="שם"
            className="input"
            autoFocus
          />
          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-600">תאריך לידה (לחישוב גיל)</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-600">צבע מזהה</label>
            <div className="flex flex-wrap gap-2">
              {CHILD_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  aria-label={`צבע ${c}`}
                  className={`h-9 w-9 rounded-full transition active:scale-90 ${form.color === c ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-600">אייקון</label>
            <div className="flex flex-wrap gap-2">
              {CHILD_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition active:scale-90 ${
                    form.emoji === e ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-gray-50'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => void save()}
            disabled={busy || !form.name.trim()}
            className="w-full rounded-2xl bg-amber-500 py-3.5 font-bold text-white shadow-md shadow-amber-500/30 active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? 'שומר...' : 'שמירה'}
          </button>

          {editing && (
            <button
              onClick={() => {
                setModalOpen(false);
                setDeleting(editing);
              }}
              className="w-full py-1 text-sm font-semibold text-rose-500"
            >
              מחיקת {editing.name} מהרשימה
            </button>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={`מחיקת ${deleting?.name ?? ''}`}
        message="הבגדים המשויכים לא יימחקו – הם יהפכו ל״כללי״. להמשיך?"
        onConfirm={() => {
          if (deleting) void deleteChild(deleting.id);
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />

      {children.length > 0 && (
        <div className="mx-auto max-w-lg px-4 pt-4 text-center">
          <button onClick={() => navigate('/add')} className="text-sm font-semibold text-amber-600">
            + הוספת בגד חדש לארון
          </button>
        </div>
      )}
    </div>
  );
}
