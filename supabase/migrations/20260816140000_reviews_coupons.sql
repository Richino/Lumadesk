-- ============================================================================
-- Phase 2 back-office tables: product reviews + coupons
--   * reviews          — customer reviews with a moderation workflow
--   * coupons          — percentage / fixed-amount discount codes
--   * coupon_redemptions — ledger for coupon usage analytics
--
-- Admins manage everything via is_admin(). Approved reviews and currently-valid
-- coupons are readable by the storefront (anon/authenticated) so those surfaces
-- can integrate later; the storefront isn't wired to write these yet.
-- ============================================================================

-- --- reviews ----------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  author_email text,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified_purchase boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_product_id_idx on public.reviews(product_id);
create index if not exists reviews_status_created_at_idx on public.reviews(status, created_at desc);

alter table public.reviews enable row level security;
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

create policy "Approved reviews are readable"
  on public.reviews for select
  using (status = 'approved');
create policy "Admins manage reviews"
  on public.reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute procedure public.set_user_updated_at();

-- --- coupons ----------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null default '',
  type text not null check (type in ('percent', 'fixed')),
  -- percent: 1..100; fixed: discount in cents (> 0)
  value integer not null check (value > 0),
  min_purchase_cents integer not null default 0 check (min_purchase_cents >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type <> 'percent' or value <= 100)
);
create index if not exists coupons_active_idx on public.coupons(active);

alter table public.coupons enable row level security;
grant select on public.coupons to anon, authenticated;
grant insert, update, delete on public.coupons to authenticated;

-- Storefront may read currently-valid coupons to validate a code at checkout.
create policy "Valid coupons are readable"
  on public.coupons for select
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
  );
create policy "Admins manage coupons"
  on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create trigger set_coupons_updated_at
  before update on public.coupons
  for each row execute procedure public.set_user_updated_at();

-- --- coupon_redemptions -----------------------------------------------------
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  created_at timestamptz not null default now()
);
create index if not exists coupon_redemptions_coupon_id_idx on public.coupon_redemptions(coupon_id);

alter table public.coupon_redemptions enable row level security;
grant select, insert on public.coupon_redemptions to authenticated;
create policy "Admins manage coupon redemptions"
  on public.coupon_redemptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
