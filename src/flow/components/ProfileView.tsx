"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Tag, DollarSign } from "lucide-react";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink:    "#0D0D0D",
  cream: "#FFFFFF",
  white:  "#FFFFFF",
  green:  "#63A694",
  coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
  muted:  "#EFE7DE",
};

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
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

const levelLabel = (val?: number) => {
  if (!val) return null;
  if (val <= 2) return "Bajo";
  if (val <= 3) return "Medio";
  return "Alto";
};

export function ProfileView({ userId }: { userId: string }) {
  const navigate = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/profile?user_id=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProfile(data); })
      .finally(() => setIsLoading(false));
  }, [userId]);

  const photos = profile?.profile_images?.length
    ? profile.profile_images
    : [profile?.avatar_url || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=640"];

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", background: C.cream }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.green}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100dvh", background: C.cream, gap: 12 }}>
        <p style={{ fontFamily: BODY, fontSize: 15, color: C.coffee }}>Perfil no encontrado.</p>
        <button onClick={() => navigate.back()} style={{ padding: "8px 20px", borderRadius: 9999, background: C.green, color: C.white, border: "none", fontFamily: BODY, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Volver
        </button>
      </div>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Roomie";
  const tags = [...(profile.lifestyle_tags || []), ...(profile.interests || [])];

  return (
    <div style={{ minHeight: "100dvh", background: C.cream, paddingBottom: 40 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Photo hero */}
      <div style={{ position: "relative", height: 380 }}>
        <img
          src={photos[photoIdx]}
          alt={fullName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />

        {/* Back button */}
        <button onClick={() => navigate.back()} style={{
          position: "absolute", top: 16, left: 16,
          width: 38, height: 38, borderRadius: 19,
          background: "rgba(255,255,255,0.9)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ArrowLeft style={{ width: 18, height: 18, color: C.coffee }} />
        </button>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {photos.map((_, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)} style={{
                width: i === photoIdx ? 20 : 6, height: 6, borderRadius: 3,
                background: i === photoIdx ? C.white : "rgba(255,255,255,0.5)",
                border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s",
              }} />
            ))}
          </div>
        )}

        {/* Name overlay */}
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, color: C.white, margin: 0, lineHeight: 1.1 }}>
            {fullName}{profile.age ? `, ${profile.age}` : ""}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {profile.university_name && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: BODY }}>
                <GraduationCap style={{ width: 13, height: 13 }} />{profile.university_name}
              </span>
            )}
            {profile.job_title && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: BODY }}>
                <Briefcase style={{ width: 13, height: 13 }} />{profile.job_title}
              </span>
            )}
            {profile.city && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: BODY }}>
                <MapPin style={{ width: 13, height: 13 }} />{profile.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Budget */}
        {profile.monthly_budget && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px 20px", border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.green}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <DollarSign style={{ width: 18, height: 18, color: C.green }} />
            </div>
            <div>
              <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, margin: 0 }}>Presupuesto mensual</p>
              <p style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink, margin: "2px 0 0" }}>
                ${new Intl.NumberFormat("es-CO").format(profile.monthly_budget)} COP
              </p>
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px 20px", border: `1.5px solid ${C.border}` }}>
            <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 8px" }}>Sobre mí</p>
            <p style={{ fontFamily: BODY, fontSize: 14, lineHeight: 1.65, color: C.ink, margin: 0 }}>{profile.bio}</p>
          </div>
        )}

        {/* Lifestyle tags */}
        {tags.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px 20px", border: `1.5px solid ${C.border}` }}>
            <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Tag style={{ width: 12, height: 12 }} /> Estilo de vida
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tags.map(t => (
                <span key={t} style={{ padding: "5px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600, fontFamily: BODY, background: C.muted, color: C.coffee }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cleanliness / Social levels */}
        {(profile.cleanliness_level || profile.social_level) && (
          <div style={{ background: C.white, borderRadius: 16, padding: "16px 20px", border: `1.5px solid ${C.border}`, display: "flex", gap: 16 }}>
            {profile.cleanliness_level && (
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>Limpieza</p>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= profile.cleanliness_level! ? C.green : C.muted }} />
                  ))}
                </div>
                <p style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, margin: "4px 0 0" }}>{levelLabel(profile.cleanliness_level)}</p>
              </div>
            )}
            {profile.social_level && (
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>Social</p>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= profile.social_level! ? C.green : C.muted }} />
                  ))}
                </div>
                <p style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, margin: "4px 0 0" }}>{levelLabel(profile.social_level)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
