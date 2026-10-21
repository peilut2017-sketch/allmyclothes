import type { Item, ItemType, Look } from './types';
import { effectiveMaxAge } from './sizes';

export interface Suggestion {
  item: Item;
  score: number;
  reasons: string[];
}

const SEASON_SCORE = (a: Item['season'], b: Item['season']): number => {
  if (a === b) return 2;
  if (a === 'all' || b === 'all') return 1;
  if (a === 'mid' || b === 'mid') return 1;
  return -2; // חורף מול קיץ
};

/**
 * דירוג פריטים שמתאימים לפריטים שכבר נבחרו ללוק:
 * אותו ילד, עונה תואמת, מידה קרובה, ופריט מסוג אחר (חולצה + מכנס ולא שתי חולצות).
 * ללא פריטים נבחרים – מחזיר את כל הפריטים בסדר המקורי.
 */
export function suggestItems(
  candidates: Item[],
  selected: Item[],
  itemTypes: ItemType[],
): Suggestion[] {
  const typeName = (id: string | null) => itemTypes.find((t) => t.id === id)?.name ?? null;
  const selectedIds = new Set(selected.map((s) => s.id));
  const selectedTypes = new Set(selected.map((s) => s.type_id).filter(Boolean));

  return candidates
    .filter((c) => !selectedIds.has(c.id))
    .map((item) => {
      const reasons: string[] = [];
      let score = 0;
      if (selected.length > 0) {
        const sameChild = selected.every((s) => s.child_id && s.child_id === item.child_id);
        if (sameChild) { score += 3; reasons.push('אותו ילד'); }
        const seasonAvg = selected.reduce((sum, s) => sum + SEASON_SCORE(s.season, item.season), 0) / selected.length;
        score += seasonAvg;
        if (seasonAvg >= 2) reasons.push('אותה עונה');
        else if (seasonAvg >= 1) reasons.push('עונה מתאימה');
        const sameSize = selected.some((s) => s.size_label && s.size_label === item.size_label);
        const a = effectiveMaxAge(item);
        const close = selected.some((s) => {
          const b = effectiveMaxAge(s);
          return a != null && b != null && Math.abs(a - b) <= 6;
        });
        if (sameSize) { score += 2; reasons.push('אותה מידה'); }
        else if (close) { score += 1; reasons.push('מידה קרובה'); }
        if (item.type_id && selectedTypes.has(item.type_id)) score -= 2;
        else if (item.type_id) { score += 1; const n = typeName(item.type_id); if (n) reasons.push(`משלים: ${n}`); }
      }
      if (item.status !== 'active') score -= 1.5;
      if (item.status === 'outgrown' || item.status === 'given') score -= 3;
      return { item, score, reasons };
    })
    .sort((x, y) => y.score - x.score);
}

/** האם הפריט הוא חלק מלוק כלשהו – מחזיר את הלוקים */
export function looksOfItem(looks: Look[], itemId: string): Look[] {
  return looks.filter((l) => l.item_ids.includes(itemId));
}

/** חיפוש חופשי לפי שם, סוג פריט, חנות ותיאור */
export function matchesQuery(item: Item, typeNameStr: string | null, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${item.name} ${typeNameStr ?? ''} ${item.store ?? ''} ${item.description ?? ''} ${item.size_label ?? ''}`
    .toLowerCase()
    .includes(q);
}
