# KheZwo

An accessible digital commerce platform for small businesses. Businesses can publish product listings, accept customer orders, and receive enquiries for services. Customers can browse a business storefront, place product orders, and track orders using a private tracking token.

Built and operated by **Saccharum Technologies**.

> **Current status:** development branch only. The security foundation and Stage 3 commerce changes have not been merged or deployed. Database migrations must be tested against a disposable Supabase project before production use.

---

## Stack

- **Next.js 15** (App Router, TypeScript, Server Actions)
- **Supabase** — Postgres, Auth, and Storage
- **Tailwind CSS 4**
- **Vercel + Supabase Cloud** deployment target

## Brand rules

| Surface | Branding |
|---|---|
| Landing, registration and vendor dashboard | KheZwo |
| Customer storefront and order tracking | The vendor's own logo and colours |
| Customer footer | Small “Powered by KheZwo” credit |
| Platform administration | Saccharum Technologies watermark and platform-level reporting |

Keep using the shared logo, vendor-branding, and Saccharum watermark components rather than introducing one-off logo markup.

---

## Local setup

1. Create a **disposable Supabase development project**. Do not start with production.
2. Apply the SQL files in `supabase/migrations/` in numerical order, from `0001_init.sql` onward. Review each migration first.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL and keys.
4. Install dependencies and start the app:
   ```bash
   npm ci
   npm run dev
   ```
5. Register a test business and exercise the vendor and customer journeys.
6. Keep email confirmation enabled when validating the production-like registration flow; separately test the confirmation-disabled path.

**Important:** the migrations have not yet been validated end-to-end against a disposable database. Do not apply them to production until RLS, RPC permissions, storage ownership, and registration/checkout flows have been tested.

---

## Current functionality

- Vendor registration and login with Supabase Auth.
- Vendor dashboard for incoming orders and order status updates.
- Product catalogue management, including availability controls and a 20-listing Free-plan UI limit.
- Service listings with a customer enquiry form.
- Vendor service-enquiry inbox with New → Contacted → Closed status tracking.
- Vendor branding, logo upload, colours, closing message, and QR code.
- Product checkout with database-authoritative prices and opaque-token order tracking in the security-foundation branch.
- Platform admin dashboard, vendor suspension/reactivation, platform-fee settings, and sponsor-ad slots.

The service-enquiry feature is introduced in migration `0007_products_services_catalog.sql`. It adds product/service listing types, a private enquiry table, row-level policies, restricted column grants, and a database guard that prevents service listings from entering product checkout.

---

## Not yet complete

- **Database security verification:** run the migrations and test RLS, RPC execute grants, storage ownership, registration, checkout, tracking and enquiry privacy against a disposable Supabase project.
- **Service-enquiry notifications:** vendors can view and update enquiry status in the dashboard, but email/SMS/WhatsApp notifications are not wired up.
- **Payments:** the cash/card choice is not a live card-payment integration. Add a payment gateway only after choosing a provider and opening a merchant account.
- **Subscription billing:** Free / Pro / Enterprise plans are represented in the data model, but paid subscription checkout and entitlement enforcement are not complete.
- **Currency and regional settings:** the current commerce experience is still South Africa-oriented and uses ZAR formatting.
- **Product improvements:** category grouping, richer product images, availability scheduling, and more complete business onboarding remain future work.
- **Scale and operations:** public checkout and enquiry rate limiting, observability, backup/restore drills, and production incident procedures still need attention.

---

## Validation

GitHub Actions runs TypeScript checks and a production build for the active feature branches. A successful build confirms the app compiles; it does **not** prove that database migrations, RLS policies, or RPC permissions are correct.

Security work remains in the separate draft pull request. Stage 3 commerce work is kept on `feature/core-commerce` so it does not get mixed into the security pull request prematurely.
