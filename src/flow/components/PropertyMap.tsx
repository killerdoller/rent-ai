"use client";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type AmenityCategory = "gym" | "education" | "market" | "transport" | "park" | "health";

type NearbyPlace = {
  id: string;
  name: string;
  category: AmenityCategory;
  categoryLabel: string;
  lat: number;
  lng: number;
  distanceMeters: number;
};

interface Props {
  lat: number;
  lng: number;
  title: string;
}

const CATEGORIES: Array<{ key: AmenityCategory; label: string; color: string }> = [
  { key: "education", label: "Estudio", color: "#2563EB" },
  { key: "gym", label: "Gym", color: "#D87D6F" },
  { key: "market", label: "Mercado", color: "#16A34A" },
  { key: "transport", label: "Transp.", color: "#7C3AED" },
  { key: "park", label: "Parques", color: "#059669" },
  { key: "health", label: "Salud", color: "#DC2626" },
];

const CATEGORY_COLORS = Object.fromEntries(CATEGORIES.map((item) => [item.key, item.color])) as Record<AmenityCategory, string>;

const propertyIcon = L.divIcon({
  className: "rentai-property-pin",
  html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:#0D0D0D;transform:rotate(-45deg);border:3px solid white;box-shadow:0 8px 22px rgba(13,13,13,.3);"><div style="width:10px;height:10px;border-radius:50%;background:#D87D6F;margin:8px auto 0;"></div></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 120);
    map.scrollWheelZoom.enable();
    return () => window.clearTimeout(id);
  }, [map]);

  return null;
}

function metersLabel(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${value} m`;
}

export default function PropertyMap({ lat, lng, title }: Props) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [activeCategories, setActiveCategories] = useState<Record<AmenityCategory, boolean>>({
    education: true,
    gym: true,
    market: true,
    transport: true,
    park: true,
    health: true,
  });

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: "900" });

    fetch(`/api/maps/nearby?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { places: [] }))
      .then((data) => setPlaces(data.places || []))
      .catch(() => {
        if (!controller.signal.aborted) setPlaces([]);
      });

    return () => controller.abort();
  }, [lat, lng]);

  const filteredPlaces = useMemo(
    () => places.filter((place) => activeCategories[place.category]),
    [activeCategories, places],
  );

  const toggleCategory = (category: AmenityCategory) => {
    setActiveCategories((current) => ({ ...current, [category]: !current[category] }));
  };

  return (
    <div className="w-full h-full overflow-hidden relative">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        minZoom={3}
        maxZoom={19}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />

        {filteredPlaces.map((place) => (
          <CircleMarker
            key={place.id}
            center={[place.lat, place.lng]}
            radius={6}
            pathOptions={{
              color: "#FFFFFF",
              fillColor: CATEGORY_COLORS[place.category],
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{place.name}</strong>
              <br />
              {place.categoryLabel} - {metersLabel(place.distanceMeters)}
            </Popup>
          </CircleMarker>
        ))}

        <Marker position={[lat, lng]} icon={propertyIcon}>
          <Popup>{title}</Popup>
        </Marker>
        <MapSizeFix />
      </MapContainer>

      <div className="absolute top-2 left-2 right-12 z-[1000] flex gap-1.5 overflow-x-auto pb-1 pointer-events-auto">
        {CATEGORIES.map((category) => {
          const active = activeCategories[category.key];
          return (
            <button
              key={category.key}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleCategory(category.key);
              }}
              className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm"
              style={{
                background: active ? category.color : "rgba(255,255,255,0.9)",
                borderColor: active ? category.color : "rgba(13,13,13,0.12)",
                color: active ? "#FFFFFF" : "#82554D",
              }}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 z-[1000] flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
        onClick={(event) => event.stopPropagation()}
        title="Como llegar"
        aria-label="Como llegar"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#4285F4]" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </a>
    </div>
  );
}
