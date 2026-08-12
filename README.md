# Bud Seeker

A free, instant AI product guide and nearby-dispensary finder for cannabis retailers, built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and **Prisma**.

## Features

- `/bud-seeker`: a dedicated, no-signup search experience with three modes — search products by strain/brand/effect, find nearby dispensaries by city/ZIP or shared location, or ask the AI budtender directly. No email or account required for any of it.
- Nearby dispensary search via OpenStreetMap/Overpass, with distance/delivery/pickup filters and a live map
- City/ZIP geocoding via Nominatim, plus browser geolocation ("share my location")
- Canonical product graph: `CanonicalProduct → ProductVariant → RetailerListing → PriceObservation`, so a product's identity is never conflated with one retailer's listing of it
- Price intelligence: daily price snapshots per listing power a DealScore (with fake-sale detection), surfaced in product search, chat, and via a price-history API
- BudMatch: a rules-based match score against a member's favorited products' effects/flavors/terpenes/THC — a heuristic starting point, not a trained model
- Reviews, Favorites, Shopping Lists, and price/stock Alerts as backend APIs (not yet wired into the UI) — these are member-scoped and still require a subscribed email via `/api/newsletter/subscribe`; alerts are pull-based via `/api/alerts/check` since no email/push provider is wired up yet

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/budseeker"
OLLAMA_BASE_URL=""
OLLAMA_API_KEY=""
OLLAMA_MODEL="gemma4:31b"
```

### 3. Set up the database

```bash
npm run db:push
```

The production `build` script also runs `prisma db push` automatically, so `DATABASE_URL` must be reachable at build time (including on Vercel) — there's no separate migrations step yet. If a future schema change would cause data loss, the push will fail rather than silently drop data; run it manually with `--accept-data-loss` once you've confirmed that's intended.

Bud Seeker reads its catalog from the canonical product graph — seed `Category`, `Brand`, `CanonicalProduct`, `ProductVariant`, `Retailer`, and `RetailerListing` from your own retailer data. Price history builds up automatically as `RetailerListing` rows are read (one snapshot per listing per day); it does not need to be seeded.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click through to `/bud-seeker`.

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Landing page promoting Bud Seeker
│   ├── layout.tsx         # Root layout
│   ├── bud-seeker/        # The Bud Seeker tool itself (products / stores / AI guide)
│   └── api/
│       ├── chat/                            # AI budtender chat (Ollama-compatible)
│       ├── dispensaries/                    # Nearby dispensary search (Overpass)
│       ├── geocode/                         # City/ZIP geocoding (Nominatim)
│       ├── products/search/                 # Search products by strain/brand/effect
│       ├── newsletter/subscribe/            # Optional email capture for member features
│       ├── favorites/                       # Favorite a canonical product (feeds BudMatch)
│       ├── budmatch/                        # BudMatch scores from a member's favorites
│       ├── shopping-lists/                  # Shopping lists + items
│       ├── alerts/                          # Price-drop / back-in-stock alerts (+ /check)
│       └── products/[slug]/
│           ├── price-history/               # DealScore + price history per variant
│           └── reviews/                     # Product reviews + average rating
├── components/
│   ├── BudSeekerTrigger.tsx    # Links to /bud-seeker
│   └── BudSeekerApp.tsx        # The tool's UI: product search, store search, AI guide
└── lib/
    ├── db.ts
    ├── membership.ts       # Email-gate check, used only by member-scoped features
    ├── pricing.ts          # DealScore + price snapshot logic
    └── budmatch.ts         # BudMatch heuristic scoring
prisma/
└── schema.prisma
```

## Explicitly out of scope (for now)

The canonical graph is built to support multiple retailers, but this deployment model is still single-tenant end to end — there's no auth/dashboard for onboarding additional retailers yet. Also not built: demand/inventory forecasting, POS/partner data ingestion, cross-retailer market intelligence, a barcode/visual search, retailer/brand analytics dashboards, and UI for the member-scoped features (favorites, reviews, shopping lists, alerts). Each needs real data sources, infrastructure decisions, or dedicated UI work this repo doesn't make on its own.
