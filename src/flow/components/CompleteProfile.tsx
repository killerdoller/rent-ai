"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Home, Users, ChevronRight, Loader2 } from "lucide-react";

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
  { label: "No fumador", icon: "🚭" },
  { label: "Fumador", icon: "🚬" },
  { label: "Mascotas", icon: "🐾" },
  { label: "Noctámbulo", icon: "🌙" },
  { label: "Madrugador", icon: "☀️" },
  { label: "Trabajo desde casa", icon: "💻" },
  { label: "Deportista", icon: "🏃" },
  { label: "Cocinero", icon: "🍳" },
];

const INTEREST_OPTIONS = [
  "Música", "Cine", "Lectura", "Viajes", "Cocina",
  "Arte", "Yoga", "Gaming", "Fotografía", "Deporte",
];

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
    user_mode: "find-room", monthly_budget: "",
  });

  const steps = [
    { label: "Sobre ti",       component: <Step1 form={form} setForm={setForm} /> },
    { label: "Estilo de vida", component: <Step2 form={form} setForm={setForm} /> },
    { label: "¿Qué buscas?",  component: <Step3 form={form} setForm={setForm} /> },
  ];

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const userId = localStorage.getItem("rentai_user_id");
      if (!userId) throw new Error("No hay sesión activa");
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
          monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : null,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
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
                  {isSaving ? <Loader2 style={{ width: 18, height: 18, animation: "spin 0.7s linear infinite" }} /> : "¡Listo, empezar! 🎉"}
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

      <div>
        <Label>Presupuesto mensual (COP)</Label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.green, zIndex: 1 }}>$</span>
          <input
            type="text"
            value={formatCOP(form.monthly_budget)}
            onChange={e => setForm({ ...form, monthly_budget: parseCOP(e.target.value) })}
            placeholder="1.200.000"
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

      <div style={{ background: `${C.green}12`, borderRadius: 16, padding: "14px 16px", fontFamily: BODY, fontSize: 13, color: C.coffee, lineHeight: 1.5 }}>
        🎉 Casi listo. Con esta información podremos mostrarte las mejores opciones según tu perfil.
      </div>
    </div>
  );
}
