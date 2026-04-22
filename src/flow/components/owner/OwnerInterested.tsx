"use client";
import { useState, useEffect } from "react";
import { Users, MapPin, Check, Building2, Mail, X, Briefcase, Heart, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink: "#0D0D0D", cream: "#F7F2EC", muted: "#EFE7DE",
  white: "#FFFFFF", terra: "#D87D6F", green: "#63A694",
  coffee: "#82554D", border: "rgba(130,85,77,0.14)",
};

const LIFESTYLE_LABELS: Record<string, string> = {
  early_bird: "Madrugador", night_owl: "Trasnochador",
  neat_freak: "Muy ordenado", relaxed_cleaner: "Relajado con el orden",
  social_butterfly: "Muy sociable", introvert: "Introvertido",
  work_from_home: "Trabaja en casa", student: "Estudiante",
  pet_owner: "Tiene mascotas", smoker: "Fumador",
  vegan: "Vegano/a", fitness_lover: "Amante del gym",
};

const INTEREST_LABELS: Record<string, string> = {
  music: "Música", sports: "Deportes", tech: "Tecnología",
  cooking: "Cocina", travel: "Viajes", art: "Arte",
  reading: "Lectura", gaming: "Gaming", yoga: "Yoga",
  cinema: "Cine", photography: "Fotografía", nature: "Naturaleza",
};

interface InterestedTenant {
  like_id: string; user_id: string; liked_at: string;
  tenant: { id: string; name: string; email: string | null; phone: string | null; user_mode: string } | null;
  property: { property_id: string; title: string; image_url: string; neighborhood: string; city: string };
}

interface TenantProfile {
  id: string; first_name: string | null; last_name: string | null;
  age: number | null; job_title: string | null; city: string | null;
  bio: string | null; interests: string[] | null; lifestyle_tags: string[] | null;
  cleanliness_level: number | null; social_level: number | null;
  avatar_url: string | null; monthly_budget: number | null;
}

function SliderBar({ value, label }: { value: number | null; label: string }) {
  const pct = value != null ? Math.round(((value - 1) / 4) * 100) : 50;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
        <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.6 }}>{value ?? "—"}/5</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: C.muted, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C.terra, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function TenantProfileSheet({
  tenant, onClose, onAccept, isAccepted, isAccepting,
}: {
  tenant: InterestedTenant;
  onClose: () => void;
  onAccept: () => void;
  isAccepted: boolean;
  isAccepting: boolean;
}) {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile?user_id=${tenant.user_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenant.user_id]);

  const name = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
    : tenant.tenant?.name || "Arrendatario";

  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 600, maxHeight: "90vh",
          background: C.cream, borderRadius: "24px 24px 0 0",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Handle bar */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border }} />
        </div>

        {/* Close button */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, zIndex: 1,
          width: 32, height: 32, borderRadius: 16, border: "none",
          background: C.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <X style={{ width: 16, height: 16, color: C.coffee }} />
        </button>

        {/* Scrollable content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 20px 24px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60, paddingBottom: 40 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${C.terra}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : (
            <>
              {/* Hero */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, paddingBottom: 20, gap: 10 }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} style={{ width: 84, height: 84, borderRadius: 42, objectFit: "cover", border: `3px solid ${C.terra}` }} />
                ) : (
                  <div style={{ width: 84, height: 84, borderRadius: 42, background: `${C.terra}22`, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${C.terra}` }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 500, color: C.terra }}>{initial}</span>
                  </div>
                )}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 500, color: C.ink, letterSpacing: -0.6 }}>{name}</div>
                  {profile?.age && (
                    <div style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, marginTop: 2 }}>{profile.age} años</div>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                  {profile?.city && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 9999, background: C.muted }}>
                      <MapPin style={{ width: 11, height: 11, color: C.coffee }} />
                      <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee }}>{profile.city}</span>
                    </div>
                  )}
                  {profile?.job_title && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 9999, background: C.muted }}>
                      <Briefcase style={{ width: 11, height: 11, color: C.coffee }} />
                      <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee }}>{profile.job_title}</span>
                    </div>
                  )}
                  {profile?.monthly_budget && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 9999, background: `${C.terra}18` }}>
                      <Star style={{ width: 11, height: 11, color: C.terra }} />
                      <span style={{ fontFamily: BODY, fontSize: 11, color: C.terra, fontWeight: 700 }}>
                        Presupuesto: ${Number(profile.monthly_budget).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Property interested in */}
              <div style={{ background: C.white, borderRadius: 16, padding: "12px 14px", border: `1.5px solid ${C.border}`, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <Building2 style={{ width: 16, height: 16, color: C.coffee, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>Interesado en</div>
                  <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tenant.property?.title}</div>
                  <div style={{ fontFamily: BODY, fontSize: 11, color: C.coffee }}>{tenant.property?.neighborhood}</div>
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div style={{ background: C.white, borderRadius: 16, padding: "14px", border: `1.5px solid ${C.border}`, marginBottom: 14 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 500, color: C.ink, marginBottom: 8 }}>Sobre mí</div>
                  <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, lineHeight: 1.6, margin: 0 }}>{profile.bio}</p>
                </div>
              )}

              {/* Lifestyle tags */}
              {profile?.lifestyle_tags && profile.lifestyle_tags.length > 0 && (
                <div style={{ background: C.white, borderRadius: 16, padding: "14px", border: `1.5px solid ${C.border}`, marginBottom: 14 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 500, color: C.ink, marginBottom: 10 }}>Estilo de vida</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {profile.lifestyle_tags.map(tag => (
                      <span key={tag} style={{ padding: "5px 12px", borderRadius: 9999, background: `${C.terra}14`, border: `1px solid ${C.terra}44`, fontFamily: BODY, fontSize: 11, fontWeight: 600, color: C.terra }}>
                        {LIFESTYLE_LABELS[tag] || tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sliders */}
              {(profile?.cleanliness_level != null || profile?.social_level != null) && (
                <div style={{ background: C.white, borderRadius: 16, padding: "14px", border: `1.5px solid ${C.border}`, marginBottom: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                  {profile.cleanliness_level != null && <SliderBar value={profile.cleanliness_level} label="Orden y limpieza" />}
                  {profile.social_level != null && <SliderBar value={profile.social_level} label="Nivel social" />}
                </div>
              )}

              {/* Interests */}
              {profile?.interests && profile.interests.length > 0 && (
                <div style={{ background: C.white, borderRadius: 16, padding: "14px", border: `1.5px solid ${C.border}`, marginBottom: 14 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 500, color: C.ink, marginBottom: 10 }}>Intereses</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {profile.interests.map(interest => (
                      <span key={interest} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 9999, background: C.muted, fontFamily: BODY, fontSize: 11, fontWeight: 600, color: C.coffee }}>
                        <Heart style={{ width: 10, height: 10 }} />
                        {INTEREST_LABELS[interest] || interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Email */}
              {tenant.tenant?.email && (
                <div style={{ background: C.white, borderRadius: 16, padding: "12px 14px", border: `1.5px solid ${C.border}`, marginBottom: 14 }}>
                  <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Contacto</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Mail style={{ width: 13, height: 13, color: C.coffee }} />
                    <span style={{ fontFamily: BODY, fontSize: 13, color: C.ink }}>{tenant.tenant.email}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Accept footer */}
        <div style={{ flexShrink: 0, padding: "12px 20px", background: C.white, borderTop: `1.5px solid ${C.border}` }}>
          <button onClick={onAccept} disabled={isAccepted || isAccepting} style={{
            width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
            background: isAccepted ? `${C.green}18` : C.green,
            color: isAccepted ? C.green : C.white,
            fontFamily: BODY, fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: isAccepted ? "default" : "pointer",
            transition: "all 0.15s",
          }}>
            {isAccepting
              ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${C.white}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              : <Check style={{ width: 16, height: 16 }} />}
            {isAccepted ? "Ya aceptado" : "Aceptar arrendatario"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function OwnerInterested() {
  const navigate = useRouter();
  const [interested, setInterested] = useState<InterestedTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [selectedTenant, setSelectedTenant] = useState<InterestedTenant | null>(null);

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) { navigate.push("/app"); return; }
    fetch(`/api/owner/interested?owner_id=${ownerId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setInterested)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleAccept = async (tenant: InterestedTenant) => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) return;
    setAccepting(tenant.like_id);
    try {
      const res = await fetch("/api/owner/like-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: ownerId, user_id: tenant.user_id, property_id: tenant.property.property_id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccepted(prev => new Set(prev).add(tenant.like_id));
        if (data.match_created) setTimeout(() => navigate.push("/owner/matches"), 800);
      }
    } catch { /* silent */ }
    finally { setAccepting(null); }
  };

  const formatDate = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    return `Hace ${diff} días`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.cream, overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "20px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, fontWeight: 600, letterSpacing: 0.4 }}>
            {isLoading ? "Cargando…" : `${interested.length} arrendatario${interested.length !== 1 ? "s" : ""} interesado${interested.length !== 1 ? "s" : ""}`}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 500, color: C.ink, letterSpacing: -1.2, lineHeight: 1, marginTop: 4 }}>
            Interesados
          </div>
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 80px" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.terra}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : interested.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users style={{ width: 32, height: 32, color: C.coffee, opacity: 0.4 }} />
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.8 }}>Sin interesados aún</div>
              <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, textAlign: "center", maxWidth: 260 }}>
                Cuando un arrendatario le dé like a tu propiedad, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {interested.map((tenant) => {
                const isAccepted = accepted.has(tenant.like_id);
                const isAccepting = accepting === tenant.like_id;
                return (
                  <div
                    key={tenant.like_id}
                    onClick={() => setSelectedTenant(tenant)}
                    style={{
                      background: C.white, borderRadius: 20, padding: "16px",
                      border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14,
                      opacity: isAccepted ? 0.65 : 1, transition: "opacity 0.2s",
                      boxShadow: "0 2px 8px rgba(130,85,77,0.06)", cursor: "pointer",
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 48, height: 48, borderRadius: 24, background: `${C.terra}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 500, color: C.terra }}>
                        {tenant.tenant?.name ? tenant.tenant.name.charAt(0).toUpperCase() : "?"}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tenant.tenant?.name || "Arrendatario anónimo"}
                      </div>
                      {tenant.tenant?.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Mail style={{ width: 11, height: 11, color: C.coffee, flexShrink: 0 }} />
                          <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tenant.tenant.email}</span>
                        </div>
                      )}
                      <div style={{ 
                        display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px", 
                        marginTop: 6, background: C.muted, borderRadius: 8, padding: "6px 10px" 
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                          <Building2 style={{ width: 11, height: 11, color: C.coffee, flexShrink: 0 }} />
                          <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 600, color: C.coffee, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tenant.property?.title}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                          <MapPin style={{ width: 11, height: 11, color: C.coffee, flexShrink: 0 }} />
                          <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tenant.property?.neighborhood}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.6, marginTop: 6 }}>{formatDate(tenant.liked_at)}</div>
                    </div>

                    {/* Accept button */}
                    <button
                      onClick={e => { e.stopPropagation(); handleAccept(tenant); }}
                      disabled={isAccepted || isAccepting}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
                        borderRadius: 9999, border: "none", flexShrink: 0, cursor: isAccepted ? "default" : "pointer",
                        background: isAccepted ? `${C.green}18` : C.green,
                        fontFamily: BODY, fontSize: 12, fontWeight: 700,
                        color: isAccepted ? C.green : C.white,
                        transition: "all 0.15s",
                      }}
                    >
                      {isAccepting
                        ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.white}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                        : <Check style={{ width: 14, height: 14 }} />}
                      <span className="hidden sm:inline">{isAccepted ? "Aceptado" : "Aceptar"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedTenant && (
          <TenantProfileSheet
            tenant={selectedTenant}
            onClose={() => setSelectedTenant(null)}
            onAccept={() => handleAccept(selectedTenant)}
            isAccepted={accepted.has(selectedTenant.like_id)}
            isAccepting={accepting === selectedTenant.like_id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
