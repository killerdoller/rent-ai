"use client";
import { useState, useEffect } from "react";
import { MessageCircle, MapPin, Bed, Bath, Maximize2, Sparkles, Heart, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RoommateProfileSheet } from "./RoommateProfileSheet";
import { PropertyDetailSheet, type PropertyDetailCard } from "./PropertyDetailSheet";

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

interface Match {
  id: string;
  created_at: string;
  match_score: number | null;
  type?: "property" | "roommate";
  properties?: {
    property_id: string;
    title: string;
    monthly_rent: number;
    neighborhood: string;
    city: string;
    image_url: string;
    description: string;
  };
  owners?: { owner_id: string; name: string; email: string };
  other?: { id: string; name: string; image: string; detail: string };
}

interface LikedProperty {
  id: string;
  property_id: string;
  created_at: string;
  properties: {
    property_id: string;
    title: string;
    monthly_rent: number;
    neighborhood: string;
    localidad?: string | null;
    city: string;
    bedrooms: number;
    bathrooms?: number | null;
    area_sqm?: number | null;
    stratum?: number | null;
    floor_number?: number | null;
    building_floors?: number | null;
    image_url: string;
    images?: string[];
    description: string;
    tags: string[];
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    property_type?: string | null;
    amenities_interior?: string[] | null;
    amenities_exterior?: string[] | null;
    amenities_sector?: string[] | null;
    utilities_included?: string[] | null;
    nearby_pois?: any;
  };
}

// Convierte una propiedad guardada al shape que espera el PropertyDetailSheet
// compartido (mismo que usa Descubrir).
function likedToDetailCard(p: LikedProperty["properties"]): PropertyDetailCard {
  return {
    id: p.property_id,
    type: "room",
    image: p.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=1080",
    images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
    title: p.title,
    location: `${p.neighborhood || ""}, ${p.city}`.replace(/^, /, ""),
    price: p.monthly_rent ? Number(p.monthly_rent) : undefined,
    bedrooms: p.bedrooms,
    description: p.description || "",
    tags: p.tags || [],
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    property_type: p.property_type ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    area_sqm: p.area_sqm ?? undefined,
    stratum: p.stratum ?? undefined,
    floor_number: p.floor_number ?? undefined,
    building_floors: p.building_floors ?? undefined,
    amenities_interior: p.amenities_interior ?? [],
    amenities_exterior: p.amenities_exterior ?? [],
    amenities_sector: p.amenities_sector ?? [],
    utilities_included: p.utilities_included ?? [],
    nearby_pois: p.nearby_pois ?? null,
  };
}

type Tab = "matches" | "guardados";

export function Conexiones({ defaultTab = "matches" }: { defaultTab?: Tab }) {
  const navigate = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [matches, setMatches] = useState<Match[]>([]);
  const [likes, setLikes] = useState<LikedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailCard, setDetailCard] = useState<PropertyDetailCard | null>(null);
  const [roommieSheet, setRoommieSheet] = useState<{ userId: string; matchId: string } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const userId = localStorage.getItem("rentai_user_id");
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [matchesRes, likesRes] = await Promise.all([
        fetch(`/api/matches?user_id=${userId}`),
        fetch(`/api/likes?user_id=${userId}`),
      ]);
      const matchesData: Match[] = matchesRes.ok ? await matchesRes.json() : [];
      const likesData: LikedProperty[] = likesRes.ok ? await likesRes.json() : [];
      setMatches(matchesData);
      const matchedIds = new Set(matchesData.filter(m => m.type !== "roommate").map((m) => m.properties?.property_id));
      setLikes(likesData.filter((l) => !matchedIds.has(l.property_id)));
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  const formatDate = (dateStr: string) => {
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.cream, overflow: "hidden" }}>
      {/* Header */}
      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "20px 20px 0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, fontWeight: 600, letterSpacing: 0.4 }}>
            Tus conexiones
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 500, color: C.ink, letterSpacing: -1.2, lineHeight: 1, marginTop: 4, marginBottom: 16 }}>
            Conexiones
          </div>
          {/* Tabs */}
          <div style={{ display: "flex" }}>
            {([
              ["matches", Sparkles, "Matches", matches.length],
              ["guardados", Heart, "Guardados", likes.length],
            ] as const).map(([tab, Icon, label, count]) => (
              <button key={tab} onClick={() => setActiveTab(tab as Tab)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", background: "none", border: "none", cursor: "pointer",
                  fontFamily: BODY, fontSize: 13, fontWeight: 600,
                  color: activeTab === tab ? C.green : C.coffee,
                  borderBottom: `2px solid ${activeTab === tab ? C.green : "transparent"}`,
                  transition: "all 0.12s",
                }}>
                <Icon style={{ width: 14, height: 14 }} />
                {label}
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 9999,
                    background: activeTab === tab ? C.green : C.muted,
                    color: activeTab === tab ? C.white : C.coffee,
                  }}>{count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.green}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "matches" ? (
                <motion.div key="matches" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  {matches.length === 0 ? (
                    <EmptyState icon={<Sparkles style={{ width: 32, height: 32, color: C.coffee, opacity: 0.4 }} />}
                      title="No tienes matches aún"
                      subtitle="Cuando un propietario acepte tu solicitud aparecerá aquí" />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                      {matches.map((match) => {
                        const isRoomie = match.type === "roommate";
                        const img   = isRoomie ? match.other?.image : match.properties?.image_url;
                        const title = isRoomie ? match.other?.name  : match.properties?.title;
                        const sub   = isRoomie ? match.other?.detail : [match.properties?.neighborhood, match.properties?.city].filter(Boolean).join(", ");
                        const foot  = isRoomie ? match.other?.name  : match.owners?.name;
                        return (
                          <button key={match.id}
                            onClick={() => isRoomie && match.other?.id
                              ? setRoommieSheet({ userId: match.other.id, matchId: match.id })
                              : navigate.push(`/app/chat/${match.id}`)}
                            style={{ background: C.white, borderRadius: 20, overflow: "hidden", border: `1.5px solid ${C.border}`, cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(130,85,77,0.06)", transition: "box-shadow 0.12s" }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(130,85,77,0.12)")}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(130,85,77,0.06)")}>
                            <div style={{ position: "relative", height: 160 }}>
                              <img src={img || (isRoomie ? "/profile.jpg" : "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400")}
                                alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: isRoomie ? "center top" : "center" }} />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />
                              {match.match_score && (
                                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.92)", borderRadius: 9999, padding: "3px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                                  <Sparkles style={{ width: 11, height: 11, color: C.green }} />
                                  <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.green }}>{match.match_score}%</span>
                                </div>
                              )}
                              {/* Type badge */}
                              <div style={{ position: "absolute", top: 10, left: 10, background: isRoomie ? "rgba(216,125,111,0.92)" : "rgba(99,166,148,0.92)", borderRadius: 9999, padding: "2px 8px" }}>
                                <span style={{ fontFamily: BODY, fontSize: 9, fontWeight: 700, color: C.white, textTransform: "uppercase", letterSpacing: 0.6 }}>
                                  {isRoomie ? "Roomie" : "Apto"}
                                </span>
                              </div>
                              <div style={{ position: "absolute", bottom: 10, left: 12, right: 40 }}>
                                <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.white }}>{title}</div>
                                {sub && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                    {isRoomie
                                      ? <Users style={{ width: 11, height: 11, color: "rgba(255,255,255,0.7)", flexShrink: 0 }} />
                                      : <MapPin style={{ width: 11, height: 11, color: "rgba(255,255,255,0.7)", flexShrink: 0 }} />}
                                    <span style={{ fontFamily: BODY, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{sub}</span>
                                  </div>
                                )}
                              </div>
                              <div style={{ position: "absolute", bottom: 10, right: 10, width: 30, height: 30, borderRadius: 15, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MessageCircle style={{ width: 15, height: 15, color: C.white }} />
                              </div>
                            </div>
                            <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee }}>{foot} · {formatDate(match.created_at)}</span>
                              <span style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.green, background: `${C.green}18`, padding: "3px 8px", borderRadius: 9999 }}>¡Match!</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="guardados" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  {likes.length === 0 ? (
                    <EmptyState icon={<Heart style={{ width: 32, height: 32, color: C.coffee, opacity: 0.4 }} />}
                      title="No hay guardados aún"
                      subtitle="Dale like a los apartamentos que te interesen para guardarlos aquí" />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                      {likes.map((fav) => {
                        const p = fav.properties;
                        if (!p) return null;
                        const primaryAmenities =
                          (p.amenities_interior && p.amenities_interior.length > 0)
                            ? p.amenities_interior
                            : (p.amenities_exterior && p.amenities_exterior.length > 0)
                              ? p.amenities_exterior
                              : (p.tags || []);
                        return (
                          <button key={fav.id}
                            onClick={() => setDetailCard(likedToDetailCard(p))}
                            className="group"
                            style={{
                              position: "relative",
                              borderRadius: 20,
                              overflow: "hidden",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              textAlign: "left",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                              aspectRatio: "3 / 4",
                              minHeight: 380,
                              background: "#0D0D0D",
                            }}>
                            {/* Imagen full-bleed (mismo look que SwipeCard de Descubrir) */}
                            <img
                              src={p.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=1080"}
                              alt={p.title}
                              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {/* Gradient overlay para legibilidad */}
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.2) 50%, transparent)" }} />

                            {/* Badge "Guardado" top-right */}
                            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, background: "rgba(255,255,255,0.92)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                              <Heart style={{ width: 12, height: 12, color: "#D87D6F", fill: "#D87D6F" }} />
                              <span style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: "#D87D6F", textTransform: "uppercase", letterSpacing: 0.5 }}>Guardado</span>
                            </div>

                            {/* Información apilada en la parte inferior */}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 18 }}>
                              <div style={{ fontFamily: BODY, fontSize: 18, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2, marginBottom: 4 }}>{p.title}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                                <MapPin style={{ width: 13, height: 13, color: "rgba(255,255,255,0.8)", flexShrink: 0 }} />
                                <span style={{ fontFamily: BODY, fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {p.neighborhood ? `${p.neighborhood}, ` : ""}{p.city}
                                </span>
                              </div>
                              {/* Price + property_type + bedrooms + bathrooms + área */}
                              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                {p.monthly_rent && (
                                  <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>
                                    ${Number(p.monthly_rent).toLocaleString()} COP/mes
                                  </span>
                                )}
                                {p.property_type && (
                                  <span style={{ padding: "2px 8px", background: "rgba(0,0,0,0.4)", color: "#FFFFFF", borderRadius: 6, fontFamily: BODY, fontSize: 11 }}>
                                    {p.property_type}
                                  </span>
                                )}
                                {p.bedrooms && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 3, color: "rgba(255,255,255,0.85)" }}>
                                    <Bed style={{ width: 12, height: 12 }} />
                                    <span style={{ fontFamily: BODY, fontSize: 11 }}>{p.bedrooms} {p.bedrooms === 1 ? "hab." : "habs."}</span>
                                  </div>
                                )}
                                {p.bathrooms && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 3, color: "rgba(255,255,255,0.85)" }}>
                                    <Bath style={{ width: 12, height: 12 }} />
                                    <span style={{ fontFamily: BODY, fontSize: 11 }}>{p.bathrooms} {p.bathrooms === 1 ? "baño" : "baños"}</span>
                                  </div>
                                )}
                                {p.area_sqm && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 3, color: "rgba(255,255,255,0.85)" }}>
                                    <Maximize2 style={{ width: 12, height: 12 }} />
                                    <span style={{ fontFamily: BODY, fontSize: 11 }}>{p.area_sqm} m²</span>
                                  </div>
                                )}
                              </div>
                              {/* Chips de amenidades */}
                              {primaryAmenities.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {primaryAmenities.slice(0, 3).map((tag) => (
                                    <span key={tag} style={{ padding: "4px 10px", borderRadius: 9999, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", fontFamily: BODY, fontSize: 11, fontWeight: 500, color: "#FFFFFF" }}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {detailCard && (
          <PropertyDetailSheet card={detailCard} onClose={() => setDetailCard(null)} />
        )}
      </AnimatePresence>

      {roommieSheet && (
        <RoommateProfileSheet
          userId={roommieSheet.userId}
          onClose={() => setRoommieSheet(null)}
          onChat={() => { setRoommieSheet(null); navigate.push(`/app/chat/${roommieSheet.matchId}`); }}
        />
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12 }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.8 }}>{title}</div>
      <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, textAlign: "center", maxWidth: 260 }}>{subtitle}</p>
    </div>
  );
}

