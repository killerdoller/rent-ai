"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

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
  match_type?: string;
  other_party_name: string;
  other_party_avatar: string | null;
  property_title: string;
  property_image: string | null;
  property_neighborhood: string;
  last_message: string | null;
  last_message_at: string | null;
  match_created_at: string;
}

const READ_KEY = (matchId: string) => `chat_read_${matchId}`;

function isUnread(conv: ConversationItem): boolean {
  if (!conv.last_message || !conv.last_message_at) return false;
  const readAt = localStorage.getItem(READ_KEY(conv.match_id));
  if (!readAt) return true;
  return new Date(conv.last_message_at) > new Date(readAt);
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const diff  = Date.now() - new Date(dateStr).getTime();
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
  const [isLoading, setIsLoading]         = useState(true);
  const [searchQuery, setSearchQuery]     = useState("");
  // tick every second so formatTime stays fresh
  const [, setTick] = useState(0);
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  const accent   = mode === "owner" ? C.terra : C.green;
  const basePath = mode === "owner" ? "/owner/chat" : "/app/chat";

  useEffect(() => {
    const id = mode === "owner"
      ? localStorage.getItem("owner_id")
      : (localStorage.getItem("rentai_user_id") || localStorage.getItem("user_id"));
    if (!id) { setIsLoading(false); return; }

    const param = mode === "owner" ? `owner_id=${id}` : `user_id=${id}`;
    fetch(`/api/chat/conversations?${param}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: ConversationItem[]) => {
        setConversations(data);
        subscribeToConversations(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    // refresh relative times every 30s
    const ticker = setInterval(() => setTick(t => t + 1), 30000);
    return () => {
      clearInterval(ticker);
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [mode]);

  function subscribeToConversations(convs: ConversationItem[]) {
    // Clean up previous channels
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];

    const withId = convs.filter(c => c.conversation_id);
    if (!withId.length) return;

    withId.forEach(conv => {
      const ch = supabase
        .channel(`conv-list-${conv.conversation_id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conv.conversation_id}`,
        }, (payload) => {
          const msg = payload.new as { content: string; created_at: string };
          setConversations(prev => {
            const updated = prev.map(c =>
              c.conversation_id === conv.conversation_id
                ? { ...c, last_message: msg.content, last_message_at: msg.created_at }
                : c
            );
            // Bubble updated conversation to top
            const idx = updated.findIndex(c => c.conversation_id === conv.conversation_id);
            if (idx > 0) {
              const [item] = updated.splice(idx, 1);
              updated.unshift(item);
            }
            return [...updated];
          });
        })
        .subscribe();
      channelsRef.current.push(ch);
    });
  }

  const filtered = conversations.filter(c =>
    c.other_party_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.property_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newMatches = filtered.filter(c => !c.last_message);
  const activeChats = filtered.filter(c => !!c.last_message);

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
            <>
              {/* Top Bar for New Matches (Tinder Style) */}
              {newMatches.length > 0 && !searchQuery && (
                <div style={{ padding: "0 20px" }}>
                  <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 12, marginTop: 10 }}>
                    Nuevos Matches
                  </div>
                  <div style={{ 
                    display: "flex", gap: 16, overflowX: "auto", 
                    paddingBottom: 16, scrollbarWidth: "none", msOverflowStyle: "none" 
                  }}>
                    {newMatches.map(match => (
                      <button
                        key={match.match_id}
                        onClick={() => navigate.push(`${basePath}/${match.match_id}`)}
                        style={{
                          background: "none", border: "none", cursor: "pointer", 
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          flexShrink: 0, width: 72, padding: 0
                        }}
                      >
                        <div style={{ 
                          width: 64, height: 64, borderRadius: "50%", padding: 3,
                          background: C.green,
                        }}>
                           <img 
                            src={match.other_party_avatar || match.property_image || "/profile.jpg"} 
                            alt={match.other_party_name}
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.white}` }}
                           />
                        </div>
                        <span style={{ 
                          fontFamily: BODY, fontSize: 12, fontWeight: 600, color: C.ink,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center"
                        }}>
                          {match.other_party_name.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vertical List for Active Conversations */}
              <div style={{ padding: "0" }}>
                <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 12, marginTop: 10, padding: "0 20px" }}>
                  Mensajes
                </div>
                {activeChats.length === 0 ? (
                  <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, textAlign: "center", marginTop: 20 }}>Empieza enviándole un mensaje a tus nuevos matches.</p>
                ) : (
                  activeChats.map(conv => {
                    const unread = isUnread(conv);
                    return (
                      <button
                        key={conv.match_id}
                        onClick={() => {
                          localStorage.setItem(READ_KEY(conv.match_id), new Date().toISOString());
                          setConversations(prev => [...prev]); // re-render to clear badge
                          navigate.push(`${basePath}/${conv.match_id}`);
                        }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 14,
                          padding: "14px 20px",
                          background: unread ? `${accent}08` : "none",
                          border: "none", borderBottom: `1px solid ${C.border}`,
                          cursor: "pointer", textAlign: "left",
                        }}
                      >
                        {/* Avatar with unread dot */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <img
                            src={conv.other_party_avatar || conv.property_image || "/profile.jpg"}
                            alt={conv.other_party_name}
                            style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }}
                          />
                          {unread && (
                            <div style={{
                              position: "absolute", bottom: 1, right: 1,
                              width: 14, height: 14, borderRadius: "50%",
                              background: accent, border: `2px solid ${C.cream}`,
                            }} />
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{
                              fontFamily: BODY, fontSize: 14,
                              fontWeight: unread ? 800 : 700,
                              color: C.ink,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%",
                            }}>
                              {conv.other_party_name}
                            </span>
                            <span style={{
                              fontFamily: BODY, fontSize: 11,
                              color: unread ? accent : C.coffee,
                              fontWeight: unread ? 700 : 400,
                              flexShrink: 0,
                            }}>
                              {formatTime(conv.last_message_at)}
                            </span>
                          </div>
                          <div style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                            {conv.property_title}{conv.property_neighborhood ? ` · ${conv.property_neighborhood}` : ""}
                          </div>
                          <p style={{
                            fontFamily: BODY, fontSize: 13,
                            color: unread ? C.ink : C.coffee,
                            fontWeight: unread ? 600 : 400,
                            opacity: conv.last_message ? 1 : 0.5,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0,
                          }}>
                            {conv.last_message || "Empieza la conversación"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
