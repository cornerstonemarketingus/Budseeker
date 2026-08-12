"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bike, ExternalLink, Leaf, ListFilter, Loader2, LocateFixed, Map, MapPin,
  Navigation, Search, Send, SlidersHorizontal, Sparkles, Store, TrendingDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Tab = "products" | "stores" | "guide";

type Deal = {
  dealScore: number;
  label: string;
  typicalPrice: number;
  lowestPrice: number;
  savingsVsTypical: number;
  suspiciousSale: boolean;
};

type ProductResult = {
  productName: string;
  slug: string;
  brand: string | null;
  category: string;
  strain: string | null;
  thcContent: number | null;
  cbdContent: number | null;
  effects: string[];
  variantId: string;
  variantLabel: string;
  price: number;
  comparePrice: number | null;
  deal: Deal | null;
};

type Place = {
  id: string;
  name: string;
  address: string;
  distanceMiles: number;
  openingHours: string | null;
  website: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  delivery: boolean;
  pickup: boolean;
};
type Coordinates = { latitude: number; longitude: number };
type FulfillmentFilter = "any" | "delivery" | "pickup";
type ProductSort = "deal" | "price-asc" | "price-desc";
type Message = { role: "user" | "assistant"; content: string };

const chip = (active: boolean) =>
  active
    ? "bg-emerald-700 text-white dark:bg-emerald-500/15 dark:text-emerald-300 dark:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_16px_rgba(52,255,156,.25)]"
    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-400 dark:hover:border-emerald-500/40";

const tabButton = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${active
    ? "bg-white text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_14px_rgba(52,255,156,.25)]"
    : "text-slate-600 dark:text-zinc-500"}`;

export function BudSeekerApp() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-950 dark:bg-black dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_20px_rgba(52,255,156,.5)]">
              <Leaf className="h-4 w-4" />
            </span>
            Bud Seeker
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-4">
          <div className="inline-grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1 dark:bg-white/[.04]">
            <button onClick={() => setTab("products")} className={tabButton(tab === "products")}>Products</button>
            <button onClick={() => setTab("stores")} className={tabButton(tab === "stores")}>Stores</button>
            <button onClick={() => setTab("guide")} className={tabButton(tab === "guide")}>Ask AI</button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {tab === "products" && <ProductsPanel />}
        {tab === "stores" && <StoresPanel />}
        {tab === "guide" && <GuidePanel />}
      </main>
    </div>
  );
}

function ProductsPanel() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductSort>("deal");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  async function runSearch(q: string) {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed.");
      setResults(data.results ?? []);
      setState("done");
    } catch {
      setState("error");
    }
  }

  // Load the full catalog immediately so results are visible without typing first.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { runSearch(""); }, []);

  const sortedResults = useMemo(() => {
    const copy = [...results];
    if (sort === "price-asc") copy.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") copy.sort((a, b) => b.price - a.price);
    else copy.sort((a, b) => (b.deal?.dealScore ?? 0) - (a.deal?.dealScore ?? 0));
    return copy;
  }, [results, sort]);

  return (
    <div>
      <form onSubmit={(event) => { event.preventDefault(); setState("loading"); runSearch(query); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by strain, product, brand, or effect — e.g. &quot;Blue Dream&quot; or &quot;relaxing&quot;"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white dark:focus:border-emerald-400/60"
          />
        </div>
        <button className="rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_16px_rgba(52,255,156,.35)]">Search</button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-500"><SlidersHorizontal className="h-3.5 w-3.5" />Sort</span>
        <button onClick={() => setSort("deal")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(sort === "deal")}`}><TrendingDown className="h-3.5 w-3.5" />Best deal</button>
        <button onClick={() => setSort("price-asc")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(sort === "price-asc")}`}>Price: low to high</button>
        <button onClick={() => setSort("price-desc")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(sort === "price-desc")}`}>Price: high to low</button>
      </div>

      {state === "loading" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[.03]" />
          ))}
        </div>
      )}
      {state === "error" && <p className="mt-8 text-center text-sm text-red-600 dark:text-red-400">Product search is temporarily unavailable.</p>}
      {state === "done" && sortedResults.length === 0 && (
        <p className="mt-8 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-white/[.03] dark:text-zinc-500">No products match &quot;{query}&quot;. Try a different strain, brand, or effect.</p>
      )}
      {state === "done" && sortedResults.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedResults.map((product) => (
            <article key={product.variantId} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[.02] dark:hover:border-emerald-400/40 dark:hover:shadow-[0_0_24px_rgba(52,255,156,.12)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{product.category}{product.brand ? ` · ${product.brand}` : ""}</p>
                  <h3 className="mt-0.5 font-semibold">{product.productName}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">{product.variantLabel}{product.strain ? ` · ${product.strain}` : ""}</p>
                </div>
                <span className="shrink-0 text-lg font-semibold">${product.price}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-zinc-500">
                {product.thcContent != null && <span>THC {product.thcContent}%</span>}
                {product.cbdContent != null && <span>CBD {product.cbdContent}%</span>}
              </div>
              {product.deal && (
                <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <TrendingDown className="h-3 w-3" />{product.deal.label} · {product.deal.dealScore}/100
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StoresPanel() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [locationError, setLocationError] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [areaQuery, setAreaQuery] = useState("");
  const [maxDistance, setMaxDistance] = useState(25);
  const [websiteOnly, setWebsiteOnly] = useState(false);
  const [fulfillment, setFulfillment] = useState<FulfillmentFilter>("any");

  const visiblePlaces = useMemo(
    () => places.filter((place) =>
      place.distanceMiles <= maxDistance &&
      (!websiteOnly || place.website) &&
      (fulfillment === "any" || (fulfillment === "delivery" ? place.delivery : place.pickup)),
    ),
    [places, maxDistance, websiteOnly, fulfillment],
  );
  const mapUrl = coordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.08}%2C${coordinates.latitude - 0.06}%2C${coordinates.longitude + 0.08}%2C${coordinates.latitude + 0.06}&layer=mapnik&marker=${coordinates.latitude}%2C${coordinates.longitude}`
    : "";

  async function loadPlaces(nextCoordinates: Coordinates, label: string) {
    setLocationState("loading");
    setLocationError("");
    setCoordinates(nextCoordinates);
    setLocationLabel(label);
    try {
      const response = await fetch(`/api/dispensaries?lat=${nextCoordinates.latitude}&lon=${nextCoordinates.longitude}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed.");
      setPlaces(data.places ?? []);
      setLocationState("done");
    } catch (error) {
      setLocationState("error");
      setLocationError(error instanceof Error ? error.message : "Search failed.");
    }
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      setLocationState("error");
      setLocationError("Location sharing isn't available in this browser.");
      return;
    }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => loadPlaces({ latitude: coords.latitude, longitude: coords.longitude }, "your shared location"),
      () => {
        setLocationState("error");
        setLocationError("Location sharing was denied. Search by city or ZIP instead.");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }

  async function searchArea(event: React.FormEvent) {
    event.preventDefault();
    const query = areaQuery.trim();
    if (!query) return;
    setLocationState("loading");
    setLocationError("");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Location not found.");
      await loadPlaces({ latitude: data.latitude, longitude: data.longitude }, data.label);
    } catch (error) {
      setLocationState("error");
      setLocationError(error instanceof Error ? error.message : "Location not found.");
    }
  }

  return (
    <div>
      <form onSubmit={searchArea} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="City, neighborhood, or ZIP code"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white dark:focus:border-emerald-400/60" />
        </div>
        <button className="rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_16px_rgba(52,255,156,.35)]">Search</button>
        <button type="button" onClick={shareLocation} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-300"><LocateFixed className="h-4 w-4" /><span className="hidden sm:inline">Share my location</span></button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-500"><ListFilter className="h-3.5 w-3.5" />Distance</span>
        {[5, 10, 25, 50].map((distance) => <button key={distance} onClick={() => setMaxDistance(distance)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(maxDistance === distance)}`}>{distance} mi</button>)}
        <span className="ml-2 h-4 w-px bg-slate-200 dark:bg-white/10" />
        <button onClick={() => setFulfillment((current) => (current === "delivery" ? "any" : "delivery"))} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(fulfillment === "delivery")}`}><Bike className="h-3.5 w-3.5" />Delivery</button>
        <button onClick={() => setFulfillment((current) => (current === "pickup" ? "any" : "pickup"))} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(fulfillment === "pickup")}`}><Store className="h-3.5 w-3.5" />Pickup</button>
        <button onClick={() => setWebsiteOnly((current) => !current)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(websiteOnly)}`}>Online menu</button>
      </div>

      {locationState === "idle" && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/10">
          <Map className="mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-400 dark:drop-shadow-[0_0_16px_rgba(52,255,156,.5)]" />
          <h3 className="mt-4 text-2xl font-semibold">See what&apos;s actually near you.</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-zinc-400">Search a city or ZIP, or share your location — every mapped store nearby, closest first, delivery and pickup called out.</p>
          <button onClick={shareLocation} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_20px_rgba(52,255,156,.4)]"><Navigation className="h-4 w-4" />Share my location</button>
        </div>
      )}
      {locationState === "loading" && <div className="mt-8 flex items-center justify-center gap-3 py-16 text-slate-600 dark:text-zinc-400"><Loader2 className="h-5 w-5 animate-spin" />Searching the area…</div>}
      {locationState === "error" && (
        <div className="mt-8 py-10 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{locationError}</p>
          <button onClick={shareLocation} className="mt-4 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400">Try sharing location again</button>
        </div>
      )}
      {locationState === "done" && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 lg:order-1">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Near {locationLabel}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">{visiblePlaces.length} mapped result{visiblePlaces.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            <div className="space-y-3">
              {visiblePlaces.length === 0 && <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-white/[.03] dark:text-zinc-500">No mapped dispensaries match these filters. Try a wider distance.</p>}
              {visiblePlaces.map((place, index) => (
                <article key={place.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[.02] dark:hover:border-emerald-400/40 dark:hover:shadow-[0_0_24px_rgba(52,255,156,.12)]">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{place.name}</h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">{place.address}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{place.distanceMiles} mi</span>
                      </div>
                      {place.openingHours && <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">{place.openingHours}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {place.delivery && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Bike className="h-3 w-3" />Delivery</span>}
                        {place.pickup && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/[.06] dark:text-zinc-300"><Store className="h-3 w-3" />Pickup</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/directions?to=${place.latitude},${place.longitude}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-black">Directions <Navigation className="h-3.5 w-3.5" /></a>
                        {place.website && <a target="_blank" rel="noreferrer" href={place.website} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:text-zinc-300">Menu / website <ExternalLink className="h-3.5 w-3.5" /></a>}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="order-1 min-h-56 overflow-hidden rounded-2xl border border-slate-200 bg-emerald-50 lg:order-2 dark:border-white/10 dark:bg-white/[.02]">
            {mapUrl && <iframe src={mapUrl} className="h-full min-h-64 w-full" style={{ border: 0 }} loading="lazy" title={`Dispensaries near ${locationLabel}`} />}
          </div>
        </div>
      )}
      <p className="mt-4 text-[11px] text-slate-500 dark:text-zinc-600">Location data © OpenStreetMap contributors. Verify licensing directly.</p>
    </div>
  );
}

function GuidePanel() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "What are you in the mood for? Tell me the vibe, strength, or format and I'll match it against what's actually in stock right now.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const userMessage: Message = { role: "user", content: text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Guide is unavailable.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Guide is unavailable." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[min(700px,calc(100vh-13rem))] flex-col rounded-2xl border border-slate-200 dark:border-white/10">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.map((message, index) => message.role === "user" ? (
          <div key={index} className="flex justify-end">
            <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-emerald-700 px-4 py-3 text-sm leading-relaxed text-white dark:bg-emerald-500/15 dark:text-white dark:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_18px_rgba(52,255,156,.18)]">
              {message.content}
            </div>
          </div>
        ) : (
          <div key={index} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:shadow-[0_0_10px_rgba(52,255,156,.3)]">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <p className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-zinc-200">{message.content}</p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Sparkles className="h-3.5 w-3.5" /></span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s] dark:bg-emerald-400 dark:shadow-[0_0_6px_rgba(52,255,156,.7)]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s] dark:bg-emerald-400 dark:shadow-[0_0_6px_rgba(52,255,156,.7)]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 dark:bg-emerald-400 dark:shadow-[0_0_6px_rgba(52,255,156,.7)]" />
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-3 dark:border-white/10">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="What are you looking for?"
          className="h-11 flex-1 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white dark:focus:border-emerald-400/60 dark:focus:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_18px_rgba(52,255,156,.2)]" />
        <button disabled={!input.trim() || loading} className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white transition disabled:opacity-40 dark:bg-emerald-500 dark:text-black dark:enabled:shadow-[0_0_18px_rgba(52,255,156,.45)]"><Send className="h-4 w-4" /></button>
      </form>
      <p className="flex items-center justify-center gap-1 pb-2 pt-1 text-[11px] text-slate-500 dark:text-zinc-600"><Leaf className="h-3 w-3" />Adults 21+ · Not medical advice</p>
    </div>
  );
}
