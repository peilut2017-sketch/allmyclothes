-- מיגרציה להתקנה קיימת: שדה מצב הבגד (1 = לזריקה, 10 = חדש)
alter table public.items
  add column if not exists condition int check (condition between 1 and 10);
