"use client";
import { useState, useEffect } from "react";
import { Users, MapPin, Check, Loader2, Building2, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

interface InterestedTenant {
  like_id: string;
  user_id: string;
  liked_at: string;
  tenant: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    user_mode: string;
  } | null;
  property: {
    property_id: string;
    title: string;
    image_url: string;
    neighborhood: string;
    city: string;
  };
}

export function OwnerInterested() {
  const navigate = useRouter();
  const [interested, setInterested] = useState<InterestedTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) { navigate.push("/app"); return; }
    fetchInterested(ownerId);
  }, []);

  const fetchInterested = async (ownerId: string) => {
    try {
      const res = await fetch(`/api/owner/interested?owner_id=${ownerId}`);
      if (res.ok) setInterested(await res.json());
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (tenant: InterestedTenant) => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) return;

    setAccepting(tenant.like_id);
    try {
      const res = await fetch("/api/owner/like-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: ownerId,
          user_id: tenant.user_id,
          property_id: tenant.property.property_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAccepted((prev) => new Set(prev).add(tenant.like_id));
        if (data.match_created) {
          // pequeña notificación visual — el match se creó
          setTimeout(() => navigate.push("/owner/matches"), 800);
        }
      }
    } catch {
      // silent
    } finally {
      setAccepting(null);
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
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Interesados</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Cargando..." : `${interested.length} arrendatario${interested.length !== 1 ? "s" : ""} interesado${interested.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : interested.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Sin interesados aún</h2>
            <p className="text-muted-foreground">
              Cuando un arrendatario le dé like a tu propiedad, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interested.map((tenant) => {
              const isAccepted = accepted.has(tenant.like_id);
              const isAccepting = accepting === tenant.like_id;
              return (
                <div
                  key={tenant.like_id}
                  className={`bg-white rounded-2xl p-5 shadow-lg flex items-start gap-4 transition-all ${
                    isAccepted ? "opacity-60" : ""
                  }`}
                >
                  {/* Avatar arrendatario */}
                  <div className="w-14 h-14 rounded-full bg-[#A8D1B1] flex items-center justify-center flex-shrink-0 text-xl font-bold text-white">
                    {tenant.tenant?.name ? tenant.tenant.name.charAt(0).toUpperCase() : "?"}
                  </div>

                  {/* Info arrendatario + propiedad */}
                  <div className="flex-1 min-w-0">
                    {/* Nombre */}
                    <p className="font-semibold text-[#0D0D0D] truncate">
                      {tenant.tenant?.name || "Arrendatario anónimo"}
                    </p>

                    {/* Email / teléfono */}
                    {tenant.tenant?.email && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{tenant.tenant.email}</span>
                      </div>
                    )}
                    {tenant.tenant?.phone && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{tenant.tenant.phone}</span>
                      </div>
                    )}

                    {/* Propiedad que le interesó */}
                    <div className="flex items-center gap-1 mt-2 bg-secondary/50 rounded-lg px-2 py-1">
                      <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{tenant.property?.title}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">·</span>
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{tenant.property?.neighborhood}</span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">{formatDate(tenant.liked_at)}</p>
                  </div>

                  {/* Acción */}
                  <button
                    onClick={() => handleAccept(tenant)}
                    disabled={isAccepted || isAccepting}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
                      isAccepted
                        ? "bg-green-100 text-green-700"
                        : "bg-[#63A694] text-white hover:bg-[#4e8a7c]"
                    }`}
                  >
                    {isAccepting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isAccepted ? (
                      <><Check className="w-4 h-4" /><span className="hidden sm:inline">Aceptado</span></>
                    ) : (
                      <><Check className="w-4 h-4" /><span className="hidden sm:inline">Aceptar</span></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
