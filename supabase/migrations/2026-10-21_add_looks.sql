-- מיגרציה להתקנה קיימת: לוקים (המלצות הלבשה) – קבוצת פריטים שמתאימים זה לזה
create table if not exists public.looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id),
  name text not null default '',
  item_ids uuid[] not null default '{}',   -- מזהי הפריטים בלוק
  created_at timestamptz not null default now()
);

create index if not exists looks_household_idx on public.looks (household_id);

drop trigger if exists looks_set_household on public.looks;
create trigger looks_set_household before insert on public.looks
  for each row execute function public.set_household_id();

alter table public.looks enable row level security;
drop policy if exists "looks_own" on public.looks;
create policy "looks_own" on public.looks
  for all to authenticated
  using (household_id = public.my_household()) with check (household_id = public.my_household());
