import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/PageHeader';
import { useData } from '../context/DataContext';
import { ConfirmDialog } from '../components/Modal';
import { LookViewer } from '../components/LookViewer';
import { EmptyState } from '../components/EmptyState';
import { LookCollage } from '../components/LookCollage';
import type { Item, Look } from '../lib/types';

export function LooksPage() {
  const { looks, items, children, deleteLook } = useData();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const openParam = params.get('open');
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

  // ‎/looks?open=<id> (מעמוד הפריט) פותח את הלוק ישר במסך מלא
  useEffect(() => {
    if (!openParam) return;
    const i = resolved.findIndex((r) => r.look.id === openParam);
    if (i >= 0) setViewIndex(i);
    setParams({}, { replace: true });
  }, [openParam, resolved, setParams]);

  const childrenOf = (list: Item[]) => {
    const ids = [...new Set(list.map((i) => i.child_id).filter(Boolean))];
    return ids.map((id) => children.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  };

  return (
    <div className="min-h-dvh bg-cream pb-28">
      <PageHeader
        title="הלוקים שלנו"
        subtitle="במה להלביש היום"
        right={
          <button
            onClick={() => navigate('/looks/new')}
            className="h-10 rounded-full bg-amber-500 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgb(var(--c-accent)/0.35)] transition-transform duration-150 ease-out active:scale-95"
          >
            + לוק חדש
          </button>
        }
      />

      <main className="mx-auto max-w-lg px-4 pt-4">
        {error && <p className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>}
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
                onClick={() => setViewIndex(resolved.findIndex((r) => r.look.id === look.id))}
                style={{ ['--i' as string]: resolved.findIndex((r) => r.look.id === look.id) }}
                className="rise overflow-hidden rounded-card bg-card text-start shadow-card transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                <LookCollage items={list} />
                <div className="p-3">
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

      <AnimatePresence>
        {viewIndex !== null && resolved[viewIndex] && (
          <LookViewer
            looks={resolved}
            index={viewIndex}
            onIndexChange={setViewIndex}
            onClose={() => setViewIndex(null)}
            onOpenItem={(id) => navigate(`/item/${id}`)}
            onEdit={(look) => navigate(`/looks/${look.id}/edit`)}
            onDelete={setDeleting}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleting}
        title="למחוק את הלוק?"
        message="הלוק יימחק, הפריטים עצמם יישארו בארון."
        onConfirm={() => {
          if (!deleting) return;
          const removed = deleting;
          deleteLook(removed.id).catch(() => setError('המחיקה נכשלה'));
          setDeleting(null);
          // אחרי מחיקה: ממשיכים ללוק הקודם, או סוגרים אם זה היה האחרון
          setViewIndex((i) => (resolved.length <= 1 || i === null ? null : Math.min(i, resolved.length - 2)));
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
