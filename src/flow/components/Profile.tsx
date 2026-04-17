"use client";
import { useState, useEffect } from "react";
import { Camera, Edit2, MapPin, Briefcase, DollarSign, Heart, Zap, Moon, Sun, Save, X, Plus, Home, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "../../utils/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  job_title: string;
  university_name: string;
  city: string;
  monthly_budget: number;
  user_mode: string;
  avatar_url: string;
  bio: string;
  interests: string[];
  lifestyle_tags: string[];
  cleanliness_level: number;
  social_level: number;
  profile_images: string[];
}

const PLUM_COLOR = "#935B7E";
const BG_LIGHT = "#FDFBFC";

export function Profile() {
  const navigate = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("rentai_user_id");
      if (!userId) {
        toast.error("No hay sesión activa");
        setIsLoading(false);
        return;
      }
      const res = await fetch(`/api/profile?user_id=${userId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cargar el perfil");
      }
      const data = await res.json();
      setProfile(data);
      setEditForm(data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut().catch(() => {});
    localStorage.removeItem("rentai_user_id");
    localStorage.removeItem("userMode");
    navigate.push("/app");
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    
    // DEVELOPMENT HACK: If we are in mock mode, simulate a successful save locally
    if (profile?.id === "mock") {
      setTimeout(() => {
        setProfile(editForm as UserProfile);
        setIsEditing(false);
        setIsSaving(false);
        toast.success("¡Perfil actualizado localmente! (Modo Desarrollo)");
      }, 500);
      return;
    }

    try {
      const userId = localStorage.getItem("rentai_user_id");
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...editForm }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Update failed");
      }

      const updated = await res.json();
      setProfile(updated);
      setIsEditing(false);
      toast.success("¡Perfil actualizado en Supabase!");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#935B7E]/20 border-t-[#935B7E] rounded-full animate-spin"></div>
      </div>
    );
  }

  const data = isEditing ? editForm : profile;

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden" style={{ backgroundColor: BG_LIGHT }}>
      {/* --- HERO SECTION --- */}
      <section className="relative h-[45vh] w-full overflow-hidden">
        {/* Cover Image */}
        <img
          src={data?.profile_images?.[0] || data?.avatar_url || "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1080"}
          alt="Cover"
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Edit Button */}
        <div className="absolute top-6 right-6 z-20">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ backgroundColor: `${PLUM_COLOR}CC` }}
            >
              <Edit2 className="w-4 h-4" />
              <span>Editar</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="p-2.5 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white font-bold transition-all hover:bg-opacity-90 active:scale-95 shadow-lg"
                style={{ color: PLUM_COLOR }}
              >
                {isSaving ? <div className="w-5 h-5 animate-spin border-2 border-current border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                <span>Guardar</span>
              </button>
            </div>
          )}
        </div>

        {/* Floating Info */}
        <div className="absolute bottom-10 left-8 right-8 text-white z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {isEditing ? (
              <div className="flex gap-4 mb-4">
                <input
                  value={editForm.first_name || ""}
                  onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                  placeholder="Nombre"
                  className="bg-white/20 border-white/40 border-2 rounded-xl px-4 py-2 text-2xl font-black focus:outline-none w-1/2"
                />
                <input
                  value={editForm.age || ""}
                  type="number"
                  onChange={e => setEditForm({ ...editForm, age: Number(e.target.value) })}
                  placeholder="Edad"
                  className="bg-white/20 border-white/40 border-2 rounded-xl px-4 py-2 text-2xl font-black focus:outline-none w-24"
                />
              </div>
            ) : (
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-xl">
                {profile?.first_name}, {profile?.age}
              </h1>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge icon={<Briefcase className="w-3.5 h-3.5" />} text={data?.job_title || "Profesión"} />
              <Badge icon={<MapPin className="w-3.5 h-3.5" />} text={data?.city || "Ubicación"} />
              <Badge icon={<DollarSign className="w-3.5 h-3.5" />} text={`$${(data?.monthly_budget || 0).toLocaleString()} MXN`} />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-30">
        
        {/* --- PHOTOS SECTION --- */}
        <section className="mb-10">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: PLUM_COLOR }}>
            Fotos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.profile_images?.slice(0, 4).map((img, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="aspect-square rounded-3xl overflow-hidden shadow-md bg-white/50 relative group"
              >
                <img src={img} alt={`Profile ${i}`} className="w-full h-full object-cover" />
                {isEditing && (
                  <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-6 h-6" />
                  </button>
                )}
              </motion.div>
            ))}
            {isEditing && (data?.profile_images?.length || 0) < 6 && (
              <div className="aspect-square rounded-3xl border-4 border-dashed border-zinc-200 flex items-center justify-center text-zinc-300 hover:border-[#935B7E] hover:text-[#935B7E] cursor-pointer transition-colors">
                <Plus className="w-10 h-10" />
              </div>
            )}
          </div>
        </section>

        {/* --- ABOUT SECTION --- */}
        <section className="mb-10 bg-white p-8 rounded-[40px] shadow-sm">
          <h3 className="text-xl font-black mb-4" style={{ color: PLUM_COLOR }}>Sobre mí</h3>
          {isEditing ? (
            <textarea
              value={editForm.bio || ""}
              onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full bg-zinc-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-[#935B7E]/20 font-medium text-zinc-600 h-32 outline-none"
              placeholder="Cuéntanos sobre ti..."
            />
          ) : (
            <p className="text-lg leading-relaxed font-bold opacity-80" style={{ color: PLUM_COLOR }}>
              {profile?.bio || "Añade una descripción."}
            </p>
          )}
        </section>

        {/* --- LIFESTYLE SECTION --- */}
        <section className="mb-10">
          <h3 className="text-xl font-black mb-4" style={{ color: PLUM_COLOR }}>Estilo de vida</h3>
          
          {/* Tags Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <LifeTag 
              icon={<Zap className="w-4 h-4" />} 
              label="Fumador" 
              active={data?.lifestyle_tags?.includes("Fumador")} 
              isEdit={isEditing} 
              onClick={() => {
                const current = editForm.lifestyle_tags || [];
                const next = current.includes("Fumador") ? current.filter(t => t !== "Fumador") : [...current, "Fumador"];
                setEditForm({ ...editForm, lifestyle_tags: next });
              }}
            />
            <LifeTag 
              icon={<Zap className="w-4 h-4" />} 
              label="Mascotas" 
              active={data?.lifestyle_tags?.includes("Mascotas")} 
              isEdit={isEditing} 
              onClick={() => {
                const current = editForm.lifestyle_tags || [];
                const next = current.includes("Mascotas") ? current.filter(t => t !== "Mascotas") : [...current, "Mascotas"];
                setEditForm({ ...editForm, lifestyle_tags: next });
              }}
            />
            <LifeTag 
              icon={<Moon className="w-4 h-4" />} 
              label="Noctámbulo" 
              active={data?.lifestyle_tags?.includes("Noctámbulo")} 
              isEdit={isEditing} 
              onClick={() => {
                const current = editForm.lifestyle_tags || [];
                const next = current.includes("Noctámbulo") ? current.filter(t => t !== "Noctámbulo") : [...current, "Noctámbulo"];
                setEditForm({ ...editForm, lifestyle_tags: next });
              }}
            />
            <LifeTag 
              icon={<Sun className="w-4 h-4" />} 
              label="Madrugador" 
              active={data?.lifestyle_tags?.includes("Madrugador")} 
              isEdit={isEditing} 
              onClick={() => {
                const current = editForm.lifestyle_tags || [];
                const next = current.includes("Madrugador") ? current.filter(t => t !== "Madrugador") : [...current, "Madrugador"];
                setEditForm({ ...editForm, lifestyle_tags: next });
              }}
            />
          </div>

          {/* Progress Bars */}
          <div className="space-y-6">
            <ProgressItem 
              icon={<Home className="w-5 h-5" />} 
              label="Limpieza" 
              value={data?.cleanliness_level || 5} 
              isEdit={isEditing} 
              onChange={(v) => setEditForm({...editForm, cleanliness_level: v})}
            />
            <ProgressItem 
              icon={<Heart className="w-5 h-5" />} 
              label="Social" 
              value={data?.social_level || 5} 
              isEdit={isEditing}
              onChange={(v) => setEditForm({...editForm, social_level: v})}
            />
          </div>
        </section>

        {/* --- INTERESTS SECTION --- */}
        <section className="mb-10">
          <h3 className="text-xl font-black mb-4" style={{ color: PLUM_COLOR }}>Intereses</h3>
          <div className="flex flex-wrap gap-3">
            {(isEditing ? editForm.interests : profile?.interests)?.map((interest, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!isEditing) return;
                  const current = editForm.interests || [];
                  const next = current.includes(interest)
                    ? current.filter(t => t !== interest)
                    : [...current, interest];
                  setEditForm({ ...editForm, interests: next });
                }}
                className={`px-6 py-2.5 rounded-full font-bold text-sm shadow-md transition-all active:scale-95
                  ${(isEditing ? editForm.interests : profile?.interests)?.includes(interest)
                    ? "text-white"
                    : "bg-zinc-100 text-zinc-400 shadow-none border-2 border-zinc-200"
                  }
                `}
                style={{ backgroundColor: (isEditing ? editForm.interests : profile?.interests)?.includes(interest) ? PLUM_COLOR : undefined }}
              >
                {interest}
              </button>
            ))}
            {isEditing && (
              <button 
                onClick={() => {
                  const newInterest = prompt("Añadir nuevo interés:");
                  if (newInterest) {
                    setEditForm({ ...editForm, interests: [...(editForm.interests || []), newInterest] });
                  }
                }}
                className="px-6 py-2.5 rounded-full border-2 border-dashed border-zinc-300 text-zinc-400 font-bold text-sm hover:border-[#935B7E] hover:text-[#935B7E]"
              >
                + Añadir
              </button>
            )}
          </div>
        </section>

        {/* --- LOGOUT BUTTON --- */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-zinc-200 text-zinc-500 font-semibold text-sm hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>

        {/* --- SEARCH FOOTER (USER MODE) --- */}
        <footer className="mt-6 overflow-hidden rounded-[40px] shadow-2xl relative min-h-40 flex flex-col items-center justify-center transition-all" style={{ backgroundColor: PLUM_COLOR }}>
          <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none" />
          <div className="text-center text-white p-8 relative z-10 w-full">
            <h4 className="text-xl font-black mb-4">¿Qué estás buscando?</h4>
            
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4">
                <ModeOption 
                  label="Apartamento" 
                  selected={editForm.user_mode === "find-room"} 
                  onClick={() => setEditForm({...editForm, user_mode: "find-room"})}
                />
                <ModeOption 
                  label="Roommate" 
                  selected={editForm.user_mode === "find-roommate"} 
                  onClick={() => setEditForm({...editForm, user_mode: "find-roommate"})}
                />
                <ModeOption 
                  label="Alquilar propiedad" 
                  selected={editForm.user_mode === "landlord"} 
                  onClick={() => setEditForm({...editForm, user_mode: "landlord"})}
                />
              </div>
            ) : (
              <p className="text-white font-bold text-lg px-6 py-3 bg-white/10 rounded-2xl inline-block backdrop-blur-sm">
                {profile?.user_mode === "find-room" && "Buscando apartamento / habitación"}
                {profile?.user_mode === "find-roommate" && "Buscando roommate compatible"}
                {profile?.user_mode === "landlord" && "Ofreciendo propiedad en alquiler"}
                {!profile?.user_mode && "Configura tu modo de búsqueda"}
              </p>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

/* Helper Components */

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider">{text}</span>
    </div>
  );
}

function ModeOption({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-4 rounded-2xl font-black text-sm transition-all active:scale-95 border-2
        ${selected 
          ? "bg-white text-[#935B7E] border-white shadow-lg" 
          : "bg-transparent text-white border-white/30 hover:bg-white/10"
        }
      `}
    >
      {label}
    </button>
  );
}

function LifeTag({ icon, label, active, isEdit, onClick }: { icon: React.ReactNode; label: string; active?: boolean; isEdit?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={isEdit ? onClick : undefined}
      className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all select-none
        ${active 
          ? `bg-[#935B7E]/10 border-[#935B7E] text-[#935B7E]` 
          : `bg-white border-zinc-100 text-zinc-400`
        }
        ${isEdit ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}
      `}
    >
      <div className={active ? "text-[#935B7E]" : "text-zinc-300"}>{icon}</div>
      <span className="text-xs font-black">{label}</span>
    </div>
  );
}

function ProgressItem({ icon, label, value, isEdit, onChange }: { icon: React.ReactNode; label: string; value: number; isEdit?: boolean; onChange?: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2 font-black text-xs uppercase" style={{ color: PLUM_COLOR }}>
          {icon}
          {label}
        </div>
        <span className="font-black text-xs" style={{ color: PLUM_COLOR }}>{value}/10</span>
      </div>
      <div className="h-3 w-full bg-zinc-200/50 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: PLUM_COLOR }}
        />
        {isEdit && (
          <input 
            type="range" min="1" max="10" value={value} 
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        )}
      </div>
    </div>
  );
}

