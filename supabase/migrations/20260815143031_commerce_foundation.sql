create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  slug text not null unique,
  name text not null,
  finish text not null,
  frame text not null,
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'usd' check (currency = 'usd'),
  image_path text not null,
  active boolean not null default true,
  inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, finish, frame)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  line1 text not null check (char_length(trim(line1)) between 1 and 120),
  line2 text,
  city text not null check (char_length(trim(city)) between 1 and 80),
  state text not null check (char_length(trim(state)) between 2 and 80),
  postal_code text not null check (char_length(trim(postal_code)) between 3 and 16),
  country_code text not null default 'US' check (country_code = 'US'),
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index addresses_one_default_per_user_idx on public.addresses(user_id) where is_default;

create table public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, variant_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'fulfilled', 'cancelled', 'refunded')),
  currency text not null default 'usd' check (currency = 'usd'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_cents = subtotal_cents + shipping_cents + tax_cents)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on public.product_variants(product_id);
create index cart_items_cart_id_idx on public.cart_items(cart_id);
create index addresses_user_id_idx on public.addresses(user_id);
create index wishlist_items_variant_id_idx on public.wishlist_items(variant_id);
create index orders_user_id_created_at_idx on public.orders(user_id, created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.products, public.product_variants to anon, authenticated;
grant select, insert, update, delete on public.carts, public.cart_items, public.addresses, public.wishlist_items to authenticated;
grant select on public.orders, public.order_items to authenticated;

create policy "Active products are readable" on public.products for select using (active = true);
create policy "Active variants are readable" on public.product_variants for select using (active = true);
create policy "Customers manage their cart" on public.carts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Customers manage their cart items" on public.cart_items for all to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy "Customers manage their addresses" on public.addresses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Customers manage their wishlist" on public.wishlist_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Customers read their orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "Customers read their order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

create trigger set_products_updated_at before update on public.products for each row execute procedure public.set_user_updated_at();
create trigger set_product_variants_updated_at before update on public.product_variants for each row execute procedure public.set_user_updated_at();
create trigger set_carts_updated_at before update on public.carts for each row execute procedure public.set_user_updated_at();
create trigger set_cart_items_updated_at before update on public.cart_items for each row execute procedure public.set_user_updated_at();
create trigger set_addresses_updated_at before update on public.addresses for each row execute procedure public.set_user_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute procedure public.set_user_updated_at();

insert into public.products (slug, name, description)
values ('lumadesk-pro', 'LumaDesk Pro', 'A made-to-order standing desk for a more intentional workday.')
on conflict (slug) do nothing;

insert into public.product_variants (product_id, slug, name, finish, frame, price_cents, image_path, active, inventory_quantity)
select p.id, v.slug, v.name, v.finish, v.frame, 189500, v.image_path, true, 25
from public.products p
cross join (values
  ('natural-white-oak-matte-black', 'Natural white oak / Matte black', 'Natural white oak', 'Matte black', '/images/lumadesk-product-master.png'),
  ('natural-white-oak-matte-white', 'Natural white oak / Matte white', 'Natural white oak', 'Matte white', '/products/variants/05-natural-white-oak-matte-white.png'),
  ('american-walnut-matte-black', 'American walnut / Matte black', 'American walnut', 'Matte black', '/products/variants/02-american-walnut-matte-black.png'),
  ('american-walnut-brushed-aluminum', 'American walnut / Brushed aluminum', 'American walnut', 'Brushed aluminum', '/products/variants/06-american-walnut-brushed-aluminum.png'),
  ('smoked-oak-matte-black', 'Smoked oak / Matte black', 'Smoked oak', 'Matte black', '/products/variants/03-smoked-oak-matte-black.png'),
  ('matte-black-ash-matte-black', 'Matte black ash / Matte black', 'Matte black ash', 'Matte black', '/products/variants/04-matte-black-ash-matte-black.png')
) as v(slug, name, finish, frame, image_path)
where p.slug = 'lumadesk-pro'
on conflict (slug) do nothing;
