"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Home, Users, ChevronRight, Loader2, Cigarette, Ban, PawPrint, Moon, Sun, Laptop, Dumbbell, ChefHat, PartyPopper, Sparkles, Wallet, Zap, Heart, Smile, X } from "lucide-react";
import { geocodeWeightedTarget } from "../../utils/geocodeTarget";
import { BOGOTA_LOCALITIES, neighborhoodsForLocalities } from "../../utils/bogotaZones";
import { SECTOR_AMENITIES, PROPERTY_AMENITIES_FOR_TENANT } from "../../utils/bogotaAmenities";

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

const LIFESTYLE_OPTIONS: { label: string; icon: React.ReactNode }[] = [
  { label: "No fumador", icon: <Ban style={{ width: 14, height: 14 }} /> },
  { label: "Fumador",    icon: <Cigarette style={{ width: 14, height: 14 }} /> },
  { label: "Mascotas",   icon: <PawPrint style={{ width: 14, height: 14 }} /> },
  { label: "Noctámbulo", icon: <Moon style={{ width: 14, height: 14 }} /> },
  { label: "Madrugador", icon: <Sun style={{ width: 14, height: 14 }} /> },
  { label: "Trabajo desde casa", icon: <Laptop style={{ width: 14, height: 14 }} /> },
  { label: "Deportista", icon: <Dumbbell style={{ width: 14, height: 14 }} /> },
  { label: "Cocinero",   icon: <ChefHat style={{ width: 14, height: 14 }} /> },
];

const INTEREST_OPTIONS = [
  "Música", "Cine", "Lectura", "Viajes", "Cocina",
  "Arte", "Yoga", "Gaming", "Fotografía", "Deporte",
];

const LOCALITIES = BOGOTA_LOCALITIES;

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

interface StepProps { form: any; setForm: (f: any) => void; }

export function CompleteProfile() {
  const navigate = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    bio: "", age: "", city: "", job_title: "",
    lifestyle_tags: [] as string[],
    cleanliness_level: 5, social_level: 5,
    interests: [] as string[],
    user_mode: "find-room", min_budget: "", max_budget: "",
    exclusion_rules: { no_smokers: false, pets_accepted: false, same_gender: false },
    importance_weights: { budget: 1.0, lifestyle: 1.0, interests: 1.0, personality: 1.0 },
    desired_amenities_sector: [] as string[],
    desired_amenities_interior: [] as string[],
    desired_property_types: [] as string[],
    min_bedrooms: null as number | null,
    desired_localities: [] as string[],
    desired_neighborhoods: [] as string[],
    new_neighborhood: ""
  });

  const steps = [
    { label: "Sobre ti",       component: <Step1 form={form} setForm={setForm} /> },
    { label: "Estilo de vida", component: <Step2 form={form} setForm={setForm} /> },
    { label: "¿Qué buscas?",  component: <Step3 form={form} setForm={setForm} /> },
    { label: "Match",          component: <Step4 form={form} setForm={setForm} /> },
  ];

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const userId = localStorage.getItem("rentai_user_id");
      if (!userId) throw new Error("No hay sesión activa");

      // Geocode the chosen zones into a single search center (target_location),
      // which drives the 50% spatial weight of the match score. Localidad y
      // barrios se combinan con pesos (60/40 por default) — ver
      // geocodeWeightedTarget. La localidad pesa más porque es la señal más
      // confiable cuando el usuario aún no conoce los barrios.
      let target_lat: number | undefined;
      let target_lng: number | undefined;
      const hasZones = form.desired_localities.length > 0 || form.desired_neighborhoods.length > 0;
      if (form.user_mode === "find-room" && hasZones) {
        const target = await geocodeWeightedTarget({
          localities: form.desired_localities,
          neighborhoods: form.desired_neighborhoods,
        });
        if (target) { target_lat = target.lat; target_lng = target.lng; }
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          bio: form.bio || null, age: form.age ? Number(form.age) : null,
          city: form.city || null, job_title: form.job_title || null,
          lifestyle_tags: form.lifestyle_tags,
          cleanliness_level: form.cleanliness_level, social_level: form.social_level,
          interests: form.interests, user_mode: form.user_mode,
          min_budget: form.min_budget ? Number(form.min_budget) : null,
          max_budget: form.max_budget ? Number(form.max_budget) : null,
          exclusion_rules: form.exclusion_rules,
          importance_weights: form.importance_weights,
          desired_amenities_sector: form.desired_amenities_sector,
          desired_amenities_interior: form.desired_amenities_interior,
          desired_property_types: form.desired_property_types,
          min_bedrooms: form.min_bedrooms,
          desired_localities: form.desired_localities,
          desired_neighborhoods: form.desired_neighborhoods,
          ...(target_lat !== undefined ? { target_lat, target_lng } : {}),
          profile_completed: true,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      localStorage.setItem("profile_completed", "true");
      navigate.push("/app/home");
    } catch {
      navigate.push("/app/home");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: C.cream, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "auto 0" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/Logo_finalfinal.png" alt="RentAI" style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 10px" }} />
          <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.8 }}>Completa tu perfil</div>
          <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, marginTop: 4 }}>
            Paso {step + 1} de {steps.length} — {steps[step].label}
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 9999, overflow: "hidden", background: "rgba(130,85,77,0.14)" }}>
              <motion.div style={{ height: "100%", background: C.green, borderRadius: 9999 }}
                initial={{ width: 0 }} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.3 }} />
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: C.white, borderRadius: 24, boxShadow: "0 8px 32px rgba(130,85,77,0.12)", overflow: "hidden", border: `1.5px solid ${C.border}` }}>
          <div style={{ padding: "28px 24px" }}>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
                {steps[step].component}
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 14, border: `1.5px solid ${C.border}`,
                  background: "none", fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.coffee, cursor: "pointer",
                }}>Atrás</button>
              )}
              {step < steps.length - 1 ? (
                <button onClick={() => setStep(step + 1)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 14, border: "none",
                  background: C.green, color: C.white, fontFamily: BODY, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  Continuar <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              ) : (
                <button onClick={handleFinish} disabled={isSaving} style={{
                  flex: 1, padding: "12px 0", borderRadius: 14, border: "none",
                  background: C.green, color: C.white, fontFamily: BODY, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: isSaving ? 0.7 : 1,
                }}>
                  {isSaving ? <Loader2 style={{ width: 18, height: 18, animation: "spin 0.7s linear infinite" }} /> : <><PartyPopper style={{ width: 16, height: 16 }} /> ¡Listo, empezar!</>}
                </button>
              )}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            <button onClick={() => navigate.push("/app/home")} style={{
              width: "100%", marginTop: 12, background: "none", border: "none",
              fontFamily: BODY, fontSize: 12, color: C.coffee, opacity: 0.55, cursor: "pointer",
            }}>
              Completar después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{children}</div>;
}

function FieldInput({ value, onChange, placeholder, type = "text", icon }: { value: string; onChange: (v: string) => void; placeholder: string; type?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {icon && <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.coffee, opacity: 0.5 }}>{icon}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box", paddingLeft: icon ? 36 : 14, paddingRight: 14, paddingTop: 11, paddingBottom: 11, background: C.muted, border: "none", borderRadius: 12, fontFamily: BODY, fontSize: 14, color: C.ink, outline: "none" }} />
    </div>
  );
}

function Step1({ form, setForm }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 500, color: C.ink, letterSpacing: -0.5, marginBottom: 4 }}>Cuéntanos sobre ti</div>
        <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee }}>Esta info aparecerá en tu perfil público</p>
      </div>
      <div>
        <Label>Bio</Label>
        <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder="Soy estudiante de ingeniería, tranquilo, ordenado..." rows={3}
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", background: C.muted, border: "none", borderRadius: 12, fontFamily: BODY, fontSize: 14, color: C.ink, outline: "none", resize: "none" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
        <div>
          <Label>Ciudad</Label>
          <FieldInput value={form.city} onChange={v => setForm({ ...form, city: v })} placeholder="Bogotá" icon={<MapPin style={{ width: 15, height: 15 }} />} />
        </div>
        <div>
          <Label>Edad</Label>
          <FieldInput value={form.age} onChange={v => setForm({ ...form, age: v })} placeholder="22" type="number" />
        </div>
      </div>
      <div>
        <Label>Ocupación / Universidad</Label>
        <FieldInput value={form.job_title} onChange={v => setForm({ ...form, job_title: v })} placeholder="Estudiante de Derecho — U. Javeriana" icon={<Briefcase style={{ width: 15, height: 15 }} />} />
      </div>
    </div>
  );
}

function Step2({ form, setForm }: StepProps) {
  const toggle = (arr: string[], val: string) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 500, color: C.ink, letterSpacing: -0.5, marginBottom: 4 }}>Tu estilo de vida</div>
        <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee }}>Ayuda a encontrar roomies compatibles</p>
      </div>

      <div>
        <Label>Características</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LIFESTYLE_OPTIONS.map(({ label, icon }) => {
            const active = form.lifestyle_tags.includes(label);
            return (
              <button key={label} type="button" onClick={() => setForm({ ...form, lifestyle_tags: toggle(form.lifestyle_tags, label) })}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${active ? C.green : C.border}`, background: active ? `${C.green}12` : C.cream, color: active ? C.green : C.coffee, fontFamily: BODY, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <span>{icon}</span>{label}
              </button>
            );
          })}
        </div>
      </div>

      {[
        { label: "Nivel de limpieza", key: "cleanliness_level", left: "Relajado", right: "Impecable" },
        { label: "Nivel social", key: "social_level", left: "Tranquilo", right: "Muy social" },
      ].map(({ label, key, left, right }) => (
        <div key={key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Label>{label}</Label>
            <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.green }}>{form[key]}/10</span>
          </div>
          <input type="range" min={1} max={10} value={form[key]} onChange={e => setForm({ ...form, [key]: Number(e.target.value) })}
            style={{ width: "100%", accentColor: C.green }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ fontFamily: BODY, fontSize: 10, color: C.coffee, opacity: 0.6 }}>{left}</span>
            <span style={{ fontFamily: BODY, fontSize: 10, color: C.coffee, opacity: 0.6 }}>{right}</span>
          </div>
        </div>
      ))}

      <div>
        <Label>Intereses</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {INTEREST_OPTIONS.map(interest => {
            const active = form.interests.includes(interest);
            return (
              <button key={interest} type="button" onClick={() => setForm({ ...form, interests: toggle(form.interests, interest) })}
                style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: active ? C.green : C.muted, color: active ? C.white : C.coffee }}>
                {interest}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step3({ form, setForm }: StepProps) {
  const toggle = (arr: string[], val: string) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 500, color: C.ink, letterSpacing: -0.5, marginBottom: 4 }}>¿Qué estás buscando?</div>
        <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee }}>Define tu búsqueda principal</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { icon: <Home style={{ width: 22, height: 22 }} />, label: "Apartamento o habitación", value: "find-room" },
          { icon: <Users style={{ width: 22, height: 22 }} />, label: "Roommate compatible", value: "find-roommate" },
        ].map(({ icon, label, value }) => {
          const selected = form.user_mode === value;
          return (
            <button key={value} type="button" onClick={() => setForm({ ...form, user_mode: value })}
              style={{
                position: "relative", padding: "16px 12px", borderRadius: 16,
                border: `2px solid ${selected ? C.green : C.border}`,
                background: selected ? `${C.green}08` : C.white,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                cursor: "pointer", color: selected ? C.green : C.coffee,
                transition: "all 0.2s",
              }}>
              {selected && (
                <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 8, height: 4, borderLeft: "2px solid white", borderBottom: "2px solid white", transform: "rotate(-45deg) translateY(-1px)" }} />
                </div>
              )}
              {icon}
              <span style={{ fontFamily: BODY, fontSize: 12, fontWeight: 700, textAlign: "center", lineHeight: 1.3, color: selected ? C.green : C.coffee }}>{label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Presupuesto Mínimo (COP)</Label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.green, zIndex: 1 }}>$</span>
            <input
              type="text"
              value={formatCOP(form.min_budget)}
              onChange={e => setForm({ ...form, min_budget: parseCOP(e.target.value) })}
              placeholder="800.000"
              style={{
                width: "100%", boxSizing: "border-box", paddingLeft: 28, paddingRight: 14,
                paddingTop: 11, paddingBottom: 11, background: C.muted, border: `1.5px solid ${C.border}`,
                borderRadius: 12, fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink, outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => (e.target.parentElement!.style.borderColor = C.green)}
              onBlur={(e) => (e.target.parentElement!.style.borderColor = C.border)}
            />
          </div>
        </div>
        <div>
          <Label>Presupuesto Máximo (COP)</Label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.green, zIndex: 1 }}>$</span>
            <input
              type="text"
              value={formatCOP(form.max_budget)}
              onChange={e => setForm({ ...form, max_budget: parseCOP(e.target.value) })}
              placeholder="1.500.000"
              style={{
                width: "100%", boxSizing: "border-box", paddingLeft: 28, paddingRight: 14,
                paddingTop: 11, paddingBottom: 11, background: C.muted, border: `1.5px solid ${C.border}`,
                borderRadius: 12, fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink, outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => (e.target.parentElement!.style.borderColor = C.green)}
              onBlur={(e) => (e.target.parentElement!.style.borderColor = C.border)}
            />
          </div>
        </div>
      </div>

      {form.user_mode === "find-room" && (
        <>
          <div>
            <Label>Tipo de Propiedad Ideal</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PROPERTY_TYPES.map(type => {
                const active = form.desired_property_types.includes(type);
                return (
                  <button key={type} type="button" onClick={() => setForm({ ...form, desired_property_types: toggle(form.desired_property_types, type) })}
                    style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${active ? C.green : C.border}`, cursor: "pointer", background: active ? `${C.green}12` : C.cream, color: active ? C.green : C.coffee }}>
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Mínimo de habitaciones</Label>
            <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, marginTop: -6, marginBottom: 8 }}>
              Filtra propiedades con menos habitaciones. Déjalo en "Sin mínimo" si te da igual.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Sin mínimo", value: null },
                { label: "1+", value: 1 },
                { label: "2+", value: 2 },
                { label: "3+", value: 3 },
                { label: "4+", value: 4 },
              ].map(opt => {
                const active = form.min_bedrooms === opt.value;
                return (
                  <button key={String(opt.value)} type="button"
                    onClick={() => setForm({ ...form, min_bedrooms: opt.value })}
                    style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${active ? C.green : C.border}`, cursor: "pointer", background: active ? `${C.green}12` : C.cream, color: active ? C.green : C.coffee }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Localidad(es) en Bogotá</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LOCALITIES.map(loc => {
                const active = form.desired_localities.includes(loc);
                return (
                  <button key={loc} type="button" onClick={() => setForm({ ...form, desired_localities: toggle(form.desired_localities, loc) })}
                    style={{ padding: "6px 12px", borderRadius: 8, fontFamily: BODY, fontSize: 11, fontWeight: 600, border: `1px solid ${active ? C.green : C.border}`, cursor: "pointer", background: active ? `${C.green}12` : C.cream, color: active ? C.green : C.coffee }}>
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Barrios específicos (opcional)</Label>
            {form.desired_localities.length === 0 ? (
              <p style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, fontStyle: "italic" }}>
                Selecciona al menos una localidad arriba para ver sus barrios.
                Si no quieres especificar, déjalo así — la localidad es suficiente.
              </p>
            ) : (
              <>
                {neighborhoodsForLocalities(form.desired_localities).map(group => (
                  <div key={group.locality} style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
                      {group.locality}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {group.neighborhoods.map(hood => {
                        const active = form.desired_neighborhoods.includes(hood);
                        return (
                          <button key={hood} type="button"
                            onClick={() => setForm({
                              ...form,
                              desired_neighborhoods: active
                                ? form.desired_neighborhoods.filter(h => h !== hood)
                                : [...form.desired_neighborhoods, hood],
                            })}
                            style={{ padding: "5px 10px", borderRadius: 8, fontFamily: BODY, fontSize: 11, fontWeight: 600, border: `1px solid ${active ? C.green : C.border}`, cursor: "pointer", background: active ? `${C.green}12` : C.cream, color: active ? C.green : C.coffee }}>
                            {hood}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Escape hatch para barrios que no estén en la lista */}
                <details style={{ marginTop: 4 }}>
                  <summary style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, cursor: "pointer" }}>
                    ¿No ves tu barrio? Añadirlo manualmente
                  </summary>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      type="text"
                      value={form.new_neighborhood || ""}
                      onChange={e => setForm({ ...form, new_neighborhood: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && form.new_neighborhood) {
                          e.preventDefault();
                          if (!form.desired_neighborhoods.includes(form.new_neighborhood)) {
                            setForm({ ...form, desired_neighborhoods: [...form.desired_neighborhoods, form.new_neighborhood], new_neighborhood: "" });
                          }
                        }
                      }}
                      placeholder="Nombre del barrio"
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: BODY, fontSize: 13, outline: "none" }}
                    />
                    <button type="button" onClick={() => {
                      if (form.new_neighborhood && !form.desired_neighborhoods.includes(form.new_neighborhood)) {
                        setForm({ ...form, desired_neighborhoods: [...form.desired_neighborhoods, form.new_neighborhood], new_neighborhood: "" });
                      }
                    }} style={{ padding: "8px 16px", borderRadius: 10, background: C.green, color: C.white, border: "none", fontFamily: BODY, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      Añadir
                    </button>
                  </div>
                </details>

                {/* Chips de barrios seleccionados (cuando hay alguno fuera del picker, queda visible) */}
                {form.desired_neighborhoods.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
                    <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
                      Seleccionados
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {form.desired_neighborhoods.map((hood: string) => (
                        <div key={hood} style={{ padding: "5px 10px", borderRadius: 9999, background: C.muted, fontFamily: BODY, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                          {hood}
                          <button type="button" onClick={() => setForm({ ...form, desired_neighborhoods: form.desired_neighborhoods.filter((h: string) => h !== hood) })} style={{ border: "none", background: "none", cursor: "pointer", color: C.coffee, display: "flex", alignItems: "center", padding: 0 }}>
                            <X style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <Label>Amenidades del sector deseadas</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {form.desired_amenities_sector.map((amenity: string) => (
                <button key={amenity} type="button" onClick={() => setForm({ ...form, desired_amenities_sector: form.desired_amenities_sector.filter((a: string) => a !== amenity) })}
                  style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.green}`, cursor: "pointer", background: `${C.green}12`, color: C.green }}>
                  {amenity} ✕
                </button>
              ))}
              {SECTOR_AMENITIES
                .filter(a => !form.desired_amenities_sector.includes(a))
                .map(amenity => (
                <button key={amenity} type="button" onClick={() => setForm({ ...form, desired_amenities_sector: [...form.desired_amenities_sector, amenity] })}
                  style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.border}`, cursor: "pointer", background: C.cream, color: C.coffee }}>
                  {amenity}
                </button>
              ))}
              <button type="button" onClick={() => {
                const n = prompt("Añadir amenidad del sector:");
                if (n && !form.desired_amenities_sector.includes(n)) setForm({ ...form, desired_amenities_sector: [...form.desired_amenities_sector, n] });
              }}
                style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px dashed ${C.border}`, cursor: "pointer", background: "none", color: C.coffee }}>
                + Añadir
              </button>
            </div>
          </div>
          <div>
            <Label>Comodidades de la propiedad deseadas</Label>
            <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, marginTop: -6, marginBottom: 8 }}>
              No te preocupes si está dentro del apartamento o en áreas comunes — solo selecciona lo que quieres que tenga.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {form.desired_amenities_interior.map((amenity: string) => (
                <button key={amenity} type="button" onClick={() => setForm({ ...form, desired_amenities_interior: form.desired_amenities_interior.filter((a: string) => a !== amenity) })}
                  style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.green}`, cursor: "pointer", background: `${C.green}12`, color: C.green }}>
                  {amenity} ✕
                </button>
              ))}
              {PROPERTY_AMENITIES_FOR_TENANT
                .filter(a => !form.desired_amenities_interior.includes(a))
                .map(amenity => (
                <button key={amenity} type="button" onClick={() => setForm({ ...form, desired_amenities_interior: [...form.desired_amenities_interior, amenity] })}
                  style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.border}`, cursor: "pointer", background: C.cream, color: C.coffee }}>
                  {amenity}
                </button>
              ))}
              <button type="button" onClick={() => {
                const n = prompt("Añadir característica del apto:");
                if (n && !form.desired_amenities_interior.includes(n)) setForm({ ...form, desired_amenities_interior: [...form.desired_amenities_interior, n] });
              }}
                style={{ padding: "7px 14px", borderRadius: 9999, fontFamily: BODY, fontSize: 12, fontWeight: 700, border: `1.5px dashed ${C.border}`, cursor: "pointer", background: "none", color: C.coffee }}>
                + Añadir
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ background: `${C.green}12`, borderRadius: 16, padding: "14px 16px", fontFamily: BODY, fontSize: 13, color: C.coffee, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
        <PartyPopper style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
        Continúa para configurar tus preferencias de match.
      </div>
    </div>
  );
}

function Step4({ form, setForm }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 500, color: C.ink, letterSpacing: -0.5, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          La magia del Match <Sparkles style={{ width: 18, height: 18, color: C.green }} />
        </div>
        <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, lineHeight: 1.4 }}>
          Cuéntanos qué es lo más importante para ti y buscaremos las opciones que mejor conecten contigo.
        </p>
      </div>

      <div>
        <Label>Tus innegociables</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.exclusion_rules.no_smokers} onChange={e => setForm({...form, exclusion_rules: {...form.exclusion_rules, no_smokers: e.target.checked}})} style={{ accentColor: C.green, width: 16, height: 16 }} />
            <span style={{ fontFamily: BODY, fontSize: 13, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>No acepto fumadores <Ban style={{ width: 14, height: 14, color: C.coffee }} /></span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.exclusion_rules.pets_accepted} onChange={e => setForm({...form, exclusion_rules: {...form.exclusion_rules, pets_accepted: e.target.checked}})} style={{ accentColor: C.green, width: 16, height: 16 }} />
            <span style={{ fontFamily: BODY, fontSize: 13, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>Deben aceptar mascotas <PawPrint style={{ width: 14, height: 14, color: C.coffee }} /></span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.exclusion_rules.same_gender} onChange={e => setForm({...form, exclusion_rules: {...form.exclusion_rules, same_gender: e.target.checked}})} style={{ accentColor: C.green, width: 16, height: 16 }} />
            <span style={{ fontFamily: BODY, fontSize: 13, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>Solo de mi mismo género <Users style={{ width: 14, height: 14, color: C.coffee }} /></span>
          </label>
        </div>
      </div>

      <div>
        <Label>¿Qué tanto te importa cada cosa?</Label>
        <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, marginBottom: 16, lineHeight: 1.4 }}>
          Mueve los controles según qué tan vital sea para ti cada aspecto. (A la izquierda = Me da igual, a la derecha = Es súper importante).
        </p>
        {[
          { key: "budget", label: "Presupuesto", icon: <Wallet style={{ width: 14, height: 14, color: C.coffee }} /> },
          { key: "lifestyle", label: "Estilo de vida y limpieza", icon: <Zap style={{ width: 14, height: 14, color: C.coffee }} /> },
          { key: "interests", label: "Intereses en común", icon: <Heart style={{ width: 14, height: 14, color: C.coffee }} /> },
          { key: "personality", label: "Personalidad", icon: <Smile style={{ width: 14, height: 14, color: C.coffee }} /> }
        ].map(item => (
          <div key={item.key} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: BODY, fontSize: 12, color: C.ink, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                {item.label} {item.icon}
              </span>
              <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.green }}>{Math.round(form.importance_weights[item.key as keyof typeof form.importance_weights] * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.1} value={form.importance_weights[item.key as keyof typeof form.importance_weights]} 
              onChange={e => setForm({...form, importance_weights: {...form.importance_weights, [item.key]: Number(e.target.value)}})} 
              style={{ width: "100%", accentColor: C.green }} />
          </div>
        ))}
      </div>

      <div style={{ background: `${C.green}12`, borderRadius: 16, padding: "14px 16px", fontFamily: BODY, fontSize: 13, color: C.coffee, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
        <PartyPopper style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: C.green }} />
        ¡Todo listo! Con estos superpoderes encontraremos a tu roomie ideal.
      </div>
    </div>
  );
}

