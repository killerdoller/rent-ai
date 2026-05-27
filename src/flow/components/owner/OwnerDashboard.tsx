"use client";
import { useState, useEffect } from "react";
import { Building2, Users, Heart, Plus, ArrowRight, LogOut, TrendingUp, BarChart3, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient";
import { useIsMobile } from "../ui/use-mobile";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink: "#0D0D0D",
  cream: "#FFFFFF",
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
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({ properties: 0, interested: 0, matches: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [marketLevel, setMarketLevel] = useState<"neighborhood" | "city">("neighborhood");
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    fetchData(ownerId);
  }, []);

  const fetchData = async (ownerId: string, propertyId?: string) => {
    if (!propertyId) setIsLoading(true);
    else setIsSyncing(true);

    try {
      const queryParams = `?owner_id=${ownerId}${propertyId ? `&property_id=${propertyId}` : ""}`;
      const analyticsParams = `?ownerId=${ownerId}${propertyId ? `&propertyId=${propertyId}` : ""}`;

      const [propertiesRes, interestedRes, matchesRes, analyticsRes] = await Promise.all([
        fetch(`/api/owner/properties?owner_id=${ownerId}`),
        fetch(`/api/owner/interested${queryParams}`),
        fetch(`/api/owner/matches${queryParams}`),
        fetch(`/api/owner/analytics${analyticsParams}`),
      ]);
      
      const [propsData, interested, matches, analyticsData] = await Promise.all([
        propertiesRes.ok ? propertiesRes.json() : [],
        interestedRes.ok ? interestedRes.json() : [],
        matchesRes.ok ? matchesRes.json() : [],
        analyticsRes.ok ? analyticsRes.json() : null,
      ]);
      
      setProperties(propsData);
      if (!selectedPropertyId && propsData.length > 0 && !propertyId) {
        setSelectedPropertyId(propsData[0].property_id);
      }

      setStats({ 
        properties: propsData.length, 
        interested: interested.length, 
        matches: matches.length 
      });
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const ownerId = localStorage.getItem("owner_id");
    if (ownerId && selectedPropertyId) {
      fetchData(ownerId, selectedPropertyId);
    }
  }, [selectedPropertyId]);

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
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.cream, fontFamily: BODY, overflow: "hidden" }}>
      {/* Header */}
      <header style={{
        background: C.white, borderBottom: `1.5px solid ${C.border}`,
        padding: isMobile ? "16px 16px" : "20px 24px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, minWidth: 0, flex: isMobile ? "1 1 auto" : "0 1 auto" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: DISPLAY, fontSize: isMobile ? 26 : 34, fontWeight: 500, color: C.ink,
                letterSpacing: -1.2, lineHeight: 1, marginTop: 4
              }}>
                Panel de Control
              </div>
              <div style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, marginTop: 6, opacity: 0.7 }}>
                Bienvenido de nuevo, {ownerName}
              </div>
            </div>

            {/* Property Selector */}
            {properties.length > 1 && (
              <div style={{ marginLeft: isMobile ? 0 : 20, display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: isMobile ? "1 1 100%" : "0 1 auto" }}>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  style={{
                    padding: "8px 12px", borderRadius: 12, border: `1.5px solid ${C.border}`,
                    background: C.creAlt, color: C.ink, fontFamily: BODY, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", outline: "none",
                    maxWidth: "100%", flex: isMobile ? 1 : "0 1 auto",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden",
                  }}
                >
                  {properties.map(p => (
                    <option key={p.property_id} value={p.property_id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                {isSyncing && (
                   <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: `2px solid ${C.terra}`, borderTopColor: "transparent",
                    animation: "spin 0.7s linear infinite"
                  }} />
                )}
              </div>
            )}
          </div>
          
          <button onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 9999, background: "transparent",
              border: `1.5px solid ${C.border}`, cursor: "pointer",
              fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.coffee,
              transition: "all 0.12s", flexShrink: 0,
            }}>
            <LogOut style={{ width: 14, height: 14 }} />
            Salir
          </button>
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "20px 16px 80px" : "28px 24px 80px" }}>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button key={card.path} onClick={() => navigate.push(card.path)}
                      style={{
                        background: C.white, borderRadius: 24, padding: "24px 20px",
                        border: `1.5px solid ${C.border}`,
                        display: "flex", flexDirection: "column", gap: 0,
                        cursor: "pointer", textAlign: "left", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 8px rgba(130,85,77,0.06)",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(130,85,77,0.12)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(130,85,77,0.06)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: card.bg, display: "flex",
                        alignItems: "center", justifyContent: "center", marginBottom: 18,
                      }}>
                        <Icon style={{ width: 24, height: 24, color: card.fg }} />
                      </div>
                      <div style={{
                        fontFamily: DISPLAY, fontSize: 42, fontWeight: 500,
                        color: C.ink, letterSpacing: -1.5, lineHeight: 1
                      }}>
                        {card.value}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.coffee }}>
                          {card.label}
                        </span>
                        <ArrowRight style={{ width: 14, height: 14, color: C.coffee, opacity: 0.5 }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Analytics Section */}
              {analytics && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ 
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
                    fontFamily: DISPLAY, fontSize: 20, color: C.ink, fontWeight: 500 
                  }}>
                    <TrendingUp style={{ width: 20, height: 20, color: C.terra }} />
                    Estadísticas de Rendimiento
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Radar Chart: Psicográfico */}
                    <div style={{ 
                      background: C.white, borderRadius: 24, padding: isMobile ? "18px" : "28px",
                      border: `1.5px solid ${C.border}`,
                      boxShadow: "0 2px 8px rgba(130,85,77,0.04)",
                      minHeight: "350px",
                      minWidth: 0, // Fix for recharts container
                    }}>
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink }}>
                          <Target style={{ width: 16, height: 16, color: C.green }} />
                          Perfil del Interesado
                        </div>
                        <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, marginTop: 4 }}>
                          Promedio conductal de quienes buscan tu inmueble
                        </div>
                      </div>
                      
                      <div style={{ width: '100%', height: 250, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.radar}>
                            <PolarGrid stroke={C.border} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: C.coffee, fontSize: 11, fontWeight: 600 }} />
                            <Radar
                              name="Promedio"
                              dataKey="A"
                              stroke={C.green}
                              fill={C.green}
                              fillOpacity={0.5}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Funnel: Conversión */}
                    <div style={{ 
                      background: C.white, borderRadius: 24, padding: isMobile ? "18px" : "28px",
                      border: `1.5px solid ${C.border}`,
                      boxShadow: "0 2px 8px rgba(130,85,77,0.04)",
                      minHeight: "350px",
                      minWidth: 0, // Fix for recharts container
                    }}>
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink }}>
                          <BarChart3 style={{ width: 16, height: 16, color: C.terra }} />
                          Embudo de Conversión
                        </div>
                        <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, marginTop: 4 }}>
                          Flujo de usuarios desde la vista hasta el match
                        </div>
                      </div>

                      <div style={{ width: '100%', height: 250, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={analytics.funnel} margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              axisLine={false} 
                              tickLine={false}
                              tick={{ fill: C.coffee, fontSize: 12, fontWeight: 600 }}
                              width={80}
                            />
                            <Tooltip 
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                              {analytics.funnel.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? C.greenL : index === 1 ? C.green : C.terra} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Market Price Indicator */}
                    <div className="lg:col-span-2" style={{ 
                      background: `linear-gradient(135deg, ${C.white} 0%, ${C.creAlt} 100%)`, 
                      borderRadius: 24, padding: isMobile ? "18px" : "28px",
                      border: `1.5px solid ${C.border}`,
                    }}>
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
                        <div>
                          <div style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink }}>
                            Análisis de Mercado
                          </div>
                          <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, marginTop: 4, maxWidth: 400 }}>
                            Comparativa de precios basada en {analytics.market[marketLevel].count} inmuebles similares.
                          </div>
                        </div>

                        {/* Level Selector (Pills) */}
                        <div style={{ 
                          display: "flex", background: C.creAlt, padding: 4, borderRadius: 12,
                          border: `1px solid ${C.border}`
                        }}>
                          {(["neighborhood", "city"] as const).map((level) => (
                            <button
                              key={level}
                              onClick={() => setMarketLevel(level)}
                              style={{
                                padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                                border: "none", cursor: "pointer", transition: "all 0.2s",
                                background: marketLevel === level ? C.white : "transparent",
                                color: marketLevel === level ? C.ink : C.coffee,
                                boxShadow: marketLevel === level ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                              }}
                            >
                              {level === "neighborhood" ? "Mi Barrio" : "Mi Ciudad"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-end", justifyContent: "space-between", gap: 20 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: BODY, fontSize: 13, color: C.ink, lineHeight: 1.5,
                            background: C.white, padding: "12px 16px", borderRadius: 16,
                            border: `1px solid ${C.border}`
                          }}>
                            Tu precio está <strong>
                              {analytics.market.yourPrice > analytics.market[marketLevel].avg ? "por encima" : "por debajo"}
                            </strong> de la media en <strong>{analytics.market[marketLevel].label}</strong>.
                          </div>
                        </div>

                        <div style={{ textAlign: isMobile ? "left" : "right" }}>
                          <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Promedio ({analytics.market[marketLevel].label})
                          </div>
                          <div style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 500, color: C.ink, marginTop: 4 }}>
                            ${analytics.market[marketLevel].avg.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert — pending interested */}
              {stats.interested > 0 && (
                <div style={{
                  background: C.greenSoft, borderRadius: 20, padding: "18px 22px",
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
                  width: "100%", padding: "20px 24px", borderRadius: 24,
                  background: C.white, border: `1.5px dashed ${C.borderS}`,
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.creAlt; e.currentTarget.style.borderColor = C.terra; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.borderS; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: C.terra, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Plus style={{ width: 22, height: 22, color: C.white }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: BODY, fontSize: 15, fontWeight: 700, color: C.ink }}>
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
    </div>
  );
}
