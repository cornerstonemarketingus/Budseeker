"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bike, ExternalLink, Leaf, ListFilter, Loader2, LocateFixed, Map, MapPin, Navigation, Send, Store, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Message = { role: "user" | "assistant"; content: string };
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

const BUD_SEEKER_EMAIL_KEY = "budseeker_email";

const chip = (active: boolean) =>
  active
    ? "bg-emerald-700 text-white dark:bg-emerald-500/15 dark:text-emerald-300 dark:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_16px_rgba(52,255,156,.25)]"
    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-400 dark:hover:border-emerald-500/40";

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"nearby" | "guide">("guide");
  const [places, setPlaces] = useState<Place[]>([]);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [locationError, setLocationError] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [areaQuery, setAreaQuery] = useState("");
  const [maxDistance, setMaxDistance] = useState(25);
  const [websiteOnly, setWebsiteOnly] = useState(false);
  const [fulfillment, setFulfillment] = useState<FulfillmentFilter>("any");
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "What are you in the mood for? Tell me the vibe, strength, or format and I'll match it against what's actually in stock right now.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [gateEmail, setGateEmail] = useState("");
  const [gateError, setGateError] = useState("");
  const [joining, setJoining] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => setMemberEmail(localStorage.getItem(BUD_SEEKER_EMAIL_KEY) || ""), []);
  useEffect(() => {
    const handler = () => { setOpen(true); setTab("nearby"); };
    window.addEventListener("bud-seeker:open", handler);
    return () => window.removeEventListener("bud-seeker:open", handler);
  }, []);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  function toggleGuide() {
    setTab("guide");
    setOpen((current) => !current);
  }

  async function loadPlaces(nextCoordinates: Coordinates, label: string) {
    setLocationState("loading");
    setLocationError("");
    setCoordinates(nextCoordinates);
    setLocationLabel(label);
    try {
      const response = await fetch(`/api/dispensaries?lat=${nextCoordinates.latitude}&lon=${nextCoordinates.longitude}&email=${encodeURIComponent(memberEmail)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed.");
      setPlaces(data.places ?? []);
      setLocationState("done");
    } catch (error) {
      setLocationState("error");
      setLocationError(error instanceof Error ? error.message : "Search failed.");
    }
  }

  function findNearby() {
    if (!navigator.geolocation) {
      setLocationState("error");
      setLocationError("Location services are not available in this browser.");
      return;
    }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => loadPlaces({ latitude: coords.latitude, longitude: coords.longitude }, "Your current location"),
      () => {
        setLocationState("error");
        setLocationError("Allow location access, or search by city or ZIP code.");
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
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&email=${encodeURIComponent(memberEmail)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Location not found.");
      await loadPlaces({ latitude: data.latitude, longitude: data.longitude }, data.label);
    } catch (error) {
      setLocationState("error");
      setLocationError(error instanceof Error ? error.message : "Location not found.");
    }
  }

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
        body: JSON.stringify({ messages: [...messages, userMessage], email: memberEmail }),
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

  async function joinBudSeeker(event: React.FormEvent) {
    event.preventDefault();
    setGateError("");
    setJoining(true);
    try {
      const normalizedEmail = gateEmail.trim().toLowerCase();
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setGateError(data.error || "Signup failed.");
      localStorage.setItem(BUD_SEEKER_EMAIL_KEY, normalizedEmail);
      setMemberEmail(normalizedEmail);
    } finally {
      setJoining(false);
    }
  }

  if (pathname === "/games") return null;

  return (
    <>
      <button onClick={toggleGuide}
        className="group fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-[0_16px_45px_rgba(0,0,0,.35)] transition hover:scale-105 dark:shadow-none"
        aria-label={open ? "Close private guide" : "Chat with the private guide"}>
        <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse-ring" style={{ boxShadow: "0 0 0 0 rgba(52,255,156,.55)" }} />
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full ring-1 ring-white/20 dark:shadow-[0_0_24px_rgba(52,255,156,.45)]">
          {open ? <X className="h-6 w-6" /> : (
            <>
              <Image src="/brand/private-guide.webp" alt="" fill sizes="64px" className="rounded-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-black bg-[#34ff9c] shadow-[0_0_12px_rgba(52,255,156,.9)]" />
            </>
          )}
        </span>
      </button>

      {open && (
        <section className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white text-slate-950 shadow-[0_30px_100px_rgba(15,23,42,.3)] sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(760px,calc(100vh-8rem))] sm:w-[min(920px,calc(100vw-2.5rem))] dark:border-white/10 dark:bg-black dark:text-white dark:shadow-[0_0_0_1px_rgba(52,255,156,.14),0_30px_100px_rgba(0,0,0,.6),0_0_60px_rgba(52,255,156,.08)]">
          <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-black">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 animate-guide-idle overflow-hidden rounded-full ring-2 ring-emerald-100 dark:ring-1 dark:ring-emerald-400/40 dark:shadow-[0_0_18px_rgba(52,255,156,.35)]">
                  <Image src="/brand/private-guide.webp" alt="" fill sizes="44px" className="object-cover" />
                </div>
                <div><h2 className="font-semibold">{tab === "guide" ? "Private Guide" : "Bud Seeker"}</h2><p className="text-xs text-slate-500 dark:text-zinc-500">{tab === "guide" ? "Your private product guide" : "Explore licensed retailers near you"}</p></div>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 sm:hidden dark:text-zinc-400 dark:hover:bg-white/5" aria-label="Close"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="mt-4 grid max-w-sm grid-cols-2 rounded-full bg-slate-100 p-1 dark:bg-white/[.04]">
              <button onClick={() => setTab("guide")} className={`rounded-full px-3 py-2 text-sm font-medium transition ${tab === "guide" ? "bg-white text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_14px_rgba(52,255,156,.25)]" : "text-slate-600 dark:text-zinc-500"}`}>Private guide</button>
              <button onClick={() => setTab("nearby")} className={`rounded-full px-3 py-2 text-sm font-medium transition ${tab === "nearby" ? "bg-white text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_14px_rgba(52,255,156,.25)]" : "text-slate-600 dark:text-zinc-500"}`}>Bud Seeker</button>
            </div>
          </header>

          {tab === "nearby" && !memberEmail ? (
            <form onSubmit={joinBudSeeker} className="m-auto w-full max-w-md p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Free access</p>
              <h3 className="mt-3 text-3xl font-semibold">You&apos;re one email away.</h3>
              <p className="mt-3 leading-7 text-slate-600 dark:text-zinc-400">Get instant access to your AI budtender and a live map of nearby stores. Free, always — no menus, no calling around.</p>
              <label htmlFor="bud-seeker-email" className="mt-6 block text-sm font-medium text-slate-700 dark:text-zinc-300">Email address</label>
              <input id="bud-seeker-email" type="email" required value={gateEmail} onChange={(event) => setGateEmail(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white dark:focus:border-emerald-400/60 dark:focus:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_18px_rgba(52,255,156,.2)]"
                placeholder="you@example.com" />
              {gateError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{gateError}</p>}
              <button disabled={joining} className="mt-4 h-12 w-full rounded-xl bg-emerald-700 font-semibold text-white transition disabled:opacity-50 dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_24px_rgba(52,255,156,.4)] dark:hover:shadow-[0_0_32px_rgba(52,255,156,.55)]">{joining ? "Joining…" : "Get instant access"}</button>
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-zinc-500">Adults 21+ · Unsubscribe anytime</p>
            </form>
          ) : tab === "nearby" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[.02]">
                <form onSubmit={searchArea} className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <input value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="City, neighborhood, or ZIP code"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white dark:focus:border-emerald-400/60" />
                  </div>
                  <button className="rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_16px_rgba(52,255,156,.35)]">Search</button>
                  <button type="button" onClick={findNearby} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-300"><LocateFixed className="h-4 w-4" /><span className="hidden sm:inline">Near me</span></button>
                </form>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-500"><ListFilter className="h-3.5 w-3.5" />Distance</span>
                  {[5, 10, 25, 50].map((distance) => <button key={distance} onClick={() => setMaxDistance(distance)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(maxDistance === distance)}`}>{distance} mi</button>)}
                  <span className="ml-2 h-4 w-px bg-slate-200 dark:bg-white/10" />
                  <button onClick={() => setFulfillment((current) => (current === "delivery" ? "any" : "delivery"))} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(fulfillment === "delivery")}`}><Bike className="h-3.5 w-3.5" />Delivery</button>
                  <button onClick={() => setFulfillment((current) => (current === "pickup" ? "any" : "pickup"))} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(fulfillment === "pickup")}`}><Store className="h-3.5 w-3.5" />Pickup</button>
                  <button onClick={() => setWebsiteOnly((current) => !current)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(websiteOnly)}`}>Online menu</button>
                </div>
              </div>

              {locationState === "idle" && <div className="m-auto px-6 py-12 text-center"><Map className="mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-400 dark:drop-shadow-[0_0_16px_rgba(52,255,156,.5)]" /><h3 className="mt-4 text-2xl font-semibold">See what&apos;s actually near you.</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-zinc-400">Search a city or ZIP, or use your location — every mapped store nearby, closest first, delivery and pickup called out.</p><button onClick={findNearby} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_20px_rgba(52,255,156,.4)]"><Navigation className="h-4 w-4" />Explore near me</button></div>}
              {locationState === "loading" && <div className="m-auto flex items-center gap-3 py-16 text-slate-600 dark:text-zinc-400"><Loader2 className="h-5 w-5 animate-spin" />Searching the area…</div>}
              {locationState === "error" && <div className="m-auto py-10 text-center"><p className="text-sm text-red-600 dark:text-red-400">{locationError}</p><button onClick={findNearby} className="mt-4 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400">Try current location</button></div>}
              {locationState === "done" && <div className="grid min-h-0 flex-1 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="order-2 overflow-y-auto p-4 lg:order-1">
                  <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Near {locationLabel}</p><p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">{visiblePlaces.length} mapped result{visiblePlaces.length === 1 ? "" : "s"}</p></div></div>
                  <div className="space-y-3">
                    {visiblePlaces.length === 0 && <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-white/[.03] dark:text-zinc-500">No mapped dispensaries match these filters. Try a wider distance.</p>}
                    {visiblePlaces.map((place, index) => <article key={place.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[.02] dark:hover:border-emerald-400/40 dark:hover:shadow-[0_0_24px_rgba(52,255,156,.12)]">
                      <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{place.name}</h3><p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">{place.address}</p></div><span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{place.distanceMiles} mi</span></div>
                        {place.openingHours && <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">{place.openingHours}</p>}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {place.delivery && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Bike className="h-3 w-3" />Delivery</span>}
                          {place.pickup && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/[.06] dark:text-zinc-300"><Store className="h-3 w-3" />Pickup</span>}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2"><a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/directions?to=${place.latitude},${place.longitude}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-black">Directions <Navigation className="h-3.5 w-3.5" /></a>{place.website && <a target="_blank" rel="noreferrer" href={place.website} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:text-zinc-300">Menu / website <ExternalLink className="h-3.5 w-3.5" /></a>}</div>
                      </div></div>
                    </article>)}
                  </div>
                </div>
                <div className="order-1 min-h-56 border-b border-slate-200 bg-emerald-50 lg:order-2 lg:border-b-0 lg:border-l dark:border-white/10 dark:bg-white/[.02]">
                  {mapUrl && <iframe src={mapUrl} className="h-full min-h-64 w-full" style={{ border: 0 }} loading="lazy" title={`Dispensaries near ${locationLabel}`} />}
                </div>
              </div>}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-500 dark:border-white/10 dark:bg-black dark:text-zinc-600">
                <span>Location data © OpenStreetMap contributors. Verify licensing directly.</span>
              </div>
            </div>
          ) : (
            <>
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
                      <Leaf className="h-3.5 w-3.5" />
                    </span>
                    <p className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-zinc-200">{message.content}</p>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Leaf className="h-3.5 w-3.5" /></span>
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s] dark:bg-emerald-400 dark:shadow-[0_0_6px_rgba(52,255,156,.7)]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s] dark:bg-emerald-400 dark:shadow-[0_0_6px_rgba(52,255,156,.7)]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 dark:bg-emerald-400 dark:shadow-[0_0_6px_rgba(52,255,156,.7)]" />
                    </span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-black">
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="What are you looking for?"
                  className="h-11 flex-1 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white dark:focus:border-emerald-400/60 dark:focus:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_18px_rgba(52,255,156,.2)]" />
                <button disabled={!input.trim() || loading} className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white transition disabled:opacity-40 dark:bg-emerald-500 dark:text-black dark:enabled:shadow-[0_0_18px_rgba(52,255,156,.45)]"><Send className="h-4 w-4" /></button>
              </form>
              <p className="flex items-center justify-center gap-1 pb-2 text-[11px] text-slate-500 dark:text-zinc-600"><Leaf className="h-3 w-3" />Adults 21+ · Not medical advice</p>
            </>
          )}
        </section>
      )}
    </>
  );
}
