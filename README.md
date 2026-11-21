# Banaras store (working name: Zari & Loom)

A WhatsApp-first shop for Banarasi sarees, suit sets, suit fabric and dupattas, with an owner dashboard.
**This is Phase 1**: the storefront, checkout in test mode, the owner dashboard and the 37 starting products.
WhatsApp automation, the AI sales agent, courier booking and broadcasts come in Phases 2 to 4.

- **Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Supabase (Postgres), Razorpay, hosted on Netlify.
- **Brand name:** change it once in `src/config/site.ts` and it changes everywhere.

## Run it on your computer

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. The owner dashboard is at http://localhost:3000/admin.

With no Supabase keys the store runs in **local demo mode**: data is saved in `.data/store.json`, payments are
simulated, and the dashboard password is `ADMIN_PASSWORD` in `.env.local`. Delete the `.data` folder to reset.

## Settings (environment variables)

Copy `.env.example` to `.env.local` and fill in what you have. All secrets live here, never in the code.

| Name | What it is |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The site address, e.g. `https://yourstore.netlify.app` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | The shop's WhatsApp number, digits only with 91 in front |
| `SESSION_SECRET` | Long random text that signs the owner login. `openssl rand -hex 32` makes one |
| `ADMIN_PASSWORD` | The owner password for the dashboard (with or without Supabase) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase, Project settings, API |
| `SUPABASE_SERVICE_ROLE_KEY` | From the same page. Server only. Never share it |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay **test** keys (`rzp_test_...`) |
| `RAZORPAY_WEBHOOK_SECRET` | The secret you type when creating the Razorpay webhook |
| `RAZORPAY_ALLOW_LIVE` | Leave empty. Live keys are refused unless this is `yes` |

## Connect Supabase

1. Create a project at supabase.com.
2. Open the SQL editor, paste all of `supabase/schema.sql`, and run it. It creates every table with Row Level Security on.
3. Put the three Supabase keys in `.env.local`, then load the starting products:

```bash
npm run seed
```

The seed never overwrites a product that already exists, so it is safe to run again.

## Connect Razorpay (test mode)

1. In the Razorpay dashboard, switch to Test mode and create API keys. Put them in the settings above.
2. Add a webhook pointing to `https://YOUR-SITE/api/razorpay/webhook` with the events `payment.captured` and
   `payment.failed`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`.

Every payment is checked twice: the signature from the payment window, and the signed webhook.
Going live is a deliberate step: swap in live keys **and** set `RAZORPAY_ALLOW_LIVE=yes`.

## Put it on Netlify

1. Push this folder to a GitHub repository.
2. In Netlify: Add new site, Import from Git, pick the repository. Netlify reads `netlify.toml` and builds it as a Next.js site.
3. In Site configuration, Environment variables, add every setting from the table above. Supabase is required on Netlify
   (the local file store only works on your own computer).
4. Deploy.

## Product photos

Original photos live in `assets/photos`. To rebuild the web versions:

```bash
npm run images
```

This makes compressed WebP files in `public/products` at three sizes. Photos are **never cropped**. The nine model
photos are collages; the script splits each along its white lines into a main shot plus close-ups for the gallery.

## What is where

| Path | What |
| --- | --- |
| `src/config/site.ts` | Brand name, WhatsApp number, Noida pincodes, offers, add-on prices, consent wording |
| `src/data/catalog.ts` | The 37 starting products (names and prices are placeholders) |
| `src/app/(shop)` | Customer pages: home, collection, product, bag and checkout, order, account |
| `src/app/admin` | Owner dashboard: overview, orders, products, home trials, customers |
| `src/app/api` | Checkout, payment verification, Razorpay webhook, trial booking, order lookup |
| `src/lib/store.ts` | All database reads and writes (Supabase, or the local file in demo mode) |
| `supabase/schema.sql` | The full database, including tables the later phases will use |

## Rules built into the code

- **Consent:** a WhatsApp marketing opt-in is saved only when the box is ticked, with the time, the source and the
  exact words shown. An unsubscribe is never undone by a later form.
- **Silk claims:** the dashboard refuses the words "pure silk", "handloom" and "Silk Mark" on any piece that is not
  ticked as Silk Mark.
- **Prices and stock** are always read on the server at checkout, never trusted from the browser.
- **Sold-out pieces** hide from the store on their own.

## Before going live

- Confirm real product names, prices and weaver details (all placeholders now).
- Put in the real WhatsApp number.
- Connect Supabase and Razorpay, and place one test order end to end on the Netlify site.
