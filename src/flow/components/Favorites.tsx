import { useState, useEffect } from "react";
import { Heart, MapPin, DollarSign, Bed, Trash2 } from "lucide-react";

interface FavoriteCard {
  id: number;
  type: "room" | "roommate";
  image: string;
  title?: string;
  name?: string;
  location: string;
  price?: number;
  bedrooms?: number;
  matchScore?: number;
}

export function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);

  useEffect(() => {
    const likedCards = JSON.parse(localStorage.getItem("likedCards") || "[]");
    setFavorites(likedCards);
  }, []);

  const removeFavorite = (id: number) => {
    const updated = favorites.filter((fav) => fav.id !== id);
    setFavorites(updated);
    localStorage.setItem("likedCards", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border p-4 md:p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Guardados</h1>
          <p className="text-muted-foreground mt-1">
            {favorites.length} {favorites.length === 1 ? "favorito guardado" : "favoritos guardados"}
          </p>
        </div>
      </header>

      {/* Favorites List */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {favorites.length === 0 ? (
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
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
              >
                <div className="relative h-48">
                  <img
                    src={favorite.image}
                    alt={favorite.title || favorite.name || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => removeFavorite(favorite.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-accent hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {favorite.type === "room" ? favorite.title : favorite.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{favorite.location}</span>
                  </div>

                  {favorite.price && (
                    <div className="flex items-center gap-1 text-primary mb-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-semibold">
                        ${favorite.price.toLocaleString()} COP/mes
                      </span>
                    </div>
                  )}

                  {favorite.bedrooms && (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Bed className="w-4 h-4" />
                      <span>{favorite.bedrooms} {favorite.bedrooms === 1 ? "habitación" : "habitaciones"}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}