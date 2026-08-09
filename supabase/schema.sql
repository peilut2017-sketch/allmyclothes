-- ============================================================
-- ארון המשפחה – סכמת מסד נתונים ל-Supabase (התקנה חדשה)
-- הריצו את הקובץ הזה ב-SQL Editor של פרויקט ה-Supabase שלכם.
-- אם כבר יש לכם התקנה פעילה מגרסה קודמת – אל תריצו את זה!
-- הריצו במקום זאת את קובצי המיגרציה שבתיקיית supabase/migrations.
-- ============================================================

-- ---------- משק בית משותף (שיתוף בין שני הורים) ----------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text not null unique default encode(gen_random_bytes(4), 'hex'),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id),
  email text,
  created_at timestamptz not null default now()
);

-- משק הבית של המשתמש המחובר
create or replace function public.my_household()
returns uuid language sql stable security definer set search_path = public as
$$ select household_id from public.profiles where id = auth.uid() $$;

-- יצירת משק בית ופרופיל בכניסה ראשונה (נקרא מהאפליקציה)
create or replace function public.ensure_membership()
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select household_id into hid from profiles where id = auth.uid();
  if hid is null then
    insert into households (name) values (null) returning id into hid;
    insert into profiles (id, household_id, email)
    values (auth.uid(), hid, (select email from auth.users where id = auth.uid()));
  end if;
  return hid;
end $$;

-- הצטרפות למשק בית של בן/בת זוג באמצעות קוד הזמנה
create or replace function public.join_household(code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select id into hid from households where invite_code = lower(trim(code));
  if hid is null then return false; end if;
  perform public.ensure_membership();
  update profiles set household_id = hid where id = auth.uid();
  return true;
end $$;

-- עזיבת משק בית משותף (חוזרים למשק בית חדש וריק)
create or replace function public.leave_household()
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  insert into households (name) values (null) returning id into hid;
  update profiles set household_id = hid where id = auth.uid();
  return hid;
end $$;

-- מילוי אוטומטי של household_id בכל הוספת רשומה
create or replace function public.set_household_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.household_id := public.my_household();
  return new;
end $$;

-- ---------- ילדים ----------
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id),
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
  household_id uuid not null references public.households (id),
  name text not null,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

-- ---------- סוגי פריטים (מכנס / חולצה / אוברול...) ----------
create table if not exists public.item_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id),
  name text not null,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

-- ---------- פריטי לבוש ----------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id),
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
  condition int check (condition between 1 and 10),  -- מצב הבגד: 1 לזריקה, 10 חדש
  images text[] not null default '{}',          -- נתיבי תמונות בתוך ה-bucket (הראשונה = ראשית)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_household_idx on public.items (household_id);
create index if not exists items_child_idx on public.items (child_id);
create index if not exists children_household_idx on public.children (household_id);

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

-- טריגרים למילוי household_id
drop trigger if exists children_set_household on public.children;
create trigger children_set_household before insert on public.children
  for each row execute function public.set_household_id();
drop trigger if exists categories_set_household on public.categories;
create trigger categories_set_household before insert on public.categories
  for each row execute function public.set_household_id();
drop trigger if exists item_types_set_household on public.item_types;
create trigger item_types_set_household before insert on public.item_types
  for each row execute function public.set_household_id();
drop trigger if exists items_set_household on public.items;
create trigger items_set_household before insert on public.items
  for each row execute function public.set_household_id();

-- ============================================================
-- אבטחת שורות (RLS): כל משק בית רואה ומנהל רק את הנתונים שלו
-- ============================================================
alter table public.households enable row level security;
alter table public.profiles   enable row level security;
alter table public.children   enable row level security;
alter table public.categories enable row level security;
alter table public.item_types enable row level security;
alter table public.items      enable row level security;

drop policy if exists "households_own" on public.households;
drop policy if exists "profiles_own"   on public.profiles;
drop policy if exists "children_own"   on public.children;
drop policy if exists "categories_own" on public.categories;
drop policy if exists "item_types_own" on public.item_types;
drop policy if exists "items_own"      on public.items;

create policy "households_own" on public.households
  for select to authenticated using (id = public.my_household());

create policy "profiles_own" on public.profiles
  for select to authenticated using (household_id = public.my_household() or id = auth.uid());

create policy "children_own" on public.children
  for all to authenticated
  using (household_id = public.my_household()) with check (household_id = public.my_household());

create policy "categories_own" on public.categories
  for all to authenticated
  using (household_id = public.my_household()) with check (household_id = public.my_household());

create policy "item_types_own" on public.item_types
  for all to authenticated
  using (household_id = public.my_household()) with check (household_id = public.my_household());

create policy "items_own" on public.items
  for all to authenticated
  using (household_id = public.my_household()) with check (household_id = public.my_household());

-- ============================================================
-- אחסון תמונות: bucket פרטי, תיקייה לכל משק בית
-- (הקריאה מתירה גם תיקיות ישנות של חברי משק הבית)
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
  using (bucket_id = 'clothes' and (
    (storage.foldername(name))[1] = public.my_household()::text
    or (storage.foldername(name))[1] in (
      select id::text from public.profiles where household_id = public.my_household()
    )
  ));

create policy "clothes_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'clothes' and (storage.foldername(name))[1] = public.my_household()::text);

create policy "clothes_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'clothes' and (
    (storage.foldername(name))[1] = public.my_household()::text
    or (storage.foldername(name))[1] in (
      select id::text from public.profiles where household_id = public.my_household()
    )
  ));

create policy "clothes_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'clothes' and (
    (storage.foldername(name))[1] = public.my_household()::text
    or (storage.foldername(name))[1] in (
      select id::text from public.profiles where household_id = public.my_household()
    )
  ));
