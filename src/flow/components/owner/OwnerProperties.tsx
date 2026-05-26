"use client";
import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { Building2, MapPin, Bed, Plus, Pencil, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { PropertyDetailSheet, type PropertyDetailCard } from "../PropertyDetailSheet";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink: "#0D0D0D", cream: "#FFFFFF", muted: "#EFE7DE",
  white: "#FFFFFF", terra: "#D87D6F", coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
};

interface Property {
  property_id: string; title: string; monthly_rent: number;
  neighborhood: string; city: string; bedrooms: number;
  image_url: string; images: string[]; description: string; tags: string[];
  allows_students: boolean; requires_co_debtor: boolean;
  address: string | null; latitude: number | null; longitude: number | null;
  property_type?: string; localidad?: string;
  bathrooms?: number; area_sqm?: number; stratum?: number;
  floor_number?: number; building_floors?: number;
  amenities_interior?: string[]; amenities_exterior?: string[]; amenities_sector?: string[];
  utilities_included?: string[]; nearby_pois?: any;
  created_at: string;
}

function toDetailCard(p: Property): PropertyDetailCard {
  return {
    id: p.property_id,
    type: "room",
    image: p.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=1080",
    images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
    title: p.title,
    location: `${p.neighborhood || ""}, ${p.city}`.replace(/^, /, ""),
    price: p.monthly_rent ? Number(p.monthly_rent) : undefined,
    bedrooms: p.bedrooms,
    description: p.description || "",
    tags: p.tags || [],
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    property_type: p.property_type,
    bathrooms: p.bathrooms,
    area_sqm: p.area_sqm,
    stratum: p.stratum,
    floor_number: p.floor_number,
    building_floors: p.building_floors,
    amenities_interior: p.amenities_interior ?? [],
    amenities_exterior: p.amenities_exterior ?? [],
    amenities_sector: p.amenities_sector ?? [],
    utilities_included: p.utilities_included ?? [],
    nearby_pois: p.nearby_pois ?? null,
  };
}

export function OwnerProperties() {
  const navigate = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewCard, setPreviewCard] = useState<PropertyDetailCard | null>(null);

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) { navigate.push("/app"); return; }
    fetch(`/api/owner/properties?owner_id=${ownerId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setProperties)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.cream, overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "20px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, fontWeight: 600, letterSpacing: 0.4 }}>
              {isLoading ? "Cargando…" : `${properties.length} propiedad${properties.length !== 1 ? "es" : ""}`}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 500, color: C.ink, letterSpacing: -1.2, lineHeight: 1, marginTop: 4 }}>
              Propiedades
            </div>
          </div>
          <button onClick={() => navigate.push("/owner/properties/new")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
            borderRadius: 9999, background: C.terra, border: "none",
            fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.white, cursor: "pointer",
            boxShadow: `0 4px 14px ${C.terra}55`,
          }}>
            <Plus style={{ width: 15, height: 15 }} /> Nueva
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 80px" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.terra}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : properties.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 style={{ width: 32, height: 32, color: C.coffee, opacity: 0.4 }} />
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.8 }}>Sin propiedades</div>
              <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, textAlign: "center", maxWidth: 260 }}>
                Publica tu primera propiedad para empezar a recibir interesados.
              </p>
              <button onClick={() => navigate.push("/owner/properties/new")} style={{
                marginTop: 4, padding: "11px 24px", borderRadius: 9999, background: C.terra, border: "none",
                fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.white, cursor: "pointer",
              }}>
                Publicar propiedad
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {properties.map((prop) => (
                <div key={prop.property_id}
                  onClick={() => navigate.push(`/owner/properties/${prop.property_id}`)}
                  style={{
                    background: C.white, borderRadius: 20, overflow: "hidden",
                    border: `1.5px solid ${C.border}`, boxShadow: "0 2px 8px rgba(130,85,77,0.06)",
                    cursor: "pointer", transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(130,85,77,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(130,85,77,0.06)")}
                >
                  <div style={{ position: "relative", height: 160 }}>
                    <img src={prop.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                      alt={prop.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
                    {prop.allows_students && (
                      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", padding: "3px 10px", borderRadius: 9999 }}>
                        <span style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee }}>Acepta estudiantes</span>
                      </div>
                    )}
                    {/* Botones de acción superpuestos */}
                    <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                      {/* Vista previa: cómo lo ve un inquilino (con POIs, mapa, etc.) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewCard(toDetailCard(prop)); }}
                        title="Ver como inquilino"
                        style={{ background: "rgba(255,255,255,0.92)", width: 30, height: 30, borderRadius: 15, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Eye style={{ width: 13, height: 13, color: C.coffee }} />
                      </button>
                      {/* Edit */}
                      <div style={{ background: "rgba(255,255,255,0.92)", width: 30, height: 30, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Pencil style={{ width: 13, height: 13, color: C.terra }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prop.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      <MapPin style={{ width: 12, height: 12, color: C.coffee, flexShrink: 0 }} />
                      <span style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {prop.neighborhood}, {prop.localidad ? `${prop.localidad}, ` : ""}{prop.city}
                      </span>
                    </div>
                    {prop.property_type && (
                      <div style={{ fontFamily: BODY, fontSize: 11, color: C.terra, marginBottom: 8, fontWeight: 600 }}>
                        {prop.property_type}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.terra }}>${Number(prop.monthly_rent).toLocaleString()} COP/mes</span>
                      {prop.bedrooms && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Bed style={{ width: 12, height: 12, color: C.coffee }} />
                          <span style={{ fontFamily: BODY, fontSize: 12, color: C.coffee }}>{prop.bedrooms} hab.</span>
                        </div>
                      )}
                    </div>
                    {prop.tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {prop.tags.slice(0, 3).map(tag => (
                          <span key={tag} style={{ padding: "3px 10px", borderRadius: 9999, background: C.muted, fontFamily: BODY, fontSize: 11, fontWeight: 600, color: C.coffee }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {previewCard && (
          <PropertyDetailSheet card={previewCard} onClose={() => setPreviewCard(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
