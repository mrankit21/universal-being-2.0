# Deployment Guide

How to deploy Universal Being to production. The app lives at `apps/web`
(Next.js App Router). This doc is derived directly from the code in
`lib/db/mongoose.ts`, `lib/payments/razorpay.ts`, `lib/media/imagekit.ts`,
`lib/auth/session.ts`, `app/api/payments/webhook/route.ts`,
`app/api/cron/*`, and `.env.example` — not generic Next.js advice.

---

## 1. Prerequisites

Before you start, have accounts/access for:

- **Vercel** — hosting, the account/team that will own the project
- **MongoDB Atlas** — the database (this app has no other persistence layer;
  `lib/db/mongoose.ts` is the single source of truth for all data)
- **Razorpay** — payment processing for the "Book Your Slot" flow
- **ImageKit** — media hosting for the admin Media Library (optional but
  recommended — without it, media uploads fall back to "Add by URL")
- **A domain** you control, for DNS
- Optional but referenced in `.env.example`: **Resend** (email
  notifications), **WhatsApp Cloud API** (WhatsApp notifications), and
  **Upstash Redis** (rate limiting). All three degrade gracefully if unset
  (see section 2), so they can be added after the initial launch.

---

## 2. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**
(Production, and Preview if you want staging deploys to work fully). Source
of truth is `apps/web/.env.example` — copy it and fill in real values.

### Required — the app will not function correctly without these

| Variable | What breaks without it |
|---|---|
| `MONGODB_URI` | Every database-backed API route and the entire Admin Panel fail immediately. `connectToDatabase()` in `lib/db/mongoose.ts` throws a clear startup error if this is unset — nothing silently falls back except the public marketing pages, which use local seed data when `isDatabaseConfigured()` is false. |
| `SESSION_SECRET` | Admin login is impossible. `lib/auth/session.ts` uses this to sign/verify the JWT stored in the `ub_admin_session` cookie (`issueSessionToken` / `verifySessionToken`); without it, session issuance throws. Generate one with `openssl rand -base64 48`. |

### Site URL

| Variable | What breaks without it |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, Open Graph tags, and JSON-LD structured data won't resolve to absolute production URLs. Set to your real domain, e.g. `https://universalbeing.in`. |

### Payments (Razorpay) — optional but required for online checkout

| Variable | What breaks without it |
|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Without both, `isRazorpayConfigured()` in `lib/payments/razorpay.ts` returns false and `createSlotReservationOrder()` returns `null` — bookings still work as timed seat reservations, but the "Book Now" flow can't open an online payment sheet. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same key id as above, exposed to the browser so the Razorpay Checkout widget can open client-side. Not the secret — safe to expose. |
| `RAZORPAY_WEBHOOK_SECRET` | The webhook at `/api/payments/webhook` verifies every incoming delivery's signature against this secret (`verifyWebhookSignature`, raw-body HMAC). Without it, all webhook deliveries are rejected as unverified — the webhook is the *authoritative* payment source of truth (browser-driven `verify-payment` alone isn't trusted), so payment status can silently drift out of sync without this set. This is a separate secret from `RAZORPAY_KEY_SECRET` — see section 4. |
| `PAYMENT_MAX_RETRY_ATTEMPTS` | Optional safety cap on payment retries; unset means unlimited retries. |
| `PAYMENT_RETRY_ORDER_EXPIRY_MINUTES` | How long a retry order stays valid; defaults to 15. |

### Booking expiry & cron

| Variable | What breaks without it |
|---|---|
| `BOOKING_RESERVATION_EXPIRY_MINUTES` | How many minutes an unpaid "Book Your Slot" reservation holds a seat before auto-expiring. Defaults to 15 if unset. |
| `CRON_SECRET` | Protects `/api/cron/expire-bookings` and `/api/cron/send-reminders`. **In production, `expire-bookings` fails closed** — if `CRON_SECRET` is unset and `NODE_ENV=production`, the route throws rather than allowing unauthenticated calls. You must set this before your cron job will work in production. See section 6. |

### Media (ImageKit) — optional

| Variable | What breaks without it |
|---|---|
| `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` / `IMAGEKIT_URL_ENDPOINT` | Without all three, `imagekitConfigured()` in `lib/media/imagekit.ts` is false — the admin Media Library falls back to an "Add by URL" flow instead of direct uploads, and `getImageKitClient()` returns `null` so delete/replace operations no-op safely. |

### Invoicing

| Variable | What breaks without it |
|---|---|
| `INVOICE_PREFIX` | Prefix used in generated invoice numbers, e.g. `UB` → `UB-2026-000001`. |
| `INVOICE_SEQUENCE_PADDING` | Digit padding for the invoice sequence number. |
| `BUSINESS_GSTIN` | Your GST registration number, printed on invoices. |
| `BUSINESS_LEGAL_NAME` | Legal business name printed on invoices. |
| `BUSINESS_REGISTERED_ADDRESS` | Registered address printed on invoices. |
| `GST_RATE_PERCENT` | GST rate applied to invoice totals. |
| `REFUND_POLICY_DAYS` | Informational refund window shown to customers/admins; doesn't block admin refund actions. |

### Notifications — optional, degrade to console logging

| Variable | What breaks without it |
|---|---|
| `RESEND_API_KEY` | Without it, emails are logged to the console instead of actually sent — safe dev default, but means customers won't get real emails in production until this is set. |
| `NOTIFICATIONS_FROM_EMAIL` | The "from" address for outgoing notification emails. |
| `ADMIN_NOTIFICATION_EMAIL` | Where internal admin alerts (e.g. failed payments) are sent. |
| `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Without both, WhatsApp messages are logged to the console instead of sent. |

### Rate limiting (Upstash Redis) — optional

| Variable | What breaks without it |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Without these, rate limiting can't actually enforce limits against a store. |
| `RATE_LIMIT_ENABLED` | Master on/off switch for rate limiting. |
| `LOGIN_RATE_LIMIT`, `OTP_RATE_LIMIT`, `BOOKING_RATE_LIMIT`, `COUPON_RATE_LIMIT` | Per-endpoint limits, format `count,window` (e.g. `5,15 m`). |
| `RATE_LIMIT_IP_WHITELIST` / `RATE_LIMIT_MOBILE_WHITELIST` | Comma-separated bypass lists. |

### Dev-only — do NOT set these in production

| Variable | Notes |
|---|---|
| `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` / `DEV_ADMIN_NAME` | Only active when `NODE_ENV=development` — auto-seeds an admin user on `npm run dev` if none exists. Vercel builds run in production mode, so this has no effect there, but don't rely on it. |
| `DISABLE_DEV_ADMIN_SEED` | Opt-out switch for the above, dev-only. |

Since there's no dev auto-seed in production, create your first admin user
manually before you can log in — see section 3, step 5.

---

## 3. MongoDB Atlas setup

1. Create a free or dedicated **Atlas cluster** (Atlas → "Create a Deployment").
2. Create a **database user** (Atlas → Database Access) with read/write
   access to the database you'll use (the app defaults to a database named
   `universal-being` inside the connection string in `.env.example`).
3. Under **Network Access**, add an IP allowlist entry. Vercel's serverless
   functions don't have static IPs, so allow `0.0.0.0/0` (all IPs) — Atlas
   documents this as the standard approach for serverless hosts; access is
   still gated by the database user's credentials.
4. Copy the **connection string** (Atlas → Connect → Drivers → Node.js),
   fill in your username/password, and set it as `MONGODB_URI` in Vercel's
   environment variables. It should look like:
   `mongodb+srv://<user>:<password>@<cluster>/universal-being`
5. Create your first admin account by running the bootstrap script locally
   (or from any machine) with the production `MONGODB_URI`:
   ```
   MONGODB_URI="mongodb+srv://...production-uri..." \
     node apps/web/scripts/create-admin.mjs \
     --name "Your Name" --email you@yourdomain.com --password "a-strong-password"
   ```
   This writes directly to the `User` collection — it's the only way to
   create the first admin, since admin creation in the UI itself requires
   being logged in as an admin already. Change the password after first
   login if you used a placeholder.

---

## 4. Razorpay dashboard configuration

1. In the Razorpay dashboard, get your **Key ID** and **Key Secret**
   (Settings → API Keys) and set them as `RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same value as
   `RAZORPAY_KEY_ID`) in Vercel.
2. Go to **Settings → Webhooks** and add a new webhook pointing at:
   ```
   https://<your-domain>/api/payments/webhook
   ```
3. Subscribe it to exactly these events (per the doc comment in
   `app/api/payments/webhook/route.ts`):
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
   - `order.paid`
4. Razorpay will show you a **webhook secret** when you save it — this is
   **separate from your API Key Secret**. Set it as `RAZORPAY_WEBHOOK_SECRET`
   in Vercel. The webhook route verifies every delivery's signature against
   this secret before trusting anything in the payload, so a mismatch here
   means all webhook deliveries get silently rejected.
5. The webhook is treated as the authoritative payment record (it's what
   Razorpay calls server-to-server, unlike the client-reported
   `verify-payment` call), and it's idempotent — Razorpay's retried or
   duplicate deliveries are deduped automatically, so it's safe to leave
   "auto-retry" on in the Razorpay dashboard.

---

## 5. ImageKit setup

1. Create an ImageKit account and note your **Public Key**, **Private
   Key**, and **URL Endpoint** (ImageKit dashboard → Developer options →
   API Keys).
2. Set `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and
   `IMAGEKIT_URL_ENDPOINT` in Vercel.
3. No webhook or callback URL configuration is needed on ImageKit's side —
   the app only makes outbound calls to ImageKit (issuing signed upload
   params, and deleting/replacing files by `fileId`).
4. If you skip this step, the admin Media Library still works via
   "Add by URL" — you can add ImageKit later without any code changes.

---

## 6. Cron job setup

Two endpoints need to be hit on a schedule:

- `GET /api/cron/expire-bookings` — sweeps and releases seats from expired,
  unpaid "Book Your Slot" reservations. Run this **every 1–5 minutes**.
- `GET /api/cron/send-reminders` — sends remaining-payment reminders (trips
  departing within 7 days with pending payment) and trip reminders (trips
  departing within 2 days). Run this **once or twice a day**.

Both require the `Authorization: Bearer <CRON_SECRET>` header (or a
`?secret=<CRON_SECRET>` query param as a fallback). **Set `CRON_SECRET` in
Vercel before relying on this in production** — `expire-bookings`
specifically throws an error in production if `CRON_SECRET` is unset,
rather than silently allowing unauthenticated calls.

### Option A: Vercel Cron

Add a `vercel.json` at the repo root (`apps/web/vercel.json` if Vercel's
Root Directory is set to `apps/web` — see section 7):

```json
{
  "crons": [
    { "path": "/api/cron/expire-bookings", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/send-reminders", "schedule": "0 9 * * *" }
  ]
}
```

Vercel Cron calls your endpoint with a GET request but does **not**
natively support adding custom Authorization headers on Hobby plans —
if your plan can't set the Bearer header via Vercel Cron config, pass the
secret as `?secret=<CRON_SECRET>` in the `path` instead:
```json
{ "path": "/api/cron/expire-bookings?secret=YOUR_CRON_SECRET", "schedule": "*/5 * * * *" }
```
(Note: this puts the secret in your repo — prefer an external scheduler if
you'd rather keep it out of source control.)

### Option B: External scheduler

Use any scheduler (GitHub Actions on a schedule, cron-job.org, a real
crontab on a server you control) to send:
```
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-domain>/api/cron/expire-bookings
```
every 1–5 minutes, and the same for `/api/cron/send-reminders` once or
twice daily. This keeps the secret out of your repository.

---

## 7. Domain / DNS

1. In Vercel, go to your project → **Settings → Domains** and add your
   custom domain.
2. Vercel will show you the DNS records to add at your registrar:
   - For an apex domain (`universalbeing.in`): an `A` record pointing
     to Vercel's IP, or `ALIAS`/`ANAME` if your registrar supports it.
   - For a subdomain (`www.universalbeing.in`): a `CNAME` record
     pointing to `cname.vercel-dns.com`.
3. Wait for DNS propagation and for Vercel to confirm the domain (usually
   minutes, occasionally longer depending on your registrar's TTL).
4. Update `NEXT_PUBLIC_SITE_URL` to the final production domain and
   redeploy so canonical URLs, Open Graph tags, and JSON-LD reflect it.
5. If this is a monorepo deploy (repo root has `apps/web`), set Vercel's
   **Project Settings → Build & Development Settings → Root Directory** to
   `apps/web` so Vercel builds the right subproject.

---

## 8. Rollback procedure

If a bad deploy goes out:

1. Go to your Vercel project → **Deployments**.
2. Find the last known-good deployment (green checkmark, from before the
   bad change).
3. Click the **⋯** menu on that deployment → **Promote to Production**
   (or "Redeploy" depending on your Vercel dashboard version). This
   re-points your production domain at that build immediately, without
   needing a new git push or waiting for a fresh build.
4. If the bad deploy also shipped a breaking database migration or schema
   change, promoting an old deployment alone won't undo data changes —
   check whether the bad release touched any Mongoose schemas or ran
   one-off scripts before assuming a UI rollback is sufficient.
5. Once stable, fix forward in a new commit, redeploy normally, and confirm
   in Preview before promoting to Production again.
