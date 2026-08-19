"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bike, ExternalLink, ListFilter, Loader2, LocateFixed, Map, MapPin,
  Navigation, Store,
} from "lucide-react";

// Leaflet touches the DOM at import time, so it can only ever run client-side.
const DispensaryMap = dynamic(() => import("@/components/DispensaryMap").then((m) => m.DispensaryMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
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
    ? "border border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-primary)]"
    : "border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:border-[var(--accent-moss)]";

export function NearbyDispensaries({ autoLocate = false }: { autoLocate?: boolean }) {
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
  const autoLocateRequested = useRef(false);

  const visiblePlaces = useMemo(
    () => places.filter((place) =>
      place.distanceMiles <= maxDistance &&
      (!websiteOnly || place.website) &&
      (fulfillment === "any" || (fulfillment === "delivery" ? place.delivery : place.pickup)),
    ),
    [places, maxDistance, websiteOnly, fulfillment],
  );

  const loadPlaces = useCallback(async (nextCoordinates: Coordinates, label: string) => {
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
  }, []);

  const shareLocation = useCallback(() => {
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
  }, [loadPlaces]);

  useEffect(() => {
    if (!autoLocate || autoLocateRequested.current) return;
    autoLocateRequested.current = true;
    shareLocation();
  }, [autoLocate, shareLocation]);

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
          <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[var(--text-secondary)]" />
          <input value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="City, neighborhood, or ZIP"
            className="h-12 w-full rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] pl-10 pr-24 text-sm outline-none focus:border-[var(--accent-moss)]" />
          <button className="absolute right-1.5 top-1.5 h-9 rounded-[var(--radius-button)] bg-[var(--accent-gold)] px-4 text-xs font-medium text-[var(--bg-primary)]">Search</button>
        </form>
        <button
          type="button"
          onClick={shareLocation}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent-gold)] px-6 text-sm font-medium text-[var(--bg-primary)] hover:bg-[var(--accent-gold-dim)]"
        >
          <LocateFixed className="h-4 w-4" />Share my location
        </button>
      </div>

      {locationState === "done" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)]"><ListFilter className="h-3.5 w-3.5" />Distance</span>
          {[5, 10, 25, 50].map((distance) => <button key={distance} onClick={() => setMaxDistance(distance)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(maxDistance === distance)}`}>{distance} mi</button>)}
          <button onClick={() => setFulfillment((current) => (current === "delivery" ? "any" : "delivery"))} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(fulfillment === "delivery")}`}><Bike className="h-3.5 w-3.5" />Delivery</button>
          <button onClick={() => setFulfillment((current) => (current === "pickup" ? "any" : "pickup"))} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(fulfillment === "pickup")}`}><Store className="h-3.5 w-3.5" />Pickup</button>
          <button onClick={() => setWebsiteOnly((current) => !current)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(websiteOnly)}`}>Online menu</button>
        </div>
      )}

      {locationState === "idle" && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-14 text-center">
          <Map className="mx-auto h-10 w-10 text-[var(--accent-gold)]" />
          <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--text-secondary)]">Share your location or search a city or ZIP to map nearby licensed dispensaries.</p>
        </div>
      )}
      {locationState === "loading" && <div className="mt-6 flex items-center justify-center gap-3 py-14 text-[var(--text-secondary)]"><Loader2 className="h-5 w-5 animate-spin" />Searching the area…</div>}
      {locationState === "error" && (
        <div className="mt-6 py-6 text-center">
          <p className="text-sm text-[var(--error)]">{locationError}</p>
          <button onClick={shareLocation} className="mt-3 rounded-[var(--radius-button)] border border-[var(--border-hairline)] px-4 py-2 text-sm font-medium">Try sharing location again</button>
        </div>
      )}
      {locationState === "done" && (
        <div className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent-gold)]">Near {locationLabel}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{visiblePlaces.length} mapped result{visiblePlaces.length === 1 ? "" : "s"} — select a pin or listing for details</p>
            </div>
          </div>

          <div className="h-[60vh] min-h-[420px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {coordinates && <DispensaryMap center={coordinates} places={visiblePlaces} focusedId={focusedPlaceId} />}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePlaces.length === 0 && <p className="rounded-[var(--radius-card)] bg-[var(--bg-surface)] p-6 text-center text-sm text-[var(--text-secondary)] sm:col-span-2 lg:col-span-3">No dispensaries within {maxDistance} mi match these filters — try a wider distance or search another ZIP.</p>}
            {visiblePlaces.map((place, index) => (
              <button
                key={place.id}
                onClick={() => setFocusedPlaceId(place.id)}
                className={`flex flex-col rounded-[var(--radius-card)] border bg-[var(--bg-surface)] p-4 text-left transition-colors hover:border-[var(--accent-moss)] ${focusedPlaceId === place.id ? "border-[var(--accent-gold)]" : "border-[var(--border-hairline)]"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-data flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)] text-xs text-[var(--bg-primary)]">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{place.name}</h3>
                      <span className="font-data shrink-0 rounded-full bg-[var(--bg-surface-2)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">{place.distanceMiles} mi</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{place.address}</p>
                    {place.openingHours && <p className="mt-2 text-xs text-[var(--text-secondary)]">{place.openingHours}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {place.delivery && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"><Bike className="h-3 w-3" />Delivery</span>}
                      {place.pickup && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"><Store className="h-3 w-3" />Pickup</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a onClick={(event) => event.stopPropagation()} target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/directions?to=${place.latitude},${place.longitude}`} className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent-gold)] px-3 py-2 text-xs font-medium text-[var(--bg-primary)]">Directions <Navigation className="h-3.5 w-3.5" /></a>
                      {place.website && <a onClick={(event) => event.stopPropagation()} target="_blank" rel="noreferrer" href={place.website} className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] px-3 py-2 text-xs font-medium">Menu / website <ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-[11px] text-[var(--text-secondary)]">Location data © OpenStreetMap contributors. Verify licensing directly.</p>
    </div>
  );
}
