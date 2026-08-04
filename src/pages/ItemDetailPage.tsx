import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { SeasonBadge, StatusBadge } from '../components/Badges';
import { ConfirmDialog, Modal } from '../components/Modal';
import { STATUSES, STATUS_ORDER } from '../lib/constants';
import { formatDate, formatPrice } from '../lib/format';

export function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, children, categories, itemTypes, imageUrls, updateItem, deleteItem } = useData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const item = items.find((i) => i.id === id);
  if (!item) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-cream text-gray-500">
        הפריט לא נמצא
        <button onClick={() => navigate('/')} className="mt-3 font-semibold text-amber-600">חזרה לארון</button>
      </div>
    );
  }

  const child = children.find((c) => c.id === item.child_id);
  const category = categories.find((c) => c.id === item.category_id);
  const type = itemTypes.find((t) => t.id === item.type_id);
  const galleryUrls = item.images.map((p) => imageUrls[p]).filter((u): u is string => Boolean(u));

  const details: [string, string][] = [
    ['שיוך', child ? `${child.emoji} ${child.name}` : '🏠 כללי'],
    ['מידה / גיל', item.size_label ?? '—'],
    ['📍 מיקום אחסון', item.location ?? '—'],
    ['קטגוריה', category?.name ?? '—'],
    ['סוג פריט', type?.name ?? '—'],
    ['חנות / יצרן', item.store ?? '—'],
    ['מחיר', item.price != null ? formatPrice(item.price) : '—'],
    ['כמות', String(item.quantity)],
    ['שנה', item.year != null ? String(item.year) : '—'],
    ['נוסף בתאריך', formatDate(item.created_at)],
  ];

  return (
    <div className="min-h-dvh bg-cream pb-28">
      <div className="relative">
        {galleryUrls.length > 1 ? (
          <Gallery urls={galleryUrls} alt={item.name} index={galleryIndex} onIndexChange={setGalleryIndex} />
        ) : galleryUrls.length === 1 ? (
          <img src={galleryUrls[0]} alt={item.name} className="aspect-square w-full object-cover sm:mx-auto sm:max-w-lg sm:rounded-b-3xl" />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-amber-50 dark:bg-amber-500/15 text-8xl sm:mx-auto sm:max-w-lg">👕</div>
        )}
        <button
          onClick={() => navigate(-1)}
          aria-label="חזרה"
          className="absolute top-[max(1rem,env(safe-area-inset-top))] start-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-xl shadow"
        >
          →
        </button>
        <button
          onClick={() => navigate(`/edit/${item.id}`)}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] end-4 rounded-full bg-card/90 px-4 py-2 text-sm font-bold shadow"
        >
          ✏️ עריכה
        </button>
      </div>

      <main className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <SeasonBadge season={item.season} />
          <button onClick={() => setStatusOpen(true)}>
            <StatusBadge status={item.status} />
          </button>
        </div>
        <h1 className="text-2xl font-extrabold text-ink">{item.name}</h1>
        {item.description && <p className="mt-1 text-gray-600">{item.description}</p>}

        <dl className="mt-4 divide-y divide-gray-100 rounded-2xl bg-card px-4 shadow-card">
          {details.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-3 text-sm">
              <dt className="text-gray-500">{label}</dt>
              <dd className="font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {item.status === 'to_buy' && (
          <button
            onClick={() => {
              void updateItem(item.id, { status: 'active' });
            }}
            className="mt-5 w-full rounded-2xl bg-emerald-500 py-3.5 font-bold text-white shadow-md shadow-emerald-500/30 active:scale-[0.98]"
          >
            ✓ קניתי! העברה לארון
          </button>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <ActionButton emoji="🔁" label="שינוי סטטוס" onClick={() => setStatusOpen(true)} />
          <ActionButton emoji="🎁" label="העברה לילד אחר" onClick={() => setTransferOpen(true)} />
          <ActionButton
            emoji="📄"
            label="שכפול (מידה נוספת)"
            onClick={() => navigate('/add', { state: { duplicateOf: item.id } })}
          />
          <ActionButton emoji="🗑️" label="מחיקה" danger onClick={() => setConfirmDelete(true)} />
        </div>
      </main>

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="לאן עבר הפריט?">
        <div className="space-y-2">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => {
                void updateItem(item.id, { status: s });
                setStatusOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 font-semibold transition active:scale-[0.98] ${
                item.status === s ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200' : 'border-gray-100 bg-card text-gray-600'
              }`}
            >
              <span className="text-xl">{STATUSES[s].emoji}</span>
              {STATUSES[s].label}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="למי להעביר את הפריט?">
        <p className="mb-3 text-sm text-gray-500">
          מושלם לבגדים שעוברים בין אחים 🎁 הפריט יסומן ״בארון״ אצל היעד החדש.
        </p>
        <div className="space-y-2">
          {children
            .filter((c) => c.id !== item.child_id)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  void updateItem(item.id, { child_id: c.id, status: 'active' });
                  setTransferOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-100 bg-card px-4 py-3.5 font-semibold text-gray-700 transition active:scale-[0.98]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg" style={{ backgroundColor: `${c.color}22` }}>
                  {c.emoji}
                </span>
                {c.name}
              </button>
            ))}
          {item.child_id !== null && (
            <button
              onClick={() => {
                void updateItem(item.id, { child_id: null });
                setTransferOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-100 bg-card px-4 py-3.5 font-semibold text-gray-700 transition active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg">🏠</span>
              ללא שיוך (כללי)
            </button>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="מחיקת הפריט"
        message={`למחוק את ״${item.name}״ מהארון? אי אפשר לשחזר.`}
        onConfirm={() => {
          void deleteItem(item.id).then(() => navigate('/', { replace: true }));
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function Gallery({ urls, alt, index, onIndexChange }: {
  urls: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
}) {
  return (
    <div className="sm:mx-auto sm:max-w-lg">
      <div
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
          if (i !== index && i >= 0 && i < urls.length) onIndexChange(i);
        }}
      >
        {urls.map((url) => (
          <img
            key={url}
            src={url}
            alt={alt}
            className="aspect-square w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      <div className="pointer-events-none relative -mt-7 flex justify-center gap-1.5 pb-3">
        {urls.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-5 bg-white shadow' : 'w-2 bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ActionButton({ emoji, label, danger, onClick }: {
  emoji: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl bg-card py-3.5 text-sm font-bold shadow-card transition active:scale-[0.98] ${
        danger ? 'text-rose-600 dark:text-rose-300' : 'text-ink'
      }`}
    >
      <span className="text-lg">{emoji}</span>
      {label}
    </button>
  );
}
