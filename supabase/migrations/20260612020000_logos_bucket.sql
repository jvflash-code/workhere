-- Public bucket for company logos (the app uploads to storage.from('logos'))
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload logos"
on storage.objects for insert to authenticated
with check (bucket_id = 'logos');

create policy "Authenticated users can update logos"
on storage.objects for update to authenticated
using (bucket_id = 'logos');

create policy "Public can read logos"
on storage.objects for select to public
using (bucket_id = 'logos');
