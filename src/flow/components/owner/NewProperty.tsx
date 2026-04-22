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
  ink: "#0D0D0D", cream: "#F7F2EC", muted: "#EFE7DE",
  white: "#FFFFFF", terra: "#D87D6F", coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "11px 12px",
  background: C.muted, border: "none", borderRadius: 12,
  fontFamily: BODY, fontSize: 14, color: C.ink, outline: "none",
};

const COMMON_TAGS = [
  "Amoblado","Ascensor","Parqueadero","Balcón","Terraza",
  "Gimnasio","Piscina","Portería 24h","Zona de lavandería",
  "Mascotas permitidas","Cocina integral","WiFi incluido",
];

export function NewProperty() {
  const navigate = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", monthly_rent: "", city: "Bogotá", neighborhood: "",
    bedrooms: "1", description: "", images: [] as string[],
    allows_students: true, requires_co_debtor: false,
    address: "", latitude: null as number | null, longitude: null as number | null,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
      const res = await fetch("/api/owner/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: ownerId, title: form.title,
          monthly_rent: Number(form.monthly_rent), city: form.city,
          neighborhood: form.neighborhood, bedrooms: Number(form.bedrooms),
          description: form.description,
          images: form.images, image_url: form.images[0] || null,
          allows_students: form.allows_students, requires_co_debtor: form.requires_co_debtor,
          tags: selectedTags, address: form.address || null,
          latitude: form.latitude, longitude: form.longitude,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error al crear");
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
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.6 }}>Nueva propiedad</div>
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
              <Field label="Habitaciones">
                <div style={{ position: "relative" }}>
                  <Bed style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: C.coffee, opacity: 0.5 }} />
                  <select name="bedrooms" value={form.bedrooms} onChange={handleChange}
                    style={{ ...inputStyle, paddingLeft: 30, appearance: "none" }}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Ciudad">
                <input name="city" value={form.city} onChange={handleChange} style={inputStyle} />
              </Field>
              <Field label="Barrio">
                <input name="neighborhood" value={form.neighborhood} onChange={handleChange}
                  placeholder="Chapinero Alto" style={inputStyle} />
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

          {/* Características */}
          <Card title="Características" subtitle="Selecciona las que apliquen">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COMMON_TAGS.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <button key={tag} type="button" onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9999, border: `1.5px solid ${active ? C.terra : C.border}`, background: active ? `${C.terra}12` : C.cream, fontFamily: BODY, fontSize: 12, fontWeight: 600, color: active ? C.terra : C.coffee, cursor: "pointer" }}>
                    {active && <CheckCircle2 style={{ width: 12, height: 12 }} />}
                    {tag}
                  </button>
                );
              })}
            </div>
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
              ? <><div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${C.white}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />Publicando…</>
              : "Publicar propiedad"}
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
