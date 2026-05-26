"use client";
import { TrainFront, Bus, GraduationCap, School, ShoppingCart, ShoppingBag, Cross, Dumbbell, Trees, UtensilsCrossed, Wine, Compass } from "lucide-react";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";

type Category =
  | "transmilenio" | "transport" | "university" | "school" | "market" | "mall"
  | "park" | "pharmacy" | "gym" | "food" | "nightlife";

interface CategorySummary {
  count: number;
  nearest: { name: string; distanceMeters: number };
}

interface NearbyPois {
  radius?: number;
  places?: unknown[];
  summary?: Partial<Record<Category, CategorySummary>>;
}

const META: Record<Category, { label: string; icon: typeof Bus; color: string }> = {
  transmilenio: { label: "TransMilenio", icon: TrainFront, color: "#DC2626" },
  transport:    { label: "Transporte público", icon: Bus, color: "#7C3AED" },
  university:   { label: "Universidades", icon: GraduationCap, color: "#2563EB" },
  school:       { label: "Colegios", icon: School, color: "#0EA5E9" },
  market:       { label: "Supermercados", icon: ShoppingCart, color: "#16A34A" },
  mall:         { label: "Centros comerciales", icon: ShoppingBag, color: "#9333EA" },
  pharmacy:     { label: "Farmacias", icon: Cross, color: "#0891B2" },
  gym:          { label: "Gimnasios", icon: Dumbbell, color: "#D87D6F" },
  park:         { label: "Parques", icon: Trees, color: "#65A30D" },
  food:         { label: "Restaurantes", icon: UtensilsCrossed, color: "#EA580C" },
  nightlife:    { label: "Vida nocturna", icon: Wine, color: "#DB2777" },
};

// Order by perceived value for a student/family renter.
const ORDER: Category[] = ["transmilenio", "transport", "university", "school", "market", "mall", "pharmacy", "gym", "park", "food", "nightlife"];

function metersLabel(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${value} m`;
}

export function EnvironmentSummary({ pois }: { pois?: NearbyPois | null }) {
  const summary = pois?.summary;
  if (!summary) return null;

  const rows = ORDER.filter((cat) => summary[cat]);
  if (rows.length === 0) return null;

  return (
    <div>
      <p style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
        <Compass className="w-3 h-3" /> Qué hay alrededor
      </p>
      <div className="flex flex-col gap-2">
        {rows.map((cat) => {
          const data = summary[cat]!;
          const { icon: Icon, label, color } = META[cat];
          const distance = metersLabel(data.nearest.distanceMeters);
          // For transit/university/school/mall the place name is meaningful;
          // for the rest the count reads better.
          const named = cat === "transmilenio" || cat === "university" || cat === "school" || cat === "mall";
          const detail = named && data.nearest.name !== label
            ? `${data.nearest.name} a ${distance}`
            : data.count > 1
              ? `${data.count} cerca · el más próximo a ${distance}`
              : `a ${distance}`;
          return (
            <div key={cat} className="flex items-center gap-2.5">
              <span className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 26, height: 26, background: `${color}1A` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </span>
              <div className="min-w-0">
                <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: "#1F2937" }}>{label}</span>
                <span style={{ fontFamily: BODY, fontSize: 12, color: "#6B7280" }}> — {detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
