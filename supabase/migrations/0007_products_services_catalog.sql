-- KheZwo Stage 3: support both products and service listings.
-- Existing menu items remain products by default, preserving current storefronts.

alter table public.menu_items
  add column if not exists item_type text not null default 'product'
  check (item_type in ('product', 'service'));

create index if not exists menu_items_vendor_type_available_idx
  on public.menu_items (vendor_id, item_type, is_available);

create table if not exists public.service_enquiries (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 120),
  contact_value text not null check (char_length(trim(contact_value)) between 3 and 254),
  message text not null default '' check (char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_enquiries_vendor_created_idx
  on public.service_enquiries (vendor_id, created_at desc);

create index if not exists service_enquiries_item_idx
  on public.service_enquiries (menu_item_id);

alter table public.service_enquiries enable row level security;

-- Anonymous customers may submit an enquiry only for an available service
-- belonging to an active business. Enquiries are never publicly readable.
drop policy if exists "service enquiries: public submit service enquiry" on public.service_enquiries;
create policy "service enquiries: public submit service enquiry"
  on public.service_enquiries for insert to anon, authenticated
  with check (
    exists (
      select 1
      from public.menu_items mi
      join public.vendors v on v.id = mi.vendor_id
      where mi.id = menu_item_id
        and mi.vendor_id = service_enquiries.vendor_id
        and mi.item_type = 'service'
        and mi.is_available = true
        and v.status = 'active'
    )
  );

drop policy if exists "service enquiries: owner read own" on public.service_enquiries;
create policy "service enquiries: owner read own"
  on public.service_enquiries for select to authenticated
  using (public.owns_vendor(vendor_id) or public.is_admin());

drop policy if exists "service enquiries: owner update own" on public.service_enquiries;
create policy "service enquiries: owner update own"
  on public.service_enquiries for update to authenticated
  using (public.owns_vendor(vendor_id) or public.is_admin())
  with check (public.owns_vendor(vendor_id) or public.is_admin());

create trigger service_enquiries_set_updated_at
before update on public.service_enquiries
for each row execute function public.set_updated_at();

-- Defense in depth: the existing public checkout RPC is for products only.
-- Reject service rows at the database boundary even if a caller bypasses the UI.
create or replace function public.reject_service_order_item()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.menu_item_id is not null and exists (
    select 1 from public.menu_items mi
    where mi.id = new.menu_item_id and mi.item_type = 'service'
  ) then
    raise exception 'Service listings must use an enquiry, not product checkout.';
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_reject_service_listing on public.order_items;
create trigger order_items_reject_service_listing
before insert or update of menu_item_id on public.order_items
for each row execute function public.reject_service_order_item();

-- Least-privilege column grants: public callers cannot choose enquiry IDs,
-- timestamps or status; vendors can update only the workflow status.
revoke insert on public.service_enquiries from anon, authenticated;
grant insert (vendor_id, menu_item_id, customer_name, contact_value, message)
  on public.service_enquiries to anon, authenticated;
revoke update on public.service_enquiries from authenticated;
grant update (status) on public.service_enquiries to authenticated;
