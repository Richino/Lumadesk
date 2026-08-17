-- ============================================================================
-- Phase 2 (part 2): store settings + media library storage
--   * store_settings — singleton row of store-wide configuration
--   * media bucket    — public Storage bucket for product/marketing imagery
-- ============================================================================

-- --- store_settings (singleton) ---------------------------------------------
-- The boolean primary key pinned to true guarantees at most one row.
create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'LumaDesk',
  support_email text not null default '',
  phone text not null default '',
  business_address jsonb not null default '{}'::jsonb,
  currency text not null default 'usd',
  flat_shipping_cents integer not null default 0 check (flat_shipping_cents >= 0),
  free_shipping_threshold_cents integer check (free_shipping_threshold_cents is null or free_shipping_threshold_cents >= 0),
  tax_rate_bps integer not null default 0 check (tax_rate_bps between 0 and 10000),
  order_confirmation_template text not null default '',
  shipping_notification_template text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;
grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;

-- Non-sensitive store info is world-readable (the storefront may show it).
create policy "Store settings are readable"
  on public.store_settings for select
  using (true);
create policy "Admins manage store settings"
  on public.store_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create trigger set_store_settings_updated_at
  before update on public.store_settings
  for each row execute procedure public.set_user_updated_at();

insert into public.store_settings (id, store_name, support_email)
values (true, 'LumaDesk', 'support@lumadesk.com')
on conflict (id) do nothing;

-- --- media storage bucket ---------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

create policy "Media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');
create policy "Admins upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "Admins update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
create policy "Admins delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
