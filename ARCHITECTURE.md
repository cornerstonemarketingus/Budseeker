# Budseeker — Architecture & Product Blueprint

*Prepared for the Budseeker founding build. Covers current-state audit, target architecture, domain model, UX architecture per persona, and the implementation roadmap. This document is the reference; Phase 1 (and a slice of Phase 2) ships alongside it in this same change.*

---

## A. Current-state assessment

The repository is a single Next.js 16 / React 19 / TypeScript app, not yet a platform:

| Area | What exists today |
|---|---|
| Pages | One marketing landing page (`src/app/page.tsx`) |
| Data model | 3 Prisma tables: `Category`, `Product`, `NewsletterSubscriber` — a flat retailer catalog, no dispensaries, no users, no roles |
| Auth | None. "Access" is an email captured into `NewsletterSubscriber` and checked per-request — not a session, not a user account |
| Chat | A real, working feature: `/api/chat` builds a system prompt from the `Product` table and forwards to an Ollama-compatible LLM |
| Nearby stores | A real, working feature: `/api/dispensaries` queries OpenStreetMap Overpass for `shop=cannabis` nodes and computes distance; `/api/geocode` resolves city/ZIP via Nominatim |
| Design | Tailwind v4, hand-rolled emerald/neon utility classes repeated inline across two components; a manual light/dark toggle via a `dark` class on `<html>` |
| Compliance | Footer disclaimer only. No age gate, no license verification, no jurisdiction logic |
| Infra | Prisma 7 + `pg` driver adapter, no migrations directory populated, no seed script, no test suite, no CI |

**What to preserve:** the Overpass/Nominatim integration and the Ollama chat integration are both real, functioning, zero-fake-data features — they're small but correct, and they map directly onto two pieces of the target architecture (a community-sourced map layer, and an AI assistant). The dark/light theming instinct (near-black surface, neon-green accent, restrained glass) is a reasonable starting point for the "dark luxury tech" brief and is formalized into tokens rather than thrown out.

**What has to change:** everything about the data model. A flat `Product` with a `brand` string and no store, no price-per-listing, and no location cannot support price comparison, multi-store discovery, or merchant accounts — the single largest structural gap relative to the brief. There is also no notion of a user, so none of RBAC, favorites, reviews, alerts, or merchant/brand portals have anywhere to attach.

**Technical debt to retire deliberately:** the `NewsletterSubscriber`-as-access-token pattern (email in `localStorage`, checked server-side with no session) is replaced by real authentication; it's a dead end for anything requiring roles or persistence of user state.

---

## B. Recommended architecture

**Modular monolith, not a premature monorepo or microservices split.** One Next.js app (App Router, Server Components by default, Server Actions for mutations that don't need a public API shape), one Postgres database, one Redis instance. Internally organized into **domains** — `auth`, `users`, `dispensaries`, `products`, `brands`, `strains`, `pricing`, `deals`, `reviews`, `favorites`, `alerts`, `notifications`, `search`, `ai`, `compliance`, `merchants` (dashboard, later), `admin` (later), `billing` (later) — each with its own `types.ts`, `service.ts` (business logic), `repository.ts` (Prisma queries), and route/component layer. Domains talk to each other through their service layer, never by reaching into another domain's Prisma calls directly. This gets 90% of the benefit of a services split (clear ownership boundaries, testability, no spaghetti) with none of the deployment/versioning tax a real multi-service system would add at zero users.

**Why not a monorepo yet:** `apps/web` + `packages/*` earns its cost once there's a second deployable (a worker, a mobile app, a public API server) or a second team. Today there's one deployable. The domain folders inside `src/server/` are structured so that lifting any one of them into a `packages/` workspace later is a mechanical move, not a rewrite — that's the insurance policy without paying the premium now.

**Split later, when justified:** a `worker` process (BullMQ) for price-snapshot polling, integration syncs, and notification delivery is the first real second-deployable — planned for Phase 6/8, not built speculatively now.

**Event-driven internals from day one, in-process.** A tiny typed event emitter (`emitEvent("product.viewed", {...})`) decouples "a thing happened" from "what reacts to it" (analytics, recommendations, alerts). It's an in-memory `EventEmitter` today; the interface is shaped so swapping the transport for SQS/Kafka later doesn't touch call sites.

---

## C. Complete feature map

| Domain | Phase 1–5 (this build + near-term) | Phase 6+ (roadmapped) |
|---|---|---|
| Consumer discovery | Home, Explore, Dispensaries, Products, Brands, Strains, Deals, basic Search | AI natural-language search, visual/barcode search |
| Comparison & pricing | Canonical product ↔ listing model, price-per-unit normalization, "Available near you" table | Price history charts, price-drop/restock alerts, Price Compass, Deal Score |
| Personalization | Recently viewed, saved products/stores/brands, lists | Recommendation engine, BudScore, match %, smart lists |
| Reviews & trust | Product + dispensary reviews, ratings, moderation status | Helpful votes, abuse detection, merchant responses |
| Merchant SaaS | Data model only (Merchant, license, listings) | Full dashboard, CSV/POS import, analytics, campaigns |
| Brand portal | Data model only (Brand, brand user) | Claim flow, analytics, distribution intelligence |
| Admin | RBAC + audit log foundation | Full console: moderation, verification, billing ops |
| AI | Existing budtender chat, re-platformed | Tool-calling assistant grounded in structured DB, NL search |
| Compliance | Age gate, jurisdiction policy table, license status enum | Full verification workflow, compliance audit trail UI |
| Billing | Plan/Subscription/Entitlement schema | Stripe wiring, self-serve upgrade flows |

Section 48/49 "wow" features (BudScore, Deal Score, Price Compass, Shopping List Optimizer, Trend Radar, Knowledge Graph, AI Copilot) are designed for in the schema (they all read off `PriceSnapshot`, `InventorySnapshot`, `ReviewVote`, favorites) but are Phase 12–13 — they need real usage data to not be fake, and building them against zero real signal would mean fabricating the very insights the brief explicitly forbids ("do not fabricate insights").

---

## D. Database / domain model

Postgres 16 + PostGIS (installed and enabled for this build) + `pg_trgm` for fuzzy search. Money is `Decimal(10,2)`, never `Float`. Every table gets `createdAt`/`updatedAt`; user-facing content tables get soft-delete via `status`/`deletedAt` rather than hard deletes.

**Identity & RBAC**
`User`, `Account`/`Session`/`VerificationToken` (Auth.js), `UserRole` (userId, role enum, scopeType: PLATFORM/MERCHANT/BRAND, scopeId nullable) — this makes "merchant_manager for Store #4" and "brand_owner for Brand X" and "super_admin" all the same mechanism instead of three.

**Compliance**
`JurisdictionPolicy` (region, minAge, deliveryAllowed), `MerchantLicense` (dispensaryId, licenseNumber, issuingAuthority, status: unverified/pending/verified/suspended/expired, verifiedByUserId), `AgeVerification` (userId or anonymous session, confirmedDob, jurisdiction), `AuditLog` (actor, action, entityType/Id, before/after JSON, ip).

**Catalog (the core normalization the brief calls out as essential)**
`Brand` → `CanonicalProduct` (brand, category, strain, name, description, images) → `ProductVariant` (packageSize, unit, thcPercent, cbdPercent, thcMgPerServing, cbdMgPerServing, servingsPerPackage) → `DispensaryListing` (dispensary, variant, price, salePrice, inStock, stockQty, lastSyncedAt) → `PriceSnapshot` / `InventorySnapshot` (time series off each listing). `Category` (self-referencing for subcategories), `Strain` (name, lineage type: indica/sativa/hybrid — descriptive only, no medical claims).

**Merchants & dispensaries**
`Merchant` (company) → `Dispensary` (licensed location: address, `geog geography(Point,4326)`, hours, photos) — one merchant, many locations, matching the brief's Merchant vs. Dispensary split.

**Engagement**
`Deal`/`DealProduct`/`DealBrand`/`DealLocation` (start/end, status, terms — never silently assumed), `Review`/`ReviewVote`/`ReviewReport` (type: PRODUCT/DISPENSARY, status: pending/published/flagged/removed), `SavedProduct`/`SavedStore`/`SavedBrand`, `List`/`ListItem`, `RecentView`, `SearchHistory`, `Alert`/`AlertCondition`/`AlertEvent`, `Notification`/`NotificationPreference`.

**Growth infra (schema now, wired later)**
`Integration`/`IntegrationCredential`/`IntegrationSync`/`IntegrationError` (POS adapters), `Plan`/`Subscription`/`Entitlement` (Stripe-shaped), `FeatureFlag`, `ModerationCase`, `AnalyticsEvent`.

Full DDL ships in `prisma/schema.prisma` in this change — ~45 models. Geo queries use a raw-SQL `Unsupported("geography(Point,4326)")` column with a GiST index (`ST_DWithin`) rather than Haversine-in-application-code, so radius search stays index-backed as the dispensary table grows past thousands of rows.

---

## E. Proposed folder structure

```
src/
  app/                          # routes only — thin, delegate to server/ domains
    (marketing)/                # guest landing
    (consumer)/
      home/ explore/ search/ map/
      dispensaries/[slug]/
      products/[brand]/[slug]/
      brands/[slug]/  strains/[slug]/  deals/
      saved/ lists/ alerts/ notifications/ profile/ settings/
    (auth)/ sign-in/ sign-up/
    api/                         # only for things that must be HTTP (webhooks, chat stream)
  server/
    auth/            users/          dispensaries/
    products/         brands/         strains/
    pricing/           deals/          reviews/
    favorites/          alerts/         notifications/
    search/              ai/             compliance/
    geo/ (osm adapter)    events/ (emitter)
    each domain: types.ts, service.ts, repository.ts
  components/
    ui/              # design-system primitives (Button, Card, Badge, Input, Sheet…)
    layout/          # AppHeader, BottomNav, AgeGate
    domain components colocated under (consumer)/ routes where route-specific
  lib/               # db client, auth config, rbac helpers, geo math, format helpers
prisma/
  schema.prisma  migrations/  seed.ts
```

Kept flat (one app) on purpose — see section B. `packages/` is the future move, not today's.

---

## F. User journeys (representative)

1. **Guest → consumer:** lands on marketing page → age gate (DOB, jurisdiction-driven minimum) → browses Explore/Dispensaries with location prompt (skippable) → views a product's "Available near you" table → prompted to create an account to save/alert.
2. **Consumer price-hunting:** searches "flower under $35 near Eagan" → filtered product list → opens a product → compares listings across 4 dispensaries → sets a price alert → gets notified in-app when triggered.
3. **Consumer building a trip:** saves 5 products across 2 dispensaries to a List → (future) Shopping List Optimizer suggests the 1-stop dispensary covering the most of the list.
4. **Merchant (future phase):** signs up → claims/verifies a license → dashboard shows zero data until they import a menu (CSV first) → sees profile views, product views, follower count grow.
5. **Admin (future phase):** reviews a pending `MerchantLicense`, approves or rejects with a reason, action is audit-logged.

---

## G–J. UX architecture by persona

**G. Consumer** — mobile-first, bottom nav (Home/Explore/Map/Saved/Profile), search always one tap away via the header. Home is genuinely dynamic per the brief (nearby dispensaries, deals, recently viewed, recommended) for logged-in users and a discovery landing for guests — implemented as real Server Component queries against seeded data in this build, not static copy.

**H. Merchant** — a distinct dashboard shell (not the consumer chrome) with Overview/Locations/Products/Deals/Analytics/Reviews/Team/Settings. Out of scope for this pass beyond the data model; building the dashboard UI against schema with no import pipeline behind it would mean shipping charts with fabricated numbers, which the brief explicitly rules out.

**I. Brand** — same reasoning: portal UI is Phase 9, data model (`Brand`, scoped `UserRole`) ships now so the claim flow has somewhere to attach later.

**J. Admin** — RBAC roles and `AuditLog` ship now (foundation everything else depends on); the console UI is Phase 11.

---

## K. Search architecture

Postgres `pg_trgm` + `tsvector` generated columns on `CanonicalProduct.name`/`Dispensary.name`/`Brand.name` for typo-tolerant, ranked search now — genuinely used in the Search page shipped in this build. The query layer sits behind a `SearchProvider` interface (`search(query, filters): Result[]`) so swapping the Postgres implementation for Typesense/Meilisearch later is an adapter swap, not a rewrite of every call site. Natural-language interpretation ("cheap relaxing flower near me under 20% THC") is architected as a structured-filter extraction step in front of the same provider interface — deferred until the AI tool-calling layer (section L) exists, since it's the same mechanism.

---

## L. AI architecture

Tool-calling, not free-form DB access — the model is given a fixed set of functions (`searchProducts`, `getListingsForProduct`, `getDispensary`, `getUserFavorites`) that call the real domain services; it composes answers only from what those calls return, and every answer links to real listing URLs. This is the same shape the current `/api/chat` route will grow into, re-platformed onto the new product model instead of the flat `Product` table. No medical claims, no invented availability — enforced by construction, since the model has no path to data other than the tool results.

---

## M. Pricing / alert architecture

`PriceSnapshot`/`InventorySnapshot` are append-only time series keyed off `DispensaryListing`. A scheduled job (Phase 6, BullMQ) diffs current vs. last snapshot; a change that crosses an `AlertCondition` threshold writes an `AlertEvent` and enqueues a `Notification`. Cost-per-unit (price/g, price/mg, price/edible) is computed from `ProductVariant` fields at read time — never stored, so it's never stale relative to price.

---

## N. Compliance architecture

Age minimum and delivery legality are data (`JurisdictionPolicy`), never a hard-coded `18`/`21`. A dispensary is never rendered as "Verified" from merchant self-attestation — `MerchantLicense.status` starts `unverified` and only an admin action (audit-logged) moves it to `verified`. This build ships the age gate and the policy table; the verification *workflow UI* is Phase 11 (admin console).

---

## O. Monetization architecture

`Plan`/`Subscription`/`Entitlement` schema ships now, shaped for Stripe (`stripeCustomerId`, `stripePriceId` fields) but with no Stripe calls wired yet — there's no merchant dashboard to gate access to yet, so wiring billing first would have nothing to protect. Entitlement checks are designed to live server-side (`hasEntitlement(merchantId, "advanced_analytics")`) — never a frontend flag — from the first line of code that reads them.

---

## P. Security plan

Server-side authorization on every mutation (session + role check inside the Server Action/route, not just hidden UI); Zod validation at every input boundary; Prisma parameterization (no raw string interpolation into SQL — the one raw-SQL geo query uses parameterized `$1`/`$2`); secrets via env only, never committed; rate limiting on auth and chat endpoints; signed webhook verification once Stripe/POS webhooks exist; upload MIME/size validation once photo upload exists.

---

## Q. Scalability plan

Server Components + cursor pagination for anything list-shaped from day one (offset pagination degrades badly past a few thousand rows and the product/listing tables are expected to grow into the millions). GiST index on the geography column for radius queries. Redis planned for session storage and hot read caching (dispensary detail, product detail) once traffic justifies it — not added speculatively before there's load to justify the operational cost.

---

## R. Implementation roadmap

Phases 1–5 from the brief, sequenced as: **(1)** architecture + schema + auth + design system, **(2)** consumer discovery shell, **(3)** dispensaries/products/canonical listings with seed data, **(4)** search + basic map, **(5)** favorites/lists/reviews — is what ships in this change, as a working vertical slice, not stubs. Phases 6–13 (price engine + alerts worker, merchant dashboard, integrations, brand portal, Stripe, admin console, AI recommendations, analytics) are real, multi-week workstreams each and are not started beyond the schema that supports them — building their UI now would mean shipping dashboards with invented numbers, against the brief's own instruction not to fabricate.

---

## S. What would make Budseeker materially better than Weedmaps/Leafly-style discovery

- **Canonical-product price comparison as the default view, not an afterthought** — most competitors show you one store's menu at a time; Budseeker's core entity is the *product*, with stores as comparison rows underneath it.
- **Explainable everything** — every recommendation, match score, and deal score ships with a one-line "why," which nobody in this category does well.
- **Price history as a first-class citizen** — competitors show today's price; a "lowest observed in 30 days" badge changes user trust instantly and is nearly free once `PriceSnapshot` exists.
- **Shopping List Optimizer** — nobody solves "which combination of stores covers my list best," and it's a genuinely hard, genuinely useful operations-research-flavored feature once listing data exists.
- **Merchant-side honesty tools** (inventory freshness score, "your prices are 12% above nearby competitors") build trust with the *supply* side, which is what actually gets menus kept current — most platforms only invest in the demand side.

---

*End of blueprint. Implementation for Phases 1–5 (schema, auth/RBAC, design tokens, seed data, consumer discovery) follows in this same session.*
