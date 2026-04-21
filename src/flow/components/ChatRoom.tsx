"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Building2, User } from "lucide-react";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY = "var(--font-inter, 'system-ui', sans-serif)";
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

interface DBMessage {
  id: string;
  sender_id: string;
  sender_type: "user" | "owner";
  content: string;
  created_at: string;
}

interface RoomData {
  conversation_id: string;
  other_party: { name: string; avatar: string | null };
  property: { title: string; image_url: string | null; neighborhood: string; monthly_rent: number } | null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function ChatRoom({
  id,
  senderType = "user",
}: {
  id: string;
  senderType?: "user" | "owner";
}) {
  const navigate = useRouter();
  const [room, setRoom]         = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [loadError, setLoadError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  const accent   = senderType === "owner" ? C.terra : C.green;
  const backPath = senderType === "owner" ? "/owner/chat" : "/app/chat";

  const senderId = useCallback((): string | null => {
    if (senderType === "owner") return localStorage.getItem("owner_id");
    return localStorage.getItem("rentai_user_id") || localStorage.getItem("user_id");
  }, [senderType]);

  // Load room
  useEffect(() => {
    fetch(`/api/chat/room?match_id=${id}&caller_type=${senderType}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: RoomData & { messages: DBMessage[] }) => {
        setRoom({ conversation_id: data.conversation_id, other_party: data.other_party, property: data.property });
        setMessages(data.messages);
      })
      .catch(() => setLoadError("No se pudo cargar la conversación."));
  }, [id, senderType]);

  // Poll for new messages every 3 s
  useEffect(() => {
    if (!room) return;
    const poll = () => {
      const last = messages[messages.length - 1];
      const after = last ? `&after=${encodeURIComponent(last.created_at)}` : "";
      fetch(`/api/chat/messages?conversation_id=${room.conversation_id}${after}`)
        .then(r => r.ok ? r.json() : [])
        .then((newMsgs: DBMessage[]) => {
          if (newMsgs.length > 0) setMessages(prev => [...prev, ...newMsgs]);
        })
        .catch(() => {});
    };
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [room, messages]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !room || sending) return;
    const sid = senderId();
    if (!sid) return;

    setSending(true);
    setInput("");
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: room.conversation_id,
          sender_id:       sid,
          sender_type:     senderType,
          content:         text,
        }),
      });
      if (res.ok) {
        const msg: DBMessage = await res.json();
        setMessages(prev => [...prev, msg]);
      }
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const isOwn = (msg: DBMessage) => {
    const sid = senderId();
    return msg.sender_id === sid || msg.sender_type === senderType;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.cream, overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={{
        flexShrink: 0, background: C.white,
        borderBottom: `1.5px solid ${C.border}`,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => navigate.push(backPath)}
          style={{ width: 36, height: 36, borderRadius: 18, background: C.muted, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <ArrowLeft style={{ width: 18, height: 18, color: C.coffee }} />
        </button>

        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
          {room?.other_party.avatar ? (
            <img src={room.other_party.avatar} alt={room.other_party.name}
              style={{ width: 38, height: 38, borderRadius: 19, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: 19, background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {senderType === "owner"
                ? <User style={{ width: 18, height: 18, color: accent }} />
                : <Building2 style={{ width: 18, height: 18, color: accent }} />}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {room?.other_party.name || "…"}
            </div>
            {room?.property && (
              <div style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {room.property.title}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 16px 8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 600, margin: "0 auto" }}>

          {loadError && (
            <div style={{ background: "#FEE2E2", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
              <p style={{ fontFamily: BODY, fontSize: 13, color: "#B91C1C", margin: 0 }}>{loadError}</p>
            </div>
          )}

          {!loadError && messages.length === 0 && room && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, gap: 8 }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 style={{ width: 24, height: 24, color: accent }} />
              </div>
              <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 500, color: C.ink, textAlign: "center" }}>
                Empieza la conversación
              </p>
              <p style={{ fontFamily: BODY, fontSize: 12, color: C.coffee, textAlign: "center", maxWidth: 220 }}>
                {room.property?.title}
              </p>
            </div>
          )}

          {messages.map(msg => {
            const own = isOwn(msg);
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: own ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%", borderRadius: 18, padding: "10px 14px",
                  background: own ? accent : C.white,
                  border: own ? "none" : `1px solid ${C.border}`,
                }}>
                  <p style={{ fontFamily: BODY, fontSize: 14, lineHeight: 1.5, color: own ? C.white : C.ink, margin: 0 }}>
                    {msg.content}
                  </p>
                  <span style={{ fontFamily: BODY, fontSize: 10, display: "block", marginTop: 4, color: own ? "rgba(255,255,255,0.65)" : C.coffee, opacity: own ? 1 : 0.7 }}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0, background: C.white,
        borderTop: `1.5px solid ${C.border}`,
        padding: "12px 16px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Escribe un mensaje..."
            disabled={!room || !!loadError}
            style={{
              flex: 1, padding: "11px 16px",
              background: C.muted, border: "none", borderRadius: 22,
              fontFamily: BODY, fontSize: 14, color: C.ink, outline: "none",
              opacity: (!room || !!loadError) ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !room || sending || !!loadError}
            style={{
              width: 42, height: 42, borderRadius: 21, flexShrink: 0,
              background: input.trim() && room && !loadError ? accent : C.muted,
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() && room && !loadError ? "pointer" : "default",
              transition: "background 0.15s",
            }}
          >
            {sending
              ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${C.white}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              : <Send style={{ width: 17, height: 17, color: input.trim() && room ? C.white : C.coffee }} />}
          </button>
        </div>
      </div>
    </div>
  );
}
