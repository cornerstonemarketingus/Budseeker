"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Bike, ExternalLink, ListFilter, Loader2, LocateFixed, Map, MapPin,
  Navigation, Store,
} from "lucide-react";

// Leaflet touches the DOM at import time, so it can only ever run client-side.
const DispensaryMap = dynamic(() => import("@/components/DispensaryMap").then((m) => m.DispensaryMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-slate-500 dark:text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" />Loading map…
    </div>
  ),
});

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

const chip = (active: boolean) =>
  active
    ? "bg-emerald-700 text-white dark:bg-emerald-500/15 dark:text-emerald-300 dark:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_16px_rgba(52,255,156,.25)]"
    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-400 dark:hover:border-emerald-500/40";

export function NearbyDispensaries() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [locationError, setLocationError] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [areaQuery, setAreaQuery] = useState("");
  const [maxDistance, setMaxDistance] = useState(25);
  const [websiteOnly, setWebsiteOnly] = useState(false);
  const [fulfillment, setFulfillment] = useState<FulfillmentFilter>("any");
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);

  const visiblePlaces = useMemo(
    () => places.filter((place) =>
      place.distanceMiles <= maxDistance &&
      (!websiteOnly || place.website) &&
      (fulfillment === "any" || (fulfillment === "delivery" ? place.delivery : place.pickup)),
    ),
    [places, maxDistance, websiteOnly, fulfillment],
  );

  async function loadPlaces(nextCoordinates: Coordinates, label: string) {
    setLocationState("loading");
    setLocationError("");
    setCoordinates(nextCoordinates);
    setLocationLabel(label);
    setFocusedPlaceId(null);
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={searchArea} className="relative flex-1">
          <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="City, neighborhood, or ZIP"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-24 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white dark:focus:border-emerald-400/60" />
          <button className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-black">Search</button>
        </form>
        <button
          type="button"
          onClick={shareLocation}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(5,150,105,.3)] transition hover:-translate-y-0.5 hover:bg-emerald-800 dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_28px_rgba(52,255,156,.4)]"
        >
          <LocateFixed className="h-4 w-4" />Share my location
        </button>
      </div>

      {locationState === "done" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-500"><ListFilter className="h-3.5 w-3.5" />Distance</span>
          {[5, 10, 25, 50].map((distance) => <button key={distance} onClick={() => setMaxDistance(distance)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(maxDistance === distance)}`}>{distance} mi</button>)}
          <button onClick={() => setFulfillment((current) => (current === "delivery" ? "any" : "delivery"))} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(fulfillment === "delivery")}`}><Bike className="h-3.5 w-3.5" />Delivery</button>
          <button onClick={() => setFulfillment((current) => (current === "pickup" ? "any" : "pickup"))} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(fulfillment === "pickup")}`}><Store className="h-3.5 w-3.5" />Pickup</button>
          <button onClick={() => setWebsiteOnly((current) => !current)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(websiteOnly)}`}>Online menu</button>
        </div>
      )}

      {locationState === "idle" && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/10">
          <Map className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          <p className="mx-auto mt-3 max-w-sm text-sm text-slate-600 dark:text-zinc-400">Share your location or search a city/ZIP to see every licensed dispensary near you, plotted on the map.</p>
        </div>
      )}
      {locationState === "loading" && <div className="mt-6 flex items-center justify-center gap-3 py-14 text-slate-600 dark:text-zinc-400"><Loader2 className="h-5 w-5 animate-spin" />Searching the area…</div>}
      {locationState === "error" && (
        <div className="mt-6 py-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{locationError}</p>
          <button onClick={shareLocation} className="mt-3 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400">Try sharing location again</button>
        </div>
      )}
      {locationState === "done" && (
        <div className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Near {locationLabel}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">{visiblePlaces.length} mapped result{visiblePlaces.length === 1 ? "" : "s"} — click a pin or a result to match them up</p>
            </div>
          </div>

          <div className="h-[60vh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-emerald-50 dark:border-white/10 dark:bg-white/[.02]">
            {coordinates && <DispensaryMap center={coordinates} places={visiblePlaces} focusedId={focusedPlaceId} />}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePlaces.length === 0 && <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-white/[.03] dark:text-zinc-500 sm:col-span-2 lg:col-span-3">No mapped dispensaries match these filters. Try a wider distance.</p>}
            {visiblePlaces.map((place, index) => (
              <button
                key={place.id}
                onClick={() => setFocusedPlaceId(place.id)}
                className={`flex flex-col rounded-2xl border p-4 text-left transition hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-400/40 dark:hover:shadow-[0_0_24px_rgba(52,255,156,.12)] ${focusedPlaceId === place.id ? "border-emerald-400 bg-emerald-50 dark:border-emerald-400/50 dark:bg-emerald-500/[.06]" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.02]"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white dark:bg-emerald-500 dark:text-black">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{place.name}</h3>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{place.distanceMiles} mi</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">{place.address}</p>
                    {place.openingHours && <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">{place.openingHours}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {place.delivery && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Bike className="h-3 w-3" />Delivery</span>}
                      {place.pickup && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/[.06] dark:text-zinc-300"><Store className="h-3 w-3" />Pickup</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a onClick={(event) => event.stopPropagation()} target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/directions?to=${place.latitude},${place.longitude}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-black">Directions <Navigation className="h-3.5 w-3.5" /></a>
                      {place.website && <a onClick={(event) => event.stopPropagation()} target="_blank" rel="noreferrer" href={place.website} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:text-zinc-300">Menu / website <ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-[11px] text-slate-500 dark:text-zinc-600">Location data © OpenStreetMap contributors. Verify licensing directly.</p>
    </div>
  );
}
