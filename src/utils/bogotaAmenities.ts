// Vocabulario unificado de amenidades para alinear las tres superficies:
//   - Perfil del inquilino (CompleteProfile.tsx, Profile.tsx)
//   - Publicación del propietario (NewProperty.tsx)
//   - Datos derivados por el scraper de FincaRaíz
//
// Las strings DEBEN coincidir con las que `canonical_amenity()` mapea en
// SQL (ver supabase/migrations/20260525120000_match_score_curves.sql). Si
// añades un concepto nuevo aquí, asegúrate de que la función SQL también
// lo cubra para que el matching contra strings que vienen del scraper o
// del usuario en formato distinto siga funcionando.
//
// Si añades una amenidad y NO la incluyes en canonical_amenity, igual va a
// matchear consigo misma (el fallback la normaliza a lowercase sin acentos).

// ──────────────────────────────────────────────────────────────────────────
// SECTOR — amenidades del entorno (POIs cercanos)
// Estas strings deben coincidir con las que deriveSectorAmenities() escribe
// en properties.amenities_sector (ver src/utils/nearby.ts).
// ──────────────────────────────────────────────────────────────────────────
export const SECTOR_AMENITIES = [
  "Transporte público",
  "Universidades",
  "Comercio",
  "Parques",
  "Farmacias",
  "Gimnasio cerca",
  "Zona tranquila",
  "Vida nocturna",
] as const;

// ──────────────────────────────────────────────────────────────────────────
// PROPIEDAD — qué tiene el lugar (interior + exterior)
// El matching usa la UNIÓN de interior + exterior contra
// desired_amenities_interior, así que cualquier amenidad de esta lista puede
// vivir en cualquiera de los dos buckets desde el lado del propietario.
// ──────────────────────────────────────────────────────────────────────────

// Cosas DENTRO del apartamento (espacio privado del inquilino).
export const PROPERTY_AMENITIES_INTERIOR = [
  "Amoblado",
  "Cocina integral",
  "Aire acondicionado",
  "Calefacción",
  "Calentador",
  "Closet",
  "Balcón",
  "Terraza",
  "Estudio",
  "Chimenea",
  "Citófono",
  "Internet / WiFi",
  "Depósito / Bodega",
] as const;

// Áreas comunes del edificio o conjunto residencial.
export const PROPERTY_AMENITIES_EXTERIOR = [
  "Parqueadero",
  "Ascensor",
  "Lavandería",
  "Gimnasio",
  "Piscina",
  "Seguridad 24/7",
  "Salón comunal",
  "Salón de juegos",
  "Zona BBQ",
  "Zonas verdes",
  "Sauna / Jacuzzi",
  "Permite mascotas",
] as const;

// Vista plana para el inquilino: una sola lista de "lo que quiero que tenga
// el lugar". El inquilino no tiene que pensar "¿está dentro o es área común?".
// Ordenadas por relevancia típica en búsqueda de renta en Bogotá.
export const PROPERTY_AMENITIES_FOR_TENANT = [
  "Parqueadero",
  "Amoblado",
  "Ascensor",
  "Gimnasio",
  "Seguridad 24/7",
  "Aire acondicionado",
  "Lavandería",
  "Balcón",
  "Terraza",
  "Cocina integral",
  "Closet",
  "Calentador",
  "Calefacción",
  "Piscina",
  "Permite mascotas",
  "Internet / WiFi",
  "Estudio",
  "Depósito / Bodega",
  "Zonas verdes",
  "Salón comunal",
  "Zona BBQ",
  "Sauna / Jacuzzi",
  "Chimenea",
  "Citófono",
  "Salón de juegos",
] as const;
