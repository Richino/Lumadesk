# LumaDesk Admin

Internal operations console for the LumaDesk store. A separate Next.js 16 app
from the customer storefront — dark, dense, and fast (Stripe / Linear / Vercel
aesthetic). Shares the same Supabase project, database, and auth.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions, Turbopack)
- Tailwind CSS v4 + hand-rolled shadcn-style primitives (`components/ui`)
- Supabase (`@supabase/ssr`) — admins authenticate with their storefront login
- Recharts (charts), TanStack-free URL-driven tables, React Hook Form + Zod
- Sonner (toasts), cmdk (command palette), Framer Motion, lucide-react

## Setup

1. Install deps from the repo root (npm workspaces):
   ```bash
   npm install
   ```
2. Create `apps/admin/.env.local` from `.env.example` with the **same** Supabase
   project as the storefront:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only, never exposed
   ```
3. Apply the new migration (adds `is_admin()`, admin RLS policies, order
   fulfillment columns, `order_events`, `inventory_movements`, `activity_log`):
   ```bash
   supabase db push
   ```
4. Make yourself an admin (one-time), e.g. in SQL:
   ```sql
   update public.users set role = 'admin' where email = 'you@example.com';
   ```
5. Run it (port 3001, so it can run alongside the storefront):
   ```bash
   npm run dev:admin
   ```

## Access model

- `proxy.ts` (Next 16 middleware) requires an authenticated session for every
  route except `/login`, `/unauthorized`, `/auth/*`.
- The `(dashboard)` layout calls `requireAdmin()` which redirects non-admins to
  `/unauthorized`. Data is read under the admin's session (admin RLS policies);
  aggregate dashboard reads and the audit log use the service-role client.

## Built (Phase 1)

- **Foundation** — auth gate, app shell (sidebar, topbar, ⌘K command palette,
  breadcrumbs, user menu), dark theme, toasts, loading skeletons.
- **Dashboard** — revenue/orders KPIs with deltas, revenue & orders charts,
  recent orders, top products, low-inventory alerts.
- **Orders** — searchable/filterable/sortable/paginated table with bulk status
  actions; detail page with items, totals, timeline, customer, shipping,
  payment, tracking, internal notes; refund/cancel; printable invoice & packing
  slip.
- **Products** — CRUD with publish/archive/delete, slug generation, and full
  variant management (add/edit/delete, pricing, status).
- **Inventory** — on-hand / reserved / available per variant, low & out-of-stock
  filters, stock adjustments (restock/adjust/set) with a movement ledger.
- **Customers** — directory with lifetime spend & order counts; profile with
  order history, addresses, and stats.

Every mutation writes to `activity_log`.

## Roadmap (later phases)

Reviews, Coupons, Analytics, Media Library, Notifications, Store Settings,
Users & Roles, Security, and the Activity Log viewer are scaffolded as
"Planned" pages and need their own tables/UI. Product detail fields (sale price,
specs, warranty, shipping, SEO) also need schema before they're built.
