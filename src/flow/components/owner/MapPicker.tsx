"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2 } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const BODY  = "var(--font-inter, 'system-ui', sans-serif)";
const C = { terra: "#D87D6F", coffee: "#82554D", muted: "#EFE7DE", white: "#FFFFFF", border: "rgba(130,85,77,0.14)" };

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  initialLat: number;
  initialLng: number;
  city?: string;
  onLocationPicked: (lat: number, lng: number, address: string) => void;
}

// Inner component — has access to map instance
function MapController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 0.8 });
  }, [target]);
  return null;
}

export default function MapPicker({ initialLat, initialLng, city = "Bogotá, Colombia", onLocationPicked }: Props) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop]  = useState(false);
  const [pin, setPin]            = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (q: string) => {
    if (q.length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const fullQuery = q.toLowerCase().includes(city.split(",")[0].toLowerCase()) ? q : `${q}, ${city}`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "es" } }
      );
      setResults(await res.json());
      setShowDrop(true);
    } catch { /* silent */ }
    finally { setSearching(false); }
  };

  const handleQueryChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 400);
  };

  const selectResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setPin([lat, lng]);
    setFlyTarget([lat, lng]);
    setQuery(r.display_name);
    setShowDrop(false);
    onLocationPicked(lat, lng, r.display_name);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: C.coffee, opacity: 0.5, zIndex: 1 }} />
          {searching && <Loader2 style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: C.terra }} className="animate-spin" />}
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            placeholder="Buscar dirección, barrio o ciudad…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 36px 10px 32px",
              background: C.muted, border: `1.5px solid ${showDrop ? C.terra : "transparent"}`,
              borderRadius: 12, fontFamily: BODY, fontSize: 13, color: "#0D0D0D", outline: "none",
            }}
          />
        </div>

        {/* Dropdown */}
        {showDrop && results.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000,
            background: C.white, borderRadius: 12, border: `1.5px solid ${C.border}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
          }}>
            {results.map(r => (
              <button key={r.place_id} type="button"
                onClick={() => selectResult(r)}
                style={{
                  width: "100%", padding: "10px 14px", border: "none", background: "none",
                  textAlign: "left", cursor: "pointer", fontFamily: BODY, fontSize: 12,
                  color: "#0D0D0D", borderBottom: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.muted)}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <Search style={{ width: 12, height: 12, color: C.coffee, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: `1.5px solid ${C.border}`, height: 220 }}
        onClick={() => setShowDrop(false)}>
        <MapContainer
          center={[initialLat, initialLng]}
          zoom={pin ? 16 : 12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController target={flyTarget} />
          {pin && (
            <Marker position={pin} />
          )}
          {/* Still allow manual fine-tune click */}
          <ClickFinetuner onPick={async (lat, lng) => {
            setPin([lat, lng]);
            const addr = await reverseGeocode(lat, lng);
            setQuery(addr);
            onLocationPicked(lat, lng, addr);
          }} />
        </MapContainer>
      </div>

      {pin && (
        <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.7 }}>
          Toca el mapa para ajustar el punto exacto.
        </p>
      )}
    </div>
  );
}

// Allows clicking on the map to fine-tune the pin
function ClickFinetuner({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => onPick(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, onPick]);
  return null;
}
