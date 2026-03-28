alter table companies add column if not exists slug text unique;

-- Set default slug for the existing sample company
update companies set slug = lower(replace(name, ' ', '-')) where slug is null;

-- Allow public read access to companies for the directory
create policy "Anyone can view companies" on companies
  for select using (true);
