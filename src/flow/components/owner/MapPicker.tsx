"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Search } from "lucide-react";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = { terra: "#D87D6F", coffee: "#82554D", muted: "#EFE7DE", white: "#FFFFFF", border: "rgba(130,85,77,0.14)" };

interface GeoResult {
  id: string;
  label: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  source?: "google" | "nominatim" | "photon";
  precision?: string;
}

interface Props {
  initialLat: number;
  initialLng: number;
  city?: string;
  hasInitialLocation?: boolean;
  onLocationPicked: (lat: number | null, lng: number | null, address: string) => void;
}

const pinIcon = L.divIcon({
  className: "rentai-map-pin",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#D87D6F;transform:rotate(-45deg);border:3px solid white;box-shadow:0 6px 18px rgba(13,13,13,.24);"><div style="width:9px;height:9px;border-radius:50%;background:white;margin:7px auto 0;"></div></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function MapController({ target }: { target: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 80);
  }, [map]);

  useEffect(() => {
    if (target) map.flyTo(target, 17, { duration: 0.8 });
  }, [map, target]);

  return null;
}

function shortCity(city: string) {
  return city.split(",")[0]?.trim() || city;
}

function hasStreetNumber(value: string) {
  return /(#|nro\.?|no\.?)?\s*\d+\s*[-–]\s*\d+/i.test(value) || /#\s*\d+/i.test(value);
}

function preferredAddress(selectedLabel: string, typedQuery: string, city: string) {
  const typed = typedQuery.trim();
  if (!typed) return selectedLabel;

  if (hasStreetNumber(typed) && !selectedLabel.toLowerCase().includes(typed.toLowerCase())) {
    const cityName = shortCity(city);
    return typed.toLowerCase().includes(cityName.toLowerCase()) ? typed : `${typed}, ${cityName}`;
  }

  return selectedLabel.split(",").slice(0, 4).join(",").trim();
}

export default function MapPicker({
  initialLat,
  initialLng,
  city = "Bogota, Colombia",
  hasInitialLocation = false,
  onLocationPicked,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [pin, setPin] = useState<[number, number] | null>(
    hasInitialLocation ? [initialLat, initialLng] : null,
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(
    hasInitialLocation ? [initialLat, initialLng] : null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (value: string) => {
    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({ q, city });

      // Try Google Places autocomplete first
      const acResponse = await fetch(`/api/maps/autocomplete?${params.toString()}`);
      const acData = await acResponse.json();

      if (acData.results?.length) {
        setResults(acData.results);
        setShowDrop(true);
        return;
      }

      // Fallback to geocode (Google → Nominatim → Photon) when autocomplete
      // returns nothing OR when Google key is not configured (configured === false).
      const geocodeResponse = await fetch(`/api/maps/geocode?${params.toString()}`);
      const geocodeData = await geocodeResponse.json();
      const fallbackResults = geocodeData.results || [];
      setResults(fallbackResults);
      setShowDrop(fallbackResults.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    // Always propagate address text to parent so manual typing is saved even without a pin.
    // lat/lng pass null when there's no confirmed pin position.
    onLocationPicked(pin?.[0] ?? null, pin?.[1] ?? null, value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 450);
  };

  const selectResult = async (result: GeoResult) => {
    let resolved = result;

    if (result.placeId && (!Number.isFinite(result.lat) || !Number.isFinite(result.lng))) {
      setSearching(true);
      try {
        const params = new URLSearchParams({ place_id: result.placeId });
        const response = await fetch(`/api/maps/geocode?${params.toString()}`);
        const data = await response.json();
        resolved = data.result || data.results?.[0] || result;
      } finally {
        setSearching(false);
      }
    }

    if (!Number.isFinite(resolved.lat) || !Number.isFinite(resolved.lng)) return;

    const nextPin: [number, number] = [resolved.lat!, resolved.lng!];
    const cleanName = preferredAddress(result.label, query, city);

    setPin(nextPin);
    setFlyTarget(nextPin);
    setQuery(cleanName);
    setShowDrop(false);
    onLocationPicked(nextPin[0], nextPin[1], cleanName);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
      const response = await fetch(`/api/maps/reverse?${params.toString()}`);
      const data = await response.json();
      return data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: C.coffee, opacity: 0.5, zIndex: 1 }} />
          {searching && <Loader2 style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: C.terra }} className="animate-spin" />}
          <input
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (results.length > 0) selectResult(results[0]);
                else setShowDrop(false);
              }
              if (e.key === "Escape") setShowDrop(false);
            }}
            placeholder="Buscar direccion exacta, barrio o ciudad..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 36px 10px 32px",
              background: C.muted,
              border: `1.5px solid ${showDrop ? C.terra : "transparent"}`,
              borderRadius: 12,
              fontFamily: BODY,
              fontSize: 13,
              color: "#0D0D0D",
              outline: "none",
            }}
          />
        </div>

        {showDrop && results.length > 0 && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            background: C.white,
            borderRadius: 12,
            border: `1.5px solid ${C.border}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}>
            {results.map((result, index) => (
              <button
                key={result.id || index}
                type="button"
                onClick={() => selectResult(result)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: BODY,
                  fontSize: 12,
                  color: "#0D0D0D",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(event) => (event.currentTarget.style.background = C.muted)}
                onMouseLeave={(event) => (event.currentTarget.style.background = "none")}
              >
                <MapPin style={{ width: 13, height: 13, color: C.terra, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {result.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        style={{ borderRadius: 16, overflow: "hidden", border: `1.5px solid ${C.border}`, height: 240 }}
        onClick={() => setShowDrop(false)}
      >
        <MapContainer
          center={[initialLat, initialLng]}
          zoom={pin ? 17 : 12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController target={flyTarget} />
          {pin && <Marker position={pin} icon={pinIcon} />}
          <ClickFinetuner
            onPick={async (lat, lng) => {
              const nextPin: [number, number] = [lat, lng];
              setPin(nextPin);
              setFlyTarget(nextPin);

              if (hasStreetNumber(query) && query.length > 5) {
                onLocationPicked(lat, lng, query);
                return;
              }

              const address = await reverseGeocode(lat, lng);
              setQuery(address);
              onLocationPicked(lat, lng, address);
            }}
          />
        </MapContainer>
      </div>

      <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.72 }}>
        {pin ? "Toca el mapa para mover el pin al acceso exacto." : "Busca una direccion y ajusta el pin sobre el mapa."}
      </p>
    </div>
  );
}

function ClickFinetuner({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handler = (event: L.LeafletMouseEvent) => onPick(event.latlng.lat, event.latlng.lng);
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onPick]);

  return null;
}
