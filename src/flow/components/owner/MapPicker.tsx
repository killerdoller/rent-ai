"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  initialLat: number;
  initialLng: number;
  onLocationPicked: (lat: number, lng: number, address: string) => void;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ initialLat, initialLng, onLocationPicked }: Props) {
  const markerRef = useRef<L.Marker | null>(null);
  const posRef = useRef<[number, number] | null>(null);

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

  const handlePick = async (lat: number, lng: number) => {
    posRef.current = [lat, lng];
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    const address = await reverseGeocode(lat, lng);
    onLocationPicked(lat, lng, address);
  };

  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden border border-border">
      <MapContainer
        center={[initialLat, initialLng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={handlePick} />
        {posRef.current && (
          <Marker
            position={posRef.current}
            ref={(ref) => { markerRef.current = ref; }}
          />
        )}
      </MapContainer>
    </div>
  );
}
