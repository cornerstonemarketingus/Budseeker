# Bud Seeker

An AI product guide and nearby-dispensary finder for cannabis retailers, built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and **Prisma**.

## Features

- Email-gated private product guide chat (backed by an Ollama-compatible LLM)
- Nearby dispensary search via OpenStreetMap/Overpass, with distance and map view
- City/ZIP geocoding via Nominatim
- Canonical product graph: `CanonicalProduct → ProductVariant → RetailerListing → PriceObservation`, so a product's identity is never conflated with one retailer's listing of it
- Price intelligence: daily price snapshots per listing power a DealScore (with fake-sale detection), surfaced in chat and via a price-history API
- BudMatch: a rules-based match score against a member's favorited products' effects/flavors/terpenes/THC — a heuristic starting point, not a trained model
- Reviews, Favorites, Shopping Lists, and price/stock Alerts (alerts are pull-based via `/api/alerts/check` — no email/push provider is wired up yet)

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

Bud Seeker gates access behind a `NewsletterSubscriber` email list and reads its catalog from the canonical product graph — seed `Category`, `Brand`, `CanonicalProduct`, `ProductVariant`, `Retailer`, and `RetailerListing` from your own retailer data. Price history builds up automatically as `RetailerListing` rows are read (one snapshot per listing per day); it does not need to be seeded.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Landing page with the Bud Seeker trigger
│   ├── layout.tsx         # Root layout, mounts the chat widget
│   └── api/
│       ├── chat/                            # Product guide chat (Ollama-compatible)
│       ├── dispensaries/                    # Nearby dispensary search (Overpass)
│       ├── geocode/                         # City/ZIP geocoding (Nominatim)
│       ├── newsletter/subscribe/            # Email gate
│       ├── favorites/                       # Favorite a canonical product (feeds BudMatch)
│       ├── budmatch/                        # BudMatch scores from a member's favorites
│       ├── shopping-lists/                  # Shopping lists + items
│       ├── alerts/                          # Price-drop / back-in-stock alerts (+ /check)
│       └── products/[slug]/
│           ├── price-history/               # DealScore + price history per variant
│           └── reviews/                     # Product reviews + average rating
├── components/
│   ├── BudSeekerTrigger.tsx
│   └── ChatWidget.tsx
└── lib/
    ├── db.ts
    ├── membership.ts       # Shared email-gate check
    ├── pricing.ts          # DealScore + price snapshot logic
    └── budmatch.ts         # BudMatch heuristic scoring
prisma/
└── schema.prisma
```

## Explicitly out of scope (for now)

The canonical graph is built to support multiple retailers, but this deployment model is still single-tenant end to end — there's no auth/dashboard for onboarding additional retailers yet. Also not built: demand/inventory forecasting, POS/partner data ingestion, cross-retailer market intelligence, a barcode/visual search, and retailer/brand analytics dashboards. Each needs real data sources or infrastructure decisions this repo doesn't make on its own.
