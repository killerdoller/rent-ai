"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, Building2, User } from "lucide-react";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY    = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink:    "#0D0D0D",
  cream:  "#F7F2EC",
  white:  "#FFFFFF",
  green:  "#63A694",
  terra:  "#D87D6F",
  coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
  muted:  "#EFE7DE",
};

interface ConversationItem {
  conversation_id: string | null;
  match_id: string;
  other_party_name: string;
  other_party_avatar: string | null;
  property_title: string;
  property_image: string | null;
  property_neighborhood: string;
  last_message: string | null;
  last_message_at: string | null;
  match_created_at: string;
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Ahora";
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "Ayer";
  return `${days}d`;
}

export function Chat({ mode = "user" }: { mode?: "user" | "owner" }) {
  const navigate = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const accent   = mode === "owner" ? C.terra : C.green;
  const basePath = mode === "owner" ? "/owner/chat" : "/app/chat";

  useEffect(() => {
    const id = mode === "owner"
      ? localStorage.getItem("owner_id")
      : (localStorage.getItem("rentai_user_id") || localStorage.getItem("user_id"));

    if (!id) { navigate.push("/app"); return; }

    const param = mode === "owner" ? `owner_id=${id}` : `user_id=${id}`;
    fetch(`/api/chat/conversations?${param}`)
      .then(r => r.ok ? r.json() : [])
      .then(setConversations)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [mode]);

  const filtered = conversations.filter(c =>
    c.other_party_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.property_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.cream, overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "20px 20px 0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, fontWeight: 600, letterSpacing: 0.4 }}>
                {isLoading ? "Cargando…" : `${conversations.length} conversación${conversations.length !== 1 ? "es" : ""}`}
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 500, color: C.ink, letterSpacing: -1.2, lineHeight: 1, marginTop: 4 }}>
                Chats
              </div>
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: C.coffee, opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                background: C.muted, border: "none", borderRadius: 12,
                fontFamily: BODY, fontSize: 14, color: C.ink, outline: "none",
              }}
            />
          </div>
        </div>
      </header>

      {/* List */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle style={{ width: 32, height: 32, color: C.coffee, opacity: 0.4 }} />
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: -0.8 }}>Sin conversaciones</div>
              <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, textAlign: "center", maxWidth: 260 }}>
                {searchQuery ? "Sin resultados para tu búsqueda." : "Cuando hagas match podrás chatear aquí."}
              </p>
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.match_id}
                onClick={() => navigate.push(`${basePath}/${conv.match_id}`)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 20px", background: "none", border: "none",
                  borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left",
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {conv.other_party_avatar || conv.property_image ? (
                    <img
                      src={(conv.other_party_avatar || conv.property_image)!}
                      alt={conv.other_party_name}
                      style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {mode === "owner"
                        ? <User style={{ width: 24, height: 24, color: accent }} />
                        : <Building2 style={{ width: 24, height: 24, color: accent }} />}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>
                      {conv.other_party_name}
                    </span>
                    <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.7, flexShrink: 0 }}>
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                    {conv.property_title}
                    {conv.property_neighborhood ? ` · ${conv.property_neighborhood}` : ""}
                  </div>
                  <p style={{ fontFamily: BODY, fontSize: 13, color: conv.last_message ? C.ink : C.coffee, opacity: conv.last_message ? 1 : 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {conv.last_message || "Empieza la conversación"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
