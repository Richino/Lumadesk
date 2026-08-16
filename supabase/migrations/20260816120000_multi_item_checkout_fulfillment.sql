-- Multi-item checkout fulfillment.
--
-- The original fulfill_checkout_order recorded exactly one variant per order.
-- The storefront bag can now hold several desk configurations, so fulfillment
-- takes a jsonb array of line items and records one order with many
-- order_items, decrementing inventory per variant inside the same transaction.

drop function if exists public.fulfill_checkout_order(
  text, text, uuid, text, uuid, integer, integer, integer, integer, integer, jsonb
);

create or replace function public.fulfill_checkout_order(
  p_session_id text,
  p_payment_intent_id text,
  p_user_id uuid,
  p_email text,
  p_items jsonb,
  p_subtotal_cents integer,
  p_tax_cents integer,
  p_shipping_cents integer,
  p_total_cents integer,
  p_shipping_address jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity integer;
  v_unit_price integer;
  v_variant_name text;
begin
  if p_session_id = '' or p_email = ''
     or p_subtotal_cents < 0 or p_tax_cents < 0 or p_shipping_cents < 0 or p_total_cents < 0
     or p_items is null or pg_catalog.jsonb_typeof(p_items) <> 'array'
     or pg_catalog.jsonb_array_length(p_items) = 0 then
    raise exception 'invalid fulfillment payload';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_session_id, 0));

  select id into v_order_id
  from public.orders
  where stripe_checkout_session_id = p_session_id;
  if found then return v_order_id; end if;

  -- Generate the id up front so the confirmation number can be derived from it
  -- (the orders.confirmation_number column is NOT NULL with no default).
  v_order_id := pg_catalog.gen_random_uuid();
  insert into public.orders (
    id, confirmation_number, user_id, email, status, subtotal_cents, tax_cents, shipping_cents, total_cents,
    stripe_checkout_session_id, stripe_payment_intent_id, shipping_address
  )
  values (
    v_order_id,
    'LD-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 10)),
    p_user_id, p_email, 'paid', p_subtotal_cents, p_tax_cents, p_shipping_cents, p_total_cents,
    p_session_id, p_payment_intent_id, p_shipping_address
  );

  for v_item in select value from pg_catalog.jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price_cents')::integer;
    if v_variant_id is null or v_quantity < 1 or v_quantity > 10 or v_unit_price < 1 then
      raise exception 'invalid fulfillment item';
    end if;

    update public.product_variants
    set inventory_quantity = inventory_quantity - v_quantity
    where id = v_variant_id and active = true and inventory_quantity >= v_quantity
    returning name into v_variant_name;
    if not found then raise exception 'variant unavailable'; end if;

    insert into public.order_items (
      order_id, variant_id, product_name, variant_name, unit_price_cents, quantity
    )
    values (v_order_id, v_variant_id, 'LumaDesk Pro', v_variant_name, v_unit_price, v_quantity);
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.fulfill_checkout_order(
  text, text, uuid, text, jsonb, integer, integer, integer, integer, jsonb
) from public, anon, authenticated;
grant execute on function public.fulfill_checkout_order(
  text, text, uuid, text, jsonb, integer, integer, integer, integer, jsonb
) to service_role;
