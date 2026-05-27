"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, User as UserIcon, Sparkles, MapPin, Bed, Building2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY = "var(--font-inter, 'system-ui', sans-serif)";

const C = {
  ink: "#0D0D0D",
  cream: "#FFFFFF",
  white: "#FFFFFF",
  green: "#D87D6F",
  coffee: "#4B5563",
  border: "rgba(0,0,0,0.08)",
};

export function ChatAssistant() {
  const { messages, status, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/assistant" }),
  });
  
  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.cream, overflow: "hidden" }}>
      {/* Header */}
      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "20px 24px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            background: "rgba(216, 125, 111, 0.1)", border: `1.5px solid ${C.green}`,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Bot style={{ width: 24, height: 24, color: C.green }} />
          </div>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 500, color: C.ink, letterSpacing: -0.8, lineHeight: 1.1 }}>
              IA Asistente
            </div>
            <div style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, marginTop: 2 }}>
              Describe tu apartamento ideal
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }} className="no-scrollbar">
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Sparkles style={{ width: 40, height: 40, color: C.green, margin: "0 auto 16px", opacity: 0.8 }} />
              <h3 style={{ fontFamily: DISPLAY, fontSize: 22, color: C.ink, marginBottom: 12 }}>¡Hola! Soy tu asistente de Rent-AI.</h3>
              <p style={{ fontFamily: BODY, fontSize: 14, color: C.coffee, lineHeight: 1.5 }}>
                Dime qué estás buscando. Por ejemplo:<br />
                <span style={{ fontWeight: 600, color: C.ink }}>"Busco un apartamento en Chapinero de 2 habitaciones por menos de 2 millones."</span>
              </p>
            </div>
          )}

          {/* Chat History */}
          {messages.map((m) => (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Text Content */}
              {((m as any).content || ((m as any).parts && (m as any).parts.some((p: any) => p.type === 'text'))) && (
                <div style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  display: "flex", alignItems: "flex-end", gap: 8,
                  maxWidth: "85%"
                }}>
                  {m.role !== "user" && (
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: C.green, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bot style={{ width: 16, height: 16, color: C.white }} />
                    </div>
                  )}
                  <div style={{
                    background: m.role === "user" ? C.ink : C.white,
                    color: m.role === "user" ? C.white : C.ink,
                    border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                    padding: "12px 16px",
                    borderRadius: 18,
                    borderBottomRightRadius: m.role === "user" ? 4 : 18,
                    borderBottomLeftRadius: m.role === "user" ? 18 : 4,
                    fontFamily: BODY, fontSize: 14, lineHeight: 1.5,
                    boxShadow: m.role === "user" ? "none" : "0 4px 12px rgba(0,0,0,0.03)"
                  }}>
                    {typeof (m as any).content === "string" ? (m as any).content : (m as any).parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n')}
                  </div>
                </div>
              )}

              {/* Tool Invocations */}
              {(m as any).parts?.map((part: any, index: number) => {
                if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
                  const isSearchApartments = part.type === "tool-search_apartments" || part.toolName === "search_apartments" || (part.toolInvocation && part.toolInvocation.toolName === "search_apartments");
                  const isResultAvailable = part.state === "output-available" || part.state === "result" || (part.toolInvocation && (part.toolInvocation.state === "output-available" || part.toolInvocation.state === "result"));
                  
                  if (isSearchApartments && isResultAvailable) {
                    const properties = part.output || part.result || (part.toolInvocation && (part.toolInvocation.output || part.toolInvocation.result));
                    if (!properties || !Array.isArray(properties) || properties.length === 0) {
                      return (
                        <div key={part.toolCallId || index} style={{ 
                          background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, 
                          padding: 16, marginTop: 8, display: "flex", gap: 12, alignItems: "flex-start", maxWidth: "85%"
                        }}>
                          <div style={{ padding: 8, background: C.white, borderRadius: 12, flexShrink: 0 }}>
                            <Bot style={{ width: 18, height: 18, color: C.coffee }} />
                          </div>
                          <div>
                            <h4 style={{ fontFamily: BODY, fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
                              Búsqueda finalizada
                            </h4>
                            <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, lineHeight: 1.4 }}>
                              {properties?.error ? "Hubo un error al consultar la base de datos." : "No pude encontrar apartamentos que coincidan exactamente con tu búsqueda. Intenta usar otros filtros o buscar en una zona más amplia."}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={part.toolCallId || index} style={{ display: "flex", overflowX: "auto", gap: 12, paddingBottom: 8, marginTop: 8 }} className="no-scrollbar">
                        {properties.map((p: any) => (
                          <div key={p.property_id} onClick={() => router.push(`/app/home`)} style={{
                            minWidth: 240, maxWidth: 240, background: C.white, borderRadius: 16,
                            border: `1.5px solid ${C.border}`, overflow: "hidden", cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                          }}>
                            <div style={{ width: "100%", height: 140, background: "#E5E7EB", position: "relative" }}>
                              <img src={p.image_url || "/profile.jpg"} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 600 }}>
                                ${p.monthly_rent?.toLocaleString()} COP
                              </div>
                            </div>
                            <div style={{ padding: 12 }}>
                              <h4 style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {p.title}
                              </h4>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.coffee, fontSize: 12, marginBottom: 8 }}>
                                <MapPin style={{ width: 12, height: 12 }} />
                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.neighborhood}, {p.city}</span>
                              </div>
                              <div style={{ display: "flex", gap: 8, color: C.coffee, fontSize: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}><Bed style={{ width: 14, height: 14 }} /> {p.bedrooms}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}><Building2 style={{ width: 14, height: 14 }} /> {p.property_type || "Apto"}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                }
                return null;
              })}
              
              {/* Tool Invocations Fallback */}
              {(m as any).toolInvocations?.map((t: any, index: number) => {
                if (t.toolName === "search_apartments" && t.state === "result") {
                  const properties = t.result;
                  if (!properties || !Array.isArray(properties) || properties.length === 0) {
                    return (
                      <div key={t.toolCallId || index} style={{ 
                        background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, 
                        padding: 16, marginTop: 8, display: "flex", gap: 12, alignItems: "flex-start", maxWidth: "85%"
                      }}>
                        <div style={{ padding: 8, background: C.white, borderRadius: 12, flexShrink: 0 }}>
                          <Bot style={{ width: 18, height: 18, color: C.coffee }} />
                        </div>
                        <div>
                          <h4 style={{ fontFamily: BODY, fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
                            Búsqueda finalizada
                          </h4>
                          <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, lineHeight: 1.4 }}>
                            {properties?.error ? "Hubo un error al consultar la base de datos." : "No pude encontrar apartamentos que coincidan exactamente con tu búsqueda. Intenta usar otros filtros o buscar en una zona más amplia."}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={t.toolCallId || index} style={{ display: "flex", overflowX: "auto", gap: 12, paddingBottom: 8, marginTop: 8 }} className="no-scrollbar">
                      {properties.map((p: any) => (
                        <div key={p.property_id} onClick={() => router.push(`/app/home`)} style={{
                          minWidth: 240, maxWidth: 240, background: C.white, borderRadius: 16,
                          border: `1.5px solid ${C.border}`, overflow: "hidden", cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                        }}>
                          <div style={{ width: "100%", height: 140, background: "#E5E7EB", position: "relative" }}>
                            <img src={p.image_url || "/profile.jpg"} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 600 }}>
                              ${p.monthly_rent?.toLocaleString()} COP
                            </div>
                          </div>
                          <div style={{ padding: 12 }}>
                            <h4 style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {p.title}
                            </h4>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.coffee, fontSize: 12, marginBottom: 8 }}>
                              <MapPin style={{ width: 12, height: 12 }} />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.neighborhood}, {p.city}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8, color: C.coffee, fontSize: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}><Bed style={{ width: 14, height: 14 }} /> {p.bedrooms}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}><Building2 style={{ width: 14, height: 14 }} /> {p.property_type || "Apto"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot style={{ width: 16, height: 16, color: C.white }} />
              </div>
              <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: C.white, borderRadius: 18, border: `1px solid ${C.border}` }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: C.coffee, animation: "bounce 1s infinite" }} />
                <div style={{ width: 6, height: 6, borderRadius: 3, background: C.coffee, animation: "bounce 1s infinite 0.2s" }} />
                <div style={{ width: 6, height: 6, borderRadius: 3, background: C.coffee, animation: "bounce 1s infinite 0.4s" }} />
              </div>
            </div>
          )}
          
          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(220, 38, 38, 0.1)", color: "#DC2626", borderRadius: 12, fontSize: 14, textAlign: "center", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
              Ups! Ocurrió un error en la IA (Gemini/Grok). Revisa tu API Key.
              <br/>
              <span style={{ fontSize: 12, opacity: 0.8 }}>({error.message})</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{ background: C.white, borderTop: `1.5px solid ${C.border}`, padding: "16px 20px" }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: "0 auto", position: "relative" }}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ej. Busco apartamento de 2 habs..."
            disabled={isLoading}
            style={{
              width: "100%", padding: "14px 48px 14px 18px", borderRadius: 24,
              border: `1.5px solid ${C.border}`, background: C.cream,
              fontFamily: BODY, fontSize: 14, outline: "none", color: C.ink,
              transition: "border-color 0.2s"
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              position: "absolute", right: 6, top: 6, bottom: 6, width: 40,
              background: input.trim() && !isLoading ? C.ink : "rgba(0,0,0,0.1)",
              borderRadius: 20, border: "none", cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s"
            }}
          >
            <Send style={{ width: 16, height: 16, color: C.white, marginLeft: -2 }} />
          </button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      ` }} />
    </div>
  );
}
