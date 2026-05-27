import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
});

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROPERTY_SELECT =
  "property_id, title, monthly_rent, neighborhood, localidad, city, bedrooms, image_url, images, description, property_type, address, latitude, longitude, bathrooms, area_sqm, stratum, floor_number, building_floors, amenities_interior, amenities_exterior, amenities_sector, utilities_included, nearby_pois, tags";

const POI_CATEGORIES = [
  "transmilenio", "transport", "university", "school", "market", "mall",
  "park", "pharmacy", "gym", "food", "nightlife",
] as const;

// Sube al inicio las propiedades que tienen las categorías de lugares pedidas
// (ranking suave: no descarta las demás). Array.sort es estable en V8, así que
// los empates conservan el orden por created_at.
function rankByNearby(rows: any[], cats: string[]): any[] {
  if (!cats || cats.length === 0) return rows;
  const score = (p: any) => {
    const s = p?.nearby_pois?.summary;
    if (!s) return 0;
    return cats.reduce((acc, c) => acc + (s[c]?.count > 0 ? 1 : 0), 0);
  };
  return [...rows].sort((a, b) => score(b) - score(a));
}

// Cuenta cuántas de las categorías pedidas tiene una propiedad cerca.
function poiScore(p: any, cats: string[]): number {
  const s = p?.nearby_pois?.summary;
  if (!s || !cats?.length) return 0;
  return cats.reduce((acc, c) => acc + (s[c]?.count > 0 ? 1 : 0), 0);
}

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");
function normalizeText(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(DIACRITICS, "").trim();
}

// Centroides aproximados de las localidades de Bogotá. Para el fallback: si no
// hay apartamentos en la zona pedida, mostramos los más cercanos en distancia
// real en vez de los más recientes (que pueden quedar al otro lado de la ciudad).
const LOCALITY_CENTROIDS: Record<string, [number, number]> = {
  "usaquen": [4.7030, -74.0300],
  "chapinero": [4.6500, -74.0600],
  "santa fe": [4.6100, -74.0700],
  "san cristobal": [4.5570, -74.0860],
  "usme": [4.4790, -74.1260],
  "tunjuelito": [4.5720, -74.1320],
  "bosa": [4.6180, -74.1900],
  "kennedy": [4.6280, -74.1560],
  "fontibon": [4.6730, -74.1460],
  "engativa": [4.7080, -74.1130],
  "suba": [4.7560, -74.0840],
  "barrios unidos": [4.6670, -74.0840],
  "teusaquillo": [4.6310, -74.0840],
  "los martires": [4.6040, -74.0900],
  "antonio narino": [4.5940, -74.0990],
  "puente aranda": [4.6160, -74.1140],
  "la candelaria": [4.5970, -74.0740],
  "rafael uribe uribe": [4.5640, -74.1160],
  "ciudad bolivar": [4.5340, -74.1540],
};

// Intenta ubicar el texto de búsqueda en un centroide de localidad conocido.
function resolveCentroid(location: string): [number, number] | null {
  const norm = normalizeText(location);
  if (!norm) return null;
  for (const [name, coord] of Object.entries(LOCALITY_CENTROIDS)) {
    if (norm.includes(name) || name.includes(norm)) return coord;
  }
  return null;
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Reduce la fila completa de propiedad a lo mínimo que el modelo necesita.
// Esto se usa tanto para el resultado en vivo (toModelOutput) como para
// adelgazar el historial: el navegador conserva la fila completa para el
// detalle, pero al modelo nunca le mandamos nearby_pois/amenities completos.
function slimToolOutput(output: any, reqCats: string[]): any {
  if (output && output.error) return { error: output.error };
  const rows = Array.isArray(output) ? output : [];
  return rows.map((p: any) => {
    const base: any = {
      title: p.title,
      monthly_rent: p.monthly_rent,
      zona: [p.neighborhood, p.localidad, p.city].filter(Boolean).join(", "),
      bedrooms: p.bedrooms,
      property_type: p.property_type,
      ...(p._fallback ? { _fallback: true } : {}),
    };
    if (reqCats.length) {
      const s = p?.nearby_pois?.summary;
      const cerca: Record<string, string> = {};
      if (s) {
        for (const c of reqCats) {
          if (s[c]?.count > 0) cerca[c] = `${s[c].nearest.distanceMeters} m`;
        }
      }
      if (Object.keys(cerca).length) base.cerca = cerca;
    }
    return base;
  });
}

// Adelgaza las salidas de tool en el historial de mensajes antes de mandarlo
// al modelo. Sin esto, cada pregunta reenvía las filas completas de búsquedas
// anteriores y se agota el límite de tokens por minuto.
function slimHistory(messages: any[]): any[] {
  if (!Array.isArray(messages)) return messages;
  return messages.map((m) => {
    if (!Array.isArray(m?.parts)) return m;
    return {
      ...m,
      parts: m.parts.map((part: any) => {
        if (
          typeof part?.type === "string" &&
          part.type.startsWith("tool-") &&
          part.output != null
        ) {
          const reqCats = Array.isArray(part.input?.nearby) ? part.input.nearby : [];
          return { ...part, output: slimToolOutput(part.output, reqCats) };
        }
        return part;
      }),
    };
  });
}

const SYSTEM_PROMPT = `Eres un asistente de IA experto en bienes raíces para Rent-AI.
Tu objetivo es ayudar a estudiantes y jóvenes profesionales a encontrar apartamentos en Bogotá.

Reglas estrictas:
1. Solo respondes a consultas sobre apartamentos y bienes raíces.
2. Si te preguntan sobre programación, matemáticas u otros temas, responde amablemente que solo puedes ayudar a buscar vivienda.
3. EXTRAE SIEMPRE LOS FILTROS del mensaje del usuario y pásalos a la herramienta 'search_apartments'.
4. CRÍTICO: Si el usuario menciona un barrio, zona o ciudad (ej. "Chapinero", "Bosa", "Norte"), DEBES incluirlo OBLIGATORIAMENTE en el parámetro 'location'. NUNCA llames la herramienta con location vacío si el usuario dio una ubicación.
5. LUGARES CERCANOS: Si el usuario quiere tener algo cerca (parques, universidades, TransMilenio, gimnasios, etc.), traduce eso al parámetro 'nearby' usando estas categorías exactas: transmilenio, transport, university, school, market, mall, park, pharmacy, gym, food, nightlife. Ejemplos: "con parques cerca" => ["park"]; "cerca de la universidad" => ["university"]; "buen transporte" => ["transmilenio","transport"]; "que tenga gimnasio y supermercado cerca" => ["gym","market"]. Si no menciona nada de esto, usa [].
6. LLAMA LA HERRAMIENTA UNA SOLA VEZ por mensaje del usuario. Di una frase breve antes de usarla (Ej. "Claro, buscaré en Chapinero cerca de parques...") y NUNCA la uses en silencio.
7. Al recibir los resultados, NO repitas la frase de búsqueda: PRESÉNTALOS. Por cada apartamento di zona, precio y habitaciones, y si trae el campo 'cerca' MENCIONA esos lugares con su distancia (ej. "tiene un parque a 200 m"). Esto es obligatorio cuando el usuario pidió cercanía.
8. UBICACIÓN — lee con cuidado el campo '_fallback' de cada resultado:
   - Si NINGÚN resultado trae '_fallback', son coincidencias VÁLIDAS para la zona pedida (aunque algún barrio sea vecino). Preséntalos normal como apartamentos en esa zona. NUNCA digas "no encontré" en este caso.
   - Solo si los resultados traen '_fallback: true' significa que NO hay nada en la zona pedida: acláralo y di que son los más CERCANOS (ej. "No encontré apartamentos en Usaquén; estos son los más cercanos, en otras localidades:").
9. Si no hay ningún resultado, dilo claramente y sugiere ampliar los criterios.
`;

// Fallback cascade: intenta el modelo primario, si falla usa el secundario
const fallbackModel = (primary: any, secondary: any): any => ({
  ...primary,
  async doGenerate(options: any) {
    try {
      return await primary.doGenerate(options);
    } catch (e: any) {
      console.warn("⚠️ Primary model failed, falling back:", e?.message);
      return secondary.doGenerate(options);
    }
  },
  async doStream(options: any) {
    try {
      return await primary.doStream(options);
    } catch (e: any) {
      console.warn("⚠️ Primary model failed (stream), falling back:", e?.message);
      return secondary.doStream(options);
    }
  },
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const coreMessages = await convertToModelMessages(slimHistory(messages));

    const primaryModel = google("gemini-2.0-flash");
    const secondaryModel = groq("llama-3.3-70b-versatile");
    const activeModel = process.env.GROQ_API_KEY
      ? fallbackModel(primaryModel, secondaryModel)
      : primaryModel;

    const result = streamText({
      model: activeModel,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      stopWhen: stepCountIs(2),
      // Tras el primer paso (la búsqueda) prohibimos volver a llamar la tool:
      // así el modelo está obligado a PRESENTAR los resultados en vez de
      // repetir otra búsqueda (que causaba el doble "buscaré...").
      prepareStep: ({ stepNumber }) => (stepNumber > 0 ? { toolChoice: "none" } : {}),
      tools: {
        search_apartments: tool({
          description: "Busca apartamentos reales en la base de datos de Rent-AI con los filtros dados.",
          inputSchema: z.object({
            location: z.string().describe("Barrio, localidad o zona en Bogotá. Vacío si no se especificó."),
            max_price: z.number().describe("Presupuesto máximo en COP. 0 si no se especificó."),
            bedrooms: z.number().describe("Número mínimo de habitaciones. 0 si no se especificó."),
            nearby: z.array(z.enum(POI_CATEGORIES)).describe("Categorías de lugares que el usuario quiere tener cerca (parques, universidades, transporte, etc.). [] si no menciona ninguno."),
          }),
          // @ts-ignore - AI SDK 6 has a type inference issue with execute return type
          execute: async ({ location, max_price, bedrooms, nearby }) => {
            let query = supabase
              .from("properties")
              .select(PROPERTY_SELECT);

            if (max_price && max_price > 0) query = query.lte("monthly_rent", max_price);
            if (bedrooms && bedrooms > 0) query = query.gte("bedrooms", bedrooms);
            if (location && location.trim()) {
              const term = location.trim().toLowerCase();
              query = query.or(
                `neighborhood.ilike.%${term}%,localidad.ilike.%${term}%,city.ilike.%${term}%,address.ilike.%${term}%,description.ilike.%${term}%`
              );
            }

            const { data, error } = await query
              .order("created_at", { ascending: false })
              .limit(20);

            if (error) {
              console.error("DB error:", error);
              return { error: "Error al consultar la base de datos." };
            }

            let results = rankByNearby(data ?? [], nearby).slice(0, 5);

            // Fallback: no hay apartamentos en la zona pedida. Mostramos los más
            // cercanos GEOGRÁFICAMENTE (no los más recientes), priorizando los que
            // tengan los lugares pedidos cerca.
            if (results.length === 0 && location?.trim()) {
              const centroid = resolveCentroid(location);
              let fbQuery = supabase
                .from("properties")
                .select(PROPERTY_SELECT);
              if (max_price && max_price > 0) fbQuery = fbQuery.lte("monthly_rent", max_price);
              if (bedrooms && bedrooms > 0) fbQuery = fbQuery.gte("bedrooms", bedrooms);
              const { data: fbData } = await fbQuery
                .order("created_at", { ascending: false })
                .limit(centroid ? 200 : 20);

              let pool = fbData ?? [];
              if (centroid) {
                const [cLat, cLng] = centroid;
                const dist = (p: any) =>
                  p.latitude != null && p.longitude != null
                    ? haversineMeters(cLat, cLng, p.latitude, p.longitude)
                    : Infinity;
                // Primero los que tienen los lugares pedidos; entre ellos, los más cercanos.
                pool = [...pool].sort((a, b) => {
                  const byPoi = poiScore(b, nearby) - poiScore(a, nearby);
                  if (byPoi !== 0) return byPoi;
                  return dist(a) - dist(b);
                });
              } else {
                pool = rankByNearby(pool, nearby);
              }

              const fbRanked = pool.slice(0, 5);
              if (fbRanked.length > 0) {
                return fbRanked.map((p) => ({ ...p, _fallback: true }));
              }
            }

            return results;
          },
          // El UI recibe la fila completa (para el detalle), pero al modelo solo
          // le mandamos un resumen liviano: así no reventamos el límite de tokens.
          toModelOutput: ({ input, output }: { input: any; output: any }) => {
            const reqCats: string[] = Array.isArray(input?.nearby) ? input.nearby : [];
            return { type: "json", value: slimToolOutput(output, reqCats) } as const;
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Assistant Error:", error);
    return new Response(
      JSON.stringify({ error: "Ocurrió un error en el servidor." }),
      { status: 500 }
    );
  }
}
