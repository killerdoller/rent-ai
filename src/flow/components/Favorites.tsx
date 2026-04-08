"use client";
import { useState, useEffect } from "react";
import { Heart, MapPin, DollarSign, Bed, Loader2 } from "lucide-react";

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
    tags: string[];
  };
}

export function Favorites() {
  const [favorites, setFavorites] = useState<LikedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const userId = localStorage.getItem("rentai_user_id");
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/likes?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border p-4 md:p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Guardados</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Cargando..." : `${favorites.length} ${favorites.length === 1 ? "favorito guardado" : "favoritos guardados"}`}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No hay favoritos guardados</h2>
            <p className="text-muted-foreground">
              Dale like a las opciones que te gusten para guardarlas aquí
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => {
              const p = fav.properties;
              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
                >
                  <div className="relative h-48">
                    <img
                      src={p?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                      alt={p?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{p?.title}</h3>

                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{p?.neighborhood}, {p?.city}</span>
                    </div>

                    {p?.monthly_rent && (
                      <div className="flex items-center gap-1 text-primary mb-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-semibold">
                          ${Number(p.monthly_rent).toLocaleString()} COP/mes
                        </span>
                      </div>
                    )}

                    {p?.bedrooms && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Bed className="w-4 h-4" />
                        <span>{p.bedrooms} {p.bedrooms === 1 ? "habitación" : "habitaciones"}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
