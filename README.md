# Bud Seeker

An AI product guide and nearby-dispensary finder for cannabis retailers, built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and **Prisma**.

## Features

- Email-gated private product guide chat (backed by an Ollama-compatible LLM)
- Nearby dispensary search via OpenStreetMap/Overpass, with distance and map view
- City/ZIP geocoding via Nominatim

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

Bud Seeker reads from a `Product`/`Category` catalog and gates access behind a `NewsletterSubscriber` email list — seed these tables from your own retailer data.

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
│       ├── chat/          # Product guide chat (Ollama-compatible)
│       ├── dispensaries/  # Nearby dispensary search (Overpass)
│       ├── geocode/       # City/ZIP geocoding (Nominatim)
│       └── newsletter/subscribe/  # Email gate
├── components/
│   ├── BudSeekerTrigger.tsx
│   └── ChatWidget.tsx
└── lib/
    └── db.ts
prisma/
└── schema.prisma
```
