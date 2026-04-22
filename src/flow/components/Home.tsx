"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, PanInfo, useMotionValue, useTransform } from "motion/react";
import { X, Heart, MapPin, Bed, Sparkles, Tag, Building2, Users, MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { ImageCarousel } from "./ImageCarousel";

const DISPLAY = "var(--font-fraunces, 'Georgia', serif)";
const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink: "#0D0D0D",
  cream: "#F7F2EC",
  white: "#FFFFFF",
  green: "#63A694",
  coffee: "#82554D",
  border: "rgba(130,85,77,0.14)",
};

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl bg-secondary animate-pulse" />
  ),
});

interface CardData {
  id: string | number;
  type: "room" | "roommate";
  image: string;
  images?: string[];
  title: string;
  name?: string;
  location: string;
  price?: number;
  bedrooms?: number;
  description: string;
  tags: string[];
  matchScore?: number;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

type TabId = "apartments" | "roommates";

export function Home() {
  const navigate = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("apartments");

  // Apartments state
  const [aptCards, setAptCards] = useState<CardData[]>([]);
  const [aptIndex, setAptIndex] = useState(0);
  const [aptLoading, setAptLoading] = useState(true);
  const [aptError, setAptError] = useState<string | null>(null);

  // Roommates state
  const [rmCards, setRmCards] = useState<CardData[]>([]);
  const [rmIndex, setRmIndex] = useState(0);
  const [rmLoading, setRmLoading] = useState(false);
  const [rmError, setRmError] = useState<string | null>(null);
  const [rmFetched, setRmFetched] = useState(false);

  const [detailCard, setDetailCard] = useState<CardData | null>(null);
  const [matchData, setMatchData] = useState<{ id: string; propertyTitle: string; ownerName: string; img: string } | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (activeTab === "roommates" && !rmFetched) {
      fetchRoommates();
    }
  }, [activeTab]);

  const fetchProperties = async () => {
    try {
      setAptLoading(true);
      const userId =
        typeof window !== "undefined"
          ? localStorage.getItem("rentai_user_id")
          : null;

      const [propertiesRes, likesRes, rejectionsRes] = await Promise.all([
        fetch("/api/properties"),
        userId ? fetch(`/api/likes?user_id=${userId}`) : Promise.resolve(null),
        userId
          ? fetch(`/api/rejections?user_id=${userId}`)
          : Promise.resolve(null),
      ]);

      if (!propertiesRes.ok) throw new Error("Error al cargar las propiedades");
      const allProperties = await propertiesRes.json();

      const seenIds = new Set<string>();
      if (likesRes?.ok) {
        const likes = await likesRes.json();
        likes.forEach((l: any) => seenIds.add(l.property_id));
      }
      if (rejectionsRes?.ok) {
        const rejections = await rejectionsRes.json();
        rejections.forEach((r: any) => seenIds.add(r.property_id));
      }

      const unseen = allProperties.filter(
        (p: CardData) => !seenIds.has(String(p.id))
      );
      setAptCards(unseen);
    } catch (err: any) {
      setAptError(err.message);
    } finally {
      setAptLoading(false);
    }
  };

  const fetchRoommates = async () => {
    try {
      setRmLoading(true);
      setRmFetched(true);
      const userId =
        typeof window !== "undefined"
          ? localStorage.getItem("rentai_user_id")
          : null;
      const params = userId ? `?exclude_user_id=${userId}` : "";
      const res = await fetch(`/api/roommates${params}`);
      if (!res.ok) throw new Error("Error al cargar los perfiles");
      const data = await res.json();
      setRmCards(data);
    } catch (err: any) {
      setRmError(err.message);
    } finally {
      setRmLoading(false);
    }
  };

  const removeApt = async (direction: "left" | "right") => {
    if (aptIndex >= aptCards.length) return;
    const card = aptCards[aptIndex];
    const userId =
      typeof window !== "undefined"
        ? localStorage.getItem("rentai_user_id")
        : null;
    if (userId) {
      const endpoint = direction === "right" ? "/api/likes" : "/api/rejections";
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, property_id: card.id }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          if (res?.isMatch) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: [C.green, C.coffee, "#FDBB2D"]
            });
            setMatchData({
              id: res.match_id,
              propertyTitle: card.title,
              ownerName: res.owner_name || "El propietario",
              img: card.image
            });
          }
        })
        .catch(() => { });
    }
    setAptIndex(aptIndex + 1);
  };

  const removeRm = async (direction: "left" | "right") => {
    if (rmIndex >= rmCards.length) return;
    const card = rmCards[rmIndex];
    const userId =
      typeof window !== "undefined"
        ? localStorage.getItem("rentai_user_id")
        : null;
    
    if (userId) {
      const endpoint = direction === "right" ? "/api/roommate-likes" : "/api/roommate-rejections";
      const bodyKey = direction === "right" ? "liked_user_id" : "rejected_user_id";
      
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, [bodyKey]: card.id }),
      })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.isMatch) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: [C.green, C.coffee, "#FDBB2D"]
          });
          setMatchData({
            id: res.match_id,
            propertyTitle: "Match de Roomies",
            ownerName: card.name || "Tu nuevo roomie",
            img: card.image
          });
        }
      })
      .catch(() => {});
    }
    setRmIndex(rmIndex + 1);
  };

  const isApt = activeTab === "apartments";
  const cards = isApt ? aptCards : rmCards;
  const index = isApt ? aptIndex : rmIndex;
  const loading = isApt ? aptLoading : rmLoading;
  const error = isApt ? aptError : rmError;
  const onSwipe = isApt ? removeApt : removeRm;
  const onRetry = isApt
    ? () => {
      setAptIndex(0);
      fetchProperties();
    }
    : () => {
      setRmIndex(0);
      setRmFetched(false);
      fetchRoommates();
    };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.cream, overflow: "hidden" }}>
      {/* Header */}
      <header style={{ flexShrink: 0, background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "20px 24px 0" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 500, color: C.ink, letterSpacing: -1.2, lineHeight: 1, marginTop: 4 }}>
                Descubrir
              </div>
            </div>
            <button style={{
              width: 40, height: 40, borderRadius: 20,
              background: C.cream, border: `1.5px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", marginTop: 4,
            }}>
              <Sparkles style={{ width: 16, height: 16, color: C.green }} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex" }}>
            {([["apartments", Building2, "Apartamentos"], ["roommates", Users, "Roomies"]] as const).map(([tab, Icon, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", background: "none", border: "none", cursor: "pointer",
                  fontFamily: BODY, fontSize: 13, fontWeight: 600,
                  color: activeTab === tab ? C.green : C.coffee,
                  borderBottom: `2px solid ${activeTab === tab ? C.green : "transparent"}`,
                  transition: "all 0.12s",
                }}>
                <Icon style={{ width: 15, height: 15 }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{
        flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
        padding: "8px 16px 8px", maxWidth: 520, margin: "0 auto", width: "100%"
      }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: `3px solid ${C.green}`, borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite"
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee }}>
              {isApt ? "Buscando las mejores opciones…" : "Cargando perfiles…"}
            </p>
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <p style={{ fontFamily: BODY, fontSize: 13, color: "#C0392B" }}>{error}</p>
            <button onClick={onRetry} style={{
              padding: "10px 24px", borderRadius: 9999, background: C.green, color: C.white,
              border: "none", cursor: "pointer", fontFamily: BODY, fontSize: 13, fontWeight: 700,
            }}>Reintentar</button>
          </div>
        ) : index >= cards.length ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "#D4E8D8",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Heart style={{ width: 36, height: 36, color: C.green }} />
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 500, color: C.ink, letterSpacing: -0.8 }}>¡Eso es todo!</div>
            <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, textAlign: "center" }}>
              No hay más {isApt ? "propiedades disponibles" : "perfiles disponibles"}. Vuelve pronto.
            </p>
            <button onClick={onRetry} style={{
              padding: "10px 24px", borderRadius: 9999, background: C.green, color: C.white,
              border: "none", cursor: "pointer", fontFamily: BODY, fontSize: 13, fontWeight: 700,
            }}>Reiniciar</button>

            <button onClick={async () => {
              const userId = localStorage.getItem("rentai_user_id");
              if (!userId) return;
              setAptLoading(true);
              try {
                // Borrar likes y rejections para este usuario (solo para demo)
                await Promise.all([
                  fetch(`/api/likes?user_id=${userId}`, { method: "DELETE" }),
                  fetch(`/api/rejections?user_id=${userId}`, { method: "DELETE" })
                ]);
                setAptIndex(0);
                fetchProperties();
              } catch (e) {
                setAptError("Error al reiniciar swipes");
              } finally {
                setAptLoading(false);
              }
            }} style={{
              marginTop: 12, padding: "8px 16px", borderRadius: 9999, background: "transparent", color: C.coffee,
              border: `1.5px solid ${C.border}`, cursor: "pointer", fontFamily: BODY, fontSize: 12, fontWeight: 600,
            }}>
              Limpiar historial (Modo Demo)
            </button>
          </div>
        ) : (
          <>
            {/* Card stack */}
            <div style={{ 
              flex: 1, 
              minHeight: "460px", // Aumentado para que se vea más grande
              position: "relative",
              width: "100%",
              margin: "0 auto"
            }}>
              {cards.slice(index, index + 2).reverse().map((card, i) => {
                const isTop = i === 1;
                return (
                  <SwipeCard key={card.id} card={card} isTop={isTop}
                    onSwipe={onSwipe} onDetail={() => setDetailCard(card)} />
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, padding: "12px 0 8px" }}>
              <button onClick={() => onSwipe("left")} style={{
                width: 56, height: 56, borderRadius: "50%",
                background: C.white, border: `1.5px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 4px 14px rgba(130,85,77,0.08)",
                transition: "transform 0.1s",
              }}>
                <X style={{ width: 26, height: 26, color: "#D87D6F" }} strokeWidth={2.5} />
              </button>
              <button onClick={() => onSwipe("right")} style={{
                width: 68, height: 68, borderRadius: "50%",
                background: C.green, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: `0 12px 32px ${C.green}55`,
                transition: "transform 0.1s",
              }}>
                <Heart style={{ width: 30, height: 30, color: C.white }} strokeWidth={2.5} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Property / Profile detail sheet */}
      <AnimatePresence>
        {detailCard && (
          <PropertyDetailSheet
            card={detailCard}
            onClose={() => setDetailCard(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchData && (
          <MatchCelebration
            data={matchData}
            onClose={() => setMatchData(null)}
            onChat={() => {
              const id = matchData.id;
              setMatchData(null);
              navigate.push(`/app/chat/${id}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchCelebration({ data, onClose, onChat }: {
  data: { id: string; propertyTitle: string; ownerName: string; img: string };
  onClose: () => void;
  onChat: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ 
        position: "fixed", inset: 0, zIndex: 100, 
        background: "rgba(13,13,13,0.96)", 
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 100 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
        style={{ width: "100%", maxWidth: 420, textAlign: "center" }}
      >
        <div style={{ position: "relative", marginBottom: 32 }}>
           <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            style={{ display: "inline-block" }}
           >
            <Sparkles style={{ width: 64, height: 64, color: C.green }} />
           </motion.div>
        </div>

        <h2 style={{ 
          fontFamily: DISPLAY, fontSize: 48, color: C.white, 
          lineHeight: 1.1, marginBottom: 16, letterSpacing: -1.5 
        }}>
          ¡Increíble!<br/>Es un Match
        </h2>
        
        <p style={{ 
          fontFamily: BODY, fontSize: 16, color: "rgba(255,255,255,0.8)", 
          marginBottom: 48, lineHeight: 1.5, padding: "0 20px"
        }}>
          Parece que {data.ownerName} también quiere conectar contigo para <strong>{data.propertyTitle}</strong>.
        </p>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: -20, marginBottom: 50 }}>
          {/* User Avatar Placeholder */}
          <motion.div
            initial={{ x: -50, rotate: -10 }} animate={{ x: 10, rotate: -5 }}
            style={{ 
              width: 140, height: 140, borderRadius: "50%", 
              border: `4px solid ${C.white}`, overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 2
            }}
          >
            <img src="/profile.jpg" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Tú" />
          </motion.div>

          {/* Property Avatar */}
          <motion.div
            initial={{ x: 50, rotate: 10 }} animate={{ x: -10, rotate: 5 }}
            style={{ 
              width: 140, height: 140, borderRadius: "50%", 
              border: `4px solid ${C.white}`, overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 1
            }}
          >
            <img src={data.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Match" />
          </motion.div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 20px" }}>
          <button 
            onClick={onChat} 
            style={{
              padding: "20px", borderRadius: 20, background: C.green, color: C.white, 
              border: "none", cursor: "pointer",
              fontFamily: BODY, fontSize: 16, fontWeight: 700, 
              boxShadow: `0 12px 30px ${C.green}55`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10
            }}
          >
            <MessageSquare style={{ width: 20, height: 20 }} />
            Enviar mensaje ahora
          </button>
          
          <button 
            onClick={onClose} 
            style={{
              padding: "18px", borderRadius: 20, background: "rgba(255,255,255,0.05)", 
              color: C.white, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
              fontFamily: BODY, fontSize: 16, fontWeight: 600,
              transition: "all 0.2s"
            }}
          >
            Seguir explorando
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SwipeCard({
  card,
  isTop,
  onSwipe,
  onDetail,
}: {
  card: CardData;
  isTop: boolean;
  onSwipe: (direction: "left" | "right") => void;
  onDetail: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      style={{
        position: "absolute",
        inset: 0,
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 0.8,
        scale: isTop ? 1 : 0.95,
        borderRadius: "1.5rem",
        overflow: "hidden",
        background: C.white,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        cursor: isTop ? "grab" : "default",
        zIndex: isTop ? 2 : 1
      }}
    >
      {/* Full-card image */}
      <img
        src={card.image || "/profile.jpg"}
        alt={card.title || ""}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Match badge */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        {card.matchScore && (
          <div className="bg-white/90 text-primary px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-bold text-sm">{card.matchScore}%</span>
          </div>
        )}
        {(card as any).likedYou && (
          <div className="bg-terra text-white px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 animate-bounce">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold text-xs uppercase tracking-wider">Te dio like</span>
          </div>
        )}
      </div>

      {/* Info overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <button onClick={onDetail} className="text-left w-full mb-1 group">
          <h2 className="text-white font-bold text-xl leading-tight group-hover:underline decoration-white/60">
            {card.title}
          </h2>
        </button>

        {card.location && (
          <div className="flex items-center gap-1.5 text-white/80 text-sm mb-3">
            {card.type === "roommate" ? <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> : <MapPin className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>{card.location}</span>
          </div>
        )}

        {(card.type === "room" || card.type === "roommate") && (
          <div className="flex items-center gap-3 mb-3">
            {card.price && (
              <span className="text-white font-bold text-base">
                ${card.price.toLocaleString()} COP/mes
              </span>
            )}
            {card.type === "room" && card.bedrooms && (
              <div className="flex items-center gap-1 text-white/70 text-sm">
                <Bed className="w-3.5 h-3.5" />
                <span>
                  {card.bedrooms} {card.bedrooms === 1 ? "hab." : "habs."}
                </span>
              </div>
            )}
          </div>
        )}

        {card.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PropertyDetailSheet({ card, onClose }: { card: CardData; onClose: () => void }) {
  const hasMap = !!(card.latitude && card.longitude);
  const isRoommate = card.type === "roommate";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />

      {/* Bottom sheet on mobile, centered modal on desktop */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6 pointer-events-none"
      >
        <div
          className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-3xl pointer-events-auto overflow-hidden relative flex flex-col"
          style={{ height: "88dvh", maxHeight: "88dvh" }}
        >
          {/* Drag handle (mobile only) */}
          <div className="md:hidden flex-shrink-0 flex justify-center pt-3 pb-1">
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: C.border }} />
          </div>

          {/* Close button */}
          <button onClick={onClose}
            className="absolute top-3 right-3 z-10 rounded-full p-1.5 shadow"
            style={{ background: "rgba(255,255,255,0.92)" }}>
            <X className="w-4 h-4" style={{ color: C.coffee }} />
          </button>

          {isRoommate ? (
            /* ── Roommate: single column (same on all sizes) ── */
            <div className="flex flex-col flex-1 min-h-0">
              <div className="relative h-64 flex-shrink-0">
                <img src={card.image || "/profile.jpg"} alt={card.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                {card.matchScore && (
                  <div className="absolute top-3 left-3 rounded-full flex items-center gap-1 px-2.5 py-1 text-xs font-bold shadow"
                    style={{ background: "rgba(255,255,255,0.92)", color: C.green }}>
                    <Sparkles className="w-3 h-3" />{card.matchScore}% match
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <h2 className="text-white font-bold text-2xl drop-shadow">{card.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {card.location && <p className="text-white/80 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {card.location}</p>}
                    {card.price && <p className="text-white font-bold text-sm bg-black/20 px-2 py-0.5 rounded-lg backdrop-blur-sm">${card.price.toLocaleString()} COP</p>}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))", overscrollBehaviorY: "contain" }}>
                {card.description && (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Sobre mí</p>
                    <p style={{ fontFamily: BODY, fontSize: 14, lineHeight: 1.65, color: C.ink }}>{card.description}</p>
                  </div>
                )}
                {card.tags?.length > 0 && (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag className="w-3 h-3" /> Estilo de vida
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ background: C.cream, color: C.coffee }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ── Property mobile: vertical stack ── */}
              <div className="flex flex-col flex-1 min-h-0 md:hidden">
                {/* Hero carousel */}
                <div className="relative flex-shrink-0" style={{ height: 260 }}>
                  <ImageCarousel
                    images={card.images && card.images.length > 0 ? card.images : [card.image]}
                    height={260}
                    style={{ position: "absolute", inset: 0 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent pointer-events-none" />
                  {card.matchScore && (
                    <div className="absolute top-3 left-3 rounded-full flex items-center gap-1 px-2.5 py-1 text-xs font-bold shadow"
                      style={{ background: "rgba(255,255,255,0.92)", color: C.green, zIndex: 3 }}>
                      <Sparkles className="w-3 h-3" />{card.matchScore}%
                    </div>
                  )}
                  <div className="absolute bottom-3 left-4 right-10 pointer-events-none" style={{ zIndex: 3 }}>
                    <h2 className="text-white font-bold text-xl leading-tight drop-shadow">{card.title}</h2>
                    <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{card.location}</span>
                    </div>
                  </div>
                </div>

                {/* Price bar */}
                <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b"
                  style={{ borderColor: C.border, background: C.cream }}>
                  {card.price && (
                    <span style={{ fontFamily: BODY, fontSize: 15, fontWeight: 700, color: C.green }}>
                      ${card.price.toLocaleString()} COP/mes
                    </span>
                  )}
                  {card.bedrooms && (
                    <div className="flex items-center gap-1" style={{ color: C.coffee }}>
                      <Bed className="w-3.5 h-3.5" />
                      <span style={{ fontFamily: BODY, fontSize: 12 }}>{card.bedrooms} {card.bedrooms === 1 ? "hab." : "habs."}</span>
                    </div>
                  )}
                </div>

                {/* Scrollable: map + info */}
                <div className="flex-1 overflow-y-auto" style={{ overscrollBehaviorY: "contain" }}>
                  {hasMap && (
                    <div className="relative flex-shrink-0" style={{ height: 180 }}>
                      <PropertyMap lat={card.latitude!} lng={card.longitude!} title={card.title} />
                      {card.address && (
                        <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
                          style={{ background: "rgba(255,255,255,0.92)" }}>
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
                            <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, lineHeight: 1.4 }}
                              className="line-clamp-2">{card.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="px-4 py-4 space-y-4">
                    {card.description && (
                      <div>
                        <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Descripción</p>
                        <p style={{ fontFamily: BODY, fontSize: 14, lineHeight: 1.65, color: C.ink }}>{card.description}</p>
                      </div>
                    )}
                    {card.tags?.length > 0 && (
                      <div>
                        <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                          <Tag className="w-3 h-3" /> Características
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {card.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ background: C.cream, color: C.coffee }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Property desktop: two columns ── */}
              <div className="hidden md:flex flex-1 min-h-0">
                {hasMap ? (
                  <div className="w-2/5 flex-shrink-0 relative">
                    <PropertyMap lat={card.latitude!} lng={card.longitude!} title={card.title} />
                    {card.address && (
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
                        style={{ background: "rgba(255,255,255,0.9)" }}>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
                          <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee }} className="line-clamp-2">{card.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-2/5 flex-shrink-0 relative overflow-hidden">
                    <ImageCarousel
                      images={card.images && card.images.length > 0 ? card.images : [card.image]}
                      style={{ position: "absolute", inset: 0, height: "100%" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  </div>
                )}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="relative flex-shrink-0" style={{ height: 200 }}>
                    <ImageCarousel
                      images={card.images && card.images.length > 0 ? card.images : [card.image]}
                      height={200}
                      style={{ position: "absolute", inset: 0 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                    {card.matchScore && (
                      <div className="absolute top-2 right-2 rounded-full flex items-center gap-1 px-2.5 py-1 text-xs font-bold shadow"
                        style={{ background: "rgba(255,255,255,0.92)", color: C.green, zIndex: 3 }}>
                        <Sparkles className="w-3 h-3" />{card.matchScore}%
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-8 pointer-events-none" style={{ zIndex: 3 }}>
                      <h2 className="text-white font-bold text-base leading-tight drop-shadow">{card.title}</h2>
                      <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                        <MapPin className="w-3 h-3" /><span className="truncate">{card.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2.5 border-b"
                    style={{ borderColor: C.border, background: C.cream }}>
                    {card.price && (
                      <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 700, color: C.green }}>
                        ${card.price.toLocaleString()} COP/mes
                      </span>
                    )}
                    {card.bedrooms && (
                      <div className="flex items-center gap-1" style={{ color: C.coffee }}>
                        <Bed className="w-3.5 h-3.5" />
                        <span style={{ fontFamily: BODY, fontSize: 12 }}>{card.bedrooms} {card.bedrooms === 1 ? "hab." : "habs."}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
                    {card.description && (
                      <div>
                        <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Descripción</p>
                        <p style={{ fontFamily: BODY, fontSize: 13, lineHeight: 1.65, color: C.ink }}>{card.description}</p>
                      </div>
                    )}
                    {card.tags?.length > 0 && (
                      <div>
                        <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                          <Tag className="w-3 h-3" /> Características
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {card.tags.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ background: C.cream, color: C.coffee }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
