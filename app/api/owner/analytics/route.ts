import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializar cliente de Supabase con Service Role para cálculos globales de mercado
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId");
  const propertyId = searchParams.get("propertyId");

  if (!ownerId) {
    return NextResponse.json({ error: "ownerId es requerido" }, { status: 400 });
  }

  try {
    // 1. Obtener IDs de las propiedades del dueño (o una específica)
    let propertiesQuery = supabaseAdmin
      .from("properties")
      .select("id, price, location")
      .eq("owner_id", ownerId);
    
    if (propertyId) {
      propertiesQuery = propertiesQuery.eq("id", propertyId);
    }
    
    const { data: ownerProps } = await propertiesQuery;
    if (!ownerProps || ownerProps.length === 0) {
      return NextResponse.json({ 
        funnel: [], 
        radar: [], 
        market: { yourPrice: 0, avgPrice: 0 },
        message: "No se encontraron propiedades activas" 
      });
    }

    const propIds = ownerProps.map(p => p.id);

    // 2. Cálculo del Funnel (Simulando Vistas, Likes y Matches reales)
    const { count: totalLikes } = await supabaseAdmin
      .from("property_likes")
      .select("*", { count: 'exact', head: true })
      .in("property_id", propIds);

    const { count: totalMatches } = await supabaseAdmin
      .from("property_matches")
      .select("*", { count: 'exact', head: true })
      .in("property_id", propIds);

    // 3. Análisis Psicográfico (Radar Chart)
    const { data: likers } = await supabaseAdmin
      .from("property_likes")
      .select(`
        profiles (
          cleanliness_level,
          social_level,
          monthly_budget
        )
      `)
      .in("property_id", propIds);

    const profiles = likers?.map((l: any) => l.profiles).filter(Boolean) || [];
    
    const calculateAvg = (arr: any[], key: string) => 
      arr.length > 0 ? arr.reduce((acc, p) => acc + (p[key] || 0), 0) / arr.length : 0;

    const avgStats = {
      limpieza: calculateAvg(profiles, 'cleanliness_level'),
      social: calculateAvg(profiles, 'social_level'),
      // Normalizamos el presupuesto a una escala de 10 para el radar (asumiendo max 3M)
      presupuesto: (calculateAvg(profiles, 'monthly_budget') / 3000000) * 10,
    };

    // 4. Análisis de Mercado (Precio Promedio global para contexto)
    const { data: marketData } = await supabaseAdmin
      .from("properties")
      .select("price");
    
    const avgMarketPrice = marketData && marketData.length > 0
      ? marketData.reduce((acc, p) => acc + p.price, 0) / marketData.length
      : 0;

    return NextResponse.json({
      funnel: [
        { name: 'Vistas', value: (totalLikes || 0) * 4, fill: '#8884d8' },
        { name: 'Likes', value: totalLikes || 0, fill: '#83a6ed' },
        { name: 'Matches', value: totalMatches || 0, fill: '#8dd1e1' }
      ],
      radar: [
        { subject: 'Limpieza', A: avgStats.limpieza, fullMark: 10 },
        { subject: 'Social', A: avgStats.social, fullMark: 10 },
        { subject: 'Presupuesto', A: avgStats.presupuesto, fullMark: 10 },
      ],
      market: {
        yourPrice: ownerProps[0]?.price || 0,
        avgPrice: Math.round(avgMarketPrice)
      },
      stats: {
        totalInterested: profiles.length,
        conversionRate: totalLikes ? Math.round((totalMatches || 0) / totalLikes * 100) : 0
      }
    });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
