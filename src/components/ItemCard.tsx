import { Link, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import { useData } from '../context/DataContext';
import { outgrowStatus } from '../lib/sizes';
import { setMorphSource } from '../lib/morph';
import { FitDots } from './FitDots';
import { ClockIcon } from './Icons';
import type { Item } from '../lib/types';

/** פותח עמוד פריט כשכבה מעל הרשימה, ושומר את מיקום התמונה לצורך אנימציית הפתיחה */
export function useOpenItem(item: Item) {
  const location = useLocation();
  const imgRef = useRef<HTMLDivElement>(null);
  const onClick = () => {
    const r = imgRef.current?.getBoundingClientRect();
    if (r) setMorphSource({ id: item.id, x: r.left, y: r.top, w: r.width, h: r.height });
  };
  return { imgRef, onClick, to: `/item/${item.id}`, state: { backgroundLocation: location } };
}

export function ItemCard({ item, index = 0 }: { item: Item; index?: number }) {
  const { children, imageUrls } = useData();
  const open = useOpenItem(item);
  const child = children.find((c) => c.id === item.child_id);
  const imageUrl = item.images[0] ? imageUrls[item.images[0]] : null;
  const faded = item.status === 'outgrown' || item.status === 'given';
  const outgrow = outgrowStatus(item, child);

  return (
    <Link
      to={open.to}
      state={open.state}
      onClick={open.onClick}
      style={{ ['--i' as string]: index }}
      className={`rise group block rounded-card transition-transform duration-150 ease-out active:scale-[0.97] ${faded ? 'opacity-60' : ''}`}
    >
      <div ref={open.imgRef} className="relative aspect-square overflow-hidden rounded-card bg-gray-100 shadow-card">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-gray-300">👕</div>
        )}
        {item.quantity > 1 && (
          <span className="absolute end-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
            ×{item.quantity}
          </span>
        )}
        {item.status === 'to_buy' && (
          <span className="absolute start-2.5 top-2.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">לקנות</span>
        )}
        {outgrow && (
          <span
            className="absolute bottom-2.5 start-2.5 inline-flex items-center gap-1 rounded-full bg-[rgb(var(--c-warn))] py-0.5 pe-2.5 ps-2 text-[0.6875rem] font-bold text-white"
            title={outgrow === 'past' ? 'כנראה כבר קטן' : 'בקרוב קטן'}
          >
            <ClockIcon size={12} />
            {outgrow === 'past' ? 'קטן' : 'בקרוב קטן'}
          </span>
        )}
      </div>
      <div className="px-1 pt-2">
        <div className="truncate text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">{item.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[0.8125rem] text-gray-500">
          {child ? (
            <>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: child.color }} />
              <span className="truncate">{child.name}</span>
            </>
          ) : (
            <span>כללי</span>
          )}
          {item.size_label && (
            <span className="ms-auto inline-flex shrink-0 items-center gap-1.5 rounded-[7px] bg-gray-100 px-[7px] py-px text-xs font-bold tabular-nums text-ink">
              {item.size_label}
              <FitDots value={item.size_fit} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
