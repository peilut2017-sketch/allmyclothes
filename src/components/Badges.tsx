import { SEASONS, STATUSES } from '../lib/constants';
import type { ItemStatus, Season } from '../lib/types';

export function SeasonBadge({ season }: { season: Season }) {
  const s = SEASONS[season];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.chip}`}>
      {s.emoji} {s.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  const s = STATUSES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.chip}`}>
      {s.emoji} {s.label}
    </span>
  );
}
