"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft, MapPin, DollarSign, Bed, FileText,
  Tag, Loader2, CheckCircle2, Image as ImageIcon
} from "lucide-react";

// Leaflet must be loaded client-side only
const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false, loading: () => (
  <div className="w-full h-64 rounded-2xl bg-secondary flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
) });

const COMMON_TAGS = [
  "Amoblado", "Ascensor", "Parqueadero", "Balcón", "Terraza",
  "Gimnasio", "Piscina", "Portería 24h", "Zona de lavandería",
  "Mascotas permitidas", "Cocina integral", "WiFi incluido",
];

export function NewProperty() {
  const navigate = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    monthly_rent: "",
    city: "Bogotá",
    neighborhood: "",
    bedrooms: "1",
    description: "",
    image_url: "",
    allows_students: true,
    requires_co_debtor: false,
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleLocationPicked = (lat: number, lng: number, address: string) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng, address }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) { navigate.push("/app"); return; }

    try {
      const res = await fetch("/api/owner/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: ownerId,
          title: form.title,
          monthly_rent: Number(form.monthly_rent),
          city: form.city,
          neighborhood: form.neighborhood,
          bedrooms: Number(form.bedrooms),
          description: form.description,
          image_url: form.image_url || null,
          allows_students: form.allows_students,
          requires_co_debtor: form.requires_co_debtor,
          tags: selectedTags,
          address: form.address || null,
          latitude: form.latitude,
          longitude: form.longitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la propiedad");
      }

      navigate.push("/owner/properties");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate.back()} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Nueva propiedad</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 md:p-6 pb-24 space-y-6">

        {/* Basic info */}
        <Section title="Información básica">
          <Field label="Título del anuncio">
            <input
              name="title" required value={form.title} onChange={handleChange}
              placeholder="Ej: Apartamento moderno en Chapinero"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Canon mensual (COP)">
              <div className="relative">
                <DollarSign className="icon-left" />
                <input
                  name="monthly_rent" required type="number" min="0"
                  value={form.monthly_rent} onChange={handleChange}
                  placeholder="1500000"
                  className="input pl-9"
                />
              </div>
            </Field>
            <Field label="Habitaciones">
              <div className="relative">
                <Bed className="icon-left" />
                <select name="bedrooms" value={form.bedrooms} onChange={handleChange} className="input pl-9">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad">
              <input name="city" value={form.city} onChange={handleChange} className="input" />
            </Field>
            <Field label="Barrio">
              <input
                name="neighborhood" value={form.neighborhood} onChange={handleChange}
                placeholder="Chapinero Alto"
                className="input"
              />
            </Field>
          </div>
        </Section>

        {/* Location */}
        <Section title="Ubicación" subtitle="Haz clic en el mapa para marcar la ubicación exacta">
          <MapPicker
            initialLat={form.latitude ?? 4.711}
            initialLng={form.longitude ?? -74.0721}
            onLocationPicked={handleLocationPicked}
          />
          {form.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D87D6F]" />
              <span>{form.address}</span>
            </div>
          )}
          {!form.latitude && (
            <p className="text-xs text-muted-foreground mt-1">
              La ubicación es opcional pero ayuda a los arrendatarios a ver el mapa del apartamento.
            </p>
          )}
        </Section>

        {/* Description */}
        <Section title="Descripción">
          <Field label="">
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                name="description" value={form.description} onChange={handleChange}
                rows={4} placeholder="Describe tu apartamento: características, zona, acceso a transporte..."
                className="input pl-9 resize-none"
              />
            </div>
          </Field>
        </Section>

        {/* Image */}
        <Section title="Imagen principal">
          <Field label="URL de la imagen">
            <div className="relative">
              <ImageIcon className="icon-left" />
              <input
                name="image_url" type="url" value={form.image_url} onChange={handleChange}
                placeholder="https://..."
                className="input pl-9"
              />
            </div>
          </Field>
          {form.image_url && (
            <img src={form.image_url} alt="preview" className="w-full h-40 object-cover rounded-xl mt-2" />
          )}
        </Section>

        {/* Tags */}
        <Section title="Características" subtitle="Selecciona las que apliquen">
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => (
              <button
                key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-[#D87D6F] border-[#D87D6F] text-white"
                    : "bg-white border-border text-foreground hover:border-[#D87D6F]"
                }`}
              >
                {selectedTags.includes(tag) && <CheckCircle2 className="w-3.5 h-3.5" />}
                {tag}
              </button>
            ))}
          </div>
        </Section>

        {/* Options */}
        <Section title="Opciones">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox" name="allows_students"
              checked={form.allows_students} onChange={handleChange}
              className="w-4 h-4 accent-[#D87D6F]"
            />
            <span className="text-sm font-medium">Acepta estudiantes</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer mt-3">
            <input
              type="checkbox" name="requires_co_debtor"
              checked={form.requires_co_debtor} onChange={handleChange}
              className="w-4 h-4 accent-[#D87D6F]"
            />
            <span className="text-sm font-medium">Requiere codeudor</span>
          </label>
        </Section>

        {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

        <button
          type="submit" disabled={isLoading}
          className="w-full py-4 bg-[#D87D6F] text-white rounded-2xl font-bold text-sm hover:bg-[#c46d5f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publicar propiedad"}
        </button>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          background: #f8f8f8;
          border: none;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: box-shadow 0.15s;
        }
        .input:focus {
          box-shadow: 0 0 0 2px rgba(216,125,111,0.25);
        }
        .icon-left {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <h2 className="font-semibold text-base">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>}
      {children}
    </div>
  );
}
