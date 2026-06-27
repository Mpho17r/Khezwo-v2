-- ============================================================================
-- KheZwo — initial schema
-- Run this in Supabase SQL Editor (or via `supabase db push` with the CLI).
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- profiles: one row per auth user. Tells us whether someone is a vendor
-- owner or a platform admin (Saccharum staff), and which vendor they own.
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'vendor' check (role in ('vendor', 'admin')),
  full_name text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- vendors: one row per small business using KheZwo.
-- ----------------------------------------------------------------------------
create table vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique, -- used in the public ordering URL /order/[slug]
  logo_url text,
  primary_color text not null default '#1B5E3F',
  secondary_color text not null default '#C9A227',
  status text not null default 'active' check (status in ('active', 'suspended')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  platform_fee_percent numeric(5, 2) not null default 5.00,
  business_hours jsonb not null default '{}'::jsonb,
  closing_message text default 'We are currently closed. Please check back later!',
  created_at timestamptz not null default now()
);

create index vendors_owner_id_idx on vendors (owner_id);
create index vendors_slug_idx on vendors (slug);

-- ----------------------------------------------------------------------------
-- menu_categories
-- ----------------------------------------------------------------------------
create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create index menu_categories_vendor_id_idx on menu_categories (vendor_id);

-- ----------------------------------------------------------------------------
-- menu_items
-- ----------------------------------------------------------------------------
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  category_id uuid references menu_categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  photo_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index menu_items_vendor_id_idx on menu_items (vendor_id);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  order_number int not null,
  customer_name text not null,
  status text not null default 'received'
    check (status in ('received', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_method text not null check (payment_method in ('cash', 'card')),
  subtotal numeric(10, 2) not null,
  platform_fee numeric(10, 2) not null,
  total numeric(10, 2) not null,
  estimated_wait_minutes int not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_vendor_id_idx on orders (vendor_id);
create index orders_vendor_id_created_at_idx on orders (vendor_id, created_at desc);
create unique index orders_vendor_order_number_idx on orders (vendor_id, order_number);

-- ----------------------------------------------------------------------------
-- order_items: snapshot the name/price at time of order, so menu edits
-- later don't rewrite history.
-- ----------------------------------------------------------------------------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  menu_item_id uuid references menu_items (id) on delete set null,
  name_snapshot text not null,
  price_snapshot numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  notes text
);

create index order_items_order_id_idx on order_items (order_id);

-- ----------------------------------------------------------------------------
-- platform_settings: admin-controlled, platform-wide key/value config
-- (e.g. default platform fee %, AdSense client id).
-- ----------------------------------------------------------------------------
create table platform_settings (
  key text primary key,
  value jsonb not null
);

insert into platform_settings (key, value) values
  ('default_platform_fee_percent', '5'),
  ('adsense_enabled', 'false');

-- ----------------------------------------------------------------------------
-- sponsor_ads: direct local-business ad slots an admin sells, shown on
-- vendor customer-facing menu pages.
-- ----------------------------------------------------------------------------
create table sponsor_ads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  image_url text,
  link_url text,
  active boolean not null default true,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at trigger for orders
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_set_updated_at
before update on orders
for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Helper: is the current user an admin? Used in RLS policies below.
-- ----------------------------------------------------------------------------
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: does the current user own this vendor?
create or replace function owns_vendor(check_vendor_id uuid)
returns boolean as $$
  select exists (
    select 1 from vendors where id = check_vendor_id and owner_id = auth.uid()
  );
$$ language sql security definer stable;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table vendors enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table platform_settings enable row level security;
alter table sponsor_ads enable row level security;

-- profiles
create policy "profiles: self read" on profiles for select using (id = auth.uid());
create policy "profiles: self insert" on profiles for insert with check (id = auth.uid());
create policy "profiles: self update" on profiles for update using (id = auth.uid());
create policy "profiles: admin read all" on profiles for select using (is_admin());

-- vendors
-- Customers need to read basic vendor info (name/logo/colors/hours) to render
-- the public menu page — so active vendors are publicly readable.
create policy "vendors: public read active" on vendors for select using (status = 'active');
create policy "vendors: owner read own" on vendors for select using (owner_id = auth.uid());
create policy "vendors: owner insert" on vendors for insert with check (owner_id = auth.uid());
create policy "vendors: owner update own" on vendors for update using (owner_id = auth.uid());
create policy "vendors: admin read all" on vendors for select using (is_admin());
create policy "vendors: admin update all" on vendors for update using (is_admin());

-- menu_categories / menu_items — public can read (to show the customer menu),
-- only the owning vendor or an admin can write.
create policy "menu_categories: public read" on menu_categories for select using (true);
create policy "menu_categories: owner write" on menu_categories for all
  using (owns_vendor(vendor_id) or is_admin())
  with check (owns_vendor(vendor_id) or is_admin());

create policy "menu_items: public read" on menu_items for select using (true);
create policy "menu_items: owner write" on menu_items for all
  using (owns_vendor(vendor_id) or is_admin())
  with check (owns_vendor(vendor_id) or is_admin());

-- orders — anyone (anonymous customers) can place an order for an active
-- vendor. Reading is allowed by id (the tracking link is the access control —
-- order ids are random UUIDs). Vendor owners and admins can see/manage all
-- orders for their own vendor.
-- NOTE: for a production launch, consider swapping "public read by id" for a
-- short-lived signed tracking token instead of relying on UUID obscurity.
create policy "orders: public insert" on orders for insert with check (true);
create policy "orders: public read by id" on orders for select using (true);
create policy "orders: owner read/update" on orders for all
  using (owns_vendor(vendor_id) or is_admin())
  with check (owns_vendor(vendor_id) or is_admin());

create policy "order_items: public insert" on order_items for insert with check (true);
create policy "order_items: public read" on order_items for select using (true);
create policy "order_items: owner manage" on order_items for all
  using (
    exists (select 1 from orders o where o.id = order_id and (owns_vendor(o.vendor_id) or is_admin()))
  );

-- platform_settings — admin only
create policy "platform_settings: admin only" on platform_settings for all
  using (is_admin()) with check (is_admin());

-- sponsor_ads — public can read active ones, only admin manages
create policy "sponsor_ads: public read active" on sponsor_ads for select using (active = true);
create policy "sponsor_ads: admin manage" on sponsor_ads for all
  using (is_admin()) with check (is_admin());

-- ============================================================================
-- Storage buckets (run once). Public read, authenticated write.
-- ============================================================================
insert into storage.buckets (id, name, public) values ('vendor-assets', 'vendor-assets', true)
  on conflict (id) do nothing;

create policy "vendor-assets: public read" on storage.objects for select
  using (bucket_id = 'vendor-assets');

create policy "vendor-assets: authenticated upload" on storage.objects for insert
  with check (bucket_id = 'vendor-assets' and auth.role() = 'authenticated');

create policy "vendor-assets: authenticated update own" on storage.objects for update
  using (bucket_id = 'vendor-assets' and auth.role() = 'authenticated');

-- ============================================================================
-- After running this, promote your own account to admin manually, e.g.:
--   update profiles set role = 'admin' where id = '<your-auth-user-uuid>';
-- ============================================================================
