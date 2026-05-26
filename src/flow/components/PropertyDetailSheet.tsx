"use client";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { X, MapPin, Bed, Bath, Maximize2, Layers, Sparkles, Tag, Building2 } from "lucide-react";
import { ImageCarousel } from "./ImageCarousel";
import { EnvironmentSummary } from "./EnvironmentSummary";

// PropertyMap es cliente-only (depende de window) — dynamic con ssr:false.
const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl bg-secondary animate-pulse" />
  ),
});

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  ink: "#0D0D0D",
  cream: "#FFFFFF",
  white: "#FFFFFF",
  green: "#D87D6F",
  coffee: "#4B5563",
  border: "rgba(0,0,0,0.08)",
};

// Datos que el sheet necesita. Lo definimos amplio para que cualquier vista
// (Home/Favoritos/OwnerProperties) pueda construirlo a partir de su shape
// específica sin tener que conformarlo perfectamente.
export interface PropertyDetailCard {
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
  property_type?: string;
  bathrooms?: number;
  area_sqm?: number;
  stratum?: number;
  floor_number?: number;
  building_floors?: number;
  amenities_interior?: string[];
  amenities_exterior?: string[];
  amenities_sector?: string[];
  utilities_included?: string[];
  nearby_pois?: {
    radius?: number;
    places?: unknown[];
    summary?: Record<string, { count: number; nearest: { name: string; distanceMeters: number } }>;
  } | null;
}

export function PropertyDetailSheet({
  card,
  onClose,
}: {
  card: PropertyDetailCard;
  onClose: () => void;
}) {
  const hasMap = !!(card.latitude && card.longitude);
  const isRoommate = card.type === "roommate";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-[55]"
      />

      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        className="fixed z-[60] bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6 pointer-events-none"
      >
        <div
          className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-3xl pointer-events-auto overflow-hidden relative flex flex-col"
          style={{ height: "88dvh", maxHeight: "88dvh" }}
        >
          <div className="md:hidden flex-shrink-0 flex justify-center pt-3 pb-1">
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: C.border }} />
          </div>

          <button onClick={onClose}
            className="absolute top-3 right-3 z-10 rounded-full p-1.5 shadow"
            style={{ background: "rgba(255,255,255,0.92)" }}>
            <X className="w-4 h-4" style={{ color: C.coffee }} />
          </button>

          {isRoommate ? (
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
              {/* ── Mobile vertical stack ── */}
              <div className="flex flex-col flex-1 min-h-0 md:hidden">
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

                <PriceBar card={card} compact={false} />

                <div className="flex-1 overflow-y-auto min-h-0" style={{ overscrollBehaviorY: "contain", paddingBottom: 24 }}>
                  {hasMap && (
                    <div className="relative flex-shrink-0" style={{ height: 180 }}>
                      <PropertyMap lat={card.latitude!} lng={card.longitude!} title={card.title} pois={card.nearby_pois as any} />
                      {card.address && (
                        <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "rgba(255,255,255,0.92)" }}>
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
                            <p style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, lineHeight: 1.4 }}
                              className="line-clamp-2">{card.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <PropertyBody card={card} compact={false} />
                </div>
              </div>

              {/* ── Desktop two columns ── */}
              <div className="hidden md:flex flex-1 min-h-0">
                {hasMap ? (
                  <div className="w-2/5 flex-shrink-0 relative">
                    <PropertyMap lat={card.latitude!} lng={card.longitude!} title={card.title} pois={card.nearby_pois as any} />
                    {card.address && (
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "rgba(255,255,255,0.9)" }}>
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
                  <PriceBar card={card} compact={true} />
                  <div className="flex-1 overflow-y-auto px-4 py-3" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
                    <PropertyBody card={card} compact={true} />
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes para no duplicar JSX entre mobile y desktop.
// ─────────────────────────────────────────────────────────────────────────────

function PriceBar({ card, compact }: { card: PropertyDetailCard; compact: boolean }) {
  const px = compact ? "px-4 py-2.5" : "px-4 py-3";
  const priceSize = compact ? 14 : 15;
  return (
    <div className={`flex-shrink-0 flex flex-wrap items-center gap-4 ${px} border-b`}
      style={{ borderColor: C.border, background: C.cream }}>
      {card.price && (
        <span style={{ fontFamily: BODY, fontSize: priceSize, fontWeight: 700, color: C.green }}>
          ${card.price.toLocaleString()} COP/mes
        </span>
      )}
      {card.bedrooms && (
        <div className="flex items-center gap-1" style={{ color: C.coffee }}>
          <Bed className="w-3.5 h-3.5" />
          <span style={{ fontFamily: BODY, fontSize: 12 }}>{card.bedrooms} {card.bedrooms === 1 ? "hab." : "habs."}</span>
        </div>
      )}
      {card.area_sqm && (
        <div className="flex items-center gap-1" style={{ color: C.coffee }}>
          <Maximize2 className="w-3.5 h-3.5" />
          <span style={{ fontFamily: BODY, fontSize: 12 }}>{card.area_sqm} m²</span>
        </div>
      )}
      {card.bathrooms && (
        <div className="flex items-center gap-1" style={{ color: C.coffee }}>
          <Bath className="w-3.5 h-3.5" />
          <span style={{ fontFamily: BODY, fontSize: 12 }}>{card.bathrooms} {card.bathrooms === 1 ? "baño" : "baños"}</span>
        </div>
      )}
      {card.building_floors && card.building_floors > 1 && (
        <div className="flex items-center gap-1" style={{ color: C.coffee }}>
          <Layers className="w-3.5 h-3.5" />
          <span style={{ fontFamily: BODY, fontSize: 12 }}>{card.building_floors} niveles</span>
        </div>
      )}
      {card.floor_number && card.floor_number > 0 && !card.building_floors && (
        <div className="flex items-center gap-1" style={{ color: C.coffee }}>
          <Layers className="w-3.5 h-3.5" />
          <span style={{ fontFamily: BODY, fontSize: 12 }}>Piso {card.floor_number}</span>
        </div>
      )}
    </div>
  );
}

function PropertyBody({ card, compact }: { card: PropertyDetailCard; compact: boolean }) {
  const tagPad = compact ? "px-2.5 py-1" : "px-3 py-1";
  const gapClass = compact ? "gap-1.5" : "gap-2";
  const descFont = compact ? 13 : 14;

  return (
    <div className={`${compact ? "px-0" : "px-4"} py-4 space-y-4`}>
      {(card.description || card.stratum) && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
          <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Descripción</p>
          {card.stratum && (
            <p style={{ fontFamily: BODY, fontSize: 13, color: C.coffee, marginBottom: card.description ? 8 : 0, fontWeight: 600 }}>Estrato {card.stratum}</p>
          )}
          {card.description && (
            <p style={{ fontFamily: BODY, fontSize: descFont, lineHeight: 1.65, color: C.ink, whiteSpace: "pre-line" }}>{card.description}</p>
          )}
        </div>
      )}
      {card.amenities_interior && card.amenities_interior.length > 0 && (
        <TagGroup title="Comodidades" icon={<Tag className="w-3 h-3" />} tags={card.amenities_interior} padClass={tagPad} gapClass={gapClass} />
      )}
      {card.amenities_exterior && card.amenities_exterior.length > 0 && (
        <TagGroup title="Edificio / Conjunto" icon={<Building2 className="w-3 h-3" />} tags={card.amenities_exterior} padClass={tagPad} gapClass={gapClass} />
      )}
      {card.amenities_sector && card.amenities_sector.length > 0 && (
        <TagGroup title="Zona" icon={<MapPin className="w-3 h-3" />} tags={card.amenities_sector} padClass={tagPad} gapClass={gapClass} />
      )}
      <EnvironmentSummary pois={card.nearby_pois as any} />
      {card.utilities_included && card.utilities_included.length > 0 && (
        <TagGroup title="Servicios Incluidos" icon={<Sparkles className="w-3 h-3" />} tags={card.utilities_included} padClass={tagPad} gapClass={gapClass} bold />
      )}
      {!(card.amenities_interior?.length || card.amenities_exterior?.length || card.amenities_sector?.length) && card.tags?.length > 0 && (
        <TagGroup title="Características" icon={<Tag className="w-3 h-3" />} tags={card.tags} padClass={tagPad} gapClass={gapClass} />
      )}
    </div>
  );
}

function TagGroup({ title, icon, tags, padClass, gapClass, bold }: {
  title: string; icon: React.ReactNode; tags: string[]; padClass: string; gapClass: string; bold?: boolean;
}) {
  return (
    <div>
      <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: C.coffee, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
        {icon} {title}
      </p>
      <div className={`flex flex-wrap ${gapClass}`}>
        {tags.map((tag) => (
          <span key={tag} className={`${padClass} rounded-full text-xs ${bold ? "font-bold" : "font-medium"}`}
            style={bold ? { background: "#E8F5E9", color: "#2E7D32" } : { background: C.cream, color: C.coffee }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
