alter table public.orders add column if not exists confirmation_number text;

update public.orders
set confirmation_number = 'LD-' || upper(substr(replace(id::text, '-', ''), 1, 10))
where confirmation_number is null or confirmation_number = '';

alter table public.orders alter column confirmation_number set not null;
create unique index if not exists orders_confirmation_number_key on public.orders (confirmation_number);

create or replace function public.fulfill_checkout_order(
  p_session_id text,
  p_payment_intent_id text,
  p_user_id uuid,
  p_email text,
  p_variant_id uuid,
  p_quantity integer,
  p_unit_price_cents integer,
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
  v_variant record;
begin
  if p_session_id = '' or p_variant_id is null or p_quantity < 1 or p_unit_price_cents < 1 or p_subtotal_cents < 0 or p_tax_cents < 0 or p_shipping_cents < 0 or p_total_cents < 0 or p_email = '' then
    raise exception 'invalid fulfillment payload';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_session_id, 0));

  select id into v_order_id
  from public.orders
  where stripe_checkout_session_id = p_session_id;
  if found then return v_order_id; end if;

  update public.product_variants
  set inventory_quantity = inventory_quantity - p_quantity
  where id = p_variant_id and active = true and inventory_quantity >= p_quantity
  returning id, name into v_variant;
  if not found then raise exception 'variant unavailable'; end if;

  insert into public.orders (user_id, email, status, subtotal_cents, tax_cents, shipping_cents, total_cents, stripe_checkout_session_id, stripe_payment_intent_id, shipping_address)
  values (p_user_id, p_email, 'paid', p_subtotal_cents, p_tax_cents, p_shipping_cents, p_total_cents, p_session_id, p_payment_intent_id, p_shipping_address)
  returning id into v_order_id;

  update public.orders
  set confirmation_number = 'LD-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 10))
  where id = v_order_id;

  insert into public.order_items (order_id, variant_id, product_name, variant_name, unit_price_cents, quantity)
  values (v_order_id, v_variant.id, 'LumaDesk Pro', v_variant.name, p_unit_price_cents, p_quantity);

  return v_order_id;
end;
$$;

revoke all on function public.fulfill_checkout_order(text, text, uuid, text, uuid, integer, integer, integer, integer, integer, integer, jsonb) from public, anon, authenticated;
grant execute on function public.fulfill_checkout_order(text, text, uuid, text, uuid, integer, integer, integer, integer, integer, integer, jsonb) to service_role;
