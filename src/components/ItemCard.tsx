import { Link } from 'react-router-dom';
import { SEASONS } from '../lib/constants';
import { useData } from '../context/DataContext';
import type { Item } from '../lib/types';

export function ItemCard({ item }: { item: Item }) {
  const { children, itemTypes, imageUrls } = useData();
  const child = children.find((c) => c.id === item.child_id);
  const type = itemTypes.find((t) => t.id === item.type_id);
  const imageUrl = item.image_path ? imageUrls[item.image_path] : null;
  const season = SEASONS[item.season];
  const faded = item.status === 'outgrown' || item.status === 'given';

  return (
    <Link
      to={`/item/${item.id}`}
      className={`block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.98] ${faded ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-square bg-gray-50">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-gray-200">
            👕
          </div>
        )}
        <span
          className="absolute top-2 start-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm"
          title={season.label}
        >
          {season.emoji}
        </span>
        {item.quantity > 1 && (
          <span className="absolute top-2 end-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-bold text-white">
            ×{item.quantity}
          </span>
        )}
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
            <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
              {item.size_label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
