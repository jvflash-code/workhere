create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table push_tokens enable row level security;

create policy "Users can manage own push tokens" on push_tokens
  for all using (user_id = auth.uid());
