-- Storage object writes must stay inside the authenticated vendor's folder.
-- Existing public reads remain intentional for public logos/menu images.

drop policy if exists "vendor-assets: authenticated upload" on storage.objects;
drop policy if exists "vendor-assets: authenticated update own" on storage.objects;
drop policy if exists "vendor-assets: authenticated delete own" on storage.objects;

create policy "vendor-assets: vendor folder insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vendor-assets'
    and exists (
      select 1
      from public.vendors v
      where v.owner_id = (select auth.uid())
        and v.id::text = (storage.foldername(name))[1]
    )
  );

create policy "vendor-assets: vendor folder update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vendor-assets'
    and exists (
      select 1
      from public.vendors v
      where v.owner_id = (select auth.uid())
        and v.id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'vendor-assets'
    and exists (
      select 1
      from public.vendors v
      where v.owner_id = (select auth.uid())
        and v.id::text = (storage.foldername(name))[1]
    )
  );

create policy "vendor-assets: vendor folder delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vendor-assets'
    and exists (
      select 1
      from public.vendors v
      where v.owner_id = (select auth.uid())
        and v.id::text = (storage.foldername(name))[1]
    )
  );
