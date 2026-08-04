-- מיגרציה למי שכבר הריץ את schema.sql לפני הוספת שדה המיקום.
-- (בהתקנה חדשה אין צורך – schema.sql כבר כולל את העמודה)
alter table public.items add column if not exists location text;
