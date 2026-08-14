alter table public.investors
add column if not exists password_recovery_requested_at timestamptz;

-- Canonicalize stored investor emails before enforcing normalized uniqueness.
-- Existing duplicates must be resolved manually; this migration never deletes or merges investors.
update public.investors
set email = nullif(lower(btrim(email)), '')
where email is not null
  and email is distinct from nullif(lower(btrim(email)), '');

do $$
begin
  if exists (
    select 1
    from public.investors
    where email is not null
      and btrim(email) <> ''
    group by lower(btrim(email))
    having count(*) > 1
  ) then
    raise exception
      'Cannot enforce unique investor emails: duplicate normalized email values exist. Resolve them manually before retrying this migration.';
  end if;
end;
$$;

create unique index if not exists investors_normalized_email_unique_idx
  on public.investors (lower(btrim(email)))
  where email is not null
    and btrim(email) <> '';

create or replace function public.claim_investor_password_recovery(
  p_email text,
  p_requested_at timestamptz,
  p_cooldown_before timestamptz
)
returns table(first_name text, last_name text)
language sql
security invoker
set search_path = public
as $$
  update public.investors as investor
  set password_recovery_requested_at = p_requested_at
  where lower(btrim(investor.email)) = lower(btrim(p_email))
    and (
      investor.password_recovery_requested_at is null
      or investor.password_recovery_requested_at < p_cooldown_before
    )
  returning investor.first_name, investor.last_name;
$$;

grant usage on schema public to service_role;
grant select (email, first_name, last_name, password_recovery_requested_at)
  on public.investors to service_role;
grant update (password_recovery_requested_at)
  on public.investors to service_role;

revoke execute on function public.claim_investor_password_recovery(text, timestamptz, timestamptz) from public;
revoke execute on function public.claim_investor_password_recovery(text, timestamptz, timestamptz) from anon;
revoke execute on function public.claim_investor_password_recovery(text, timestamptz, timestamptz) from authenticated;
grant execute on function public.claim_investor_password_recovery(text, timestamptz, timestamptz) to service_role;
