import { useState } from "react";
import { MessageCircle, MapPin, Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

interface Match {
  id: number;
  type: "room" | "roommate";
  image: string;
  name: string;
  location: string;
  matchScore: number;
  matchedAt: string;
  hasNewMessage?: boolean;
}

const mockMatches: Match[] = [
  {
    id: 1,
    type: "room",
    image: "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400",
    name: "Apartamento Moderno en Chapinero",
    location: "Chapinero, Bogotá",
    matchScore: 95,
    matchedAt: "Hoy",
    hasNewMessage: true,
  },
  {
    id: 2,
    type: "roommate",
    image: "https://images.unsplash.com/photo-1645664747204-31fee58898dc?w=400",
    name: "María García",
    location: "Teusaquillo",
    matchScore: 88,
    matchedAt: "Ayer",
  },
  {
    id: 5,
    type: "room",
    image: "https://images.unsplash.com/photo-1593853814555-6951885ffa63?w=400",
    name: "Apartamento Compartido Luminoso",
    location: "Salitre",
    matchScore: 90,
    matchedAt: "Hace 2 días",
    hasNewMessage: true,
  },
];

export function Matches() {
  const [matches] = useState(mockMatches);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border p-4 md:p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Matches</h1>
          <p className="text-muted-foreground mt-1">
            {matches.length} {matches.length === 1 ? "match encontrado" : "matches encontrados"}
          </p>
        </div>
      </header>

      {/* Matches Grid */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {matches.length === 0 ? (
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
                onClick={() => navigate(`/chat/${match.id}`)}
              >
                <div className="relative h-64">
                  <img
                    src={match.image}
                    alt={match.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {match.hasNewMessage && (
                    <div className="absolute top-4 left-4 bg-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Nuevo mensaje
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-primary text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-semibold text-sm">{match.matchScore}%</span>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{match.name}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{match.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Match {match.matchedAt}
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