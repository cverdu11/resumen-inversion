-- Allow Supabase Auth users whose email matches investors.email to access
-- only their own investor-side data.

create or replace function public.current_auth_email()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

drop policy if exists "investors can read own profile" on public.investors;
create policy "investors can read own profile"
on public.investors
for select
to authenticated
using (
  email is not null
  and lower(email) = public.current_auth_email()
);

drop policy if exists "investors can read own movements" on public.investor_movements;
create policy "investors can read own movements"
on public.investor_movements
for select
to authenticated
using (
  exists (
    select 1
    from public.investors
    where investors.id = investor_movements.investor_id
      and investors.email is not null
      and lower(investors.email) = public.current_auth_email()
  )
);

drop policy if exists "investors can read own monthly snapshots" on public.investor_monthly_snapshots;
create policy "investors can read own monthly snapshots"
on public.investor_monthly_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from public.investors
    where investors.id = investor_monthly_snapshots.investor_id
      and investors.email is not null
      and lower(investors.email) = public.current_auth_email()
  )
);

drop policy if exists "authenticated users can read closed weekly profitability" on public.weekly_profitability;
create policy "authenticated users can read closed weekly profitability"
on public.weekly_profitability
for select
to authenticated
using (
  status = 'closed'
  or (select public.is_trader())
);

grant execute on function public.current_auth_email() to authenticated;
