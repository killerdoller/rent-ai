"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import {
  TrainFront, Bus, GraduationCap, School, ShoppingCart, ShoppingBag, Cross,
  Dumbbell, Trees, UtensilsCrossed, Wine, Maximize2, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AmenityCategory =
  | "transmilenio"
  | "transport"
  | "university"
  | "school"
  | "market"
  | "mall"
  | "park"
  | "pharmacy"
  | "gym"
  | "food"
  | "nightlife";

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
  // POIs precomputados (de properties.nearby_pois). Cuando llegan, evitamos
  // el fetch live a Overpass y aseguramos consistencia con el resumen
  // "Qué hay alrededor" del detail sheet.
  pois?: { places?: NearbyPlace[] } | null;
}

// Categoría → metadata visual. El icono y color coinciden con
// EnvironmentSummary para que el resumen "Qué hay alrededor" y el mapa
// hablen el mismo idioma. Si cambias uno, actualiza el otro.
const CATEGORIES: Array<{
  key: AmenityCategory; label: string; color: string; Icon: LucideIcon;
}> = [
  { key: "transmilenio", label: "TransMilenio", color: "#DC2626", Icon: TrainFront },
  { key: "transport",    label: "Transp.",      color: "#7C3AED", Icon: Bus },
  { key: "university",   label: "U.",           color: "#2563EB", Icon: GraduationCap },
  { key: "school",       label: "Colegios",     color: "#0EA5E9", Icon: School },
  { key: "market",       label: "Mercado",      color: "#16A34A", Icon: ShoppingCart },
  { key: "mall",         label: "C. Comercial", color: "#9333EA", Icon: ShoppingBag },
  { key: "park",         label: "Parques",      color: "#65A30D", Icon: Trees },
  { key: "pharmacy",     label: "Farmacia",     color: "#0891B2", Icon: Cross },
  { key: "gym",          label: "Gym",          color: "#D87D6F", Icon: Dumbbell },
  { key: "food",         label: "Comida",       color: "#EA580C", Icon: UtensilsCrossed },
  { key: "nightlife",    label: "Noche",        color: "#DB2777", Icon: Wine },
];

const CATEGORY_META = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<AmenityCategory, (typeof CATEGORIES)[number]>;

// L.divIcon cachea por categoría: el SVG del Lucide icon se renderiza una
// sola vez (renderToStaticMarkup es relativamente caro) y se reusa para todos
// los marcadores de esa categoría.
const poiIconCache: Partial<Record<AmenityCategory, L.DivIcon>> = {};
function getPoiIcon(category: AmenityCategory): L.DivIcon {
  if (poiIconCache[category]) return poiIconCache[category]!;
  const meta = CATEGORY_META[category];
  const iconSvg = renderToStaticMarkup(
    <meta.Icon size={14} color="#FFFFFF" strokeWidth={2.5} />,
  );
  poiIconCache[category] = L.divIcon({
    className: "rentai-poi-pin",
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${meta.color};border:2px solid #FFFFFF;
      box-shadow:0 3px 8px rgba(13,13,13,.28);
      display:flex;align-items:center;justify-content:center;
    ">${iconSvg}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
  return poiIconCache[category]!;
}

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

// Helper components for overlays — se usan en ambas vistas (mini y fullscreen)
// para que ambas se vean igual y sigan compartiendo el mismo state.
function FilterChips({
  activeCategories,
  toggleCategory,
}: {
  activeCategories: Record<AmenityCategory, boolean>;
  toggleCategory: (c: AmenityCategory) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 pointer-events-auto"
      style={{ scrollbarWidth: "none" }}>
      {CATEGORIES.map((category) => {
        const active = activeCategories[category.key];
        const Icon = category.Icon;
        return (
          <button
            key={category.key}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleCategory(category.key);
            }}
            className="shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold shadow-sm flex items-center gap-1"
            style={{
              background: active ? category.color : "rgba(255,255,255,0.95)",
              borderColor: active ? category.color : "rgba(13,13,13,0.12)",
              color: active ? "#FFFFFF" : "#82554D",
            }}
          >
            <Icon className="w-3 h-3" />
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

function DirectionsButton({ directionsUrl }: { directionsUrl: string }) {
  return (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 text-xs font-bold pointer-events-auto"
      onClick={(event) => event.stopPropagation()}
      style={{ color: "#1F2937" }}
      aria-label="Cómo llegar"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#4285F4]" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
      Cómo llegar
    </a>
  );
}

function MapBody({
  lat, lng, title, filteredPlaces,
}: {
  lat: number; lng: number; title: string; filteredPlaces: NearbyPlace[];
}) {
  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      {filteredPlaces.map((place) => (
        <Marker key={place.id} position={[place.lat, place.lng]} icon={getPoiIcon(place.category)}>
          <Popup>
            <strong>{place.name}</strong>
            <br />
            {place.categoryLabel} - {metersLabel(place.distanceMeters)}
          </Popup>
        </Marker>
      ))}
      <Marker position={[lat, lng]} icon={propertyIcon}>
        <Popup>{title}</Popup>
      </Marker>
      <MapSizeFix />
    </>
  );
}

export default function PropertyMap({ lat, lng, title, pois }: Props) {
  const [livePlaces, setLivePlaces] = useState<NearbyPlace[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Record<AmenityCategory, boolean>>({
    transmilenio: true,
    transport: true,
    university: true,
    school: true,
    market: true,
    mall: true,
    park: true,
    pharmacy: true,
    gym: true,
    food: false,
    nightlife: false,
  });

  // Si la propiedad tiene POIs precomputados (lo normal después del backfill),
  // los usamos directamente para que mapa y "Qué hay alrededor" siempre
  // muestren exactamente lo mismo. Sino, fetch live a Overpass.
  const prefetched = pois?.places && pois.places.length > 0 ? pois.places : null;
  const places = prefetched ?? livePlaces;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  useEffect(() => {
    if (prefetched) return; // ya tenemos los POIs, no llamamos a la API.
    const controller = new AbortController();
    // radius=1200 para que coincida con el default del backfill y con
    // fetchNearbyPois en src/utils/nearby.ts.
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: "1200" });

    fetch(`/api/maps/nearby?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { places: [] }))
      .then((data) => setLivePlaces(data.places || []))
      .catch(() => {
        if (!controller.signal.aborted) setLivePlaces([]);
      });

    return () => controller.abort();
  }, [lat, lng, prefetched]);

  // Bloquea el scroll del body cuando está en fullscreen para evitar que
  // el sheet de la propiedad se mueva por debajo.
  useEffect(() => {
    if (!isFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isFullscreen]);

  const filteredPlaces = useMemo(
    () => places.filter((place) => activeCategories[place.category]),
    [activeCategories, places],
  );

  const toggleCategory = (category: AmenityCategory) => {
    setActiveCategories((current) => ({ ...current, [category]: !current[category] }));
  };

  return (
    <>
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
          <MapBody lat={lat} lng={lng} title={title} filteredPlaces={filteredPlaces} />
        </MapContainer>

        {/* Top: filtros (toman casi todo el ancho, dejan hueco al botón expandir) */}
        <div className="absolute top-2 left-2 right-12 z-[1000]">
          <FilterChips activeCategories={activeCategories} toggleCategory={toggleCategory} />
        </div>

        {/* Top-right: expandir (icono pequeño) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
          className="absolute top-2 right-2 z-[1000] flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 pointer-events-auto"
          aria-label="Ampliar mapa"
          title="Ampliar mapa"
        >
          <Maximize2 className="w-4 h-4" style={{ color: "#1F2937" }} />
        </button>

        {/* Bottom-right: "Cómo llegar" como pill prominente */}
        <div className="absolute bottom-2 right-2 z-[1000]">
          <DirectionsButton directionsUrl={directionsUrl} />
        </div>
      </div>

      {/* Fullscreen: portal a document.body para escapar transforms ancestrales
          (el sheet de framer-motion usa transform, lo que rompe position:fixed
          de descendientes — por eso necesitamos el portal). */}
      {isFullscreen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10000]"
          style={{ background: "#FFFFFF" }}
          onClick={(e) => e.stopPropagation()}
        >
          <MapContainer
            center={[lat, lng]}
            zoom={16}
            minZoom={3}
            maxZoom={19}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            attributionControl={false}
          >
            <MapBody lat={lat} lng={lng} title={title} filteredPlaces={filteredPlaces} />
          </MapContainer>

          <div className="absolute top-3 left-3 right-14 z-[10001]">
            <FilterChips activeCategories={activeCategories} toggleCategory={toggleCategory} />
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-3 right-3 z-[10001] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 pointer-events-auto"
            aria-label="Cerrar mapa"
            title="Cerrar"
          >
            <X className="w-5 h-5" style={{ color: "#1F2937" }} />
          </button>

          <div className="absolute bottom-6 right-4 z-[10001]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <DirectionsButton directionsUrl={directionsUrl} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
