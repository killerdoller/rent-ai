"use client";
import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { Heart, MapPin, Bed, Bath, Maximize2, Loader2 } from "lucide-react";
import { PropertyDetailSheet, type PropertyDetailCard } from "./PropertyDetailSheet";

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
    images?: string[] | null;
    description?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    property_type?: string | null;
    tags: string[];
    amenities_interior?: string[] | null;
    amenities_exterior?: string[] | null;
    amenities_sector?: string[] | null;
    utilities_included?: string[] | null;
    nearby_pois?: any;
  };
}

// Construye el shape que espera PropertyDetailSheet a partir del row de likes.
function toDetailCard(p: LikedProperty["properties"]): PropertyDetailCard {
  return {
    id: p.property_id,
    type: "room",
    image: p.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=1080",
    images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
    title: p.title,
    location: `${p.neighborhood || ""}, ${p.city}`.replace(/^, /, ""),
    price: p.monthly_rent ? Number(p.monthly_rent) : undefined,
    bedrooms: p.bedrooms ?? undefined,
    description: p.description || "",
    tags: p.tags || [],
    address: p.address ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
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

export function Favorites() {
  const [favorites, setFavorites] = useState<LikedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailCard, setDetailCard] = useState<PropertyDetailCard | null>(null);

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
    <div className="bg-background pb-20">
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
              if (!p) return null;
              const primaryAmenities =
                (p.amenities_interior && p.amenities_interior.length > 0)
                  ? p.amenities_interior
                  : (p.amenities_exterior && p.amenities_exterior.length > 0)
                    ? p.amenities_exterior
                    : (p.tags || []);
              return (
                <div
                  key={fav.id}
                  onClick={() => setDetailCard(toDetailCard(p))}
                  className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                  style={{ aspectRatio: "3 / 4", minHeight: 380 }}
                >
                  {/* Imagen full-bleed (mismo look que SwipeCard de Descubrir) */}
                  <img
                    src={p.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=1080"}
                    alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Gradient overlay para que el texto se lea sobre la foto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Badge de "Guardado" en la esquina superior derecha */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow"
                    style={{ background: "rgba(255,255,255,0.92)" }}>
                    <Heart className="w-3 h-3 fill-current" style={{ color: "#D87D6F" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#D87D6F" }}>
                      Guardado
                    </span>
                  </div>

                  {/* Información apilada en la parte inferior */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="text-white font-bold text-xl leading-tight mb-1">{p.title}</h2>

                    {(p.neighborhood || p.city) && (
                      <div className="flex items-center gap-1.5 text-white/80 text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {p.neighborhood ? `${p.neighborhood}, ` : ""}{p.city}
                        </span>
                      </div>
                    )}

                    {/* Price + property_type + bedrooms + bathrooms + área */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {p.monthly_rent && (
                        <span className="text-white font-bold text-base">
                          ${Number(p.monthly_rent).toLocaleString()} COP/mes
                        </span>
                      )}
                      {p.property_type && (
                        <span className="px-2 py-0.5 bg-black/40 text-white rounded text-xs">
                          {p.property_type}
                        </span>
                      )}
                      {p.bedrooms && (
                        <div className="flex items-center gap-1 text-white/70 text-sm">
                          <Bed className="w-3.5 h-3.5" />
                          <span>{p.bedrooms} {p.bedrooms === 1 ? "hab." : "habs."}</span>
                        </div>
                      )}
                      {p.bathrooms && (
                        <div className="flex items-center gap-1 text-white/70 text-sm">
                          <Bath className="w-3.5 h-3.5" />
                          <span>{p.bathrooms} {p.bathrooms === 1 ? "baño" : "baños"}</span>
                        </div>
                      )}
                      {p.area_sqm && (
                        <div className="flex items-center gap-1 text-white/70 text-sm">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{p.area_sqm} m²</span>
                        </div>
                      )}
                    </div>

                    {/* Chips de amenidades (interior > exterior > tags) */}
                    {primaryAmenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {primaryAmenities.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {detailCard && (
          <PropertyDetailSheet card={detailCard} onClose={() => setDetailCard(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
