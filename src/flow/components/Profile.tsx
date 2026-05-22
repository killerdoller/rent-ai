"use client";
import { useState, useEffect, useRef } from "react";
import {
  Camera, Edit2, MapPin, Briefcase, Save, X, LogOut,
  Moon, Sun, Zap, Home, Users, Heart, ChevronDown, ChevronUp,
  CigaretteOff, Cigarette, PawPrint, Laptop, Dumbbell, ChefHat
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "../../utils/supabaseClient";
import { motion } from "framer-motion";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink:    "#0D0D0D",
  cream: "#FFFFFF",
  muted:  "#EFE7DE",
  white:  "#FFFFFF",
  green:  "#63A694",
  coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
};

const LIFESTYLE_OPTIONS = [
  { label: "No fumador", icon: <CigaretteOff style={{ width: 16, height: 16 }} /> },
  { label: "Fumador",    icon: <Cigarette style={{ width: 16, height: 16 }} /> },
  { label: "Mascotas",   icon: <PawPrint style={{ width: 16, height: 16 }} /> },
  { label: "Noctámbulo", icon: <Moon style={{ width: 16, height: 16 }} /> },
  { label: "Madrugador", icon: <Sun style={{ width: 16, height: 16 }} /> },
  { label: "Trabajo desde casa", icon: <Laptop style={{ width: 16, height: 16 }} /> },
  { label: "Deportista", icon: <Dumbbell style={{ width: 16, height: 16 }} /> },
  { label: "Cocinero",   icon: <ChefHat style={{ width: 16, height: 16 }} /> },
];

const INTEREST_OPTIONS = [
  "Música","Cine","Lectura","Viajes","Cocina",
  "Arte","Yoga","Gaming","Fotografía","Deporte",
];

const LOCALITIES = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito", 
  "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos", 
  "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda", 
  "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz"
];

const PROPERTY_TYPES = ["Apartamento", "Casa", "Habitación"];

const formatCOP = (val: string | number) => {
  if (val === null || val === undefined || val === "") return "";
  const num = String(val).replace(/\D/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("es-CO").format(Number(num));
};

const parseCOP = (val: string) => {
  return val.replace(/\D/g, "");
};

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  job_title: string;
  university_name: string;
  city: string;
  monthly_budget: number;
  min_budget: number;
  max_budget: number;
  user_mode: string;
  avatar_url: string;
  bio: string;
  interests: string[];
  lifestyle_tags: string[];
  cleanliness_level: number;
  social_level: number;
  profile_images: string[];
  exclusion_rules: {
    no_smokers: boolean;
    pets_accepted: boolean;
    same_gender: boolean;
  };
  importance_weights: {
    budget: number;
    lifestyle: number;
    interests: number;
    personality: number;
  };
  desired_amenities_sector: string[];
  desired_amenities_interior: string[];
  desired_property_types: string[];
  desired_localities: string[];
  desired_neighborhoods: string[];
}

export function Profile() {
  const navigate = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("rentai_user_id");
      if (!userId) { setIsLoading(false); return; }
      const res = await fetch(`/api/profile?user_id=${userId}`);
      if (!res.ok) throw new Error((await res.json()).error || "Error al cargar");
      const data = await res.json();
      setProfile(data);
      setForm(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("rentai_user_id");
    localStorage.removeItem("userMode");
    localStorage.removeItem("profile_completed");
    navigate.push("/app");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userId = localStorage.getItem("rentai_user_id");
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...form }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error al guardar");
      const updated = await res.json();
      setProfile(updated);
      setForm(updated);
      setIsEditing(false);
      toast.success("¡Perfil actualizado!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const userId = localStorage.getItem("rentai_user_id");

      // Try Supabase Storage first; fall back to base64 for demo
      let url: string;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(`${userId}/${Date.now()}_${file.name}`, file, { upsert: true });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);
        url = publicUrl;
      } else {
        // Fallback: base64 data URL (works without storage bucket)
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      setForm(f => ({ ...f, avatar_url: url }));
      // Save immediately
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, avatar_url: url }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setForm(updated);
        toast.success("Foto actualizada");
      }
    } catch {
      toast.error("No se pudo subir la foto");
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const set = (key: keyof UserProfile, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggleTag = (arr: string[], val: string) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  if (isLoading) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.green}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const d = isEditing ? form : profile;

  return (
    <div style={{ minHeight: "100%", background: C.cream }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />

      {/* ── Hero ── */}
      <section style={{ position: "relative", height: 260, overflow: "hidden", flexShrink: 0 }}>
        <img
          src={d?.avatar_url || d?.profile_images?.[0] || "/profile.jpg"}
          alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />

        {/* Camera button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadingPhoto}
          style={{
            position: "absolute", top: 16, left: 16,
            width: 38, height: 38, borderRadius: 19,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
          {uploadingPhoto
            ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.6)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            : <Camera style={{ width: 16, height: 16, color: C.white }} />}
        </button>

        {/* Edit / Save */}
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 9999, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.3)", color: C.white, cursor: "pointer",
              fontFamily: BODY, fontSize: 13, fontWeight: 700,
            }}>
              <Edit2 style={{ width: 13, height: 13 }} /> Editar
            </button>
          ) : (
            <>
              <button onClick={() => { setIsEditing(false); setForm(profile!); }} style={{
                width: 36, height: 36, borderRadius: 18,
                background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>
                <X style={{ width: 15, height: 15, color: C.white }} />
              </button>
              <button onClick={handleSave} disabled={isSaving} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                borderRadius: 9999, background: C.white, border: "none",
                color: C.green, fontFamily: BODY, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                {isSaving
                  ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.green}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                  : <Save style={{ width: 13, height: 13 }} />}
                Guardar
              </button>
            </>
          )}
        </div>

        {/* Name — always shown as text, editing happens in the card below */}
        <div style={{ position: "absolute", bottom: 18, left: 20, right: 20 }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 500, color: C.white, letterSpacing: -1, lineHeight: 1 }}>
            {d?.first_name || "Tu nombre"}{d?.age ? `, ${d.age}` : ""}
          </h1>
        </div>
      </section>

      {/* ── Sections ── */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Sobre ti */}
        <Card title="Sobre ti">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Nombre">
                {isEditing
                  ? <input value={form.first_name || ""} onChange={e => set("first_name", e.target.value)} placeholder="Nombre" style={inputStyle} />
                  : <span style={valueStyle}>{d?.first_name || <Placeholder>—</Placeholder>}</span>}
              </Field>
              <Field label="Edad">
                {isEditing
                  ? <input type="number" value={form.age || ""} onChange={e => set("age", Number(e.target.value))} placeholder="22" style={inputStyle} />
                  : <span style={valueStyle}>{d?.age || <Placeholder>—</Placeholder>}</span>}
              </Field>
            </div>
            <Field label="Bio">
              {isEditing
                ? <textarea value={form.bio || ""} onChange={e => set("bio", e.target.value)} placeholder="Cuéntanos sobre ti..." rows={3}
                    style={textareaStyle} />
                : <p style={valueStyle}>{d?.bio || <Placeholder>Sin descripción</Placeholder>}</p>}
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Ciudad" icon={<MapPin style={{ width: 13, height: 13 }} />}>
                {isEditing
                  ? <input value={form.city || ""} onChange={e => set("city", e.target.value)} placeholder="Bogotá" style={inputStyle} />
                  : <span style={valueStyle}>{d?.city || <Placeholder>—</Placeholder>}</span>}
              </Field>
              <Field label="Apellido">
                {isEditing
                  ? <input value={form.last_name || ""} onChange={e => set("last_name", e.target.value)} placeholder="Apellido" style={inputStyle} />
                  : <span style={valueStyle}>{d?.last_name || <Placeholder>—</Placeholder>}</span>}
              </Field>
            </div>
            <Field label="Ocupación / Universidad" icon={<Briefcase style={{ width: 13, height: 13 }} />}>
              {isEditing
                ? <input value={form.job_title || ""} onChange={e => set("job_title", e.target.value)} placeholder="Estudiante de Derecho — U. Javeriana" style={inputStyle} />
                : <span style={valueStyle}>{d?.job_title || <Placeholder>—</Placeholder>}</span>}
            </Field>
          </div>
        </Card>

        {/* ¿Qué buscas? */}
        <Card title="¿Qué buscas?">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: <Home style={{ width: 20, height: 20 }} />, label: "Apartamento o habitación", value: "find-room" },
                { icon: <Users style={{ width: 20, height: 20 }} />, label: "Roommate compatible", value: "find-roommate" },
              ].map(({ icon, label, value }) => {
                const selected = d?.user_mode === value;
                return (
                  <div key={value}
                    onClick={isEditing ? () => set("user_mode", value) : undefined}
                    style={{
                      position: "relative", padding: "14px 12px", borderRadius: 14,
                      border: `2px solid ${selected ? C.green : C.border}`,
                      background: selected ? `${C.green}08` : C.white,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      cursor: isEditing ? "pointer" : "default", color: selected ? C.green : C.coffee,
                      transition: "all 0.2s"
                    }}>
                    {selected && (
                      <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 6, height: 3, borderLeft: "1.5px solid white", borderBottom: "1.5px solid white", transform: "rotate(-45deg) translateY(-1px)" }} />
                      </div>
                    )}
                    {icon}
                    <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
                  </div>
                );
              })}
            </div>

            <Field label="Rango de presupuesto (COP)">
              {isEditing ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: C.green }}>$</span>
                    <input
                      type="text"
                      value={formatCOP(form.min_budget ?? 0)}
                      onChange={e => set("min_budget", Number(parseCOP(e.target.value)))}
                      placeholder="Min"
                      style={{ ...inputStyle, paddingLeft: 22, fontSize: 12 }}
                    />
                  </div>
                  <span style={{ color: C.coffee, fontWeight: 700 }}>-</span>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: C.green }}>$</span>
                    <input
                      type="text"
                      value={formatCOP(form.max_budget ?? 3000000)}
                      onChange={e => set("max_budget", Number(parseCOP(e.target.value)))}
                      placeholder="Max"
                      style={{ ...inputStyle, paddingLeft: 22, fontSize: 12 }}
                    />
                  </div>
                </div>
              ) : (
                <span style={valueStyle}>
                  {d?.min_budget || d?.max_budget 
                    ? `$${formatCOP(d.min_budget || 0)} - $${formatCOP(d.max_budget || 3000000)} COP` 
                    : <Placeholder>—</Placeholder>}
                </span>
              )}
            </Field>

            {/* Localidades y Barrios */}
            {(d?.user_mode === "find-room" || form.user_mode === "find-room") && (
              <>
                <Field label="Tipo de Propiedad Ideal">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {PROPERTY_TYPES.map(type => {
                      const active = d?.desired_property_types?.includes(type);
                      if (!isEditing && !active) return null;
                      return (
                        <button key={type}
                          onClick={isEditing ? () => set("desired_property_types", toggleTag(form.desired_property_types || [], type)) : undefined}
                          style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${active ? C.green : C.border}`, background: active ? `${C.green}12` : C.cream, color: active ? C.green : C.coffee, cursor: isEditing ? "pointer" : "default" }}>
                          {type}
                        </button>
                      );
                    })}
                    {!isEditing && !d?.desired_property_types?.length && <Placeholder>Cualquiera</Placeholder>}
                  </div>
                </Field>

                <Field label="Localidades">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {LOCALITIES.map(loc => {
                      const active = d?.desired_localities?.includes(loc);
                      if (!isEditing && !active) return null;
                      return (
                        <button key={loc}
                          onClick={isEditing ? () => set("desired_localities", toggleTag(form.desired_localities || [], loc)) : undefined}
                          style={{ padding: "6px 12px", borderRadius: 8, fontFamily: BODY, fontSize: 11, fontWeight: 600, border: `1px solid ${active ? C.green : C.border}`, background: active ? `${C.green}12` : C.cream, color: active ? C.green : C.coffee, cursor: isEditing ? "pointer" : "default" }}>
                          {loc}
                        </button>
                      );
                    })}
                    {!isEditing && !d?.desired_localities?.length && <Placeholder>Cualquiera</Placeholder>}
                  </div>
                </Field>

                <Field label="Barrios específicos">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(isEditing ? form.desired_neighborhoods : d?.desired_neighborhoods)?.map(hood => (
                      <div key={hood} style={{ padding: "5px 10px", borderRadius: 9999, background: C.muted, fontFamily: BODY, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        {hood}
                        {isEditing && (
                          <button onClick={() => set("desired_neighborhoods", form.desired_neighborhoods?.filter(h => h !== hood))} style={{ border: "none", background: "none", cursor: "pointer", color: C.coffee, display: "flex", alignItems: "center", padding: 0 }}>✕</button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button onClick={() => {
                        const hood = prompt("Añadir barrio:");
                        if (hood && !form.desired_neighborhoods?.includes(hood)) set("desired_neighborhoods", [...(form.desired_neighborhoods || []), hood]);
                      }} style={{ padding: "5px 10px", borderRadius: 9999, border: `1.5px dashed ${C.border}`, background: "none", fontFamily: BODY, fontSize: 12, color: C.coffee, cursor: "pointer" }}>
                        + Añadir
                      </button>
                    )}
                    {!isEditing && !d?.desired_neighborhoods?.length && <Placeholder>Ninguno especificado</Placeholder>}
                  </div>
                </Field>

                <Field label="Amenidades del sector deseadas">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(isEditing ? form.desired_amenities_sector : d?.desired_amenities_sector)?.map(amenity => (
                      <button key={amenity}
                        onClick={isEditing ? () => set("desired_amenities_sector", toggleTag(form.desired_amenities_sector || [], amenity)) : undefined}
                        style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.green}`, background: `${C.green}12`, color: C.green, cursor: isEditing ? "pointer" : "default" }}>
                        {amenity} {isEditing && "✕"}
                      </button>
                    ))}
                    {isEditing && ["Transporte público", "Parques", "Comercio", "Universidades", "Zona tranquila", "Vida nocturna"]
                      .filter(a => !(form.desired_amenities_sector || []).includes(a))
                      .map(amenity => (
                        <button key={amenity}
                          onClick={() => set("desired_amenities_sector", toggleTag(form.desired_amenities_sector || [], amenity))}
                          style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.border}`, background: C.cream, color: C.coffee, cursor: "pointer" }}>
                          {amenity}
                        </button>
                      ))}
                    {isEditing && (
                      <button onClick={() => {
                        const n = prompt("Añadir amenidad del sector:");
                        if (n && !form.desired_amenities_sector?.includes(n)) set("desired_amenities_sector", [...(form.desired_amenities_sector || []), n]);
                      }} style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px dashed ${C.border}`, background: "none", color: C.coffee, cursor: "pointer" }}>
                        + Añadir
                      </button>
                    )}
                    {!isEditing && !d?.desired_amenities_sector?.length && <Placeholder>Ninguna</Placeholder>}
                  </div>
                </Field>

                <Field label="Características del apto deseadas">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(isEditing ? form.desired_amenities_interior : d?.desired_amenities_interior)?.map(amenity => (
                      <button key={amenity}
                        onClick={isEditing ? () => set("desired_amenities_interior", toggleTag(form.desired_amenities_interior || [], amenity)) : undefined}
                        style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.green}`, background: `${C.green}12`, color: C.green, cursor: isEditing ? "pointer" : "default" }}>
                        {amenity} {isEditing && "✕"}
                      </button>
                    ))}
                    {isEditing && ["Lavandería", "Ascensor", "Gimnasio", "Seguridad 24/7", "Balcón", "Amoblado", "Parqueadero"]
                      .filter(a => !(form.desired_amenities_interior || []).includes(a))
                      .map(amenity => (
                        <button key={amenity}
                          onClick={() => set("desired_amenities_interior", toggleTag(form.desired_amenities_interior || [], amenity))}
                          style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.border}`, background: C.cream, color: C.coffee, cursor: "pointer" }}>
                          {amenity}
                        </button>
                      ))}
                    {isEditing && (
                      <button onClick={() => {
                        const n = prompt("Añadir característica del apto:");
                        if (n && !form.desired_amenities_interior?.includes(n)) set("desired_amenities_interior", [...(form.desired_amenities_interior || []), n]);
                      }} style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px dashed ${C.border}`, background: "none", color: C.coffee, cursor: "pointer" }}>
                        + Añadir
                      </button>
                    )}
                    {!isEditing && !d?.desired_amenities_interior?.length && <Placeholder>Ninguna</Placeholder>}
                  </div>
                </Field>
              </>
            )}
          </div>
        </Card>

        {/* Estilo de vida */}
        <Card title="Estilo de vida">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tags */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {LIFESTYLE_OPTIONS.map(({ label, icon }) => {
                const active = d?.lifestyle_tags?.includes(label);
                return (
                  <div key={label}
                    onClick={isEditing ? () => set("lifestyle_tags", toggleTag(form.lifestyle_tags || [], label)) : undefined}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 12, border: `1.5px solid ${active ? C.green : C.border}`, background: active ? `${C.green}12` : C.cream, color: active ? C.green : C.coffee, cursor: isEditing ? "pointer" : "default" }}>
                    <span style={{ fontSize: 14, display: "flex", alignItems: "center" }}>{icon}</span>
                    <span style={{ fontFamily: BODY, fontSize: 12, fontWeight: 600 }}>{label}</span>
                  </div>
                );
              })}
            </div>

            {/* Sliders */}
            {[
              { label: "Limpieza", key: "cleanliness_level" as const, left: "Relajado", right: "Impecable" },
              { label: "Social",   key: "social_level" as const,        left: "Tranquilo", right: "Muy social" },
            ].map(({ label, key, left, right }) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
                  <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.green }}>{d?.[key] ?? 5}/10</span>
                </div>
                <div style={{ height: 8, background: C.muted, borderRadius: 9999, overflow: "hidden", position: "relative" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(d?.[key] ?? 5) * 10}%` }}
                    style={{ position: "absolute", inset: "0 auto 0 0", background: C.green, borderRadius: 9999 }} />
                  {isEditing && (
                    <input type="range" min={1} max={10} value={d?.[key] ?? 5}
                      onChange={e => set(key, Number(e.target.value))}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
                  )}
                </div>
                {isEditing && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontFamily: BODY, fontSize: 10, color: C.coffee, opacity: 0.55 }}>{left}</span>
                    <span style={{ fontFamily: BODY, fontSize: 10, color: C.coffee, opacity: 0.55 }}>{right}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Intereses */}
        <Card title="Intereses">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {INTEREST_OPTIONS.map(interest => {
              const active = d?.interests?.includes(interest);
              return (
                <button key={interest}
                  onClick={isEditing ? () => set("interests", toggleTag(form.interests || [], interest)) : undefined}
                  style={{ padding: "7px 16px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: "none", cursor: isEditing ? "pointer" : "default", background: active ? C.green : C.muted, color: active ? C.white : C.coffee }}>
                  {interest}
                </button>
              );
            })}
            {isEditing && (
              <button onClick={() => {
                const n = prompt("Añadir interés:");
                if (n) set("interests", [...(form.interests || []), n]);
              }}
                style={{ padding: "7px 16px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, background: "none", border: `1.5px dashed ${C.border}`, color: C.coffee, cursor: "pointer" }}>
                + Añadir
              </button>
            )}
            {!isEditing && !d?.interests?.length && <Placeholder>Sin intereses añadidos</Placeholder>}
          </div>
        </Card>

        {/* Prioridades del Match */}
        <Card title="Prioridades de Match">
          <p style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, opacity: 0.7, marginBottom: 16 }}>
            Define qué es más importante para ti al encontrar un roommate.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Presupuesto", key: "budget" },
              { label: "Estilo de vida", key: "lifestyle" },
              { label: "Intereses", key: "interests" },
              { label: "Personalidad", key: "personality" },
            ].map(({ label, key }) => {
              const weight = Math.min((d?.importance_weights as any)?.[key] ?? 1.0, 1.0);
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase" }}>{label}</span>
                    <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.green }}>{Math.round(weight * 100)}%</span>
                  </div>
                  <div style={{ height: 6, background: C.muted, borderRadius: 999, position: "relative" }}>
                    <motion.div animate={{ width: `${weight * 100}%` }}
                      style={{ position: "absolute", inset: "0 auto 0 0", background: C.green, borderRadius: 999 }} />
                    {isEditing && (
                      <input type="range" min={0} max={1} step={0.1} value={weight}
                        onChange={e => {
                          const newWeights = { ...(form.importance_weights || { budget: 1, lifestyle: 1, interests: 1, personality: 1 }) };
                          (newWeights as any)[key] = parseFloat(e.target.value);
                          set("importance_weights", newWeights);
                        }}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Mis Innegociables */}
        <Card title="Mis Innegociables">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Solo no fumadores", key: "no_smokers" },
              { label: "Obligatorio que acepte mascotas", key: "pets_accepted" },
              { label: "Solo mismo género", key: "same_gender" },
            ].map(({ label, key }) => {
              const active = (d?.exclusion_rules as any)?.[key] ?? false;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: BODY, fontSize: 13, color: C.coffee }}>{label}</span>
                  <div 
                    onClick={isEditing ? () => {
                      const newExclusions = { ...(form.exclusion_rules || { no_smokers: false, pets_accepted: false, same_gender: false }) };
                      (newExclusions as any)[key] = !active;
                      set("exclusion_rules", newExclusions);
                    } : undefined}
                    style={{ 
                      width: 44, height: 24, borderRadius: 12, 
                      background: active ? C.green : C.muted, 
                      position: "relative", cursor: isEditing ? "pointer" : "default",
                      transition: "background 0.2s"
                    }}>
                    <motion.div 
                      animate={{ x: active ? 22 : 2 }}
                      style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: 10, background: C.white, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Logout */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            borderRadius: 9999, background: "none", border: `1.5px solid ${C.border}`,
            fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.coffee, cursor: "pointer",
          }}>
            <LogOut style={{ width: 14, height: 14 }} /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px",
  background: "#EFE7DE", border: "none", borderRadius: 10,
  fontFamily: "var(--font-inter, 'system-ui', sans-serif)", fontSize: 14, color: "#0D0D0D", outline: "none",
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: "none",
};
const valueStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter, 'system-ui', sans-serif)", fontSize: 14, color: "#0D0D0D",
};

function Placeholder({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "rgba(130,85,77,0.4)", fontStyle: "italic" }}>{children}</span>;
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-inter,'system-ui',sans-serif)", fontSize: 10, fontWeight: 700, color: "#82554D", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
        {icon}{label}
      </div>
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "18px 16px", border: "1.5px solid rgba(130,85,77,0.14)" }}>
      <div style={{ fontFamily: "var(--font-fraunces,'Georgia',serif)", fontSize: 17, fontWeight: 500, color: "#0D0D0D", letterSpacing: -0.4, marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
