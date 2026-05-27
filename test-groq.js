import { createGroq } from '@ai-sdk/groq';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  try {
    const res = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      messages: [{ role: 'user', content: 'Busca apartamento en Chapinero de 2 habitaciones' }],
      tools: {
        search_apartments: tool({
          description: "Busca",
          parameters: z.object({
            location: z.string().optional(),
            max_price: z.number().optional(),
            bedrooms: z.number().optional(),
            budget: z.number().optional(),
          }),
          execute: async () => ({})
        })
      }
    });
    console.log("Success:", res.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
