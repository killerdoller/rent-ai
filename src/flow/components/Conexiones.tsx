"use client";
import { useState, useEffect } from "react";
import { MessageCircle, MapPin, Bed, Sparkles, Heart, X, Tag, Users } from "lucide-react";
import { ImageCarousel } from "./ImageCarousel";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { RoommateProfileSheet } from "./RoommateProfileSheet";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink:    "#0D0D0D",
  cream:  "#F7F2EC",
  muted:  "#EFE7DE",
  white:  "#FFFFFF",
  green:  "#63A694",
  coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
};

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%", background: C.muted }} />,
});

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
    city: string;
    bedrooms: number;
    image_url: string;
    images?: string[];
    description: string;
    tags: string[];
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

type Tab = "matches" | "guardados";

export function Conexiones({ defaultTab = "matches" }: { defaultTab?: Tab }) {
  const navigate = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [matches, setMatches] = useState<Match[]>([]);
  const [likes, setLikes] = useState<LikedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProperty, setExpandedProperty] = useState<LikedProperty | null>(null);
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
                        return (
                          <button key={fav.id} onClick={() => setExpandedProperty(fav)}
                            style={{ background: C.white, borderRadius: 20, overflow: "hidden", border: `1.5px solid ${C.border}`, cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(130,85,77,0.06)", transition: "box-shadow 0.12s" }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(130,85,77,0.12)")}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(130,85,77,0.06)")}>
                            <div style={{ position: "relative", height: 140 }}>
                              <img src={p?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                                alt={p?.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)" }} />
                            </div>
                            <div style={{ padding: "12px 14px" }}>
                              <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p?.title}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                                <MapPin style={{ width: 11, height: 11, color: C.coffee, flexShrink: 0 }} />
                                <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p?.neighborhood}, {p?.city}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                {p?.monthly_rent && (
                                  <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.green }}>${Number(p.monthly_rent).toLocaleString()} COP/mes</span>
                                )}
                                {p?.bedrooms && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                    <Bed style={{ width: 12, height: 12, color: C.coffee }} />
                                    <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee }}>{p.bedrooms} hab.</span>
                                  </div>
                                )}
                              </div>
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
        {expandedProperty && (
          <PropertyDetailSheet property={expandedProperty} onClose={() => setExpandedProperty(null)} />
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

function PropertyDetailSheet({ property, onClose }: { property: LikedProperty; onClose: () => void }) {
  const p = property.properties;
  const hasMap = !!(p?.latitude && p?.longitude);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/60 z-40" />

      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6 pointer-events-none"
      >
        <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-3xl pointer-events-auto overflow-hidden relative flex flex-col"
          style={{ height: "88vh" }}>
          <div className="md:hidden flex-shrink-0 flex justify-center pt-3 pb-1">
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: C.border }} />
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 z-10 rounded-full p-1.5 shadow"
            style={{ background: "rgba(255,255,255,0.92)" }}>
            <X style={{ width: 16, height: 16, color: C.coffee }} />
          </button>

          {/* Mobile */}
          <div className="flex flex-col flex-1 min-h-0 md:hidden">
            <div className="relative flex-shrink-0" style={{ height: 260 }}>
              <ImageCarousel
                images={p?.images && p.images.length > 0 ? p.images : (p?.image_url ? [p.image_url] : [])}
                height={260}
                style={{ position: "absolute", inset: 0 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-10 pointer-events-none" style={{ zIndex: 3 }}>
                <h2 className="text-white font-bold text-xl leading-tight drop-shadow">{p?.title}</h2>
                <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{[p?.neighborhood, p?.city].filter(Boolean).join(", ")}</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b" style={{ borderColor: C.border, background: C.cream }}>
              {p?.monthly_rent && <span style={{ fontFamily: BODY, fontSize: 15, fontWeight: 700, color: C.green }}>${Number(p.monthly_rent).toLocaleString()} COP/mes</span>}
              {p?.bedrooms && <div className="flex items-center gap-1" style={{ color: C.coffee }}><Bed className="w-3.5 h-3.5" /><span style={{ fontFamily: BODY, fontSize: 12 }}>{p.bedrooms} hab.</span></div>}
            </div>
            <div className="flex-1 overflow-y-auto">
              {hasMap && (
                <div className="relative flex-shrink-0" style={{ height: 180 }}>
                  <PropertyMap lat={p.latitude!} lng={p.longitude!} title={p.title} />
                  {p.address && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "rgba(255,255,255,0.92)" }}>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
                        <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee }} className="line-clamp-2">{p.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="px-4 py-4 space-y-4">
                {p?.description && (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Descripción</p>
                    <p style={{ fontFamily: BODY, fontSize: 14, lineHeight: 1.65, color: C.ink }}>{p.description}</p>
                  </div>
                )}
                {p?.tags && p.tags.length > 0 && (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag className="w-3 h-3" /> Características
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {p.tags.map((tag) => <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: C.cream, color: C.coffee }}>{tag}</span>)}
                    </div>
                  </div>
                )}
                <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.7 }}>
                  Guardado el {new Date(property.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex flex-1 min-h-0">
            {hasMap ? (
              <div className="w-2/5 flex-shrink-0 relative">
                <PropertyMap lat={p.latitude!} lng={p.longitude!} title={p.title} />
                {p.address && (
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "rgba(255,255,255,0.9)" }}>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
                      <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee }} className="line-clamp-2">{p.address}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-2/5 flex-shrink-0 relative overflow-hidden">
                <ImageCarousel
                  images={p?.images && p.images.length > 0 ? p.images : (p?.image_url ? [p.image_url] : [])}
                  style={{ position: "absolute", inset: 0, height: "100%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
            )}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="relative flex-shrink-0" style={{ height: 200 }}>
                <ImageCarousel
                  images={p?.images && p.images.length > 0 ? p.images : (p?.image_url ? [p.image_url] : [])}
                  height={200}
                  style={{ position: "absolute", inset: 0 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-8 pointer-events-none" style={{ zIndex: 3 }}>
                  <h2 className="text-white font-bold text-base leading-tight drop-shadow">{p?.title}</h2>
                  <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                    <MapPin className="w-3 h-3" /><span className="truncate">{[p?.neighborhood, p?.city].filter(Boolean).join(", ")}</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2.5 border-b" style={{ borderColor: C.border, background: C.cream }}>
                {p?.monthly_rent && <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.green }}>${Number(p.monthly_rent).toLocaleString()} COP/mes</span>}
                {p?.bedrooms && <div className="flex items-center gap-1" style={{ color: C.coffee }}><Bed className="w-3.5 h-3.5" /><span style={{ fontFamily: BODY, fontSize: 12 }}>{p.bedrooms} hab.</span></div>}
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {p?.description && (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Descripción</p>
                    <p style={{ fontFamily: BODY, fontSize: 13, lineHeight: 1.65, color: C.ink }}>{p.description}</p>
                  </div>
                )}
                {p?.tags && p.tags.length > 0 && (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag className="w-3 h-3" /> Características
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tags.map((tag) => <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: C.cream, color: C.coffee }}>{tag}</span>)}
                    </div>
                  </div>
                )}
                <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.7 }}>
                  Guardado el {new Date(property.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
