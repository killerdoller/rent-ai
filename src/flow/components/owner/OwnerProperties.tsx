"use client";
import { useState, useEffect } from "react";
import { Building2, MapPin, DollarSign, Bed, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Property {
  property_id: string;
  title: string;
  monthly_rent: number;
  neighborhood: string;
  city: string;
  bedrooms: number;
  image_url: string;
  description: string;
  tags: string[];
  allows_students: boolean;
  created_at: string;
}

export function OwnerProperties() {
  const navigate = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) { navigate.push("/app"); return; }
    fetchProperties(ownerId);
  }, []);

  const fetchProperties = async (ownerId: string) => {
    try {
      const res = await fetch(`/api/owner/properties?owner_id=${ownerId}`);
      if (res.ok) setProperties(await res.json());
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border p-4 md:p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Mis propiedades</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? "Cargando..." : `${properties.length} propiedad${properties.length !== 1 ? "es" : ""}`}
            </p>
          </div>
          <button
            onClick={() => navigate.push("/owner/properties/new")}
            className="flex items-center gap-2 px-4 py-2 bg-[#D87D6F] text-white rounded-xl font-medium hover:bg-[#c46d5f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <Building2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No tienes propiedades</h2>
            <p className="text-muted-foreground mb-6">
              Publica tu primera propiedad para empezar a recibir interesados.
            </p>
            <button
              onClick={() => navigate.push("/owner/properties/new")}
              className="px-6 py-3 bg-[#D87D6F] text-white rounded-full font-medium hover:bg-[#c46d5f] transition-colors"
            >
              Publicar propiedad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((prop) => (
              <div key={prop.property_id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <img
                    src={prop.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                    alt={prop.title}
                    className="w-full h-full object-cover"
                  />
                  {prop.allows_students && (
                    <div className="absolute top-3 left-3 bg-[#63A694] text-white px-2 py-1 rounded-full text-xs font-medium">
                      Acepta estudiantes
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{prop.title}</h3>

                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{prop.neighborhood}, {prop.city}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-primary">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">${Number(prop.monthly_rent).toLocaleString()} COP/mes</span>
                    </div>
                    {prop.bedrooms && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Bed className="w-4 h-4" />
                        <span>{prop.bedrooms} hab.</span>
                      </div>
                    )}
                  </div>

                  {prop.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {prop.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
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
