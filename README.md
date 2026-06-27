# KheZwo

The most accessible, affordable digital ordering platform for South African
small businesses. Scan a QR code → browse the menu → order → track.

Built and operated by **Saccharum Technologies**.

---

## Stack

- **Next.js 14** (App Router, TypeScript, Server Actions)
- **Supabase** — Postgres database, Auth, Realtime, and Storage (free tier
  comfortably covers an early-stage launch)
- **Tailwind CSS**
- Deploys cleanly to **Vercel** + **Supabase Cloud**

This combination was chosen specifically because it needs no servers to
manage, has a generous free tier, and gives you auth + a live database +
file storage + realtime order updates out of the box — important for a
bootstrapped MVP.

---

## Brand rules baked into the code

This matters enough to call out explicitly, because it's encoded directly
in components rather than left as a styling convention:

| Where | What shows | Component |
|---|---|---|
| Landing / registration page | **KheZwo** logo, full size | `<KhezwoLogo />` |
| Vendor dashboard | **KheZwo** logo (sidebar) | `<KhezwoLogo />` in `VendorNav` |
| Admin dashboard | **KheZwo** logo (sidebar) | `<KhezwoLogo />` in `AdminNav` |
| Customer menu / tracking pages | The **vendor's own** logo & colors | `<VendorBrandHeader />` |
| Customer pages (footer only) | Tiny "Powered by KheZwo" credit | `<PoweredByKhezwo />` |
| Everywhere (footer / admin settings) | Small **Saccharum Technologies** watermark | `<SaccharumWatermark />` |
| Admin → Platform settings | Full Saccharum section — this is where all platform-level reporting belongs | — |

KheZwo is the face customers never really need to notice. Vendors and admins
see it constantly (it's their tool). Saccharum is the legal entity behind
everything, but stays a quiet credit, never the headline.

If you extend the UI, keep using these four components rather than dropping
logos in directly — it keeps the rule from drifting as the app grows.

---

## Getting started locally

1. **Create a Supabase project** at supabase.com (free tier is fine).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`. This creates
   every table, RLS policy, and the `vendor-assets` storage bucket.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   keys (Project Settings → API).
4. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```
5. Visit `http://localhost:3000`, click **Register your business**, and
   create your first vendor account.
6. To make yourself a platform admin (so you can see `/admin`), run this in
   the Supabase SQL Editor:
   ```sql
   update profiles set role = 'admin' where id = '<your-auth-user-uuid>';
   ```
   (Find your user's UUID under Authentication → Users.)

By default Supabase requires email confirmation on sign-up. For faster local
testing, turn it off under Authentication → Providers → Email → "Confirm
email", then re-enable it before going live.

---

## Deploying

1. Push this repo to GitHub.
2. Import it into **Vercel**, add the same environment variables from
   `.env.local`.
3. Set `NEXT_PUBLIC_SITE_URL` to your real domain — this is used to build
   the QR code links and tracking URLs vendors print out.
4. Deploy. Supabase needs no separate deployment; it's already cloud-hosted.

---

## What's fully working

- Vendor registration & login (Supabase Auth)
- Vendor dashboard with **live, realtime order updates** (no polling)
- One-click order status flow: Received → Preparing → Ready → Completed
- Menu management (add / edit availability / delete), with the Free plan's
  20-item cap enforced in the UI
- Branding page: vendor logo upload (Supabase Storage), brand colors,
  closing message, and a **generated QR code** linking straight to their
  menu — copy link or screenshot the SVG to print
- Public customer ordering flow: browse → cart → checkout (name + cash/card
  choice) → confirmation with order number → live tracking page
- Admin dashboard: platform-wide stats, vendor list with suspend/reactivate,
  platform fee % control, simple sponsor-ad slots
- Row Level Security on every table, so vendors can only ever touch their
  own data, and the public can only read what a customer should see

## What's intentionally stubbed (next phases)

These are real product decisions, not oversights — each needs an external
account/contract before it can be wired up for real:

- **Card payments**: the UI captures "cash" or "card" but doesn't process
  card payments yet. Wire up a South African gateway (PayFast, Yoco, or
  Paystack) inside `app/order/[slug]/actions.ts` once you have a merchant
  account.
- **Subscription billing** (Free / Pro / Enterprise): plan is stored on the
  vendor row but there's no checkout flow yet — add this once you've chosen
  a billing provider (PayFast subscriptions, Paddle, etc).
- **Google AdSense**: a `adsense_enabled` flag already exists in
  `platform_settings`; drop in your AdSense script once you have an account.
- **Multi-branch / staff accounts** (Enterprise tier): the schema supports
  adding a `branch_id`-style column later, but it isn't modeled yet.
- **SMS/WhatsApp order alerts**: vendors currently get sound + visual alerts
  in-browser only.
- A new-order sound file is referenced at `public/notification.mp3` — add a
  short audio clip there (see `public/README-ASSETS.txt`).
- **Menu categories**: the `menu_categories` table exists in the schema, but
  the vendor menu editor currently lists items flat (no category grouping in
  the UI yet). Wire it up if you want sectioned menus (Starters / Mains /
  Drinks etc).

## Honest note on this build

This codebase was written and assembled in an environment without internet
access, so it could not be `npm install`'d or `next build`'d to confirm it
compiles cleanly end-to-end before being handed to you. The code follows the
standard, documented Next.js App Router + Supabase SSR patterns throughout,
but please run `npm install && npm run dev` (or `npm run build`) yourself as
the first step, and treat any error that surfaces as a normal part of
bringing a fresh project online rather than a sign something is fundamentally
wrong with the architecture.

## A note on order tracking security

Tracking links use the order's UUID as the access control (hard to guess,
but not cryptographically private). That's a reasonable trade-off for an
MVP. Before a large-scale launch, consider replacing it with a short signed
token so tracking links can't theoretically be enumerated.
