import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ConfirmDialog, Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { LookCollage } from '../components/LookCollage';
import type { Item, Look } from '../lib/types';

export function LooksPage() {
  const { looks, items, children, imageUrls, deleteLook } = useData();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(params.get('open'));
  const [deleting, setDeleting] = useState<Look | null>(null);
  const [error, setError] = useState<string | null>(null);

  // פריטים שנמחקו מהארון פשוט לא מוצגים בלוק
  const resolved = useMemo(
    () =>
      looks.map((look) => ({
        look,
        list: look.item_ids.map((id) => items.find((i) => i.id === id)).filter((i): i is Item => Boolean(i)),
      })),
    [looks, items],
  );

  useEffect(() => {
    if (params.get('open')) setParams({}, { replace: true });
  }, [params, setParams]);

  const opened = resolved.find((r) => r.look.id === openId);

  const childrenOf = (list: Item[]) => {
    const ids = [...new Set(list.map((i) => i.child_id).filter(Boolean))];
    return ids.map((id) => children.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  };

  return (
    <div className="min-h-dvh bg-cream pb-28">
      <header className="sticky top-0 z-30 glass-bar px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink">הלוקים שלנו 👗</h1>
          <button
            onClick={() => navigate('/looks/new')}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-amber-500/30 active:scale-95"
          >
            + לוק חדש
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4">
        {resolved.length === 0 ? (
          <EmptyState
            emoji="👗"
            title="עוד אין לוקים"
            subtitle="שלבו חולצה, מכנס ואביזרים שמתאימים זה לזה – ותמיד תדעו במה להלביש"
            action={{ label: 'בניית לוק ראשון', onClick: () => navigate('/looks/new') }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {resolved.map(({ look, list }) => (
              <button
                key={look.id}
                onClick={() => setOpenId(look.id)}
                className="overflow-hidden rounded-2xl bg-card text-start shadow-card transition active:scale-[0.98]"
              >
                <LookCollage items={list} />
                <div className="p-2.5">
                  <div className="truncate text-sm font-bold text-ink">{look.name || 'לוק'}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                    {childrenOf(list).map((c) => (
                      <span key={c.id}>{c.emoji}</span>
                    ))}
                    <span>{list.length} פריטים</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <Modal open={!!opened} onClose={() => setOpenId(null)} title={opened?.look.name || 'לוק'}>
        {opened && (
          <>
            <div className="space-y-2">
              {opened.list.map((item) => {
                const url = item.images[0] ? imageUrls[item.images[0]] : null;
                return (
                  <Link
                    key={item.id}
                    to={`/item/${item.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-gray-50 p-2.5 active:scale-[0.98]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card text-xl">
                      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : '👕'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.size_label ? `מידה ${item.size_label}` : ' '}</div>
                    </div>
                    <span className="text-gray-300">‹</span>
                  </Link>
                );
              })}
            </div>
            {opened.list.length < opened.look.item_ids.length && (
              <p className="mt-2 text-xs text-gray-400">חלק מהפריטים נמחקו מהארון ולכן לא מוצגים.</p>
            )}
            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate(`/looks/${opened.look.id}/edit`)}
                className="flex-1 rounded-2xl bg-amber-500 py-3 font-semibold text-white active:scale-[0.98]"
              >
                ✏️ עריכה
              </button>
              <button
                onClick={() => { setDeleting(opened.look); setOpenId(null); }}
                className="flex-1 rounded-2xl bg-gray-100 py-3 font-semibold text-rose-600 active:scale-[0.98]"
              >
                🗑️ מחיקה
              </button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="למחוק את הלוק?"
        message="הלוק יימחק, הפריטים עצמם יישארו בארון."
        onConfirm={() => {
          if (!deleting) return;
          deleteLook(deleting.id).catch(() => setError('המחיקה נכשלה'));
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
