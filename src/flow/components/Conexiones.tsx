"use client";
import { useState, useEffect } from "react";
import {
  MessageCircle, MapPin, Bed, Sparkles,
  Loader2, Heart, X, Tag
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-secondary animate-pulse" />,
});

interface Match {
  id: string;
  created_at: string;
  match_score: number | null;
  properties: {
    property_id: string;
    title: string;
    monthly_rent: number;
    neighborhood: string;
    city: string;
    image_url: string;
    description: string;
  };
  owners: {
    owner_id: string;
    name: string;
    email: string;
  };
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

  useEffect(() => {
    fetchAll();
  }, []);

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

      // Excluir de Guardados los que ya tienen match bilateral
      const matchedPropertyIds = new Set(matchesData.map((m) => m.properties?.property_id));
      setLikes(likesData.filter((l) => !matchedPropertyIds.has(l.property_id)));
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-5 pb-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">Conexiones</h1>

          {/* Tabs — full width 50/50 */}
          <div className="flex w-full">
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "matches"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Matches
              {matches.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "matches" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  {matches.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("guardados")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "guardados"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="w-4 h-4" />
              Guardados
              {likes.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "guardados" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  {likes.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "matches" ? (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {matches.length === 0 ? (
                  <EmptyState
                    icon={<Sparkles className="w-12 h-12 text-muted-foreground" />}
                    title="No tienes matches aún"
                    subtitle="Cuando un propietario acepte tu solicitud aparecerá aquí"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        onClick={() => navigate.push(`/app/chat/${match.id}`)}
                        className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                      >
                        <div className="relative h-52">
                          <img
                            src={match.properties?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                            alt={match.properties?.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          {match.match_score && (
                            <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="font-bold text-sm">{match.match_score}%</span>
                            </div>
                          )}
                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                            <div>
                              <p className="text-white font-semibold text-base leading-tight drop-shadow">
                                {match.properties?.title}
                              </p>
                              <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span>{match.properties?.neighborhood}, {match.properties?.city}</span>
                              </div>
                            </div>
                            <div className="bg-primary rounded-full p-2 shadow-lg flex-shrink-0">
                              <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {match.owners?.name} · {formatDate(match.created_at)}
                          </span>
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                            ¡Es un match!
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="guardados"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {likes.length === 0 ? (
                  <EmptyState
                    icon={<Heart className="w-12 h-12 text-muted-foreground" />}
                    title="No hay guardados aún"
                    subtitle="Dale like a los apartamentos que te interesen para guardarlos aquí"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {likes.map((fav) => {
                      const p = fav.properties;
                      return (
                        <div
                          key={fav.id}
                          onClick={() => setExpandedProperty(fav)}
                          className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <div className="relative h-44">
                            <img
                              src={p?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                              alt={p?.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            <div className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1.5">
                              <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-base mb-1 line-clamp-1">{p?.title}</h3>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{p?.neighborhood}, {p?.city}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              {p?.monthly_rent && (
                                <span className="text-primary font-bold text-sm">
                                  ${Number(p.monthly_rent).toLocaleString()} COP/mes
                                </span>
                              )}
                              {p?.bedrooms && (
                                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                  <Bed className="w-3.5 h-3.5" />
                                  <span>{p.bedrooms} hab.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Detail bottom sheet */}
      <AnimatePresence>
        {expandedProperty && (
          <PropertyDetailSheet
            property={expandedProperty}
            onClose={() => setExpandedProperty(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto">{subtitle}</p>
    </div>
  );
}

function PropertyDetailSheet({ property, onClose }: { property: LikedProperty; onClose: () => void }) {
  const p = property.properties;
  const hasMap = !!(p?.latitude && p?.longitude);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />

      {/* Centered modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full pointer-events-auto overflow-hidden relative"
          style={{ maxWidth: "95vw", height: "88vh" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          <div className="flex h-full">
            {/* ── Left column: map or image fallback ── */}
            {hasMap ? (
              <div className="w-2/5 flex-shrink-0 relative">
                <PropertyMap
                  lat={p.latitude!}
                  lng={p.longitude!}
                  title={p.title}
                />
                {p.address && (
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-3 py-2">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600 leading-tight line-clamp-2">{p.address}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-2/5 flex-shrink-0 relative">
                <img
                  src={p?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=800"}
                  alt={p?.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            )}

            {/* ── Right column: photo + scrollable info ── */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Hero photo */}
              <div className="relative h-52 flex-shrink-0">
                <img
                  src={p?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=800"}
                  alt={p?.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-3 left-3 right-8">
                  <h2 className="text-white font-bold text-base leading-tight drop-shadow">
                    {p?.title}
                  </h2>
                  <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">
                      {[p?.neighborhood, p?.city].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price + beds */}
              <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                {p?.monthly_rent && (
                  <span className="text-primary font-bold text-sm">
                    ${Number(p.monthly_rent).toLocaleString()} COP/mes
                  </span>
                )}
                {p?.bedrooms && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Bed className="w-3.5 h-3.5" />
                    <span>{p.bedrooms} {p.bedrooms === 1 ? "hab." : "habs."}</span>
                  </div>
                )}
              </div>

              {/* Scrollable description + tags */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {p?.description && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Descripción
                    </p>
                    <p className="text-xs leading-relaxed text-foreground">{p.description}</p>
                  </div>
                )}
                {p?.tags && p.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Características
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-1">
                  Guardado el{" "}
                  {new Date(property.created_at).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
