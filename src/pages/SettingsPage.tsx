import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ConfirmDialog } from '../components/Modal';
import { SEASONS, STATUSES } from '../lib/constants';
import { getTheme, setTheme as persistTheme, type Theme } from '../lib/theme';

const THEME_OPTIONS: { value: Theme; label: string; emoji: string }[] = [
  { value: 'light', label: 'בהיר', emoji: '☀️' },
  { value: 'dark', label: 'כהה', emoji: '🌙' },
  { value: 'system', label: 'אוטומטי', emoji: '📱' },
];

export function SettingsPage() {
  const { session, signOut } = useAuth();
  const {
    items, children, categories, itemTypes,
    addCategory, renameCategory, deleteCategory,
    addItemType, renameItemType, deleteItemType,
    inviteCode, members, joinHousehold, leaveHousehold,
  } = useData();
  const [confirm, setConfirm] = useState<{ kind: 'category' | 'type'; id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [joinCode, setJoinCode] = useState('');
  const [joinMsg, setJoinMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const changeTheme = (t: Theme) => {
    setThemeState(t);
    persistTheme(t);
  };

  const doJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinBusy(true);
    setJoinMsg(null);
    try {
      const ok = await joinHousehold(joinCode.trim());
      setJoinMsg(
        ok
          ? { ok: true, text: 'הצטרפתם! עכשיו אתם רואים את אותו ארון 🎉' }
          : { ok: false, text: 'קוד לא מוכר – בדקו שהעתקתם נכון' },
      );
      if (ok) setJoinCode('');
    } catch {
      setJoinMsg({ ok: false, text: 'משהו השתבש, נסו שוב' });
    } finally {
      setJoinBusy(false);
    }
  };

  const shareInvite = () => {
    if (!inviteCode) return;
    const text = `היי! מצטרפים לארון המשפחה שלנו 👕\nבאפליקציה: הגדרות ← ארון משותף ← מזינים את הקוד: ${inviteCode}`;
    if (navigator.share) void navigator.share({ text }).catch(() => {});
    else void navigator.clipboard.writeText(text);
  };

  const exportCsv = () => {
    const header = ['שם', 'תיאור', 'ילד/ה', 'מידה', 'עונה', 'קטגוריה', 'סוג', 'חנות/יצרן', 'מיקום', 'מחיר', 'שנה', 'כמות', 'סטטוס', 'מצב'];
    const lines = items.map((i) => {
      const child = children.find((c) => c.id === i.child_id)?.name ?? 'כללי';
      const cat = categories.find((c) => c.id === i.category_id)?.name ?? '';
      const type = itemTypes.find((t) => t.id === i.type_id)?.name ?? '';
      return [
        i.name, i.description ?? '', child, i.size_label ?? '', SEASONS[i.season].label,
        cat, type, i.store ?? '', i.location ?? '', i.price ?? '', i.year ?? '', i.quantity, STATUSES[i.status].label,
        i.condition ?? '',
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
        <section className="rounded-2xl bg-card p-4 shadow-card">
          <h2 className="mb-1 text-sm font-bold text-gray-600">מראה</h2>
          <p className="mb-3 text-xs text-gray-400">בהיר, כהה, או לפי הגדרת המכשיר</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => changeTheme(opt.value)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 text-xs font-semibold transition active:scale-95 ${
                  theme === opt.value
                    ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                    : 'border-gray-100 bg-card text-gray-500'
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <h2 className="mb-1 text-sm font-bold text-gray-600">ארון משותף 👨‍👩‍👧‍👦</h2>
          <p className="mb-3 text-xs text-gray-400">
            שני הורים, ארון אחד: שתפו את הקוד, ובן/בת הזוג מזינים אותו כאן מהחשבון שלהם
          </p>

          {members.length > 1 && (
            <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              מחוברים לארון הזה:
              <ul className="mt-1 space-y-0.5">
                {members.map((m) => (
                  <li key={m.id} dir="ltr" className="text-end font-medium">
                    {m.email ?? 'משתמש'} {m.id === session?.user.id && '(אני)'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {inviteCode && (
            <div className="mb-3 flex items-center gap-2">
              <div className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-ink" dir="ltr">
                {inviteCode}
              </div>
              <button
                onClick={shareInvite}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white active:scale-95"
              >
                📤 שיתוף
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="קוד שקיבלתם מבן/בת הזוג"
              dir="ltr"
              className="input flex-1 text-center font-mono"
            />
            <button
              onClick={() => void doJoin()}
              disabled={joinBusy || !joinCode.trim()}
              className="rounded-2xl bg-gray-100 px-4 font-bold text-ink active:scale-95 disabled:opacity-40"
            >
              {joinBusy ? '...' : 'הצטרפות'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            שימו לב: הצטרפות לארון של מישהו אחר מסתירה את הנתונים שהזנתם בחשבון הנוכחי
          </p>
          {joinMsg && (
            <p className={`mt-2 rounded-xl px-3 py-2 text-sm ${joinMsg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>
              {joinMsg.text}
            </p>
          )}
          {members.length > 1 && (
            <button
              onClick={() => setConfirmLeave(true)}
              className="mt-2 text-xs font-semibold text-rose-500 dark:text-rose-400"
            >
              עזיבת הארון המשותף
            </button>
          )}
        </section>

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

        <section className="rounded-2xl bg-card p-4 shadow-card">
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

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <h2 className="mb-1 text-sm font-bold text-gray-600">החשבון שלי</h2>
          <p className="mb-3 text-sm text-gray-500" dir="ltr">{session?.user.email}</p>
          <button
            onClick={() => void signOut()}
            className="w-full rounded-2xl bg-rose-50 dark:bg-rose-500/15 py-3 font-semibold text-rose-600 dark:text-rose-300 active:scale-[0.98]"
          >
            התנתקות
          </button>
        </section>

        <p className="pb-2 text-center text-xs text-gray-300">ארון המשפחה · הבגדים של כולם, במקום אחד 👕</p>
      </main>

      <ConfirmDialog
        open={confirmLeave}
        title="עזיבת הארון המשותף"
        message="תחזרו לארון ריק משלכם. הנתונים המשותפים יישארו אצל בן/בת הזוג. להמשיך?"
        confirmLabel="עזיבה"
        onConfirm={() => {
          setConfirmLeave(false);
          void leaveHousehold();
        }}
        onCancel={() => setConfirmLeave(false)}
      />

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
    <section className="rounded-2xl bg-card p-4 shadow-card">
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
