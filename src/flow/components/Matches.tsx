"use client";
import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { MessageCircle, MapPin, Heart, Sparkles, Loader2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { RoommateProfileSheet } from "./RoommateProfileSheet";
import { PropertyDetailSheet, type PropertyDetailCard } from "./PropertyDetailSheet";

interface Match {
  id: string;
  created_at: string;
  match_score: number | null;
  type: "property" | "roommate";
  properties?: {
    property_id: string;
    title: string;
    monthly_rent: number;
    neighborhood: string;
    localidad?: string | null;
    city: string;
    bedrooms?: number;
    bathrooms?: number | null;
    area_sqm?: number | null;
    stratum?: number | null;
    floor_number?: number | null;
    building_floors?: number | null;
    image_url: string;
    images?: string[] | null;
    description?: string | null;
    tags?: string[] | null;
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
  owners?: { owner_id: string; name: string };
  other?: { id: string; name: string; image: string; detail: string };
}

function propertyMatchToCard(m: Match): PropertyDetailCard | null {
  const p = m.properties;
  if (!p) return null;
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
    matchScore: m.match_score ?? undefined,
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

export function Matches() {
  const [activeTab, setActiveTab] = useState<"matches" | "interested">("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [interested, setInterested] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likingBack, setLikingBack] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState<{ userId: string; profileData?: any; matchId?: string; interestedEntry?: any } | null>(null);
  const [propertyDetail, setPropertyDetail] = useState<PropertyDetailCard | null>(null);
  const navigate = useRouter();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const userId = localStorage.getItem("rentai_user_id");
    if (!userId) { setIsLoading(false); return; }
    try {
      const [mRes, iRes] = await Promise.all([
        fetch(`/api/matches?user_id=${userId}`),
        fetch(`/api/roommate/interested?user_id=${userId}`)
      ]);
      if (mRes.ok) setMatches(await mRes.json());
      if (iRes.ok) setInterested(await iRes.json());
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  const likeBack = async (targetUserId: string) => {
    const userId = localStorage.getItem("rentai_user_id");
    if (!userId) return;
    setLikingBack(prev => ({ ...prev, [targetUserId]: true }));
    try {
      const res = await fetch("/api/roommate-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, liked_user_id: targetUserId }),
      });
      if (res.ok) { setSheet(null); await fetchAll(); }
    } finally {
      setLikingBack(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const formatDate = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    return `Hace ${diff} días`;
  };

  const C = {
    ink:    "#0D0D0D",
    cream: "#FFFFFF",
    white:  "#FFFFFF",
    green:  "#63A694",
    coffee: "#82554D",
    border: "rgba(130,85,77,0.14)",
    terra:  "#D87D6F",
  };

  return (
    <div className="bg-background pb-20">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
          <h1 className="text-2xl font-bold text-foreground">Conexiones</h1>
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => setActiveTab("matches")}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === "matches" ? "border-green text-green" : "border-transparent text-muted-foreground"}`}
            >
              Matches ({matches.length})
            </button>
            <button
              onClick={() => setActiveTab("interested")}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === "interested" ? "border-green text-green" : "border-transparent text-muted-foreground"}`}
            >
              Les gustas ({interested.length})
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeTab === "matches" ? (
          matches.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">No hay matches todavía</h2>
              <p className="text-muted-foreground">¡Sigue explorando!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => {
                    if (m.type === "roommate" && m.other?.id) {
                      setSheet({ userId: m.other.id, matchId: m.id });
                    } else {
                      navigate.push(`/app/chat/${m.id}`);
                    }
                  }}
                >
                  <div className="relative h-48">
                    <img
                      src={m.type === "property" ? m.properties?.image_url : m.other?.image}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {m.match_score && (
                      <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-green" />
                        <span className="font-bold text-xs text-green">{m.match_score}%</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${m.type === "property" ? "bg-green text-white" : "bg-terra text-white"}`}>
                        {m.type === "property" ? "Apartamento" : "Roomie"}
                      </span>
                    </div>
                    {m.type === "property" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const card = propertyMatchToCard(m);
                          if (card) setPropertyDetail(card);
                        }}
                        title="Ver detalle"
                        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 text-coffee" />
                      </button>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-base truncate">
                      {m.type === "property" ? m.properties?.title : m.other?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {m.type === "property"
                        ? `${m.properties?.neighborhood}, ${m.properties?.city}`
                        : m.other?.detail}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Conectado {formatDate(m.created_at)}
                      </span>
                      <MessageCircle className="w-5 h-5 text-green" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          interested.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">Todavía nadie por aquí</h2>
              <p className="text-muted-foreground">Tu perfil pronto llamará la atención.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {interested.map((i) => (
                <div
                  key={i.like_id}
                  className="bg-white p-3 rounded-2xl border border-border flex items-center gap-4 cursor-pointer hover:border-terra transition-colors"
                  onClick={() => setSheet({ userId: i.user_id, profileData: i.profile, interestedEntry: i })}
                >
                  <img
                    src={i.profile.profile_images?.[0] || i.profile.avatar_url || "/profile.jpg"}
                    className="w-14 h-14 rounded-full object-cover border-2 border-terra"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{i.profile.first_name} {i.profile.last_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{i.profile.university_name || i.profile.job_title || "Busca roomie"}</p>
                    <p className="text-[10px] text-terra font-bold mt-1 uppercase">Te dio like {formatDate(i.liked_at)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-terra/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-terra fill-terra" />
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Profile sheet */}
      {sheet && (
        <RoommateProfileSheet
          userId={sheet.userId}
          profileData={sheet.profileData}
          onClose={() => setSheet(null)}
          onChat={sheet.matchId ? () => { setSheet(null); navigate.push(`/app/chat/${sheet.matchId}`); } : undefined}
          onLikeBack={sheet.interestedEntry ? () => likeBack(sheet.userId) : undefined}
          isLiking={likingBack[sheet.userId]}
        />
      )}

      {/* Property detail sheet — para que el inquilino vea las cosas del POI/mapa de su match */}
      <AnimatePresence>
        {propertyDetail && (
          <PropertyDetailSheet card={propertyDetail} onClose={() => setPropertyDetail(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
