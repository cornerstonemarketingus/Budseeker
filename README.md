# Budseeker

The intelligent discovery layer for legal, regulated cannabis retail — dispensary and product discovery, cross-store price comparison, and an AI budtender, built on **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **PostgreSQL + PostGIS**.

Budseeker only lists licensed retailers and normalizes products into a canonical catalog so the same product can be compared across every store that carries it — see `ARCHITECTURE.md` (or the shared architecture blueprint) for the full domain model and roadmap.

## Features (this build)

- Age-gated entry with jurisdiction-driven minimum age (`JurisdictionPolicy`) — no dark patterns
- Scoped RBAC (`UserRole`) behind real session auth (Auth.js + credentials)
- Canonical product catalog with cross-dispensary price comparison, normalized cost-per-unit, and 30-day price history
- Dispensary, brand, and strain discovery pages, all backed by seeded Postgres data
- Deals engine with explicit start/end windows — nothing is assumed to apply
- Favorites (products/stores/brands) and a saved-items page
- Typo-tolerant search (Postgres `pg_trgm`) across products, dispensaries, and brands
- AI budtender chat — retrieval-grounded against real inventory, never fabricated (Ollama-compatible backend)
- Community-sourced "nearby stores" map layer (OpenStreetMap Overpass/Nominatim) — clearly separate from the verified-license `Dispensary` system of record

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Postgres + PostGIS

```bash
createdb budseeker
psql -d budseeker -c "CREATE EXTENSION postgis;"
```

### 3. Configure environment

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/budseeker"
AUTH_SECRET=""            # openssl rand -base64 32
OLLAMA_BASE_URL=""        # optional — AI budtender chat
OLLAMA_API_KEY=""
OLLAMA_MODEL="gemma4:31b"
```

### 4. Migrate and seed

```bash
npm run db:migrate   # applies prisma/migrations, including the PostGIS geo + trigram search migration
npm run db:seed      # realistic, fictional demo dispensaries/brands/products/deals/users
```

Demo accounts (password `budseeker-demo-2026` for all):

| Email | Role |
|---|---|
| `demo.consumer@example.com` | Consumer, with saved products/stores seeded |
| `demo.merchant@example.com` | Merchant owner (scoped) |
| `demo.brand@example.com` | Brand owner (scoped) |
| `demo.admin@example.com` | Super admin |

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # guest marketing/discovery landing
│   ├── (auth)/sign-in/
│   ├── (consumer)/              # authenticated app shell (header + bottom nav)
│   │   ├── explore/             # dynamic home feed
│   │   ├── dispensaries/[slug]/
│   │   ├── products/[brand]/[slug]/
│   │   ├── brands/[slug]/  strains/[slug]/  deals/  search/
│   │   ├── saved/  profile/     # session-protected via proxy.ts
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── chat/                # AI budtender (grounded retrieval)
│       ├── dispensaries/ geocode/  newsletter/subscribe/   # legacy community-map layer
├── server/                      # domain layer: types/service/repository per domain
│   ├── auth/ (config, rbac)     compliance/ (age gate)     geo/ (PostGIS + OSM adapter)
│   ├── dispensaries/  products/  brands/  strains/  deals/  favorites/  search/  ai/
├── components/
│   ├── ui/                      # design-system primitives (Button, Card, Badge, Input)
│   └── layout/                  # AppHeader, BottomNav, AgeGate, SessionProvider
└── proxy.ts                     # route protection (Next.js 16 middleware convention)
prisma/
├── schema.prisma                # ~45-model domain schema
├── migrations/                  # includes raw-SQL PostGIS geo + pg_trgm migration
└── seed.ts
```

## What's real vs. roadmapped

Everything listed under Features above is wired to the real database — no mock UI, no fake buttons. Merchant/brand dashboards, Stripe billing, POS integrations, and the admin console exist as schema (`Merchant`, `Brand`, `Plan`/`Subscription`/`Entitlement`, `Integration*`) but not yet as UI — building dashboards against that schema before there's a real import pipeline or billing wiring would mean shipping numbers nobody generated. See the architecture blueprint for the phased plan.
