"use client";
import { useState, useEffect } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "motion/react";
import { X, Heart, MapPin, Bed, Sparkles, Tag, Building2, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";

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
      }).catch(() => {});
    }
    setAptIndex(aptIndex + 1);
  };

  const removeRm = (direction: "left" | "right") => {
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
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-border px-4 pt-4 pb-0">
        <div className="max-w-lg mx-auto flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src="/Logo_finalfinal.png"
              alt="Logo"
              className="w-8 h-8 md:hidden object-contain"
            />
            <h1 className="text-lg font-semibold text-foreground">Descubre</h1>
          </div>
          <button className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <Sparkles className="w-4 h-4 text-primary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setActiveTab("apartments")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "apartments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Apartamentos
          </button>
          <button
            onClick={() => setActiveTab("roommates")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "roommates"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Roomies
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col px-4 pt-4 pb-2 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              {isApt
                ? "Buscando las mejores opciones…"
                : "Cargando perfiles…"}
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-medium text-sm"
            >
              Reintentar
            </button>
          </div>
        ) : index >= cards.length ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">¡Eso es todo!</h2>
            <p className="text-sm text-muted-foreground text-center">
              No hay más{" "}
              {isApt ? "propiedades disponibles" : "perfiles disponibles"}.
              Vuelve pronto.
            </p>
            <button
              onClick={onRetry}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Reiniciar
            </button>
          </div>
        ) : (
          <>
            {/* Card stack — fills available space */}
            <div className="flex-1 min-h-0 relative">
              {cards.slice(index, index + 2).reverse().map((card, i) => {
                const isTop = i === 1;
                return (
                  <SwipeCard
                    key={card.id}
                    card={card}
                    isTop={isTop}
                    onSwipe={onSwipe}
                    onDetail={() => setDetailCard(card)}
                  />
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex-shrink-0 flex justify-center items-center gap-8 py-3">
              <button
                onClick={() => onSwipe("left")}
                className="w-14 h-14 rounded-full bg-white border-2 border-accent shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
              >
                <X className="w-7 h-7 text-accent" />
              </button>
              <button
                onClick={() => onSwipe("right")}
                className="w-18 h-18 rounded-full bg-primary shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
                style={{ width: "4.5rem", height: "4.5rem" }}
              >
                <Heart className="w-9 h-9 text-white fill-white" />
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
    </div>
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
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 0.8,
      }}
      className={`absolute inset-0 rounded-3xl shadow-2xl overflow-hidden ${
        isTop ? "cursor-grab active:cursor-grabbing" : "scale-95"
      }`}
    >
      {/* Full-card image */}
      <img
        src={card.image}
        alt={card.title || ""}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Match badge */}
      {card.matchScore && (
        <div className="absolute top-4 right-4 bg-white/90 text-primary px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-bold text-sm">{card.matchScore}%</span>
        </div>
      )}

      {/* Info overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <button onClick={onDetail} className="text-left w-full mb-1 group">
          <h2 className="text-white font-bold text-xl leading-tight group-hover:underline decoration-white/60">
            {card.title}
          </h2>
        </button>

        {card.location && (
          <div className="flex items-center gap-1.5 text-white/80 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{card.location}</span>
          </div>
        )}

        {card.type === "room" && (
          <div className="flex items-center gap-3 mb-3">
            {card.price && (
              <span className="text-white font-bold text-base">
                ${card.price.toLocaleString()} COP/mes
              </span>
            )}
            {card.bedrooms && (
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

function PropertyDetailSheet({
  card,
  onClose,
}: {
  card: CardData;
  onClose: () => void;
}) {
  const hasMap = !!(card.latitude && card.longitude);
  const isRoommate = card.type === "roommate";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full pointer-events-auto overflow-hidden relative"
          style={{ maxWidth: "95vw", height: "88vh" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {isRoommate ? (
            /* ── Roommate detail: single column ── */
            <div className="flex flex-col h-full">
              <div className="relative h-64 flex-shrink-0">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                {card.matchScore && (
                  <div className="absolute top-3 left-3 bg-white/90 text-primary px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow">
                    <Sparkles className="w-3 h-3" />
                    {card.matchScore}% match
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <h2 className="text-white font-bold text-2xl drop-shadow">
                    {card.title}
                  </h2>
                  {card.location && (
                    <p className="text-white/80 text-sm mt-0.5">{card.location}</p>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {card.description && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Sobre mí
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {card.description}
                    </p>
                  </div>
                )}
                {card.tags?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Estilo de vida
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Property detail: two columns ── */
            <div className="flex h-full">
              {/* Left: map or fallback image */}
              {hasMap ? (
                <div className="w-2/5 flex-shrink-0 relative">
                  <PropertyMap
                    lat={card.latitude!}
                    lng={card.longitude!}
                    title={card.title}
                  />
                  {card.address && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-3 py-2">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 leading-tight line-clamp-2">
                          {card.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-2/5 flex-shrink-0 relative">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}

              {/* Right: photo + info */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="relative h-52 flex-shrink-0">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  {card.matchScore && (
                    <div className="absolute top-2 right-2 bg-white/90 text-primary px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow">
                      <Sparkles className="w-3 h-3" />
                      {card.matchScore}%
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-8">
                    <h2 className="text-white font-bold text-base leading-tight drop-shadow">
                      {card.title}
                    </h2>
                    <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{card.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                  {card.price && (
                    <span className="text-primary font-bold text-sm">
                      ${card.price.toLocaleString()} COP/mes
                    </span>
                  )}
                  {card.bedrooms && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Bed className="w-3.5 h-3.5" />
                      <span>
                        {card.bedrooms}{" "}
                        {card.bedrooms === 1 ? "hab." : "habs."}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {card.description && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Descripción
                      </p>
                      <p className="text-xs leading-relaxed text-foreground">
                        {card.description}
                      </p>
                    </div>
                  )}
                  {card.tags?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Características
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
