-- Company location for the job-seeker map card
alter table companies add column if not exists address text;
alter table companies add column if not exists latitude double precision;
alter table companies add column if not exists longitude double precision;
