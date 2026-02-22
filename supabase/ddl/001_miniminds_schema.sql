-- MiniMinds Supabase Schema (Postgres)
-- Run this in Supabase SQL Editor as a single script.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

-- -----------------------------
-- Enums
-- -----------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'fulfillment_mode') then
    create type fulfillment_mode as enum ('pdf', 'print');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'payment_pending',
      'paid',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_provider') then
    create type payment_provider as enum ('stripe', 'razorpay', 'manual', 'unknown');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum (
      'initiated',
      'authorized',
      'captured',
      'failed',
      'refunded',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type delivery_status as enum (
      'not_applicable',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled'
    );
  end if;
end $$;

-- -----------------------------
-- Utility Functions
-- -----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.hash_download_token(raw_token text)
returns text
language sql
immutable
strict
as $$
  select encode(digest(raw_token, 'sha256'), 'hex');
$$;

-- -----------------------------
-- Catalog
-- -----------------------------
create table if not exists public.bundle_catalog (
  id text primary key,
  name text not null,
  age_range text,
  is_free boolean not null default false,
  price numeric(10,2) not null default 0 check (price >= 0),
  worksheet_count integer not null default 0 check (worksheet_count >= 0),
  cover_image_url text,
  pdf_storage_path text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_bundle_catalog_updated_at
before update on public.bundle_catalog
for each row execute function public.set_updated_at();

-- -----------------------------
-- Customers
-- -----------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email citext not null,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_user_unique unique (user_id)
);

create index if not exists idx_customers_email on public.customers (email);

create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- -----------------------------
-- Orders
-- -----------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('MM-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  customer_id uuid not null references public.customers(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  status order_status not null default 'payment_pending',
  fulfillment_mode fulfillment_mode not null,
  payment_method text,
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  printing_fee numeric(10,2) not null default 0 check (printing_fee >= 0),
  shipping_fee numeric(10,2) not null default 0 check (shipping_fee >= 0),
  tax_amount numeric(10,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  currency char(3) not null default 'INR',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer_created on public.orders (customer_id, created_at desc);
create index if not exists idx_orders_user_created on public.orders (user_id, created_at desc);
create index if not exists idx_orders_status_created on public.orders (status, created_at desc);

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'IN',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  bundle_id text not null references public.bundle_catalog(id) on delete restrict,
  bundle_name_snapshot text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  line_total numeric(10,2) generated always as (round((unit_price * quantity)::numeric, 2)) stored,
  created_at timestamptz not null default now(),
  constraint order_items_order_bundle_unique unique (order_id, bundle_id)
);

create index if not exists idx_order_items_order on public.order_items (order_id);

-- -----------------------------
-- Payments + Webhooks
-- -----------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider payment_provider not null default 'unknown',
  status payment_status not null default 'initiated',
  amount numeric(10,2) not null check (amount >= 0),
  currency char(3) not null default 'INR',
  gateway_order_id text,
  gateway_payment_id text,
  gateway_session_id text,
  gateway_signature text,
  provider_event_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_payments_gateway_payment_id
  on public.payments (gateway_payment_id)
  where gateway_payment_id is not null;

create unique index if not exists ux_payments_provider_event_id
  on public.payments (provider, provider_event_id)
  where provider_event_id is not null;

create index if not exists idx_payments_order_created on public.payments (order_id, created_at desc);

create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider payment_provider not null,
  provider_event_id text not null,
  event_type text not null,
  signature_valid boolean not null default false,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  process_error text,
  constraint webhook_provider_event_unique unique (provider, provider_event_id)
);

create index if not exists idx_webhook_received on public.webhook_events (provider, received_at desc);

-- -----------------------------
-- Downloads + Fulfillment Tracking
-- -----------------------------
create table if not exists public.download_entitlements (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  token_hash text not null unique,
  token_hint text,
  expires_at timestamptz,
  max_downloads integer not null default 5 check (max_downloads > 0),
  download_count integer not null default 0 check (download_count >= 0),
  last_downloaded_at timestamptz,
  is_revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_download_entitlements_order on public.download_entitlements (order_id);
create index if not exists idx_download_entitlements_active on public.download_entitlements (is_revoked, expires_at);

create table if not exists public.delivery_tracking (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  status delivery_status not null default 'processing',
  tracking_id text unique,
  carrier text,
  eta_days text,
  latest_update text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_delivery_tracking_updated_at
before update on public.delivery_tracking
for each row execute function public.set_updated_at();

-- -----------------------------
-- RLS
-- -----------------------------
alter table public.bundle_catalog enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_shipping_addresses enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;
alter table public.download_entitlements enable row level security;
alter table public.delivery_tracking enable row level security;

-- Public catalog access (needed if frontend queries Supabase directly)
drop policy if exists bundle_catalog_public_read on public.bundle_catalog;
create policy bundle_catalog_public_read
on public.bundle_catalog
for select
using (is_active = true);

-- Authenticated user read access to own data
drop policy if exists customers_self_read on public.customers;
create policy customers_self_read
on public.customers
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists orders_self_read on public.orders;
create policy orders_self_read
on public.orders
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists order_items_self_read on public.order_items;
create policy order_items_self_read
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists order_shipping_self_read on public.order_shipping_addresses;
create policy order_shipping_self_read
on public.order_shipping_addresses
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_shipping_addresses.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists payments_self_read on public.payments;
create policy payments_self_read
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = payments.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists entitlements_self_read on public.download_entitlements;
create policy entitlements_self_read
on public.download_entitlements
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = download_entitlements.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists tracking_self_read on public.delivery_tracking;
create policy tracking_self_read
on public.delivery_tracking
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = delivery_tracking.order_id
      and o.user_id = auth.uid()
  )
);

-- webhooks table intentionally has no client-read policies
-- service_role can still read/write all tables.

commit;
