"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Home, Users, ChevronRight, Loader2 } from "lucide-react";

const PLUM = "#935B7E";

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

interface StepProps {
  form: any;
  setForm: (f: any) => void;
}

export function CompleteProfile() {
  const navigate = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    age: "",
    city: "",
    job_title: "",
    lifestyle_tags: [] as string[],
    cleanliness_level: 5,
    social_level: 5,
    interests: [] as string[],
    user_mode: "find-room",
    monthly_budget: "",
  });

  const steps = [
    { label: "Sobre ti", component: <Step1 form={form} setForm={setForm} /> },
    { label: "Estilo de vida", component: <Step2 form={form} setForm={setForm} /> },
    { label: "¿Qué buscas?", component: <Step3 form={form} setForm={setForm} /> },
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
          bio: form.bio || null,
          age: form.age ? Number(form.age) : null,
          city: form.city || null,
          job_title: form.job_title || null,
          lifestyle_tags: form.lifestyle_tags,
          cleanliness_level: form.cleanliness_level,
          social_level: form.social_level,
          interests: form.interests,
          user_mode: form.user_mode,
          monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : null,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar el perfil");
      navigate.push("/app/home");
    } catch (err) {
      console.error(err);
      navigate.push("/app/home");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#A8D1B1] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/Logo_finalfinal.png" alt="RentAI" className="w-12 h-12 object-contain mx-auto mb-3" />
          <h1 className="text-xl font-black text-[#0D0D0D]">Completa tu perfil</h1>
          <p className="text-sm text-[#0D0D0D]/60 mt-1">
            Paso {step + 1} de {steps.length} — {steps[step].label}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/40"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: PLUM }}
                initial={{ width: 0 }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                {steps[step].component}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Atrás
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ backgroundColor: PLUM }}
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: PLUM }}
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "¡Listo, empezar! 🎉"
                  )}
                </button>
              )}
            </div>

            {/* Skip */}
            <button
              onClick={() => navigate.push("/app/home")}
              className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Completar después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Paso 1: Sobre ti ── */
function Step1({ form, setForm }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-[#0D0D0D] mb-1">Cuéntanos sobre ti</h2>
        <p className="text-sm text-slate-400">Esta info aparecerá en tu perfil público</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Soy estudiante de ingeniería, tranquilo, ordenado..."
            rows={3}
            className="w-full mt-1 bg-slate-50 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#935B7E]/20 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Edad</label>
            <input
              type="number"
              value={form.age}
              onChange={e => setForm({ ...form, age: e.target.value })}
              placeholder="22"
              min={16} max={80}
              className="w-full mt-1 bg-slate-50 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#935B7E]/20 outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Ciudad</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                placeholder="Bogotá"
                className="w-full bg-slate-50 rounded-2xl py-3 pl-9 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#935B7E]/20 outline-none"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Ocupación / Universidad</label>
          <div className="relative mt-1">
            <input
              type="text"
              value={form.job_title}
              onChange={e => setForm({ ...form, job_title: e.target.value })}
              placeholder="Estudiante de Derecho — U. Javeriana"
              className="w-full bg-slate-50 rounded-2xl py-3 pl-9 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#935B7E]/20 outline-none"
            />
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Paso 2: Estilo de vida ── */
function Step2({ form, setForm }: StepProps) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-[#0D0D0D] mb-1">Tu estilo de vida</h2>
        <p className="text-sm text-slate-400">Ayuda a encontrar roomies compatibles</p>
      </div>

      {/* Tags de estilo */}
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Características</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {LIFESTYLE_OPTIONS.map(({ label, icon }) => {
            const active = form.lifestyle_tags.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => setForm({ ...form, lifestyle_tags: toggle(form.lifestyle_tags, label) })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                  active
                    ? "border-[#935B7E] bg-[#935B7E]/10 text-[#935B7E]"
                    : "border-slate-100 text-slate-500 hover:border-slate-200"
                }`}
              >
                <span>{icon}</span> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <SliderField
          label="Nivel de limpieza"
          value={form.cleanliness_level}
          onChange={v => setForm({ ...form, cleanliness_level: v })}
          leftLabel="Relajado"
          rightLabel="Impecable"
        />
        <SliderField
          label="Nivel social"
          value={form.social_level}
          onChange={v => setForm({ ...form, social_level: v })}
          leftLabel="Tranquilo"
          rightLabel="Muy social"
        />
      </div>

      {/* Intereses */}
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Intereses</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {INTEREST_OPTIONS.map(interest => {
            const active = form.interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => setForm({ ...form, interests: toggle(form.interests, interest) })}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active
                    ? "text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                style={active ? { backgroundColor: PLUM } : undefined}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Paso 3: ¿Qué buscas? ── */
function Step3({ form, setForm }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-[#0D0D0D] mb-1">¿Qué estás buscando?</h2>
        <p className="text-sm text-slate-400">Define tu búsqueda principal</p>
      </div>

      {/* Modo de búsqueda */}
      <div className="grid grid-cols-2 gap-3">
        <ModeCard
          icon={<Home className="w-6 h-6" />}
          label="Apartamento o habitación"
          selected={form.user_mode === "find-room"}
          onClick={() => setForm({ ...form, user_mode: "find-room" })}
        />
        <ModeCard
          icon={<Users className="w-6 h-6" />}
          label="Roommate compatible"
          selected={form.user_mode === "find-roommate"}
          onClick={() => setForm({ ...form, user_mode: "find-roommate" })}
        />
      </div>

      {/* Presupuesto mensual */}
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Presupuesto mensual (COP)
        </label>
        <div className="relative mt-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
          <input
            type="number"
            value={form.monthly_budget}
            onChange={e => setForm({ ...form, monthly_budget: e.target.value })}
            placeholder="1.200.000"
            className="w-full bg-slate-50 rounded-2xl py-3 pl-8 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#935B7E]/20 outline-none"
          />
        </div>
      </div>

      <div className="bg-[#A8D1B1]/20 rounded-2xl p-4 text-sm text-slate-500 leading-relaxed">
        🎉 Casi listo. Con esta información podremos mostrarte las mejores opciones según tu perfil.
      </div>
    </div>
  );
}

/* ── Helpers ── */
function SliderField({
  label, value, onChange, leftLabel, rightLabel,
}: {
  label: string; value: number; onChange: (v: number) => void;
  leftLabel: string; rightLabel: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</label>
        <span className="text-xs font-black" style={{ color: PLUM }}>{value}/10</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#935B7E]"
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-0.5">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function ModeCard({
  icon, label, selected, onClick,
}: {
  icon: React.ReactNode; label: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
        selected
          ? "border-[#935B7E] bg-[#935B7E]/5"
          : "border-slate-100 hover:border-[#935B7E]/30"
      }`}
    >
      <span style={{ color: selected ? PLUM : "#94a3b8" }}>{icon}</span>
      <span
        className="text-xs font-black leading-tight"
        style={{ color: selected ? PLUM : "#94a3b8" }}
      >
        {label}
      </span>
    </button>
  );
}
