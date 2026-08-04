-- ============================================================
-- מיגרציה להתקנה קיימת: שיתוף משפחתי (households) + ריבוי תמונות
-- הריצו את כל הקובץ הזה פעם אחת ב-SQL Editor.
-- הנתונים הקיימים נשמרים במלואם.
-- ============================================================

-- ---------- 1. טבלאות משק בית ----------
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

-- ---------- 2. פונקציות ----------
create or replace function public.my_household()
returns uuid language sql stable security definer set search_path = public as
$$ select household_id from public.profiles where id = auth.uid() $$;

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

create or replace function public.leave_household()
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  insert into households (name) values (null) returning id into hid;
  update profiles set household_id = hid where id = auth.uid();
  return hid;
end $$;

create or replace function public.set_household_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.household_id := public.my_household();
  return new;
end $$;

-- ---------- 3. משק בית לכל משתמש קיים ----------
do $$
declare u record; hid uuid;
begin
  for u in select id, email from auth.users loop
    if not exists (select 1 from public.profiles where id = u.id) then
      insert into public.households (name) values (null) returning id into hid;
      insert into public.profiles (id, household_id, email) values (u.id, hid, u.email);
    end if;
  end loop;
end $$;

-- ---------- 4. עמודת household_id בטבלאות הנתונים + מילוי ----------
alter table public.children   add column if not exists household_id uuid references public.households (id);
alter table public.categories add column if not exists household_id uuid references public.households (id);
alter table public.item_types add column if not exists household_id uuid references public.households (id);
alter table public.items      add column if not exists household_id uuid references public.households (id);

update public.children c   set household_id = p.household_id from public.profiles p where p.id = c.user_id and c.household_id is null;
update public.categories c set household_id = p.household_id from public.profiles p where p.id = c.user_id and c.household_id is null;
update public.item_types t set household_id = p.household_id from public.profiles p where p.id = t.user_id and t.household_id is null;
update public.items i      set household_id = p.household_id from public.profiles p where p.id = i.user_id and i.household_id is null;

alter table public.children   alter column household_id set not null;
alter table public.categories alter column household_id set not null;
alter table public.item_types alter column household_id set not null;
alter table public.items      alter column household_id set not null;

-- ייחודיות שמות לפי משק בית במקום לפי משתמש
alter table public.categories drop constraint if exists categories_user_id_name_key;
alter table public.item_types drop constraint if exists item_types_user_id_name_key;
create unique index if not exists categories_household_name_key on public.categories (household_id, name);
create unique index if not exists item_types_household_name_key on public.item_types (household_id, name);

create index if not exists items_household_idx on public.items (household_id);
create index if not exists children_household_idx on public.children (household_id);

-- ---------- 5. טריגרים למילוי household_id ----------
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

-- ---------- 6. ריבוי תמונות: image_path -> images[] ----------
alter table public.items add column if not exists images text[] not null default '{}';
update public.items set images = array[image_path]
  where image_path is not null and (images is null or images = '{}');
alter table public.items drop column if exists image_path;

-- ---------- 7. עדכון חוקי RLS לפי משק בית ----------
alter table public.households enable row level security;
alter table public.profiles   enable row level security;

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

-- ---------- 8. חוקי אחסון: תיקיית משק בית + תיקיות ישנות של חברים ----------
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
