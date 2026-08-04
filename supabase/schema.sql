-- ============================================================
-- ארון המשפחה – סכמת מסד נתונים ל-Supabase
-- הריצו את הקובץ הזה ב-SQL Editor של פרויקט ה-Supabase שלכם
-- (Dashboard -> SQL Editor -> New query -> הדביקו והריצו)
-- ============================================================

-- ---------- ילדים ----------
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  birth_date date,
  color text not null default '#f59e0b',
  emoji text not null default '🧒',
  created_at timestamptz not null default now()
);

-- ---------- קטגוריות (שבת / חול / פיג'מות...) ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- סוגי פריטים (מכנס / חולצה / אוברול...) ----------
create table if not exists public.item_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- פריטי לבוש ----------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  child_id uuid references public.children (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  type_id uuid references public.item_types (id) on delete set null,
  size_label text,                              -- מידה: "2-3", "104", "6-12 ח'" וכו'
  season text not null default 'all',           -- winter / summer / mid / all
  store text,                                   -- חנות / יצרן
  location text,                                -- מיקום אחסון: איזה ארון / מדף
  price numeric(10, 2),
  year int,                                     -- לאיזו שנה מיועד
  quantity int not null default 1,
  status text not null default 'active',        -- active / waiting / to_buy / outgrown / given
  image_path text,                              -- נתיב בתוך ה-bucket
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_user_idx on public.items (user_id);
create index if not exists items_child_idx on public.items (child_id);

-- עדכון אוטומטי של updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================
-- אבטחת שורות (RLS): כל חשבון רואה ומנהל רק את הנתונים שלו
-- ============================================================
alter table public.children   enable row level security;
alter table public.categories enable row level security;
alter table public.item_types enable row level security;
alter table public.items      enable row level security;

drop policy if exists "children_own"   on public.children;
drop policy if exists "categories_own" on public.categories;
drop policy if exists "item_types_own" on public.item_types;
drop policy if exists "items_own"      on public.items;

create policy "children_own" on public.children
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_own" on public.categories
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "item_types_own" on public.item_types
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "items_own" on public.items
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- אחסון תמונות: bucket פרטי, כל משתמש בתיקייה משלו
-- ============================================================
insert into storage.buckets (id, name, public)
values ('clothes', 'clothes', false)
on conflict (id) do nothing;

drop policy if exists "clothes_select_own" on storage.objects;
drop policy if exists "clothes_insert_own" on storage.objects;
drop policy if exists "clothes_update_own" on storage.objects;
drop policy if exists "clothes_delete_own" on storage.objects;

create policy "clothes_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'clothes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "clothes_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'clothes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "clothes_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'clothes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "clothes_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'clothes' and (storage.foldername(name))[1] = auth.uid()::text);
