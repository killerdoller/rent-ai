"use client";
import { useState, useEffect } from "react";
import { Building2, Users, Heart, Plus, ArrowRight, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { supabase } from "../../../utils/supabaseClient";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink: "#0D0D0D",
  cream: "#F7F2EC",
  creAlt: "#EFE7DE",
  white: "#FFFFFF",
  green: "#63A694",
  greenL: "#A8D1B1",
  greenSoft: "#D4E8D8",
  terra: "#D87D6F",
  terraDeep: "#A85548",
  coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
  borderS: "rgba(130,85,77,0.28)",
};

export function OwnerDashboard() {
  const navigate = useRouter();
  const { signOut } = useClerk();
  const [stats, setStats] = useState({ properties: 0, interested: 0, matches: 0 });
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("owner_id");
    localStorage.removeItem("owner_email");
    navigate.push("/app");
  };

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    const email = localStorage.getItem("owner_email") || "";
    setOwnerEmail(email);
    setOwnerName(email.split("@")[0]);
    if (!ownerId) { navigate.push("/app"); return; }
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
      setStats({ properties: properties.length, interested: interested.length, matches: matches.length });
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  const statCards = [
    {
      label: "Propiedades", value: stats.properties, icon: Building2,
      bg: C.green, fg: C.white, path: "/owner/properties"
    },
    {
      label: "Interesados", value: stats.interested, icon: Users,
      bg: C.greenL, fg: C.ink, path: "/owner/interested"
    },
    {
      label: "Matches", value: stats.matches, icon: Heart,
      bg: C.terra, fg: C.white, path: "/owner/matches"
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: BODY }}>
      {/* Header */}
      <header style={{
        background: C.white, borderBottom: `1.5px solid ${C.border}`,
        padding: "20px 24px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{
              fontFamily: DISPLAY, fontSize: 34, fontWeight: 500, color: C.ink,
              letterSpacing: -1.2, lineHeight: 1, marginTop: 4
            }}>
              Dashboard
            </div>
          </div>
          <button onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 9999, background: "transparent",
              border: `1.5px solid ${C.border}`, cursor: "pointer",
              fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.coffee,
              transition: "all 0.12s", flexShrink: 0, marginTop: 4,
            }}>
            <LogOut style={{ width: 14, height: 14 }} />
            Salir
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 24px 80px" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: `3px solid ${C.terra}`, borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite"
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}
              className="grid-cols-1 sm:grid-cols-3">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button key={card.path} onClick={() => navigate.push(card.path)}
                    style={{
                      background: C.white, borderRadius: 20, padding: "22px 18px",
                      border: `1.5px solid ${C.border}`,
                      display: "flex", flexDirection: "column", gap: 0,
                      cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                      boxShadow: "0 2px 8px rgba(130,85,77,0.06)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(130,85,77,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(130,85,77,0.06)")}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: card.bg, display: "flex",
                      alignItems: "center", justifyContent: "center", marginBottom: 16,
                    }}>
                      <Icon style={{ width: 22, height: 22, color: card.fg }} />
                    </div>
                    <div style={{
                      fontFamily: DISPLAY, fontSize: 38, fontWeight: 500,
                      color: C.ink, letterSpacing: -1.5, lineHeight: 1
                    }}>
                      {card.value}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.coffee }}>
                        {card.label}
                      </span>
                      <ArrowRight style={{ width: 14, height: 14, color: C.coffee, opacity: 0.5 }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Alert — pending interested */}
            {stats.interested > 0 && (
              <div style={{
                background: C.greenSoft, borderRadius: 18, padding: "18px 20px",
                border: `1.5px solid ${C.greenL}`, marginBottom: 22,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <div>
                  <div style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink }}>
                    {stats.interested} arrendatario{stats.interested !== 1 ? "s" : ""} interesado{stats.interested !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, marginTop: 3 }}>
                    Revisa sus perfiles y acepta los que más te convenzan
                  </div>
                </div>
                <button onClick={() => navigate.push("/owner/interested")}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "9px 16px",
                    borderRadius: 9999, background: C.green, color: C.white,
                    border: "none", cursor: "pointer", fontFamily: BODY, fontSize: 13, fontWeight: 700,
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                  Ver <ArrowRight style={{ width: 13, height: 13 }} />
                </button>
              </div>
            )}

            {/* Add property CTA */}
            <button onClick={() => navigate.push("/owner/properties/new")}
              style={{
                width: "100%", padding: "18px 22px", borderRadius: 20,
                background: C.white, border: `1.5px dashed ${C.borderS}`,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.creAlt; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.white; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: C.terra, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Plus style={{ width: 20, height: 20, color: C.white }} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink }}>
                  Publicar propiedad
                </div>
                <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, marginTop: 2 }}>
                  Agrega un nuevo inmueble para que los arrendatarios lo encuentren
                </div>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
