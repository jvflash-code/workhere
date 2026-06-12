-- Track company profile views for the admin metrics dashboard
alter table companies add column if not exists view_count integer not null default 0;

-- Atomic counter increment, callable from the app with the anon key.
-- security definer so RLS on companies doesn't block the update.
create or replace function increment_company_views(company_id_param uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update companies set view_count = view_count + 1 where id = company_id_param;
$$;

grant execute on function increment_company_views(uuid) to anon, authenticated;
