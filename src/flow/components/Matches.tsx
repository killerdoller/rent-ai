"use client";
import { useState, useEffect } from "react";
import { MessageCircle, MapPin, Heart, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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

export function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useRouter();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const userId = localStorage.getItem("rentai_user_id");
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/matches?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
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
            {isLoading ? "Cargando..." : `${matches.length} ${matches.length === 1 ? "match encontrado" : "matches encontrados"}`}
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
            <h2 className="text-2xl font-semibold mb-2">No tienes matches aún</h2>
            <p className="text-muted-foreground">
              ¡Sigue explorando para encontrar tu match perfecto!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => navigate.push(`/app/chat/${match.id}`)}
              >
                <div className="relative h-64">
                  <img
                    src={match.properties?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                    alt={match.properties?.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {match.match_score && (
                    <div className="absolute top-4 right-4 bg-primary text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-semibold text-sm">{match.match_score}%</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{match.properties?.title}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{match.properties?.neighborhood}, {match.properties?.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Match {formatDate(match.created_at)} · {match.owners?.name}
                    </span>
                    <button className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
