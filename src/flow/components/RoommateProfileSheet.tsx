"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Briefcase, GraduationCap, Tag, DollarSign, MessageCircle, Heart, Loader2 } from "lucide-react";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink:    "#0D0D0D",
  cream:  "#F7F2EC",
  white:  "#FFFFFF",
  green:  "#63A694",
  terra:  "#D87D6F",
  coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
  muted:  "#EFE7DE",
};

interface Profile {
  id?: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  job_title?: string;
  university_name?: string;
  city?: string;
  monthly_budget?: number;
  bio?: string;
  interests?: string[];
  lifestyle_tags?: string[];
  cleanliness_level?: number;
  social_level?: number;
  profile_images?: string[];
  avatar_url?: string;
}

interface Props {
  userId?: string;
  profileData?: Profile;
  onClose: () => void;
  onChat?: () => void;
  onLikeBack?: () => void;
  isLiking?: boolean;
}

const levelLabel = (v: number) => v <= 2 ? "Bajo" : v <= 3 ? "Medio" : "Alto";

export function RoommateProfileSheet({ userId, profileData, onClose, onChat, onLikeBack, isLiking }: Props) {
  const [profile, setProfile] = useState<Profile | null>(profileData || null);
  const [loading, setLoading] = useState(!profileData && !!userId);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (profileData || !userId) return;
    fetch(`/api/profile?user_id=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProfile(d); })
      .finally(() => setLoading(false));
  }, [userId, profileData]);

  const photos = profile?.profile_images?.length
    ? profile.profile_images
    : [profile?.avatar_url || "/profile.jpg"];

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Roomie";
  const tags = [...(profile?.lifestyle_tags || []), ...(profile?.interests || [])];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }}
      />

      {/* Sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, pointerEvents: "none" }}
        className="md:flex md:items-center md:justify-center md:inset-0 md:p-6"
      >
        <div style={{
          background: C.white, borderRadius: "24px 24px 0 0", width: "100%",
          maxWidth: 600, margin: "0 auto", height: "88dvh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          pointerEvents: "auto",
        }}
          className="md:rounded-3xl md:shadow-2xl md:h-auto md:max-h-[90vh]"
        >
          {/* Drag handle */}
          <div className="md:hidden" style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: C.border }} />
          </div>

          {/* Close */}
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16, zIndex: 10,
            width: 32, height: 32, borderRadius: 16,
            background: "rgba(255,255,255,0.92)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <X style={{ width: 16, height: 16, color: C.coffee }} />
          </button>

          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 style={{ width: 32, height: 32, color: C.green }} className="animate-spin" />
            </div>
          ) : !profile ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <p style={{ fontFamily: BODY, fontSize: 14, color: C.coffee }}>Perfil no disponible.</p>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* Hero photo */}
              <div style={{ position: "relative", height: 260, flexShrink: 0 }}>
                <img src={photos[photoIdx]} alt={fullName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />

                {photos.length > 1 && (
                  <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                    {photos.map((_, i) => (
                      <button key={i} onClick={() => setPhotoIdx(i)} style={{
                        width: i === photoIdx ? 18 : 6, height: 6, borderRadius: 3,
                        background: i === photoIdx ? C.white : "rgba(255,255,255,0.5)",
                        border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s",
                      }} />
                    ))}
                  </div>
                )}

                <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                  <h2 style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, color: C.white, margin: 0, lineHeight: 1.1 }}>
                    {fullName}{profile.age ? `, ${profile.age}` : ""}
                  </h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 5 }}>
                    {profile.university_name && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: BODY }}>
                        <GraduationCap style={{ width: 12, height: 12 }} />{profile.university_name}
                      </span>
                    )}
                    {profile.job_title && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: BODY }}>
                        <Briefcase style={{ width: 12, height: 12 }} />{profile.job_title}
                      </span>
                    )}
                    {profile.city && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: BODY }}>
                        <MapPin style={{ width: 12, height: 12 }} />{profile.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 16, overscrollBehaviorY: "contain" }}>

                {profile.monthly_budget && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.cream, borderRadius: 14, padding: "12px 16px" }}>
                    <DollarSign style={{ width: 16, height: 16, color: C.green, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.7, margin: 0 }}>Presupuesto</p>
                      <p style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, color: C.ink, margin: "1px 0 0" }}>
                        ${new Intl.NumberFormat("es-CO").format(profile.monthly_budget)} COP/mes
                      </p>
                    </div>
                  </div>
                )}

                {profile.bio && (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 6px" }}>Sobre mí</p>
                    <p style={{ fontFamily: BODY, fontSize: 14, lineHeight: 1.65, color: C.ink, margin: 0 }}>{profile.bio}</p>
                  </div>
                )}

                {tags.length > 0 && (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag style={{ width: 11, height: 11 }} /> Estilo de vida
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {tags.map(t => (
                        <span key={t} style={{ padding: "4px 11px", borderRadius: 9999, fontSize: 12, fontWeight: 600, fontFamily: BODY, background: C.muted, color: C.coffee }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(profile.cleanliness_level || profile.social_level) && (
                  <div style={{ display: "flex", gap: 16, paddingBottom: 4 }}>
                    {profile.cleanliness_level && (
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 6px" }}>Limpieza</p>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= profile.cleanliness_level! ? C.green : C.muted }} />)}
                        </div>
                        <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, margin: "3px 0 0" }}>{levelLabel(profile.cleanliness_level)}</p>
                      </div>
                    )}
                    {profile.social_level && (
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 6px" }}>Social</p>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= profile.social_level! ? C.green : C.muted }} />)}
                        </div>
                        <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, margin: "3px 0 0" }}>{levelLabel(profile.social_level)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* bottom padding */}
                <div style={{ height: 16 }} />
              </div>

              {/* Action buttons */}
              {(onChat || onLikeBack) && (
                <div style={{ flexShrink: 0, padding: "12px 20px 20px", borderTop: `1.5px solid ${C.border}`, display: "flex", gap: 10 }}>
                  {onLikeBack && (
                    <button onClick={onLikeBack} disabled={isLiking} style={{
                      flex: 1, padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer",
                      background: C.terra, color: C.white,
                      fontFamily: BODY, fontSize: 15, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}>
                      {isLiking
                        ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                        : <><Heart style={{ width: 16, height: 16, fill: C.white }} /> Match!</>}
                    </button>
                  )}
                  {onChat && (
                    <button onClick={onChat} style={{
                      flex: 1, padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer",
                      background: C.green, color: C.white,
                      fontFamily: BODY, fontSize: 15, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}>
                      <MessageCircle style={{ width: 16, height: 16 }} /> Chatear
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
