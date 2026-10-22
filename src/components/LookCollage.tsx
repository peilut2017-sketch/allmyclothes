import { useData } from '../context/DataContext';
import type { Item } from '../lib/types';

/** קולאז' של עד 4 פריטים בלוק; הפריסה מתאימה למספר הפריטים בלי תאים ריקים */
export function LookCollage({ items, className = '' }: { items: Item[]; className?: string }) {
  const { imageUrls } = useData();
  const shown = items.slice(0, 4);
  const n = shown.length;
  const cols = n <= 1 ? '1fr' : '1fr 1fr';
  const rows = n <= 2 ? '1fr' : '1fr 1fr';
  return (
    <div
      className={`grid aspect-square gap-0.5 overflow-hidden bg-gray-100 ${className}`}
      style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}
    >
      {shown.map((item, i) => {
        const url = item.images[0] ? imageUrls[item.images[0]] : null;
        return (
          <div
            key={item.id}
            className="flex min-h-0 items-center justify-center overflow-hidden bg-gray-50 text-3xl text-gray-300"
            style={n === 3 && i === 0 ? { gridRow: '1 / span 2' } : undefined}
          >
            {url ? <img src={url} alt={item.name} loading="lazy" className="h-full w-full object-cover" /> : '👕'}
          </div>
        );
      })}
    </div>
  );
}
