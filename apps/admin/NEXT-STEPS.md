# LumaDesk Admin — Next Steps

The admin app is **fully built** and pushed to `master`, but it has **not been run
against the live database yet**. Do these once, in order, from a machine that has
your Supabase project credentials.

## 1. Apply the three admin migrations ⚠️ (not yet applied)

Run in order:

- `supabase/migrations/20260816130000_admin_backoffice.sql` — `is_admin()`, admin
  RLS policies, order fulfillment columns, `order_events`, `inventory_movements`,
  `activity_log`
- `supabase/migrations/20260816140000_reviews_coupons.sql` — `reviews`, `coupons`,
  `coupon_redemptions`
- `supabase/migrations/20260816150000_settings_media.sql` — `store_settings` +
  the public `media` storage bucket and its policies

**Option A — Supabase CLI**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — Supabase Studio → SQL editor**

Paste each file's contents and Run, in the order above. Note: `create policy`
statements are **not** re-runnable — apply the set once, not twice.

## 2. Grant yourself admin

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

## 3. Configure env

Create `apps/admin/.env.local` from `.env.example` — the **same** Supabase project
as the storefront, plus `SUPABASE_SERVICE_ROLE_KEY` (server-only).

## 4. Run

```bash
npm install        # if a fresh clone
npm run dev:admin  # http://localhost:3001
```

Sanity-check a production build with `npm run build:admin`.

## After it's running — verify against real data

Everything so far is **build-verified only** (compiles clean on Next 16), not
click-tested against live Supabase. Worth a pass on:

- Media Library upload/delete (bucket RLS policies)
- Users → Invite (needs Supabase email/SMTP configured)
- Coupon redemption totals and dashboard/analytics aggregate joins
- Reserved-stock numbers on the Inventory page

## Known follow-ups (future phase)

- Wire the **storefront** to actually collect reviews and apply coupons (the admin
  side manages both; the customer-facing integration is unbuilt).
- Product detail fields (sale price, specifications, warranty, shipping, SEO) need
  a `products`/`product_variants` migration + UI.
- Optional: TOTP 2FA enrollment flow, real login history via auth audit logs, a
  scoped "manager" role (would broaden `requireAdmin`/`is_admin`).
