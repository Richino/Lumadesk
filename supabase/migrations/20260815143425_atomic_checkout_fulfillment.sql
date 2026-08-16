create function public.fulfill_checkout_order(
  p_session_id text,
  p_payment_intent_id text,
  p_user_id uuid,
  p_email text,
  p_variant_id uuid,
  p_quantity integer,
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
  select id into v_order_id from public.orders where stripe_checkout_session_id = p_session_id;
  if found then return v_order_id; end if;

  update public.product_variants
  set inventory_quantity = inventory_quantity - p_quantity
  where id = p_variant_id and active = true and inventory_quantity >= p_quantity
  returning id, name, price_cents into v_variant;
  if not found then raise exception 'variant unavailable'; end if;

  insert into public.orders (user_id, email, status, subtotal_cents, tax_cents, shipping_cents, total_cents, stripe_checkout_session_id, stripe_payment_intent_id, shipping_address)
  values (p_user_id, p_email, 'paid', p_subtotal_cents, p_tax_cents, p_shipping_cents, p_total_cents, p_session_id, p_payment_intent_id, p_shipping_address)
  returning id into v_order_id;

  insert into public.order_items (order_id, variant_id, product_name, variant_name, unit_price_cents, quantity)
  values (v_order_id, v_variant.id, 'LumaDesk Pro', v_variant.name, v_variant.price_cents, p_quantity);
  return v_order_id;
end;
$$;

revoke all on function public.fulfill_checkout_order(text, text, uuid, text, uuid, integer, integer, integer, integer, integer, jsonb) from public, anon, authenticated;
grant execute on function public.fulfill_checkout_order(text, text, uuid, text, uuid, integer, integer, integer, integer, integer, jsonb) to service_role;
