import { NextResponse } from "next/server";

type AutocompleteResult = {
  id: string;
  placeId: string;
  label: string;
  mainText?: string;
  secondaryText?: string;
  source: "google";
};

const BOGOTA_RECTANGLE = {
  low: { latitude: 4.46, longitude: -74.25 },
  high: { latitude: 4.85, longitude: -73.99 },
};

function cleanAddress(input: string) {
  return input
    .replace(/\s+/g, " ")
    .replace(/\s*#\s*/g, " # ")
    .trim();
}

function withCity(query: string, city: string) {
  const cleaned = cleanAddress(query);
  const cityName = city.split(",")[0]?.trim().toLowerCase();
  if (cityName && cleaned.toLowerCase().includes(cityName)) return cleaned;
  return `${cleaned}, ${city}`;
}

export async function GET(request: Request) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const { searchParams } = new URL(request.url);
  const query = cleanAddress(searchParams.get("q") || "");
  const city = cleanAddress(searchParams.get("city") || "Bogota, Colombia");

  if (query.length < 3) {
    return NextResponse.json({ results: [], provider: "google" });
  }

  if (!key) {
    return NextResponse.json({ results: [], provider: "google", configured: false });
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": [
          "suggestions.placePrediction.placeId",
          "suggestions.placePrediction.text.text",
          "suggestions.placePrediction.structuredFormat.mainText.text",
          "suggestions.placePrediction.structuredFormat.secondaryText.text",
        ].join(","),
      },
      body: JSON.stringify({
        input: withCity(query, city),
        includedRegionCodes: ["co"],
        languageCode: "es",
        locationBias: { rectangle: BOGOTA_RECTANGLE },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ results: [], provider: "google" });
    }

    const data = await response.json();
    const results: AutocompleteResult[] = (data.suggestions || [])
      .map((suggestion: any) => suggestion.placePrediction)
      .filter(Boolean)
      .map((prediction: any) => ({
        id: prediction.placeId,
        placeId: prediction.placeId,
        label: prediction.text?.text || "Direccion encontrada",
        mainText: prediction.structuredFormat?.mainText?.text,
        secondaryText: prediction.structuredFormat?.secondaryText?.text,
        source: "google" as const,
      }))
      .slice(0, 6);

    return NextResponse.json({ results, provider: "google", configured: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo autocompletar la direccion" },
      { status: 500 },
    );
  }
}
