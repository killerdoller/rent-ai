"use client";
import { useState, useEffect } from "react";
import { Building2, Users, Heart, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function OwnerDashboard() {
  const navigate = useRouter();
  const [stats, setStats] = useState({ properties: 0, interested: 0, matches: 0 });
  const [ownerEmail, setOwnerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    const email = localStorage.getItem("owner_email") || "";
    setOwnerEmail(email);

    if (!ownerId) {
      navigate.push("/app");
      return;
    }
    fetchStats(ownerId);
  }, []);

  const fetchStats = async (ownerId: string) => {
    try {
      const [propertiesRes, interestedRes, matchesRes] = await Promise.all([
        fetch(`/api/owner/properties?owner_id=${ownerId}`),
        fetch(`/api/owner/interested?owner_id=${ownerId}`),
        fetch(`/api/owner/matches?owner_id=${ownerId}`),
      ]);

      const [properties, interested, matches] = await Promise.all([
        propertiesRes.ok ? propertiesRes.json() : [],
        interestedRes.ok ? interestedRes.json() : [],
        matchesRes.ok ? matchesRes.json() : [],
      ]);

      setStats({
        properties: properties.length,
        interested: interested.length,
        matches: matches.length,
      });
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const cards = [
    {
      label: "Mis propiedades",
      value: stats.properties,
      icon: Building2,
      color: "bg-[#63A694]",
      path: "/owner/properties",
    },
    {
      label: "Interesados",
      value: stats.interested,
      icon: Users,
      color: "bg-[#A8D1B1]",
      path: "/owner/interested",
    },
    {
      label: "Matches",
      value: stats.matches,
      icon: Heart,
      color: "bg-[#D87D6F]",
      path: "/owner/matches",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Dashboard</h1>
          {ownerEmail && (
            <p className="text-muted-foreground mt-1">{ownerEmail}</p>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.path}
                    onClick={() => navigate.push(card.path)}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left group"
                  >
                    <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{card.value}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-between">
                      {card.label}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>

            {stats.interested > 0 && (
              <div className="bg-[#A8D1B1]/30 border border-[#A8D1B1] rounded-2xl p-5">
                <p className="font-medium text-[#0D0D0D]">
                  Tienes <span className="font-bold">{stats.interested}</span> arrendatario{stats.interested !== 1 ? "s" : ""} interesado{stats.interested !== 1 ? "s" : ""} en tus propiedades.
                </p>
                <button
                  onClick={() => navigate.push("/owner/interested")}
                  className="mt-3 text-sm font-semibold text-[#63A694] hover:underline flex items-center gap-1"
                >
                  Ver interesados <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
