-- Stripe billing support for company subscriptions.

-- Ensure the plans + company_subscriptions tables exist (mirrors schema.sql)
create table if not exists plans (
  id text primary key,
  name text not null,
  monthly_price numeric(10,2) default 0,
  annual_price numeric(10,2) default 0,
  video_limit integer default 1
);

insert into plans (id, name, monthly_price, annual_price, video_limit) values
  ('starter', 'Starter', 0, 0, 1),
  ('growth', 'Growth', 49, 39, 5),
  ('pro', 'Pro', 149, 119, 999)
on conflict (id) do nothing;

create table if not exists company_subscriptions (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) not null,
  plan_id text references plans(id) not null default 'starter',
  billing_period text check (billing_period in ('monthly', 'annual')) default 'monthly',
  created_at timestamp with time zone default now(),
  renews_at timestamp with time zone
);

-- Stripe linkage
alter table company_subscriptions add column if not exists stripe_customer_id text;
alter table company_subscriptions add column if not exists stripe_subscription_id text;
alter table company_subscriptions add column if not exists status text default 'active';

-- Collapse any duplicate rows so a company maps to a single subscription,
-- then enforce it (the webhook upserts on company_id).
delete from company_subscriptions a
  using company_subscriptions b
  where a.company_id = b.company_id and a.ctid < b.ctid;

create unique index if not exists company_subscriptions_company_id_key
  on company_subscriptions(company_id);
