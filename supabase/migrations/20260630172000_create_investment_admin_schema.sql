-- Investment admin schema for Resumen Inversion.
-- Apply this in Supabase SQL Editor or through Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.trader_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investors (
  id bigint generated always as identity primary key,
  slug text not null unique,
  first_name text not null,
  last_name text not null,
  email text,
  start_date date not null,
  status text not null default 'active',
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investors_slug_format_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint investors_status_check check (
    status in ('active', 'watch', 'pending', 'paused')
  )
);

create table if not exists public.investor_movements (
  id bigint generated always as identity primary key,
  investor_id bigint not null references public.investors (id) on delete cascade,
  movement_type text not null,
  movement_date date not null,
  amount numeric(14, 2) not null,
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investor_movements_amount_positive_check check (amount > 0),
  constraint investor_movements_type_check check (
    movement_type in ('initial_contribution', 'contribution', 'withdrawal')
  )
);

create table if not exists public.weekly_profitability (
  id bigint generated always as identity primary key,
  week_start date not null unique,
  week_end date not null,
  return_pct numeric(8, 4) not null default 0,
  status text not null default 'draft',
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_profitability_dates_check check (week_end >= week_start),
  constraint weekly_profitability_status_check check (
    status in ('draft', 'closed', 'pending')
  )
);

create table if not exists public.investor_monthly_snapshots (
  id bigint generated always as identity primary key,
  investor_id bigint not null references public.investors (id) on delete cascade,
  month_start date not null,
  net_capital numeric(14, 2) not null default 0,
  current_balance numeric(14, 2) not null default 0,
  profit numeric(14, 2) not null default 0,
  return_pct numeric(8, 4) not null default 0,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investor_monthly_snapshots_month_start_check check (
    month_start = date_trunc('month', month_start)::date
  ),
  constraint investor_monthly_snapshots_unique_month unique (
    investor_id,
    month_start
  )
);

create index if not exists trader_profiles_active_idx
  on public.trader_profiles (is_active)
  where is_active = true;

create index if not exists investors_status_start_date_idx
  on public.investors (status, start_date);

create index if not exists investors_created_by_idx
  on public.investors (created_by);

create index if not exists investor_movements_investor_date_idx
  on public.investor_movements (investor_id, movement_date);

create index if not exists investor_movements_created_by_idx
  on public.investor_movements (created_by);

create index if not exists weekly_profitability_status_week_start_idx
  on public.weekly_profitability (status, week_start);

create index if not exists weekly_profitability_created_by_idx
  on public.weekly_profitability (created_by);

create index if not exists investor_monthly_snapshots_investor_month_idx
  on public.investor_monthly_snapshots (investor_id, month_start desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trader_profiles_updated_at on public.trader_profiles;
create trigger set_trader_profiles_updated_at
before update on public.trader_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_investors_updated_at on public.investors;
create trigger set_investors_updated_at
before update on public.investors
for each row execute function public.set_updated_at();

drop trigger if exists set_investor_movements_updated_at on public.investor_movements;
create trigger set_investor_movements_updated_at
before update on public.investor_movements
for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_profitability_updated_at on public.weekly_profitability;
create trigger set_weekly_profitability_updated_at
before update on public.weekly_profitability
for each row execute function public.set_updated_at();

drop trigger if exists set_investor_monthly_snapshots_updated_at on public.investor_monthly_snapshots;
create trigger set_investor_monthly_snapshots_updated_at
before update on public.investor_monthly_snapshots
for each row execute function public.set_updated_at();

create or replace function public.is_trader()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.trader_profiles
    where id = (select auth.uid())
      and is_active = true
  );
$$;

alter table public.trader_profiles enable row level security;
alter table public.investors enable row level security;
alter table public.investor_movements enable row level security;
alter table public.weekly_profitability enable row level security;
alter table public.investor_monthly_snapshots enable row level security;

drop policy if exists "traders can read trader profiles" on public.trader_profiles;
create policy "traders can read trader profiles"
on public.trader_profiles
for select
to authenticated
using ((select public.is_trader()));

drop policy if exists "traders can manage investors" on public.investors;
create policy "traders can manage investors"
on public.investors
for all
to authenticated
using ((select public.is_trader()))
with check ((select public.is_trader()));

drop policy if exists "traders can manage investor movements" on public.investor_movements;
create policy "traders can manage investor movements"
on public.investor_movements
for all
to authenticated
using ((select public.is_trader()))
with check ((select public.is_trader()));

drop policy if exists "traders can manage weekly profitability" on public.weekly_profitability;
create policy "traders can manage weekly profitability"
on public.weekly_profitability
for all
to authenticated
using ((select public.is_trader()))
with check ((select public.is_trader()));

drop policy if exists "traders can manage monthly snapshots" on public.investor_monthly_snapshots;
create policy "traders can manage monthly snapshots"
on public.investor_monthly_snapshots
for all
to authenticated
using ((select public.is_trader()))
with check ((select public.is_trader()));

grant usage on schema public to authenticated;
grant select on public.trader_profiles to authenticated;
grant select, insert, update, delete on public.investors to authenticated;
grant select, insert, update, delete on public.investor_movements to authenticated;
grant select, insert, update, delete on public.weekly_profitability to authenticated;
grant select, insert, update, delete on public.investor_monthly_snapshots to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.is_trader() to authenticated;

-- After creating the admin user in Supabase Auth, promote it with:
-- insert into public.trader_profiles (id, email, display_name)
-- select id, email, 'Carlos Verdu'
-- from auth.users
-- where email = 'your-admin-email@example.com'
-- on conflict (id) do update
-- set email = excluded.email,
--     display_name = excluded.display_name,
--     is_active = true;
