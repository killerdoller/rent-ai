"use client";
import { useState, useEffect } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "motion/react";
import { X, Heart, MapPin, User, Bed, DollarSign, Info, MessageCircle, Sparkles } from "lucide-react";

interface CardData {
  id: string | number;
  type: "room" | "roommate";
  image: string;
  title: string;
  name?: string;
  age?: number;
  university?: string;
  location: string;
  price?: number;
  bedrooms?: number;
  description: string;
  tags: string[];
  matchScore?: number;
}

// Mock data moved or deleted after API implementation

export function Home() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userMode, setUserMode] = useState("find-room");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserMode(localStorage.getItem("userMode") || "find-room");
    }
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem("rentai_user_id");

      const [propertiesRes, likesRes, rejectionsRes] = await Promise.all([
        fetch("/api/properties"),
        userId ? fetch(`/api/likes?user_id=${userId}`) : Promise.resolve(null),
        userId ? fetch(`/api/rejections?user_id=${userId}`) : Promise.resolve(null),
      ]);

      if (!propertiesRes.ok) throw new Error("Error al cargar las propiedades");
      const allProperties = await propertiesRes.json();

      // IDs ya vistos (likes + rechazos)
      const seenIds = new Set<string>();
      if (likesRes?.ok) {
        const likes = await likesRes.json();
        likes.forEach((l: any) => seenIds.add(l.property_id));
      }
      if (rejectionsRes?.ok) {
        const rejections = await rejectionsRes.json();
        rejections.forEach((r: any) => seenIds.add(r.property_id));
      }

      const unseen = allProperties.filter((p: CardData) => !seenIds.has(String(p.id)));
      setCards(unseen);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCard = async (direction: "left" | "right") => {
    if (currentIndex >= cards.length) return;
    const card = cards[currentIndex];
    const userId = localStorage.getItem("rentai_user_id");

    if (userId) {
      const endpoint = direction === "right" ? "/api/likes" : "/api/rejections";
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, property_id: card.id }),
      }).catch(() => {}); // fire-and-forget, no bloquear la UI
    }

    setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/Logo_finalfinal.png"
              alt="Logo"
              className="w-10 h-10 md:hidden object-contain"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">Descubre</h1>
              <p className="text-sm text-muted-foreground">
                {userMode === "find-room" && "Encuentra tu hogar ideal"}
                {userMode === "find-roommate" && "Encuentra tu roommate perfecto"}
                {userMode === "landlord" && "Tus potenciales inquilinos"}
              </p>
            </div>
          </div>
          <button className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <Sparkles className="w-5 h-5 text-primary" />
          </button>
        </div>
      </header>

      {/* Cards Container */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Buscando las mejores opciones para ti...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchProperties}
              className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : currentIndex >= cards.length ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">¡Eso es todo por ahora!</h2>
            <p className="text-muted-foreground mb-6">
              No hay más opciones disponibles. Vuelve pronto para nuevos matches.
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                fetchProperties();
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
            >
              Reiniciar
            </button>
          </div>
        ) : (
          <div className="relative h-[600px] md:h-[650px]">
            {cards.slice(currentIndex, currentIndex + 2).reverse().map((card, index) => {
              const isTop = index === 1;
              return (
                <SwipeCard
                  key={card.id}
                  card={card}
                  isTop={isTop}
                  onSwipe={removeCard}
                />
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {currentIndex < cards.length && (
          <div className="flex justify-center items-center gap-6 mt-6">
            <button
              onClick={() => removeCard("left")}
              className="w-16 h-16 rounded-full bg-white border-2 border-accent shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
            >
              <X className="w-8 h-8 text-accent" />
            </button>
            <button
              onClick={() => removeCard("right")}
              className="w-20 h-20 rounded-full bg-primary shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
            >
              <Heart className="w-10 h-10 text-white fill-white" />
            </button>
            <button className="w-16 h-16 rounded-full bg-white border-2 border-secondary shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
              <Info className="w-8 h-8 text-primary" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SwipeCard({
  card,
  isTop,
  onSwipe,
}: {
  card: CardData;
  isTop: boolean;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
      className={`absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden ${isTop ? "cursor-grab active:cursor-grabbing" : "scale-95"
        }`}
    >
      <div className="relative h-full flex flex-col">
        {/* Image */}
        <div className="relative h-2/3 overflow-hidden">
          <img
            src={card.image}
            alt={card.title || card.name || ""}
            className="w-full h-full object-cover"
          />
          {card.matchScore && (
            <div className="absolute top-4 right-4 bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">{card.matchScore}% Match</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-1">
                {card.type === "room" ? card.title : card.name}
                {card.age && <span className="text-muted-foreground ml-2">{card.age}</span>}
              </h2>
              {card.university && (
                <p className="text-sm text-muted-foreground mb-1">{card.university}</p>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{card.location}</span>
              </div>
            </div>
          </div>

          {card.price && (
            <div className="flex items-center gap-2 mb-3 text-primary">
              <DollarSign className="w-5 h-5" />
              <span className="text-xl font-semibold">
                ${card.price.toLocaleString()} COP/mes
              </span>
            </div>
          )}

          {card.bedrooms && (
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Bed className="w-5 h-5" />
              <span>{card.bedrooms} {card.bedrooms === 1 ? "habitación" : "habitaciones"}</span>
            </div>
          )}

          <p className="text-foreground mb-4">{card.description}</p>

          <div className="flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}