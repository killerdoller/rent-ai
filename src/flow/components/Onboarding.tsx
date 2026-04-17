"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Phone, ArrowRight, Loader2, Home, UserCircle } from "lucide-react";
import { signIn, signUp } from "../../utils/authHelpers";
import { supabase } from "../../utils/supabaseClient";

export function Onboarding() {
  const navigate = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"student" | "owner">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    university: "",
  });

  // Detectar sesión tras redirect de Google OAuth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const userId = session.user.id;
          const user = session.user;

          // Detectar si es registro nuevo: created_at y last_sign_in_at son iguales
          const createdAt = new Date(user.created_at).getTime();
          const lastSignIn = new Date(user.last_sign_in_at || user.created_at).getTime();
          const isNewUser = Math.abs(createdAt - lastSignIn) < 5000;

          // Verificar si es owner
          const { data: owner } = await supabase
            .from("owners")
            .select("owner_id")
            .eq("owner_id", userId)
            .maybeSingle();

          if (owner) {
            localStorage.setItem("owner_id", userId);
            localStorage.setItem("owner_email", user.email || "");
            localStorage.setItem("userMode", "landlord");
            navigate.push(isNewUser ? "/owner/complete-profile" : "/owner/dashboard");
          } else {
            localStorage.setItem("rentai_user_id", userId);
            localStorage.setItem("userMode", "find-room");
            navigate.push(isNewUser ? "/app/complete-profile" : "/app/home");
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      let result: any;

      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password, role, formData);
      }

      // Guardar en localStorage para compatibilidad con el flujo actual
      if (result.role === "student") {
        localStorage.setItem("rentai_user_id", result.userId);
        localStorage.setItem("userMode", "find-room");
        // Nuevo usuario → completar perfil; login → home directamente
        navigate.push(isLogin ? "/app/home" : "/app/complete-profile");
      } else if (result.role === "owner") {
        localStorage.setItem("owner_id", result.ownerId);
        localStorage.setItem("owner_email", formData.email);
        localStorage.setItem("userMode", "landlord");
        navigate.push(isLogin ? "/owner/dashboard" : "/owner/complete-profile");
      } else {
        navigate.push("/app/home");
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#A8D1B1] flex items-center justify-center p-4">
      <div className="w-full max-w-[500px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img src="/Logo_finalfinal.png" alt="RentAI" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">RentAI</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black tracking-tight text-[#0D0D0D] mb-2">
                {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {isLogin ? "Encuentra tu próximo hogar hoy mismo" : "Únete a la comunidad de RentAI"}
              </p>
            </div>

            {/* Login / Registro toggle */}
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-7">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${isLogin ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${!isLogin ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                Registrarse
              </button>
            </div>

            {/* Selector de rol (solo en registro) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3 mb-7 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      role === "student" ? "border-primary bg-primary/5" : "border-slate-100 hover:border-primary/20"
                    }`}
                  >
                    <UserCircle className={`w-6 h-6 ${role === "student" ? "text-primary" : "text-slate-400"}`} />
                    <span className={`text-xs font-black uppercase tracking-wider ${role === "student" ? "text-primary" : "text-slate-400"}`}>
                      Arrendatario
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      role === "owner" ? "border-[#D87D6F] bg-[#D87D6F]/5" : "border-slate-100 hover:border-[#D87D6F]/20"
                    }`}
                  >
                    <Home className={`w-6 h-6 ${role === "owner" ? "text-[#D87D6F]" : "text-slate-400"}`} />
                    <span className={`text-xs font-black uppercase tracking-wider ${role === "owner" ? "text-[#D87D6F]" : "text-slate-400"}`}>
                      Propietario
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón Google — login siempre, registro solo para arrendatarios */}
            {(isLogin || role === "student") && (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm text-slate-700 shadow-sm active:scale-95"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </button>

                <div className="flex items-center gap-3 mt-5">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">o con email</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y apellido (solo registro) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-3 overflow-hidden"
                  >
                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="firstName"
                          required={!isLogin}
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-11 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder="Juan"
                        />
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</label>
                      <input
                        type="text"
                        name="lastName"
                        required={!isLogin}
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Pérez"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-11 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="tu@email.com"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Teléfono (solo registro) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 overflow-hidden"
                  >
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono</label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-11 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="+57 300 123 4567"
                      />
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-11 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-[13px] font-bold text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:opacity-90 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "ENTRAR" : "CREAR CUENTA"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
