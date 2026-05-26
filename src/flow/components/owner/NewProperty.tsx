"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, Bed, FileText, CheckCircle2 } from "lucide-react";
import { ImageUploader } from "./ImageUploader";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: 220, borderRadius: 16, background: "#EFE7DE", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #D87D6F", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
    </div>
  ),
});

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink: "#0D0D0D", cream: "#FFFFFF", muted: "#EFE7DE",
  white: "#FFFFFF", terra: "#D87D6F", coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "11px 12px",
  background: C.muted, border: "none", borderRadius: 12,
  fontFamily: BODY, fontSize: 14, color: C.ink, outline: "none",
};

// Vocabulario unificado con el perfil del inquilino. Ver src/utils/bogotaAmenities.ts
// para el porqué y la lista completa. El matching usa la UNIÓN de interior +
// exterior, así que un parqueadero publicado en "exterior" igual matchea si
// el tenant lo pidió.
import {
  SECTOR_AMENITIES as TENANT_SECTOR_AMENITIES,
  PROPERTY_AMENITIES_INTERIOR as TENANT_PROPERTY_INTERIOR,
  PROPERTY_AMENITIES_EXTERIOR as TENANT_PROPERTY_EXTERIOR,
} from "../../../utils/bogotaAmenities";
import { BOGOTA_LOCALITIES } from "../../../utils/bogotaZones";

// Spread para convertir readonly tuples del catálogo a string[] mutable
// que es lo que espera MultiSelect.
const AMENITIES_INTERIOR: string[] = [...TENANT_PROPERTY_INTERIOR];
const AMENITIES_EXTERIOR: string[] = [...TENANT_PROPERTY_EXTERIOR];
const AMENITIES_SECTOR: string[] = [...TENANT_SECTOR_AMENITIES];
const UTILITIES_INCLUDED = ["Agua", "Energía", "Gas", "WiFi", "Administración"];

const LOCALITIES = BOGOTA_LOCALITIES;

const MultiSelect = ({ options, selected, onChange, addLabel }: { options: string[], selected: string[], onChange: (v: string[]) => void, addLabel?: string }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {selected.map(opt => (
      <button key={opt} type="button" onClick={() => onChange(selected.filter(x => x !== opt))}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9999, border: `1.5px solid ${C.terra}`, background: `${C.terra}12`, fontFamily: BODY, fontSize: 12, fontWeight: 600, color: C.terra, cursor: "pointer" }}>
        <CheckCircle2 style={{ width: 12, height: 12 }} />
        {opt}
      </button>
    ))}
    {options.filter(opt => !selected.includes(opt)).map(opt => (
      <button key={opt} type="button" onClick={() => onChange([...selected, opt])}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9999, border: `1.5px solid ${C.border}`, background: C.cream, fontFamily: BODY, fontSize: 12, fontWeight: 600, color: C.coffee, cursor: "pointer" }}>
        {opt}
      </button>
    ))}
    {addLabel && (
      <button type="button" onClick={() => {
        const n = prompt(`Añadir ${addLabel}:`);
        if (n && !selected.includes(n)) onChange([...selected, n]);
      }} style={{ padding: "7px 12px", borderRadius: 9999, border: `1.5px dashed ${C.border}`, background: "none", fontFamily: BODY, fontSize: 12, fontWeight: 600, color: C.coffee, cursor: "pointer" }}>
        + Añadir
      </button>
    )}
  </div>
);

interface InitialProperty {
  property_id: string; title: string; monthly_rent: number;
  city: string; neighborhood: string; bedrooms: number; description: string;
  images: string[]; image_url: string; allows_students: boolean; requires_co_debtor: boolean;
  tags: string[]; address: string | null; latitude: number | null; longitude: number | null;
  property_type?: string; localidad?: string; bathrooms?: number; area_sqm?: number; stratum?: number;
  floor_number?: number; building_floors?: number;
  amenities_interior?: string[]; amenities_exterior?: string[]; amenities_sector?: string[];
  utilities_included?: string[];
}

export function NewProperty({ initialProperty }: { initialProperty?: InitialProperty }) {
  const navigate = useRouter();
  const isEdit = !!initialProperty;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: initialProperty?.title ?? "",
    monthly_rent: initialProperty?.monthly_rent ? String(initialProperty.monthly_rent) : "",
    city: initialProperty?.city ?? "Bogotá",
    neighborhood: initialProperty?.neighborhood ?? "",
    bedrooms: initialProperty?.bedrooms ? String(initialProperty.bedrooms) : "1",
    description: initialProperty?.description ?? "",
    images: initialProperty?.images?.length ? initialProperty.images : (initialProperty?.image_url ? [initialProperty.image_url] : []) as string[],
    allows_students: initialProperty?.allows_students ?? true,
    requires_co_debtor: initialProperty?.requires_co_debtor ?? false,
    address: initialProperty?.address ?? "",
    latitude: initialProperty?.latitude ?? null as number | null,
    longitude: initialProperty?.longitude ?? null as number | null,
    property_type: initialProperty?.property_type ?? "Apartamento",
    localidad: initialProperty?.localidad ?? "",
    bathrooms: initialProperty?.bathrooms ? String(initialProperty.bathrooms) : "1",
    area_sqm: initialProperty?.area_sqm ? String(initialProperty.area_sqm) : "",
    stratum: initialProperty?.stratum ? String(initialProperty.stratum) : "",
    floor_number: initialProperty?.floor_number ? String(initialProperty.floor_number) : "",
    building_floors: initialProperty?.building_floors ? String(initialProperty.building_floors) : "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(initialProperty?.tags ?? []);
  const [amenitiesInterior, setAmenitiesInterior] = useState<string[]>(initialProperty?.amenities_interior ?? []);
  const [amenitiesExterior, setAmenitiesExterior] = useState<string[]>(initialProperty?.amenities_exterior ?? []);
  const [amenitiesSector, setAmenitiesSector] = useState<string[]>(initialProperty?.amenities_sector ?? []);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<string[]>(initialProperty?.utilities_included ?? []);

  const set = (name: string, value: any) => setForm(f => ({ ...f, [name]: value }));
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    set(name, type === "checkbox" ? (e.target as HTMLInputElement).checked : value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError("");
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) { navigate.push("/app"); return; }
    try {
      const payload = {
        owner_id: ownerId, title: form.title,
        monthly_rent: Number(form.monthly_rent), city: form.city,
        neighborhood: form.neighborhood, bedrooms: Number(form.bedrooms),
        description: form.description,
        images: form.images, image_url: form.images[0] || null,
        allows_students: form.allows_students, requires_co_debtor: form.requires_co_debtor,
        tags: selectedTags, address: form.address || null,
        latitude: form.latitude, longitude: form.longitude,
        property_type: form.property_type,
        localidad: form.localidad || null,
        bathrooms: Number(form.bathrooms),
        area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
        stratum: form.stratum ? Number(form.stratum) : null,
        floor_number: form.floor_number ? Number(form.floor_number) : null,
        building_floors: form.building_floors ? Number(form.building_floors) : null,
        amenities_interior: amenitiesInterior,
        amenities_exterior: amenitiesExterior,
        amenities_sector: amenitiesSector,
        utilities_included: utilitiesIncluded,
      };
      const res = await fetch("/api/owner/properties", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, property_id: initialProperty!.property_id } : payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error al guardar");
      navigate.push("/owner/properties");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.cream, overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate.back()} style={{ width: 36, height: 36, borderRadius: 18, background: C.muted, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <ArrowLeft style={{ width: 17, height: 17, color: C.coffee }} />
        </button>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.6 }}>{isEdit ? "Editar propiedad" : "Nueva propiedad"}</div>
      </header>

      {/* Form */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Información básica */}
          <Card title="Información básica">
            <Field label="Título del anuncio">
              <input name="title" required value={form.title} onChange={handleChange}
                placeholder="Ej: Apartamento moderno en Chapinero" style={inputStyle} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Canon mensual (COP)">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: BODY, fontSize: 14, color: C.coffee, opacity: 0.5, fontWeight: 700 }}>$</span>
                  <input name="monthly_rent" required type="number" min="0" value={form.monthly_rent} onChange={handleChange}
                    placeholder="1500000" style={{ ...inputStyle, paddingLeft: 26 }} />
                </div>
              </Field>
              <Field label="Tipo de Inmueble">
                <select name="property_type" value={form.property_type} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Habitación">Habitación</option>
                  <option value="Estudio">Estudio</option>
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Habitaciones">
                <div style={{ position: "relative" }}>
                  <Bed style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: C.coffee, opacity: 0.5 }} />
                  <select name="bedrooms" value={form.bedrooms} onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: 30, appearance: "none" }}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </Field>
              <Field label="Baños">
                <select name="bathrooms" value={form.bathrooms} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Área (m²)">
                <input name="area_sqm" type="number" min="0" value={form.area_sqm} onChange={handleChange} placeholder="Ej: 60" style={inputStyle} />
              </Field>
              <Field label="Estrato">
                <select name="stratum" value={form.stratum} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="">Seleccionar</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Piso (Nivel)">
                <input name="floor_number" type="number" value={form.floor_number} onChange={handleChange} placeholder="Ej: 3" style={inputStyle} />
              </Field>
              <Field label="Pisos del edificio">
                <input name="building_floors" type="number" value={form.building_floors} onChange={handleChange} placeholder="Opcional" style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Localidad">
                <select name="localidad" value={form.localidad} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="">Seleccionar Localidad</option>
                  {LOCALITIES.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </Field>
              <Field label="Barrio">
                <input name="neighborhood" value={form.neighborhood} onChange={handleChange}
                  placeholder="Chapinero Alto" style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              <Field label="Ciudad">
                <input name="city" value={form.city} onChange={handleChange} style={inputStyle} />
              </Field>
            </div>
          </Card>

          {/* Descripción */}
          <Card title="Descripción">
            <div style={{ position: "relative" }}>
              <FileText style={{ position: "absolute", left: 10, top: 12, width: 14, height: 14, color: C.coffee, opacity: 0.5 }} />
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={4} placeholder="Describe tu apartamento: características, zona, acceso a transporte..."
                style={{ ...inputStyle, paddingLeft: 30, resize: "none" }} />
            </div>
          </Card>

          {/* Fotos */}
          <Card title="Fotos" subtitle="La primera foto será la portada del anuncio">
            <ImageUploader
              images={form.images}
              onChange={urls => set("images", urls)}
            />
          </Card>

          {/* Ubicación */}
          <Card title="Ubicación" subtitle="Busca la dirección o toca el mapa para ajustar el punto">
            <MapPicker
              initialLat={form.latitude ?? 4.711} initialLng={form.longitude ?? -74.0721}
              city={form.city ? `${form.city}, Colombia` : "Bogotá, Colombia"}
              hasInitialLocation={form.latitude !== null && form.longitude !== null}
              onLocationPicked={(lat, lng, address) => setForm(f => ({ ...f, latitude: lat, longitude: lng, address }))}
            />
            {form.address && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8 }}>
                <MapPin style={{ width: 13, height: 13, color: C.terra, flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontFamily: BODY, fontSize: 12, color: C.coffee }}>{form.address}</span>
              </div>
            )}
            {!form.latitude && (
              <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.6, marginTop: 6 }}>
                La ubicación es opcional pero ayuda a los arrendatarios a ver el mapa.
              </p>
            )}
          </Card>

          {/* Comodidades y Servicios */}
          <Card title="Comodidades y Servicios">
            <Field label="Servicios incluidos en el canon">
              <MultiSelect options={UTILITIES_INCLUDED} selected={utilitiesIncluded} onChange={setUtilitiesIncluded} addLabel="servicio" />
            </Field>
            <div style={{ marginTop: 12 }} />
            <Field label="Interior del inmueble">
              <MultiSelect options={AMENITIES_INTERIOR} selected={amenitiesInterior} onChange={setAmenitiesInterior} addLabel="característica" />
            </Field>
            <div style={{ marginTop: 12 }} />
            <Field label="Zonas comunes / Exterior">
              <MultiSelect options={AMENITIES_EXTERIOR} selected={amenitiesExterior} onChange={setAmenitiesExterior} addLabel="zona común" />
            </Field>
            <div style={{ marginTop: 12 }} />
            <Field label="El sector cuenta con">
              <MultiSelect options={AMENITIES_SECTOR} selected={amenitiesSector} onChange={setAmenitiesSector} addLabel="amenidad" />
            </Field>
          </Card>

          {/* Opciones */}
          <Card title="Opciones">
            {[
              { name: "allows_students", label: "Acepta estudiantes", checked: form.allows_students },
              { name: "requires_co_debtor", label: "Requiere codeudor", checked: form.requires_co_debtor },
            ].map(({ name, label, checked }) => (
              <label key={name} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "4px 0" }}>
                <input type="checkbox" name={name} checked={checked} onChange={handleChange}
                  style={{ width: 16, height: 16, accentColor: C.terra, cursor: "pointer" }} />
                <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 600, color: C.ink }}>{label}</span>
              </label>
            ))}
          </Card>

          {error && (
            <div style={{ background: "#FEE2E2", borderRadius: 12, padding: "10px 14px" }}>
              <p style={{ fontFamily: BODY, fontSize: 13, color: "#B91C1C" }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading} style={{
            width: "100%", padding: "14px 0", borderRadius: 16, border: "none",
            background: C.terra, color: C.white, fontFamily: BODY, fontSize: 15, fontWeight: 700,
            cursor: isLoading ? "default" : "pointer", opacity: isLoading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {isLoading
              ? <><div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${C.white}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />{isEdit ? "Guardando…" : "Publicando…"}</>
              : isEdit ? "Guardar cambios" : "Publicar propiedad"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const BODY = "var(--font-inter, 'system-ui', sans-serif)";
  const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "18px 16px", border: "1.5px solid rgba(130,85,77,0.14)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 500, color: "#0D0D0D", letterSpacing: -0.4 }}>{title}</div>
        {subtitle && <p style={{ fontFamily: BODY, fontSize: 11, color: "#82554D", marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const BODY = "var(--font-inter, 'system-ui', sans-serif)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: "#82554D", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>}
      {children}
    </div>
  );
}
