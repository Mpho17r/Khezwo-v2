-- Secure public checkout and order tracking with opaque bearer tokens.
-- Apply only after reviewing the coordinated application changes on this branch.

alter table public.orders
  add column if not exists tracking_token uuid not null default gen_random_uuid();

create unique index if not exists orders_tracking_token_uidx
  on public.orders (tracking_token);

-- Remove broad anonymous access. Vendor/admin access remains governed by the
-- existing owner/admin policies and the policies added in migration 0002.
drop policy if exists "orders: public insert" on public.orders;
drop policy if exists "orders: public read by id" on public.orders;
drop policy if exists "order_items: public insert" on public.order_items;
drop policy if exists "order_items: public read" on public.order_items;

-- Orders and snapshots are created only by the validated checkout function.
-- Vendors may read and update orders for their own business, but cannot forge
-- orders or alter snapshot prices/items directly through the public table API.
drop policy if exists "orders: owner read/update" on public.orders;
create policy "orders: owner/admin read"
  on public.orders for select
  using (owns_vendor(vendor_id) or is_admin());
create policy "orders: owner/admin update"
  on public.orders for update
  using (owns_vendor(vendor_id) or is_admin())
  with check (owns_vendor(vendor_id) or is_admin());

-- Vendors only need to advance order status from the application. Prevent
-- direct client updates to totals, customer data, order number and tracking token.
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "order_items: owner manage" on public.order_items;
create policy "order_items: owner/admin read"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (owns_vendor(o.vendor_id) or is_admin())
    )
  );

-- Public checkout accepts only item identifiers, quantities and optional notes.
-- Prices and names are read from the database, and the entire order is written
-- within one transaction (a function invocation).
create or replace function public.place_public_order(
  p_vendor_id uuid,
  p_customer_name text,
  p_payment_method text,
  p_items jsonb
)
returns table (created_order_id uuid, created_tracking_token uuid, created_order_number integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_vendor public.vendors%rowtype;
  v_item jsonb;
  v_menu_item public.menu_items%rowtype;
  v_order_id uuid;
  v_tracking_token uuid;
  v_order_number integer;
  v_quantity integer;
  v_notes text;
  v_subtotal numeric(10,2) := 0;
  v_platform_fee numeric(10,2);
  v_seen_ids uuid[] := array[]::uuid[];
begin
  if p_customer_name is null or length(btrim(p_customer_name)) < 1
     or length(btrim(p_customer_name)) > 120 then
    raise exception 'Enter a name of 1 to 120 characters.';
  end if;

  if p_payment_method not in ('cash', 'card') then
    raise exception 'Invalid payment method.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'An order must contain between 1 and 50 cart lines.';
  end if;

  -- Serialize order numbering per vendor to avoid concurrent duplicate numbers.
  select * into v_vendor
  from public.vendors
  where id = p_vendor_id and status = 'active'
  for update;

  if not found then
    raise exception 'This business is not accepting orders right now.';
  end if;

  -- Validate all cart lines and calculate subtotal from authoritative prices.
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item->>'menuItemId', '') = ''
       or coalesce(v_item->>'quantity', '') !~ '^[0-9]+$' then
      raise exception 'Invalid cart line.';
    end if;

    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 50 then
      raise exception 'Item quantities must be between 1 and 50.';
    end if;

    if (v_item->>'menuItemId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'Invalid menu item.';
    end if;

    if (v_item->>'menuItemId')::uuid = any(v_seen_ids) then
      raise exception 'Duplicate cart lines are not allowed.';
    end if;
    v_seen_ids := array_append(v_seen_ids, (v_item->>'menuItemId')::uuid);

    select * into v_menu_item
    from public.menu_items
    where id = (v_item->>'menuItemId')::uuid
      and vendor_id = p_vendor_id
      and is_available = true;

    if not found then
      raise exception 'An item is unavailable or does not belong to this business.';
    end if;

    v_subtotal := v_subtotal + (v_menu_item.price * v_quantity);
    if v_subtotal > 99999999 then
      raise exception 'Order total is too large.';
    end if;
  end loop;

  v_platform_fee := round(v_subtotal * v_vendor.platform_fee_percent / 100, 2);

  select coalesce(max(o.order_number), 0) + 1 into v_order_number
  from public.orders o
  where o.vendor_id = p_vendor_id;

  insert into public.orders (
    vendor_id, order_number, customer_name, payment_method,
    subtotal, platform_fee, total, status
  ) values (
    p_vendor_id, v_order_number, btrim(p_customer_name), p_payment_method,
    v_subtotal, v_platform_fee, v_subtotal + v_platform_fee, 'received'
  )
  returning id, tracking_token into v_order_id, v_tracking_token;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_menu_item
    from public.menu_items
    where id = (v_item->>'menuItemId')::uuid
      and vendor_id = p_vendor_id
      and is_available = true;

    v_notes := nullif(btrim(coalesce(v_item->>'notes', '')), '');
    if v_notes is not null and length(v_notes) > 500 then
      raise exception 'Item notes must be 500 characters or fewer.';
    end if;

    insert into public.order_items (
      order_id, menu_item_id, name_snapshot, price_snapshot, quantity, notes
    ) values (
      v_order_id, v_menu_item.id, v_menu_item.name, v_menu_item.price, v_quantity, v_notes
    );
  end loop;

  return query select v_order_id, v_tracking_token, v_order_number;
end;
$$;

-- This RPC exposes a minimal tracking response only to callers possessing the
-- high-entropy tracking token. It does not expose customer name, totals, or items.
create or replace function public.get_public_order_status(p_tracking_token uuid)
returns table (order_number integer, status text, primary_color text)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select o.order_number, o.status, v.primary_color
  from public.orders o
  join public.vendors v on v.id = o.vendor_id
  where o.tracking_token = p_tracking_token
  limit 1;
$$;

-- Receipt details are also scoped to the same opaque token. Do not return the
-- customer's name or internal order UUID to the public caller.
create or replace function public.get_public_order_receipt(p_tracking_token uuid)
returns table (
  vendor_name text,
  vendor_logo_url text,
  vendor_primary_color text,
  vendor_secondary_color text,
  vendor_slug text,
  order_number integer,
  estimated_wait_minutes integer,
  total numeric,
  items jsonb
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    v.name,
    v.logo_url,
    v.primary_color,
    v.secondary_color,
    v.slug,
    o.order_number,
    o.estimated_wait_minutes,
    o.total,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'name_snapshot', oi.name_snapshot,
          'price_snapshot', oi.price_snapshot,
          'quantity', oi.quantity
        ) order by oi.id
      ) filter (where oi.id is not null),
      '[]'::jsonb
    )
  from public.orders o
  join public.vendors v on v.id = o.vendor_id
  left join public.order_items oi on oi.order_id = o.id
  where o.tracking_token = p_tracking_token
  group by v.id, o.id;
$$;

revoke all on function public.place_public_order(uuid, text, text, jsonb) from public;
revoke all on function public.get_public_order_status(uuid) from public;
revoke all on function public.get_public_order_receipt(uuid) from public;
grant execute on function public.place_public_order(uuid, text, text, jsonb) to anon, authenticated;
grant execute on function public.get_public_order_status(uuid) to anon, authenticated;
grant execute on function public.get_public_order_receipt(uuid) to anon, authenticated;
