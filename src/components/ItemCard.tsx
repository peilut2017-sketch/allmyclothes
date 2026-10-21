import { Link, useNavigate } from 'react-router-dom';
import { SEASONS } from '../lib/constants';
import { useData } from '../context/DataContext';
import { outgrowStatus } from '../lib/sizes';
import { FitDots } from './FitDots';
import { isTransitionItem, markTransitionItem, withViewTransition } from '../lib/motion';
import type { Item } from '../lib/types';

export function ItemCard({ item }: { item: Item }) {
  const navigate = useNavigate();
  const { children, itemTypes, imageUrls } = useData();
  const child = children.find((c) => c.id === item.child_id);
  const type = itemTypes.find((t) => t.id === item.type_id);
  const imageUrl = item.images[0] ? imageUrls[item.images[0]] : null;
  const season = SEASONS[item.season];
  const faded = item.status === 'outgrown' || item.status === 'given';
  const outgrow = outgrowStatus(item, child);

  return (
    <Link
      to={`/item/${item.id}`}
      onClick={(e) => {
        // פתיחה "מתוך" הכרטיס: מעבר תצוגה משותף לתמונה (בדפדפנים שתומכים), אחרת ניווט רגיל
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        markTransitionItem(item.id);
        withViewTransition(() => navigate(`/item/${item.id}`));
      }}
      className={`block overflow-hidden rounded-2xl bg-card shadow-card transition active:scale-[0.98] ${faded ? 'opacity-60' : ''}`}
    >
      <div
        className="relative aspect-square bg-gray-50"
        style={isTransitionItem(item.id) ? { viewTransitionName: 'item-image' } : undefined}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-gray-200">
            👕
          </div>
        )}
        <span
          className="absolute top-2 start-2 flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-sm shadow-sm"
          title={season.label}
        >
          {season.emoji}
        </span>
        <div className="absolute top-2 end-2 flex flex-col items-end gap-1">
          {item.quantity > 1 && (
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
              ×{item.quantity}
            </span>
          )}
          {item.status === 'to_buy' && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">🛒 לקנות</span>
          )}
          {outgrow && (
            <span
              className="rounded-full bg-rose-500/90 px-2 py-0.5 text-xs font-bold text-white"
              title={outgrow === 'past' ? 'כנראה כבר קטן' : 'בקרוב קטן'}
            >
              ⏰
            </span>
          )}
        </div>
        {child && (
          <div
            className="absolute bottom-0 inset-x-0 h-1.5"
            style={{ backgroundColor: child.color }}
          />
        )}
      </div>
      <div className="p-2.5">
        <div className="truncate text-sm font-semibold text-ink">{item.name}</div>
        <div className="mt-0.5 flex items-center justify-between gap-1 text-xs text-gray-500">
          <span className="truncate">
            {child ? `${child.emoji} ${child.name}` : type ? type.name : 'כללי'}
          </span>
          {item.size_label && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
              {item.size_label}
              <FitDots value={item.size_fit} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
