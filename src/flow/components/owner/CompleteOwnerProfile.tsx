"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Plus, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "../../../utils/supabaseClient";

const TERRACOTA = "#D87D6F";

export function CompleteOwnerProfile() {
  const navigate = useRouter();
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const ownerName =
    typeof window !== "undefined"
      ? localStorage.getItem("owner_name") || "Propietario"
      : "Propietario";

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const ownerId =
        typeof window !== "undefined" ? localStorage.getItem("owner_id") : null;
      if (ownerId && description.trim()) {
        await supabase
          .from("owners")
          .update({ description })
          .eq("owner_id", ownerId);
      }
      navigate.push("/owner/dashboard");
    } catch {
      navigate.push("/owner/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{ backgroundColor: "#F5EDE8" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/Logo_finalfinal.png"
            alt="RentAI"
            className="w-14 h-14 object-contain mx-auto mb-3"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Banner */}
          <div className="h-3 w-full" style={{ backgroundColor: TERRACOTA }} />

          <div className="p-8 space-y-6">
            {/* Saludo */}
            <div>
              <h1 className="text-2xl font-black text-[#0D0D0D]">
                ¡Bienvenido, {ownerName.split(" ")[0]}! 👋
              </h1>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Tu cuenta de propietario está lista. Empieza publicando tu primera propiedad.
              </p>
            </div>

            {/* Descripción opcional */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Descripción del propietario (opcional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Propietario serio con 3 inmuebles en Chapinero. Busco arrendatarios responsables."
                rows={3}
                className="w-full mt-1 bg-slate-50 rounded-2xl p-4 text-sm font-medium focus:ring-2 outline-none resize-none"
                style={{ focusRingColor: TERRACOTA } as any}
              />
            </div>

            {/* Qué puedes hacer */}
            <div className="bg-[#D87D6F]/8 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: TERRACOTA }}>
                Desde tu dashboard podrás:
              </p>
              {[
                "Publicar y gestionar tus propiedades",
                "Ver arrendatarios interesados",
                "Aceptar solicitudes y generar matches",
                "Chatear con tus matches",
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TERRACOTA }}
                  />
                  {item}
                </div>
              ))}
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button
                onClick={() => navigate.push("/owner/properties/new")}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black text-sm transition-all active:scale-95 shadow-lg"
                style={{ backgroundColor: TERRACOTA }}
              >
                <Plus className="w-4 h-4" />
                Publicar primera propiedad
              </button>
              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Ir al dashboard <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
