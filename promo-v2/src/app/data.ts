import type { GarmentKind } from '../components/Garment';

/** נתוני דוגמה לסרטון. צבעים ואייקונים לקוחים מהרשימות שבאפליקציה (CHILD_COLORS / CHILD_EMOJIS) */

export type Season = 'winter' | 'summer' | 'mid' | 'all';
export type Status = 'active' | 'waiting' | 'to_buy' | 'outgrown' | 'given';

export interface DemoChild {
  id: string;
  name: string;
  emoji: string;
  color: string;
  age: string;
}

export const KIDS: Record<string, DemoChild> = {
  yehuda: { id: 'yehuda', name: 'יהודה', emoji: '👦', color: '#0ea5e9', age: '7 שנים' },
  shira: { id: 'shira', name: 'שירה', emoji: '👧', color: '#ec4899', age: '5 שנים' },
  moishi: { id: 'moishi', name: 'מוישי', emoji: '🧒', color: '#10b981', age: '3 שנים' },
};
export const KID_ORDER = ['yehuda', 'shira', 'moishi'];

export interface DemoItem {
  id: string;
  name: string;
  child: string | null;
  season: Season;
  size: string;
  fit: -1 | 0 | 1 | null;
  kind: GarmentKind;
  color: string;
  accent?: string;
  /** רקע "תמונת המוצר" */
  bg: string;
  qty?: number;
  outgrow?: boolean;
  status?: Status;
  condition?: number;
  price?: number;
  type?: string;
}

export const ITEMS: DemoItem[] = [
  { id: 'i1', name: 'מעיל צמר ורוד', child: 'shira', season: 'winter', size: '5-6', fit: 0, kind: 'coat', color: '#f9a8c4', accent: '#fde68a', bg: '#fdf2f8', condition: 9 },
  { id: 'i2', name: 'חולצה מכופתרת', child: 'yehuda', season: 'all', size: '7-8', fit: 1, kind: 'shirt', color: '#f1f5f9', accent: '#cbd5e1', bg: '#eef2ff', qty: 3 },
  { id: 'i3', name: 'סוודר חרדל', child: 'yehuda', season: 'winter', size: '6-7', fit: -1, kind: 'sweater', color: '#e0a83a', accent: '#fef3c7', bg: '#fffbeb', outgrow: true, condition: 9 },
  { id: 'i4', name: 'שמלת שבת', child: 'shira', season: 'all', size: '5-6', fit: 0, kind: 'dress', color: '#93c5fd', accent: '#ffffff', bg: '#eff6ff' },
  { id: 'i5', name: "פיג'מת פסים", child: 'moishi', season: 'all', size: '3-4', fit: 0, kind: 'pajama', color: '#a5b4fc', accent: '#ffffff', bg: '#eef2ff', qty: 2 },
  { id: 'i6', name: 'גרביונים חמים', child: 'shira', season: 'winter', size: '5-6', fit: 1, kind: 'tights', color: '#c4b5fd', accent: '#ffffff', bg: '#f5f3ff', qty: 4 },
  { id: 'i7', name: 'מכנסי קורדרוי', child: 'moishi', season: 'winter', size: '3-4', fit: 0, kind: 'pants', color: '#b08968', bg: '#faf3eb' },
  { id: 'i8', name: 'נעלי חורף', child: 'shira', season: 'winter', size: '30', fit: null, kind: 'boots', color: '#8b6b52', accent: '#fff7ed', bg: '#fdf6ee' },
  { id: 'i9', name: 'חצאית קפלים', child: 'shira', season: 'mid', size: '5-6', fit: 0, kind: 'skirt', color: '#475569', bg: '#f1f5f9' },
  { id: 'i10', name: "קפוצ'ון ירוק", child: 'yehuda', season: 'mid', size: '7-8', fit: 0, kind: 'hoodie', color: '#6dbf8f', accent: '#ffffff', bg: '#ecfdf5' },
  { id: 'i11', name: 'סוודר לבן', child: 'shira', season: 'winter', size: '6-7', fit: 0, kind: 'sweater', color: '#f5f5f4', accent: '#f9a8c4', bg: '#fafaf9' },
  { id: 'i13', name: 'מעיל רוח', child: 'yehuda', season: 'winter', size: '6-7', fit: 0, kind: 'coat', color: '#3f5a9a', accent: '#fde68a', bg: '#eef2ff' },
  { id: 'n1', name: 'סוודר כחול', child: 'yehuda', season: 'winter', size: '7-8', fit: 0, kind: 'sweater', color: '#3b82f6', accent: '#bfdbfe', bg: '#eff6ff' },
  { id: 'i12', name: 'כובע צמר', child: 'moishi', season: 'winter', size: '2-4', fit: null, kind: 'hat', color: '#f87171', accent: '#ffffff', bg: '#fef2f2' },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id)!;

/** תצוגת "כולם" בארון */
export const CLOSET_ALL = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'i11', 'i12'];
/** אחרי בחירת שירה */
export const CLOSET_SHIRA = ['i1', 'i4', 'i6', 'i8', 'i9', 'i11'];
/** שירה + חורף */
export const CLOSET_SHIRA_WINTER = ['i1', 'i6', 'i8', 'i11'];
/** שירה + חורף + מידה 5-6 */
export const CLOSET_SHIRA_WINTER_56 = ['i1', 'i6'];

export const SEASONS: Record<Season, { label: string; emoji: string; chipBg: string; chipFg: string }> = {
  winter: { label: 'חורף', emoji: '❄️', chipBg: '#e0f2fe', chipFg: '#075985' },
  summer: { label: 'קיץ', emoji: '☀️', chipBg: '#fef3c7', chipFg: '#92400e' },
  mid: { label: 'עונות מעבר', emoji: '🍂', chipBg: '#ffedd5', chipFg: '#9a3412' },
  all: { label: 'כל השנה', emoji: '🌈', chipBg: '#ede9fe', chipFg: '#5b21b6' },
};

export const STATUSES: Record<Status, { label: string; emoji: string; bg: string; fg: string }> = {
  active: { label: 'בארון', emoji: '✅', bg: '#d1fae5', fg: '#065f46' },
  waiting: { label: 'שמור לגדילה', emoji: '📦', bg: '#dbeafe', fg: '#1e40af' },
  to_buy: { label: 'לקנות', emoji: '🛒', bg: '#fef3c7', fg: '#92400e' },
  outgrown: { label: 'קטן מדי', emoji: '📏', bg: '#ffe4e6', fg: '#9f1239' },
  given: { label: 'הועבר הלאה', emoji: '🎁', bg: '#e5e7eb', fg: '#4b5563' },
};

export function conditionLabel(c: number) {
  if (c >= 10) return 'חדש ✨';
  return ['', 'לזריקה', 'בלוי מאוד', 'בלוי', 'משומש', 'סביר', 'טוב', 'טוב מאוד', 'מצוין', 'כמו חדש'][c];
}

/** רשימת הקניות */
export interface ShopRow {
  id: string;
  name: string;
  child: string;
  size: string;
  type: string;
  season: Season;
  price: number;
  qty?: number;
  kind: GarmentKind;
  color: string;
  accent?: string;
}
export const SHOP_LIST: ShopRow[] = [
  { id: 's1', name: 'מגפי גשם', child: 'moishi', size: '25', type: 'מגפיים', season: 'winter', price: 89, kind: 'boots', color: '#facc15', accent: '#fff' },
  { id: 's2', name: 'סוודר כחול', child: 'yehuda', size: '7-8', type: 'סוודר', season: 'winter', price: 75, kind: 'sweater', color: '#3b82f6', accent: '#bfdbfe' },
  { id: 's3', name: 'גרביים', child: 'shira', size: '5-6', type: 'גרביים', season: 'all', price: 30, qty: 5, kind: 'tights', color: '#fda4af', accent: '#fff' },
];
/** פריט שמתווסף מהחוסרים */
export const GAP_ROW: ShopRow = { id: 's0', name: 'מעיל לחורף', child: 'moishi', size: '3-4', type: 'מעיל', season: 'winter', price: 0, kind: 'coat', color: '#60a5fa', accent: '#fde68a' };
export const GAPS = [
  { key: 'g1', child: 'moishi', type: 'מעיל' },
  { key: 'g2', child: 'yehuda', type: 'כובע' },
];
