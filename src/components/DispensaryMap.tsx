"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

type Place = {
  id: string;
  name: string;
  address: string;
  distanceMiles: number;
  latitude: number;
  longitude: number;
};
type Coordinates = { latitude: number; longitude: number };

function numberedIcon(index: number) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#C9A961;color:#12190F;font:500 12px 'IBM Plex Mono',monospace;border:1px solid #12190F;">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

const youAreHereIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#4F6B4A;border:3px solid #F3EFE3;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface DispensaryMapProps {
  center: Coordinates;
  places: Place[];
  focusedId?: string | null;
}

export function DispensaryMap({ center, places, focusedId }: DispensaryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([center.latitude, center.longitude], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([[center.latitude, center.longitude]]);
    L.marker([center.latitude, center.longitude], { icon: youAreHereIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup("You are here");

    places.forEach((place, index) => {
      const marker = L.marker([place.latitude, place.longitude], { icon: numberedIcon(index) })
        .addTo(map)
        .bindPopup(`<strong>${place.name}</strong><br/>${place.address}<br/>${place.distanceMiles} mi away`);
      markersRef.current.set(place.id, marker);
      bounds.extend([place.latitude, place.longitude]);
    });

    if (places.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView([center.latitude, center.longitude], 12);
    }
  }, [center, places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedId) return;
    const marker = markersRef.current.get(focusedId);
    if (!marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
    marker.openPopup();
  }, [focusedId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
