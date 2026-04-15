"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fuerza scrollWheelZoom sin requerir Ctrl dentro de modales
function ScrollZoomFix() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.enable();
  }, [map]);
  return null;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export default function PropertyMap({ lat, lng, title }: Props) {
  const directionsUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(title)}`;

  return (
    <div className="w-full h-full overflow-hidden relative">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        minZoom={3}
        maxZoom={19}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Marker position={[lat, lng]}>
          <Popup>{title}</Popup>
        </Marker>
        <ScrollZoomFix />
      </MapContainer>

      {/* Botón cómo llegar */}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white text-gray-800 text-xs font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#4285F4]" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        Cómo llegar
      </a>
    </div>
  );
}
