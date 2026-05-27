"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, Sparkles, MapPin, Bed, Building2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { PropertyDetailSheet, PropertyDetailCard } from "./PropertyDetailSheet";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY = "var(--font-inter, 'system-ui', sans-serif)";

const C = {
  ink: "#0D0D0D",
  cream: "#FFFFFF",
  white: "#FFFFFF",
  terra: "#D87D6F",
  coffee: "#4B5563",
  border: "rgba(0,0,0,0.08)",
  cream_bg: "#F7F2EC",
};

// Convierte un error técnico en un mensaje amigable para el usuario
function friendlyError(err: Error | undefined): { title: string; detail: string } {
  const msg = (err?.message || "").toLowerCase();
  if (
    msg.includes("too large") || msg.includes("tokens per minute") ||
    msg.includes("tpm") || msg.includes("rate limit") || msg.includes("rate_limit") ||
    msg.includes("429") || msg.includes("quota")
  ) {
    return {
      title: "El asistente está muy solicitado ahora mismo",
      detail: "Recibimos muchas consultas seguidas. Espera unos segundos e inténtalo de nuevo, o sé más específico con la zona, el presupuesto y las habitaciones.",
    };
  }
  if (msg.includes("api key") || msg.includes("api_key") || msg.includes("apikey") || msg.includes("missing")) {
    return {
      title: "El asistente no está disponible",
      detail: "No pudimos conectar con el servicio de IA. Si eres el administrador, revisa la configuración de las llaves de API.",
    };
  }
  return {
    title: "Algo salió mal",
    detail: "No pudimos completar tu búsqueda. Vuelve a intentarlo en un momento.",
  };
}

// Extrae el mejor URL de imagen de una propiedad
function getImageUrl(p: any): string | null {
  if (p.image_url) return p.image_url;
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  return null;
}

// Mapea la fila de propiedad de la tool al shape que espera PropertyDetailSheet
function toDetailCard(p: any): PropertyDetailCard {
  return {
    id: p.property_id,
    type: "room",
    image: getImageUrl(p) || "/profile.jpg",
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
    title: p.title || "Apartamento",
    location: [p.neighborhood, p.localidad, p.city].filter(Boolean).join(", "),
    price: p.monthly_rent != null ? Number(p.monthly_rent) : undefined,
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
    amenities_interior: p.amenities_interior || [],
    amenities_exterior: p.amenities_exterior || [],
    amenities_sector: p.amenities_sector || [],
    utilities_included: p.utilities_included || [],
    nearby_pois: p.nearby_pois ?? null,
  };
}

// Renderiza las property cards devueltas por la tool
function PropertyCards({ properties, onCardClick }: { properties: any[]; onCardClick: (p: any) => void }) {
  if (!Array.isArray(properties) || properties.length === 0) return null;
  return (
    <div
      style={{ display: "flex", overflowX: "auto", gap: 12, paddingBottom: 8, marginTop: 8, paddingRight: 4 }}
      className="no-scrollbar"
    >
      {properties.map((p: any) => {
        const imgUrl = getImageUrl(p);
        const zone = [p.neighborhood, p.localidad, p.city].filter(Boolean).join(", ");
        return (
          <div
            key={p.property_id}
            onClick={() => onCardClick(p)}
            style={{
              minWidth: 220,
              maxWidth: 220,
              background: C.white,
              borderRadius: 16,
              border: `1.5px solid ${C.border}`,
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
            }}
          >
            {/* Imagen */}
            <div style={{ width: "100%", height: 130, background: "#E5E7EB", position: "relative", flexShrink: 0 }}>
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={p.title || "Apartamento"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 style={{ width: 32, height: 32, color: "#9CA3AF" }} />
                </div>
              )}
              {p.monthly_rent && (
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(13,13,13,0.75)", padding: "3px 8px", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                  ${Number(p.monthly_rent).toLocaleString("es-CO")}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: "10px 12px 12px" }}>
              <h4 style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.title || "Apartamento"}
              </h4>
              {zone && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.coffee, fontSize: 12, marginBottom: 6 }}>
                  <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{zone}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, color: C.coffee, fontSize: 12 }}>
                {p.bedrooms != null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Bed style={{ width: 12, height: 12 }} />
                    <span>{p.bedrooms} hab.</span>
                  </div>
                )}
                {p.property_type && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Building2 style={{ width: 12, height: 12 }} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80 }}>{p.property_type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChatAssistant() {
  const { messages, status, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/assistant" }),
  });

  const [input, setInput] = useState("");
  const [detailCard, setDetailCard] = useState<PropertyDetailCard | null>(null);
  const isLoading = status === "submitted" || status === "streaming";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCardClick = (p: any) => {
    setDetailCard(toDetailCard(p));
  };

  return (
    <div style={{ flex: "1 1 auto", minHeight: 0, height: "100%", display: "flex", flexDirection: "column", background: C.cream_bg, overflow: "hidden" }}>
      {/* Header */}
      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "20px 24px 16px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(216,125,111,0.12)", border: `1.5px solid ${C.terra}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot style={{ width: 24, height: 24, color: C.terra }} />
          </div>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.6, lineHeight: 1.1 }}>
              IA Asistente
            </div>
            <div style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, marginTop: 2 }}>
              Describe tu apartamento ideal
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }} className="no-scrollbar">
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Bienvenida */}
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <Sparkles style={{ width: 40, height: 40, color: C.terra, margin: "0 auto 16px", opacity: 0.8 }} />
              <h3 style={{ fontFamily: DISPLAY, fontSize: 22, color: C.ink, marginBottom: 12 }}>¡Hola! Soy tu asistente de Rent-AI.</h3>
              <p style={{ fontFamily: BODY, fontSize: 14, color: C.coffee, lineHeight: 1.6 }}>
                Dime qué estás buscando. Por ejemplo:<br />
                <span style={{ fontWeight: 600, color: C.ink }}>"Quiero un apto en Chapinero con 2 habitaciones por menos de $2.000.000"</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24, alignItems: "center" }}>
                {[
                  "Busco apartamento cerca de un parque en Usaquén",
                  "Quiero algo en El Nogal o La Cabrera, máximo 3M",
                  "2 habitaciones en el norte, zona universitaria",
                ].map((sugg) => (
                  <button
                    key={sugg}
                    onClick={() => { sendMessage({ text: sugg }); }}
                    style={{ fontFamily: BODY, fontSize: 13, color: C.terra, background: "rgba(216,125,111,0.08)", border: `1px solid rgba(216,125,111,0.3)`, borderRadius: 20, padding: "8px 16px", cursor: "pointer" }}
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Historial de mensajes */}
          {messages.map((m) => {
            const textContent = typeof (m as any).content === "string"
              ? (m as any).content
              : (m as any).parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n") ?? "";

            // Partes de tool invocations (AI SDK v6: type === "tool-<nombre>")
            const toolParts: any[] = (m as any).parts?.filter((p: any) => p.type === "tool-search_apartments") ?? [];

            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Burbuja de texto — solo si hay contenido real */}
                {textContent.trim() && (
                  <div style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    display: "flex", alignItems: "flex-end", gap: 8,
                    maxWidth: "85%",
                  }}>
                    {m.role !== "user" && (
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: C.terra, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bot style={{ width: 15, height: 15, color: C.white }} />
                      </div>
                    )}
                    <div style={{
                      background: m.role === "user" ? C.ink : C.white,
                      color: m.role === "user" ? C.white : C.ink,
                      border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                      padding: "11px 15px",
                      borderRadius: 18,
                      borderBottomRightRadius: m.role === "user" ? 4 : 18,
                      borderBottomLeftRadius: m.role === "user" ? 18 : 4,
                      fontFamily: BODY, fontSize: 14, lineHeight: 1.55,
                      boxShadow: m.role === "user" ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
                      whiteSpace: "pre-wrap",
                    }}>
                      {textContent}
                    </div>
                  </div>
                )}

                {/* Cards de propiedades — fusionadas y deduplicadas entre todas
                    las llamadas a la tool, para no repetir el mismo bloque. */}
                {(() => {
                  const ready = toolParts.filter((p: any) => p.state === "output-available");
                  if (ready.length === 0) return null;

                  const seen = new Set<string>();
                  const merged: any[] = [];
                  let hasFallback = false;
                  let hadError = false;

                  for (const part of ready) {
                    const result = part.output;
                    if (Array.isArray(result)) {
                      for (const p of result) {
                        const id = String(p.property_id);
                        if (!seen.has(id)) { seen.add(id); merged.push(p); }
                        if (p._fallback) hasFallback = true;
                      }
                    } else if (result?.error) {
                      hadError = true;
                    }
                  }

                  if (merged.length === 0) {
                    return (
                      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginTop: 4, maxWidth: "85%", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ padding: 8, background: C.cream_bg, borderRadius: 12, flexShrink: 0 }}>
                          <Bot style={{ width: 16, height: 16, color: C.coffee }} />
                        </div>
                        <div>
                          <p style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 3 }}>Sin resultados</p>
                          <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, lineHeight: 1.4 }}>
                            {hadError
                              ? "Hubo un error al consultar la base de datos."
                              : "No encontré apartamentos con esas características. Intenta ampliar la zona o ajustar el presupuesto."}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div>
                      {hasFallback && (
                        <p style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, marginBottom: 6, fontStyle: "italic" }}>
                          No encontré opciones en esa zona exacta, te muestro alternativas:
                        </p>
                      )}
                      <PropertyCards properties={merged} onCardClick={handleCardClick} />
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Indicador de carga */}
          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: C.terra, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot style={{ width: 15, height: 15, color: C.white }} />
              </div>
              <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: C.white, borderRadius: 18, border: `1px solid ${C.border}` }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: C.coffee, animation: `bounce 1s infinite ${delay}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (() => {
            const fe = friendlyError(error);
            return (
              <div style={{ padding: "14px 16px", background: "rgba(216,125,111,0.08)", color: C.ink, borderRadius: 14, fontSize: 13, textAlign: "center", border: "1px solid rgba(216,125,111,0.25)" }}>
                <p style={{ fontFamily: BODY, fontWeight: 700, marginBottom: 4 }}>{fe.title}</p>
                <p style={{ fontFamily: BODY, color: C.coffee, lineHeight: 1.5 }}>{fe.detail}</p>
              </div>
            );
          })()}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ background: C.white, borderTop: `1.5px solid ${C.border}`, padding: "14px 20px" }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej. Quiero un apto de 2 habs en Rosales..."
            disabled={isLoading}
            style={{
              width: "100%", padding: "13px 52px 13px 18px", borderRadius: 24,
              border: `1.5px solid ${C.border}`, background: C.cream_bg,
              fontFamily: BODY, fontSize: 14, outline: "none", color: C.ink,
              transition: "border-color 0.2s", boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.terra)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              position: "absolute", right: 6, top: 6, bottom: 6, width: 40,
              background: input.trim() && !isLoading ? C.ink : "rgba(0,0,0,0.1)",
              borderRadius: 20, border: "none",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
          >
            <Send style={{ width: 15, height: 15, color: C.white, marginLeft: -1 }} />
          </button>
        </form>
      </div>

      {/* Detalle de propiedad al tocar una card */}
      <AnimatePresence>
        {detailCard && (
          <PropertyDetailSheet card={detailCard} onClose={() => setDetailCard(null)} />
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      ` }} />
    </div>
  );
}
