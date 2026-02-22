-- RPC functions for checkout/order/payment flow.
-- Run after 001_miniminds_schema.sql and 002_seed_catalog.sql

begin;

-- --------------------------------------
-- 1) Create checkout order (atomic)
-- --------------------------------------
create or replace function public.mm_create_checkout_order(
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text default null,
  p_user_id uuid default null,
  p_fulfillment_mode fulfillment_mode default 'pdf',
  p_payment_method text default 'upi',
  p_item_ids text[] default '{}',
  p_shipping jsonb default null,
  p_notes text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_item_count integer := 0;
  v_subtotal numeric(10,2) := 0;
  v_printing numeric(10,2) := 0;
  v_shipping numeric(10,2) := 0;
  v_tax numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_address_line1 text;
  v_city text;
  v_state text;
  v_postal_code text;
  v_country text;
begin
  if coalesce(array_length(p_item_ids, 1), 0) = 0 then
    raise exception 'No item IDs provided';
  end if;

  if trim(coalesce(p_customer_email, '')) = '' or trim(coalesce(p_customer_name, '')) = '' then
    raise exception 'Customer email and name are required';
  end if;

  -- Resolve/create customer
  if p_user_id is not null then
    select c.id into v_customer_id
    from public.customers c
    where c.user_id = p_user_id
    limit 1;
  end if;

  if v_customer_id is null then
    select c.id into v_customer_id
    from public.customers c
    where c.email = p_customer_email::citext
    order by c.created_at desc
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (user_id, email, full_name, phone)
    values (p_user_id, p_customer_email::citext, trim(p_customer_name), nullif(trim(coalesce(p_customer_phone, '')), ''))
    returning id into v_customer_id;
  else
    update public.customers
    set
      user_id = coalesce(user_id, p_user_id),
      full_name = trim(p_customer_name),
      phone = nullif(trim(coalesce(p_customer_phone, '')), ''),
      email = p_customer_email::citext
    where id = v_customer_id;
  end if;

  -- Create order shell
  insert into public.orders (
    customer_id,
    user_id,
    status,
    fulfillment_mode,
    payment_method,
    notes,
    metadata
  )
  values (
    v_customer_id,
    p_user_id,
    'payment_pending',
    p_fulfillment_mode,
    p_payment_method,
    p_notes,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_order_id;

  -- Shipping details for print orders
  if p_fulfillment_mode = 'print' then
    v_address_line1 := trim(coalesce(p_shipping->>'addressLine1', ''));
    v_city := trim(coalesce(p_shipping->>'city', ''));
    v_state := trim(coalesce(p_shipping->>'state', ''));
    v_postal_code := trim(coalesce(p_shipping->>'postalCode', ''));
    v_country := coalesce(nullif(trim(coalesce(p_shipping->>'country', '')), ''), 'IN');

    if v_address_line1 = '' or v_city = '' or v_state = '' or v_postal_code = '' then
      raise exception 'Shipping address is required for print fulfillment';
    end if;

    insert into public.order_shipping_addresses (
      order_id,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country
    )
    values (
      v_order_id,
      v_address_line1,
      nullif(trim(coalesce(p_shipping->>'addressLine2', '')), ''),
      v_city,
      v_state,
      v_postal_code,
      v_country
    );
  end if;

  -- Add paid, active bundles only
  insert into public.order_items (order_id, bundle_id, bundle_name_snapshot, unit_price, quantity)
  select
    v_order_id,
    b.id,
    b.name,
    b.price,
    1
  from (
    select distinct unnest(p_item_ids) as bundle_id
  ) s
  join public.bundle_catalog b on b.id = s.bundle_id
  where b.is_active = true
    and b.is_free = false;

  get diagnostics v_item_count = row_count;
  if v_item_count = 0 then
    raise exception 'No eligible paid bundles found for order';
  end if;

  select coalesce(sum(oi.line_total), 0)::numeric(10,2)
  into v_subtotal
  from public.order_items oi
  where oi.order_id = v_order_id;

  if p_fulfillment_mode = 'print' then
    v_printing := round((v_item_count * 120.00)::numeric, 2);
    v_shipping := 79.00;
  end if;

  v_tax := round(((v_subtotal + v_printing + v_shipping) * 0.18)::numeric, 2);
  v_total := round((v_subtotal + v_printing + v_shipping + v_tax)::numeric, 2);

  update public.orders
  set
    subtotal = v_subtotal,
    printing_fee = v_printing,
    shipping_fee = v_shipping,
    tax_amount = v_tax,
    total_amount = v_total,
    currency = 'INR'
  where id = v_order_id;

  return jsonb_build_object(
    'orderId', v_order_id,
    'itemCount', v_item_count,
    'amounts', jsonb_build_object(
      'subtotal', v_subtotal,
      'printing', v_printing,
      'shipping', v_shipping,
      'tax', v_tax,
      'total', v_total,
      'currency', 'INR'
    )
  );
end;
$$;

-- --------------------------------------
-- 2) Mark paid + provision fulfillment
-- --------------------------------------
create or replace function public.mm_mark_order_paid_and_provision(
  p_order_id uuid,
  p_provider payment_provider default 'unknown',
  p_gateway_order_id text default null,
  p_gateway_payment_id text default null,
  p_gateway_session_id text default null,
  p_payment_status payment_status default 'captured',
  p_provider_event_id text default null,
  p_raw_payload jsonb default '{}'::jsonb,
  p_token_ttl_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_payment_id uuid;
begin
  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found: %', p_order_id;
  end if;

  if p_provider_event_id is not null then
    insert into public.payments (
      order_id, provider, status, amount, currency,
      gateway_order_id, gateway_payment_id, gateway_session_id,
      provider_event_id, raw_payload, processed_at
    )
    values (
      v_order.id, p_provider, p_payment_status, v_order.total_amount, v_order.currency,
      p_gateway_order_id, p_gateway_payment_id, p_gateway_session_id,
      p_provider_event_id, coalesce(p_raw_payload, '{}'::jsonb), now()
    )
    on conflict (provider, provider_event_id) where provider_event_id is not null
    do update set
      status = excluded.status,
      gateway_order_id = excluded.gateway_order_id,
      gateway_payment_id = excluded.gateway_payment_id,
      gateway_session_id = excluded.gateway_session_id,
      raw_payload = excluded.raw_payload,
      processed_at = now(),
      updated_at = now()
    returning id into v_payment_id;
  else
    insert into public.payments (
      order_id, provider, status, amount, currency,
      gateway_order_id, gateway_payment_id, gateway_session_id,
      raw_payload, processed_at
    )
    values (
      v_order.id, p_provider, p_payment_status, v_order.total_amount, v_order.currency,
      p_gateway_order_id, p_gateway_payment_id, p_gateway_session_id,
      coalesce(p_raw_payload, '{}'::jsonb), now()
    )
    returning id into v_payment_id;
  end if;

  if v_order.status = 'paid' then
    return jsonb_build_object(
      'orderId', v_order.id,
      'status', 'paid',
      'paymentId', v_payment_id,
      'message', 'Order already paid'
    );
  end if;

  update public.orders
  set status = 'paid', updated_at = now()
  where id = v_order.id;

  if v_order.fulfillment_mode = 'pdf' then
    insert into public.download_entitlements (
      order_item_id,
      order_id,
      token_hash,
      token_hint,
      expires_at,
      max_downloads
    )
    select
      oi.id,
      oi.order_id,
      public.hash_download_token(gen_random_uuid()::text),
      'init',
      now() + make_interval(days => greatest(p_token_ttl_days, 1)),
      5
    from public.order_items oi
    where oi.order_id = v_order.id
    on conflict (order_item_id) do nothing;
  else
    insert into public.delivery_tracking (order_id, status, eta_days, latest_update)
    values (v_order.id, 'processing', '5-7', 'Order confirmed and queued for print')
    on conflict (order_id) do update
    set
      status = excluded.status,
      eta_days = excluded.eta_days,
      latest_update = excluded.latest_update,
      updated_at = now();
  end if;

  return jsonb_build_object(
    'orderId', v_order.id,
    'status', 'paid',
    'paymentId', v_payment_id
  );
end;
$$;

-- --------------------------------------
-- 3) Issue/rotate one download token
-- --------------------------------------
create or replace function public.mm_issue_download_token(
  p_entitlement_id uuid,
  p_token_ttl_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_raw_token text;
  v_expires_at timestamptz;
begin
  if p_token_ttl_days <= 0 then
    p_token_ttl_days := 1;
  end if;

  v_raw_token := encode(gen_random_bytes(24), 'hex');
  v_expires_at := now() + make_interval(days => p_token_ttl_days);

  update public.download_entitlements de
  set
    token_hash = public.hash_download_token(v_raw_token),
    token_hint = right(v_raw_token, 6),
    expires_at = v_expires_at
  where de.id = p_entitlement_id
    and de.is_revoked = false;

  if not found then
    raise exception 'Entitlement not found or revoked: %', p_entitlement_id;
  end if;

  return jsonb_build_object(
    'token', v_raw_token,
    'expiresAt', v_expires_at
  );
end;
$$;

-- --------------------------------------
-- 4) Order success payload (frontend-ready)
-- --------------------------------------
create or replace function public.mm_get_order_success_payload(
  p_order_id uuid,
  p_include_download_tokens boolean default true,
  p_token_ttl_days integer default 30,
  p_api_base_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_tracking jsonb := null;
  v_items jsonb := '[]'::jsonb;
  v_downloads jsonb := '[]'::jsonb;
  v_ent record;
  v_token_payload jsonb;
  v_token text;
  v_expiry timestamptz;
  v_download_url text;
begin
  select *
  into v_order
  from public.orders
  where id = p_order_id;

  if not found then
    raise exception 'Order not found: %', p_order_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'bundleId', oi.bundle_id,
        'name', oi.bundle_name_snapshot,
        'price', oi.unit_price,
        'quantity', oi.quantity
      )
      order by oi.created_at asc
    ),
    '[]'::jsonb
  )
  into v_items
  from public.order_items oi
  where oi.order_id = v_order.id;

  if v_order.fulfillment_mode = 'print' then
    select jsonb_build_object(
      'status', dt.status,
      'trackingId', dt.tracking_id,
      'carrier', dt.carrier,
      'etaDays', dt.eta_days,
      'latestUpdate', dt.latest_update,
      'updatedAt', dt.updated_at
    )
    into v_tracking
    from public.delivery_tracking dt
    where dt.order_id = v_order.id;
  else
    for v_ent in
      select
        de.id as entitlement_id,
        oi.bundle_id,
        oi.bundle_name_snapshot
      from public.download_entitlements de
      join public.order_items oi on oi.id = de.order_item_id
      where de.order_id = v_order.id
        and de.is_revoked = false
      order by de.created_at asc
    loop
      if p_include_download_tokens then
        v_token_payload := public.mm_issue_download_token(v_ent.entitlement_id, p_token_ttl_days);
        v_token := v_token_payload->>'token';
        v_expiry := (v_token_payload->>'expiresAt')::timestamptz;
      else
        v_token := null;
        select de.expires_at into v_expiry
        from public.download_entitlements de
        where de.id = v_ent.entitlement_id;
      end if;

      if v_token is null then
        v_download_url := null;
      elsif p_api_base_url is null or trim(p_api_base_url) = '' then
        v_download_url := '/api/download/' || v_token;
      else
        v_download_url := rtrim(trim(p_api_base_url), '/') || '/api/download/' || v_token;
      end if;

      v_downloads := v_downloads || jsonb_build_object(
        'bundleId', v_ent.bundle_id,
        'bundleName', v_ent.bundle_name_snapshot,
        'token', v_token,
        'expiresAt', v_expiry,
        'downloadUrl', v_download_url
      );
    end loop;
  end if;

  return jsonb_build_object(
    'orderId', v_order.id,
    'orderNumber', v_order.order_number,
    'status', v_order.status,
    'paidAt', (
      select p.processed_at
      from public.payments p
      where p.order_id = v_order.id
        and p.status in ('captured', 'authorized')
      order by p.processed_at desc nulls last
      limit 1
    ),
    'fulfillment', jsonb_build_object(
      'mode', v_order.fulfillment_mode,
      'shippingAddress', (
        select to_jsonb(s)
        from (
          select
            osa.address_line1 as "addressLine1",
            osa.address_line2 as "addressLine2",
            osa.city,
            osa.state,
            osa.postal_code as "postalCode",
            osa.country
          from public.order_shipping_addresses osa
          where osa.order_id = v_order.id
          limit 1
        ) s
      )
    ),
    'amounts', jsonb_build_object(
      'subtotal', v_order.subtotal,
      'printing', v_order.printing_fee,
      'shipping', v_order.shipping_fee,
      'tax', v_order.tax_amount,
      'total', v_order.total_amount,
      'currency', v_order.currency
    ),
    'items', v_items,
    'downloads', v_downloads,
    'tracking', v_tracking
  );
end;
$$;

-- --------------------------------------
-- 5) Webhook event journal (idempotent)
-- --------------------------------------
create or replace function public.mm_record_webhook_event(
  p_provider payment_provider,
  p_provider_event_id text,
  p_event_type text,
  p_signature_valid boolean,
  p_payload jsonb,
  p_processed_at timestamptz default null,
  p_process_error text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if trim(coalesce(p_provider_event_id, '')) = '' then
    raise exception 'provider_event_id is required';
  end if;

  insert into public.webhook_events (
    provider,
    provider_event_id,
    event_type,
    signature_valid,
    payload,
    processed_at,
    process_error
  )
  values (
    p_provider,
    p_provider_event_id,
    p_event_type,
    coalesce(p_signature_valid, false),
    coalesce(p_payload, '{}'::jsonb),
    p_processed_at,
    p_process_error
  )
  on conflict (provider, provider_event_id)
  do update set
    event_type = excluded.event_type,
    signature_valid = excluded.signature_valid,
    payload = excluded.payload,
    processed_at = excluded.processed_at,
    process_error = excluded.process_error
  returning id into v_id;

  return v_id;
end;
$$;

-- --------------------------------------
-- Grants
-- --------------------------------------
revoke all on function public.mm_create_checkout_order(text,text,text,uuid,fulfillment_mode,text,text[],jsonb,text,jsonb) from public;
revoke all on function public.mm_mark_order_paid_and_provision(uuid,payment_provider,text,text,text,payment_status,text,jsonb,integer) from public;
revoke all on function public.mm_issue_download_token(uuid,integer) from public;
revoke all on function public.mm_get_order_success_payload(uuid,boolean,integer,text) from public;
revoke all on function public.mm_record_webhook_event(payment_provider,text,text,boolean,jsonb,timestamptz,text) from public;

grant execute on function public.mm_create_checkout_order(text,text,text,uuid,fulfillment_mode,text,text[],jsonb,text,jsonb) to service_role;
grant execute on function public.mm_mark_order_paid_and_provision(uuid,payment_provider,text,text,text,payment_status,text,jsonb,integer) to service_role;
grant execute on function public.mm_issue_download_token(uuid,integer) to service_role;
grant execute on function public.mm_get_order_success_payload(uuid,boolean,integer,text) to service_role;
grant execute on function public.mm_record_webhook_event(payment_provider,text,text,boolean,jsonb,timestamptz,text) to service_role;

commit;
