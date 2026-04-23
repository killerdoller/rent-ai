"use client";
import { useState, useEffect } from "react";
import { Heart, MapPin, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink: "#0D0D0D", cream: "#FFFFFF", muted: "#EFE7DE",
  white: "#FFFFFF", terra: "#D87D6F", coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
};

interface OwnerMatch {
  id: string; user_id: string; created_at: string; match_score: number | null;
  properties: { property_id: string; title: string; monthly_rent: number; neighborhood: string; city: string; image_url: string };
}

export function OwnerMatches() {
  const navigate = useRouter();
  const [matches, setMatches] = useState<OwnerMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) { navigate.push("/app"); return; }
    fetch(`/api/owner/matches?owner_id=${ownerId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setMatches)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    return `Hace ${diff} días`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.cream, overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "20px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, fontWeight: 600, letterSpacing: 0.4 }}>
            {isLoading ? "Cargando…" : `${matches.length} match${matches.length !== 1 ? "es" : ""} confirmado${matches.length !== 1 ? "s" : ""}`}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 500, color: C.ink, letterSpacing: -1.2, lineHeight: 1, marginTop: 4 }}>
            Matches
          </div>
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 80px" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.terra}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : matches.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart style={{ width: 32, height: 32, color: C.coffee, opacity: 0.4 }} />
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.8 }}>Sin matches aún</div>
              <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, textAlign: "center", maxWidth: 260 }}>
                Acepta arrendatarios interesados para generar matches.
              </p>
              <button onClick={() => navigate.push("/owner/interested")} style={{
                marginTop: 4, padding: "11px 24px", borderRadius: 9999, background: C.terra, border: "none",
                fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.white, cursor: "pointer",
              }}>
                Ver interesados
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {matches.map((match) => (
                <div key={match.id} style={{
                  background: C.white, borderRadius: 20, overflow: "hidden",
                  border: `1.5px solid ${C.border}`, boxShadow: "0 2px 8px rgba(130,85,77,0.06)",
                }}>
                  <div style={{ position: "relative", height: 160 }}>
                    <img src={match.properties?.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=400"}
                      alt={match.properties?.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }} />
                    <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", padding: "3px 10px", borderRadius: 9999 }}>
                      <span style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, color: C.terra }}>Match {formatDate(match.created_at)}</span>
                    </div>
                    <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
                      <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.properties?.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <MapPin style={{ width: 11, height: 11, color: "rgba(255,255,255,0.7)" }} />
                        <span style={{ fontFamily: BODY, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{match.properties?.neighborhood}, {match.properties?.city}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      {match.properties?.monthly_rent && (
                        <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.terra }}>${Number(match.properties.monthly_rent).toLocaleString()} COP/mes</span>
                      )}
                    </div>
                    <button onClick={() => navigate.push(`/owner/chat/${match.id}`)} style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "11px 0", borderRadius: 12, background: C.terra, border: "none",
                      fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.white, cursor: "pointer",
                    }}>
                      <MessageCircle style={{ width: 15, height: 15 }} /> Iniciar conversación
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
