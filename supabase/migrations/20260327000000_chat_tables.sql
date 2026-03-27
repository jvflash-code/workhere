create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  user_id uuid references auth.users(id),
  employee_id uuid references employees(id),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Drop legacy messages table if it exists without conversation_id, then recreate
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'messages'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'conversation_id'
  ) then
    drop table messages cascade;
  end if;
end
$$;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'employee')),
  content text not null,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users can read own conversations" on conversations
  for select using (user_id = auth.uid());

create policy "Users can insert own conversations" on conversations
  for insert with check (user_id = auth.uid());

create policy "Users can read messages in own conversations" on messages
  for select using (
    conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own conversations" on messages
  for insert with check (
    conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  );
