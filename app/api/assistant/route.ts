import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, LanguageModel } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Initialize providers
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

const SYSTEM_PROMPT = `Eres un asistente de IA experto en bienes raíces para Rent-AI.
Tu objetivo es ayudar a estudiantes y jóvenes profesionales a encontrar apartamentos en Bogotá.

Reglas estrictas:
1. Solo respondes a consultas sobre apartamentos y bienes raíces.
2. Si te preguntan sobre programación, matemáticas u otros temas, responde amablemente que solo puedes ayudar a buscar vivienda.
3. EXTRAE SIEMPRE LOS FILTROS del mensaje del usuario y pásalos a la herramienta 'search_apartments'.
4. CRÍTICO: Si el usuario menciona un barrio, zona o ciudad (ej. "Chapinero", "Bosa", "Norte"), DEBES incluirlo OBLIGATORIAMENTE en el parámetro 'location'. NUNCA llames la herramienta con un objeto vacío {} si el usuario dio una ubicación o presupuesto.
5. DEBES SIEMPRE decir algo al usuario antes de usar la herramienta (Ej. "Claro, buscaré en Chapinero..."). NUNCA uses la herramienta en silencio.
6. Al recibir resultados de la herramienta, preséntalos brevemente destacando por qué hacen un buen "match" con lo que el usuario pidió (por ejemplo, si están en el presupuesto, la zona o tienen las habitaciones pedidas).
7. Si la herramienta no devuelve resultados, informa al usuario claramente que en este momento no hay opciones con esas características y aliéntalo a buscar con criterios más amplios.
`;

// Helper para crear un modelo en cascada (Fallback)
const fallbackModel = (primary: any, secondary: any): any => {
  return {
    ...primary,
    async doGenerate(options: any) {
      try {
        return await primary.doGenerate(options);
      } catch (e: any) {
        console.warn("⚠️ Primary model failed (generate), falling back to secondary:", e?.message);
        return secondary.doGenerate(options);
      }
    },
    async doStream(options: any) {
      try {
        // En Vercel AI SDK los errores de cuota (429) y conexión saltan aquí antes de iniciar el stream real
        return await primary.doStream(options);
      } catch (e: any) {
        console.warn("⚠️ Primary model failed (stream), falling back to secondary:", e?.message);
        return secondary.doStream(options);
      }
    }
  };
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const coreMessages: any[] = [];
    for (const m of messages) {
      const textContent = m.content || (m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n")) || "";
      if (m.role === "user") {
        coreMessages.push({ role: "user", content: textContent });
      } else if (m.role === "assistant") {
        const toolCalls = m.toolInvocations?.map((t: any) => ({
          type: "tool-call",
          toolCallId: t.toolCallId,
          toolName: t.toolName,
          args: t.args || {},
        })) || [];
        
        const assistantContent: any[] = [];
        if (textContent) {
          assistantContent.push({ type: "text", text: textContent });
        }
        assistantContent.push(...toolCalls);

        coreMessages.push({
          role: "assistant",
          content: assistantContent.length > 0 ? assistantContent : "",
        });

        const toolResults = m.toolInvocations?.filter((t: any) => t.state === "result").map((t: any) => ({
          type: "tool-result",
          toolCallId: t.toolCallId,
          toolName: t.toolName,
          result: t.output || t.result || "Exito",
        }));
        
        if (toolResults && toolResults.length > 0) {
          coreMessages.push({
            role: "tool",
            content: toolResults,
          });
        }
      } else {
        coreMessages.push({ role: m.role, content: textContent });
      }
    }

    const primaryModel = google("gemini-3.5-flash");
    const secondaryModel = groq("llama-3.3-70b-versatile");
    
    // Solo usamos fallback si hay una key de Groq configurada
    const activeModel = process.env.GROQ_API_KEY 
      ? fallbackModel(primaryModel, secondaryModel)
      : primaryModel;

    const result = streamText({
      model: activeModel,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      tools: {
        search_apartments: tool({
          description: "Busca apartamentos reales en la base de datos de Rent-AI utilizando los filtros proporcionados.",
          parameters: z.object({
            location: z.string().describe("Ubicación. Si no la hay, usa ''"),
            max_price: z.number().describe("Presupuesto en COP. Si no hay, usa 0"),
            bedrooms: z.number().describe("Habitaciones. Si no hay, usa 0"),
            rooms: z.number().describe("Obligatorio. Igual a bedrooms"),
            price: z.number().describe("Obligatorio. Igual a max_price")
          }),
          // @ts-ignore
          execute: async ({ location, max_price, bedrooms, rooms, price }: any): Promise<any> => {
            const finalPrice = max_price || price;
            const finalBeds = bedrooms || rooms;
            let query = supabase
              .from("properties")
              .select("property_id, title, monthly_rent, neighborhood, city, bedrooms, image_url, description, property_type");

            if (finalPrice) query = query.lte("monthly_rent", finalPrice);
            if (finalBeds) query = query.gte("bedrooms", finalBeds);
            if (location) {
              const term = location.toLowerCase();
              query = query.or(`neighborhood.ilike.%${term}%,city.ilike.%${term}%,description.ilike.%${term}%`);
            }

            const { data, error } = await query.order("created_at", { ascending: false }).limit(15);
            if (error) return { error: "Failed to search apartments" };

            let results = data || [];
            if (results.length === 0 && location) {
              let fallbackQuery = supabase.from("properties").select("property_id, title, monthly_rent, neighborhood, city, bedrooms, image_url, description, property_type");
              if (finalPrice) fallbackQuery = fallbackQuery.lte("monthly_rent", finalPrice);
              if (finalBeds) fallbackQuery = fallbackQuery.gte("bedrooms", finalBeds);
              
              const { data: fallbackData } = await fallbackQuery.order("created_at", { ascending: false }).limit(5);
              if (fallbackData && fallbackData.length > 0) {
                return fallbackData.map(p => ({
                  ...p,
                  _nota_para_el_agente: "No se encontraron apartamentos en la ubicación exacta, estos son apartamentos alternativos que cumplen el presupuesto/habitaciones. Dile al usuario que son opciones en otras zonas."
                }));
              }
            }
            return results.slice(0, 5);
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Assistant Error:", error);
    return new Response(JSON.stringify({ error: "Ocurrió un error en el servidor." }), { status: 500 });
  }
}
