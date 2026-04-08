"use client";
import { useState, useEffect } from "react";
import { Heart, MapPin, MessageCircle, DollarSign, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface OwnerMatch {
  id: string;
  user_id: string;
  created_at: string;
  match_score: number | null;
  properties: {
    property_id: string;
    title: string;
    monthly_rent: number;
    neighborhood: string;
    city: string;
    image_url: string;
  };
}

export function OwnerMatches() {
  const navigate = useRouter();
  const [matches, setMatches] = useState<OwnerMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) { navigate.push("/app"); return; }
    fetchMatches(ownerId);
  }, []);

  const fetchMatches = async (ownerId: string) => {
    try {
      const res = await fetch(`/api/owner/matches?owner_id=${ownerId}`);
      if (res.ok) setMatches(await res.json());
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
      <header className="bg-white border-b border-border p-4 md:p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Matches</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Cargando..." : `${matches.length} match${matches.length !== 1 ? "es" : ""} confirmado${matches.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Sin matches aún</h2>
            <p className="text-muted-foreground">
              Acepta arrendatarios interesados para generar matches.
            </p>
            <button
              onClick={() => navigate.push("/owner/interested")}
              className="mt-4 px-6 py-2 bg-[#D87D6F] text-white rounded-full font-medium hover:bg-[#c46d5f] transition-colors"
            >
              Ver interesados
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48">
                  <img
                    src={match.properties?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                    alt={match.properties?.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#D87D6F] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Match {formatDate(match.created_at)}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2">{match.properties?.title}</h3>

                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{match.properties?.neighborhood}, {match.properties?.city}</span>
                  </div>

                  {match.properties?.monthly_rent && (
                    <div className="flex items-center gap-1 text-primary mb-4">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">
                        ${Number(match.properties.monthly_rent).toLocaleString()} COP/mes
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => navigate.push(`/owner/chat/${match.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#D87D6F] text-white rounded-xl font-medium hover:bg-[#c46d5f] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Iniciar conversación
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
