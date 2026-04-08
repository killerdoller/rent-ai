"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Key, Loader2 } from "lucide-react";

export function Onboarding() {
  const navigate = useRouter();
  const [loading, setLoading] = useState<"tenant" | "owner" | null>(null);

  const handleTenant = async () => {
    setLoading("tenant");
    let userId = localStorage.getItem("rentai_user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("rentai_user_id", userId);
    }
    localStorage.setItem("userMode", "find-room");
    navigate.push("/app/home");
  };

  const handleOwner = async () => {
    setLoading("owner");
    try {
      let ownerId = localStorage.getItem("owner_id");
      if (!ownerId) {
        const res = await fetch("/api/owner/find-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: `demo-${crypto.randomUUID()}@rentai.demo` }),
        });
        const owner = await res.json();
        ownerId = owner.owner_id;
        localStorage.setItem("owner_id", ownerId);
      }
      localStorage.setItem("userMode", "landlord");
      navigate.push("/owner/dashboard");
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#A8D1B1] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img src="/Logo_finalfinal.png" alt="RentAI" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0D0D0D]">RentAI</h1>
          <p className="text-[#0D0D0D]/70 mt-1">Encuentra tu match perfecto para vivir</p>
        </div>

        <h2 className="text-xl font-semibold text-center text-[#0D0D0D] mb-6">
          ¿Qué tipo de usuario eres?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleTenant}
            disabled={loading !== null}
            className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 text-left group disabled:opacity-60 disabled:scale-100"
          >
            <div className="bg-[#63A694] w-14 h-14 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              {loading === "tenant" ? (
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              ) : (
                <Home className="w-7 h-7 text-white" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-[#0D0D0D] mb-1">Soy Arrendatario</h3>
            <p className="text-sm text-[#82554D]">Busco donde vivir</p>
          </button>

          <button
            onClick={handleOwner}
            disabled={loading !== null}
            className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 text-left group disabled:opacity-60 disabled:scale-100"
          >
            <div className="bg-[#D87D6F] w-14 h-14 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              {loading === "owner" ? (
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              ) : (
                <Key className="w-7 h-7 text-white" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-[#0D0D0D] mb-1">Soy Propietario</h3>
            <p className="text-sm text-[#82554D]">Tengo una propiedad para arrendar</p>
          </button>
        </div>
      </div>
    </div>
  );
}
