-- מיגרציה להתקנה קיימת: גזרה ביחס למידה שעל התווית
-- -1 = הגזרה קטנה (מרגיש כמו מידה אחת למטה), 0 = במידה, 1 = הגזרה גדולה (מרגיש כמו מידה אחת למעלה)
alter table public.items
  add column if not exists size_fit int check (size_fit between -1 and 1);
