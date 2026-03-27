-- Companies table
create table if not exists companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  tagline text,
  logo_url text,
  employee_count integer default 0,
  rating numeric(3,1) default 0,
  recommend_pct integer default 0,
  created_at timestamp with time zone default now()
);

-- Profiles table (links to Supabase auth)
create table if not exists profiles (
  id uuid references auth.users primary key,
  role text check (role in ('employer', 'employee', 'jobseeker')) not null default 'jobseeker',
  company_id uuid references companies(id),
  full_name text,
  created_at timestamp with time zone default now()
);

-- Plans table
create table if not exists plans (
  id text primary key,
  name text not null,
  monthly_price numeric(10,2) default 0,
  annual_price numeric(10,2) default 0,
  video_limit integer default 1
);

-- Insert default plans
insert into plans (id, name, monthly_price, annual_price, video_limit) values
  ('starter', 'Starter', 0, 0, 1),
  ('growth', 'Growth', 49, 39, 5),
  ('pro', 'Pro', 149, 119, 999)
on conflict (id) do nothing;

-- Company subscriptions
create table if not exists company_subscriptions (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) not null,
  plan_id text references plans(id) not null default 'starter',
  billing_period text check (billing_period in ('monthly', 'annual')) default 'monthly',
  created_at timestamp with time zone default now(),
  renews_at timestamp with time zone
);

-- Employees table
create table if not exists employees (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) not null,
  name text not null,
  role text,
  initials text,
  color text default '#1A5CFF',
  years_at_company text,
  created_at timestamp with time zone default now()
);

-- Videos table
create table if not exists videos (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) not null,
  employee_id uuid references employees(id),
  video_url text not null,
  duration text,
  quote text,
  status text check (status in ('live', 'pending', 'rejected')) default 'pending',
  views integer default 0,
  created_at timestamp with time zone default now()
);

-- Messages table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users,
  to_user_id uuid references auth.users,
  employee_id uuid references employees(id),
  text text not null,
  translated text,
  created_at timestamp with time zone default now()
);

-- Insert sample company
insert into companies (id, name, tagline, employee_count, rating, recommend_pct)
values (
  '00000000-0000-0000-0000-000000000001',
  'Apex Technologies',
  'Where bold ideas become real products',
  2400,
  4.7,
  94
) on conflict (id) do nothing;

-- Insert sample employees
insert into employees (id, company_id, name, role, initials, color, years_at_company) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Maria Rodriguez', 'Senior Software Engineer', 'MR', '#1A5CFF', '3 yrs'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'James Liu', 'UX Designer', 'JL', '#1D9E75', '5 yrs'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Sara Kim', 'Product Manager', 'SK', '#BA7517', '2 yrs'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Tom Parker', 'Sales Lead', 'TP', '#993556', '4 yrs')
on conflict (id) do nothing;

-- Insert sample videos
insert into videos (company_id, employee_id, video_url, duration, quote, status, views) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '1:24', 'The growth here is real. I went from mid-level to senior in 18 months.', 'live', 312),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', '2:01', 'The design culture here is incredible. We ship real research-driven work.', 'live', 198),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', '1:45', 'I have more ownership here than anywhere I have worked before.', 'live', 145),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', '0:58', 'The commission structure is the best I have seen and the team has your back.', 'live', 89)
on conflict do nothing;
