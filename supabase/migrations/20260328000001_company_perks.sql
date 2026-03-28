create table if not exists company_perks (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  icon         text not null default '✨',
  title        text not null,
  description  text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table company_perks enable row level security;

create policy "Public can read company perks"
  on company_perks for select using (true);

create policy "Employer can insert own company perks"
  on company_perks for insert
  with check (company_id in (
    select company_id from profiles where id = auth.uid() and role = 'employer'
  ));

create policy "Employer can update own company perks"
  on company_perks for update
  using (company_id in (
    select company_id from profiles where id = auth.uid() and role = 'employer'
  ));

create policy "Employer can delete own company perks"
  on company_perks for delete
  using (company_id in (
    select company_id from profiles where id = auth.uid() and role = 'employer'
  ));
