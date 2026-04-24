"use client";
import { useEffect, useState } from "react";
import { NewProperty } from "./NewProperty";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = { terra: "#D87D6F", border: "rgba(130,85,77,0.14)", coffee: "#82554D" };

export function EditProperty({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) return;
    fetch(`/api/owner/properties?owner_id=${ownerId}`)
      .then(r => r.ok ? r.json() : [])
      .then((list: any[]) => {
        const found = list.find(p => p.property_id === propertyId);
        if (found) setProperty(found);
        else setError("Propiedad no encontrada.");
      })
      .catch(() => setError("Error al cargar la propiedad."))
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "#FFFFFF" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.terra}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "#FFFFFF" }}>
      <p style={{ fontFamily: BODY, fontSize: 14, color: C.coffee }}>{error}</p>
    </div>
  );

  return <NewProperty initialProperty={property} />;
}
