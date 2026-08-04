import type { Child, Item } from './types';

/**
 * פענוח תווית מידה לגיל מקסימלי בחודשים, כדי לזהות בגדים שהילד עומד לצאת מהם.
 * תומך ב: טווחי שנים ("2-3"), חודשים ("6-12 ח'"), מידות אירופאיות לפי גובה (92, 104...).
 */

// מידה אירופאית (ס"מ) -> גיל בחודשים
const EU_SIZE_TO_MONTHS: [number, number][] = [
  [50, 0], [56, 1], [62, 3], [68, 6], [74, 9], [80, 12], [86, 18],
  [92, 24], [98, 36], [104, 48], [110, 60], [116, 72], [122, 84],
  [128, 96], [134, 108], [140, 120], [146, 132], [152, 144], [158, 156], [164, 168],
];

export function maxAgeMonths(sizeLabel: string | null): number | null {
  if (!sizeLabel) return null;
  const label = sizeLabel.trim();
  const numbers = label.match(/\d+/g)?.map(Number);
  if (!numbers || numbers.length === 0) return null;
  const max = Math.max(...numbers);

  // "6-12 ח'" / "18 חודשים"
  if (/ח|month|m\b/i.test(label)) return max;
  // טווח או מספר בודד של שנים: "2-3", "5"
  if (max <= 18) return max * 12;
  // מידה אירופאית לפי גובה: 50-170
  if (max >= 50 && max <= 170) {
    for (const [size, months] of EU_SIZE_TO_MONTHS) {
      if (max <= size) return months;
    }
    return 180;
  }
  // מידות נעליים וכד' (19-49) – אין מיפוי אמין
  return null;
}

export function ageMonths(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return months >= 0 ? months : null;
}

/** האם הפריט קטן / עומד להיות קטן על הילד (חלון של חודשיים קדימה) */
export function outgrowStatus(item: Item, child: Child | undefined): 'past' | 'soon' | null {
  if (!child || item.status !== 'active') return null;
  const limit = maxAgeMonths(item.size_label);
  const age = ageMonths(child.birth_date);
  if (limit == null || age == null) return null;
  if (age > limit + 1) return 'past';
  if (age >= limit - 2) return 'soon';
  return null;
}
