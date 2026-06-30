# Supabase schema

Apply migrations in chronological order from `supabase/migrations`.

## First migration

Run `20260630172000_create_investment_admin_schema.sql` in the Supabase SQL
Editor, or with Supabase CLI when available:

```bash
supabase db push
```

## Promote the admin trader

After the admin user exists in Supabase Auth, run this in SQL Editor, replacing
the email:

```sql
insert into public.trader_profiles (id, email, display_name)
select id, email, 'Carlos Verdu'
from auth.users
where email = 'your-admin-email@example.com'
on conflict (id) do update
set email = excluded.email,
    display_name = excluded.display_name,
    is_active = true;
```

The `/admin` route already checks `public.is_trader()`, so the user must exist
in `trader_profiles` with `is_active = true`.

## Tables created

- `trader_profiles`: users allowed into the trader/admin panel.
- `investors`: investor identity, slug, start date and status.
- `investor_movements`: initial contribution, partial contributions and withdrawals.
- `weekly_profitability`: global weekly profitability entries.
- `investor_monthly_snapshots`: cached calculated monthly summaries for later.
