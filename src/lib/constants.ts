import type { ItemStatus, Season } from './types';

export const SEASONS: Record<Season, { label: string; emoji: string; chip: string; dot: string }> = {
  winter: { label: 'חורף', emoji: '❄️', chip: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300', dot: 'bg-sky-400' },
  summer: { label: 'קיץ', emoji: '☀️', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300', dot: 'bg-amber-400' },
  mid: { label: 'עונות מעבר', emoji: '🍂', chip: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300', dot: 'bg-orange-400' },
  all: { label: 'כל השנה', emoji: '🌈', chip: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300', dot: 'bg-violet-400' },
};

export const SEASON_ORDER: Season[] = ['winter', 'summer', 'mid', 'all'];

export const STATUSES: Record<ItemStatus, { label: string; emoji: string; chip: string }> = {
  active: { label: 'בארון', emoji: '✅', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
  waiting: { label: 'שמור לגדילה', emoji: '📦', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
  to_buy: { label: 'לקנות', emoji: '🛒', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  outgrown: { label: 'קטן מדי', emoji: '📏', chip: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' },
  given: { label: 'הועבר הלאה', emoji: '🎁', chip: 'bg-gray-200 text-gray-600' },
};

export const STATUS_ORDER: ItemStatus[] = ['active', 'waiting', 'to_buy', 'outgrown', 'given'];

export const LOCATION_SUGGESTIONS = [
  'ארון חדר ילדים', 'ארון הורים', 'מגירה עליונה', 'מגירה תחתונה',
  'מדף עליון', 'בוידעם', 'מחסן', 'קופסת אחסון',
];

export const CHILD_COLORS = [
  '#f59e0b', '#ef4444', '#ec4899', '#a855f7',
  '#6366f1', '#0ea5e9', '#10b981', '#84cc16',
];

export const CHILD_EMOJIS = ['👶', '🧒', '👧', '👦', '🧑', '👸', '🦸', '🐻', '🦄', '⚽'];

export const SIZE_SUGGESTIONS = [
  '0-3 ח\'', '3-6 ח\'', '6-12 ח\'', '12-18 ח\'', '18-24 ח\'',
  '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10',
  '10-11', '11-12', '12-13', '13-14', '14-16',
];

export const DEFAULT_CATEGORIES = ['שבת וחג', 'חול (יום־יום)', 'פיג\'מות', 'בית', 'אירועים'];

export const DEFAULT_ITEM_TYPES = [
  'חולצה', 'מכנסיים', 'שמלה', 'חצאית', 'אוברול', 'סוודר', 'קפוצ\'ון',
  'מעיל', 'גופייה', 'גרביים', 'גרביון', 'פיג\'מה', 'נעליים', 'סנדלים',
  'מגפיים', 'כובע', 'בגד ים', 'טייץ',
];

export const GENERAL_CHILD_ID = 'general';
