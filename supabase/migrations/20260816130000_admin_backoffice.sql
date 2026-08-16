-- ============================================================================
-- Admin back-office foundation
--   * is_admin() helper for RLS
--   * admin RLS policies on existing commerce tables (read-all + manage)
--   * order fulfillment columns (tracking, carrier, notes)
--   * order_events (timeline), inventory_movements (stock ledger),
--     activity_log (audit trail)
--
-- Security notes:
--   - is_admin() is SECURITY DEFINER so it reads public.users without RLS
--     recursion and cannot be spoofed by the caller.
--   - We deliberately do NOT widen UPDATE grants on public.users to
--     `authenticated`; the existing self-update policy + a broad column grant
--     would let a customer set their own role = 'admin'. Admin writes to
--     users happen through the service-role client behind requireAdmin().
-- ============================================================================

-- --- is_admin() -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- --- admin policies on existing tables --------------------------------------
-- Permissive policies OR with the existing customer/anon policies, so admins
-- gain full access without weakening anyone else's constraints.

create policy "Admins manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage variants"
  on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage orders"
  on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage order items"
  on public.order_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins read customers"
  on public.users for select to authenticated
  using (public.is_admin());

create policy "Admins read addresses"
  on public.addresses for select to authenticated
  using (public.is_admin());

-- Table privileges (RLS still gates the rows; non-admins have no matching policy).
grant insert, update, delete on public.products to authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant insert, update, delete on public.orders to authenticated;
grant insert, update, delete on public.order_items to authenticated;

-- --- order fulfillment columns ----------------------------------------------
alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists carrier text,
  add column if not exists internal_notes text,
  add column if not exists customer_note text;

-- --- order_events (timeline) ------------------------------------------------
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_id_created_at_idx
  on public.order_events(order_id, created_at desc);

alter table public.order_events enable row level security;
grant select, insert on public.order_events to authenticated;
create policy "Admins manage order events"
  on public.order_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Customers read their order events"
  on public.order_events for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));

-- --- inventory_movements (stock ledger) -------------------------------------
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  delta integer not null,
  reason text not null check (reason in (
    'restock', 'adjustment', 'sale', 'return', 'correction', 'damage', 'initial'
  )),
  note text,
  resulting_quantity integer not null check (resulting_quantity >= 0),
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_variant_id_created_at_idx
  on public.inventory_movements(variant_id, created_at desc);

alter table public.inventory_movements enable row level security;
grant select, insert on public.inventory_movements to authenticated;
create policy "Admins manage inventory movements"
  on public.inventory_movements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- activity_log (audit trail) ---------------------------------------------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_created_at_idx
  on public.activity_log(created_at desc);
create index if not exists activity_log_entity_idx
  on public.activity_log(entity_type, entity_id);

alter table public.activity_log enable row level security;
grant select, insert on public.activity_log to authenticated;
create policy "Admins manage activity log"
  on public.activity_log for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
