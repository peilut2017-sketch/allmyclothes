import { useData } from '../context/DataContext';
import type { Item } from '../lib/types';

/** קולאז' של עד 4 פריטים בלוק */
export function LookCollage({ items, className = '' }: { items: Item[]; className?: string }) {
  const { imageUrls } = useData();
  const shown = items.slice(0, 4);
  return (
    <div className={`grid aspect-square grid-cols-2 gap-0.5 overflow-hidden bg-gray-100 ${className}`}>
      {Array.from({ length: shown.length <= 1 ? 1 : 4 }, (_, i) => {
        const item = shown[i];
        const url = item?.images[0] ? imageUrls[item.images[0]] : null;
        return (
          <div
            key={i}
            className={`flex items-center justify-center bg-gray-50 text-3xl text-gray-300 ${shown.length <= 1 ? 'col-span-2 row-span-2' : ''}`}
          >
            {url ? <img src={url} alt={item?.name} loading="lazy" className="h-full w-full object-cover" /> : item ? '👕' : ''}
          </div>
        );
      })}
    </div>
  );
}
