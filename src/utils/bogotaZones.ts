// Localidades y barrios canónicos de Bogotá.
// Esta lista alimenta tanto el picker del perfil (CompleteProfile / Profile)
// como la normalización del scraper (webscrapper/scraper_to_supabase.py debe
// mapear sus strings al mismo conjunto). Si añades una localidad aquí, también
// actualiza _LOCALIDADES_CANONICAS en el scraper.
//
// Los barrios listados son una selección pragmática de los más reconocidos
// por categoría de renta — no es exhaustiva. El usuario puede añadir barrios
// custom vía el input de texto libre cuando ninguno de la lista aplica.

export const BOGOTA_LOCALITIES = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito",
  "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos",
  "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda",
  "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
] as const;

export type BogotaLocality = (typeof BOGOTA_LOCALITIES)[number];

export const NEIGHBORHOODS_BY_LOCALITY: Record<BogotaLocality, string[]> = {
  "Usaquén": [
    "Santa Bárbara", "Country Club", "Cedritos", "Toberín",
    "San Cristóbal Norte", "Verbenal", "Usaquén Centro", "Bella Suiza",
    "Santa Ana", "La Carolina", "Lijacá", "Country Sur",
  ],
  "Chapinero": [
    "El Chicó", "El Nogal", "El Refugio", "El Retiro", "La Cabrera",
    "Los Rosales", "Quinta Camacho", "Chapinero Central", "Chapinero Alto",
    "La Salle", "El Castillo", "Antiguo Country", "La Porciúncula", "Sucre",
  ],
  "Santa Fe": [
    "La Macarena", "La Perseverancia", "Las Aguas", "Santa Fe Centro",
    "Bosque Izquierdo", "Cruces", "Las Nieves",
  ],
  "San Cristóbal": [
    "20 de Julio", "La Victoria", "San Blas", "Sosiego", "Velódromo",
    "La Gloria", "Altamira",
  ],
  "Usme": [
    "Usme Centro", "La Esperanza", "Yomasa", "Comuneros", "Danubio",
    "Gran Yomasa",
  ],
  "Tunjuelito": [
    "Tunjuelito Centro", "Venecia", "Tunal", "Muzú", "San Carlos",
  ],
  "Bosa": [
    "Bosa Centro", "Bosa La Estación", "Apogeo", "Porvenir", "Holanda",
    "El Recreo",
  ],
  "Kennedy": [
    "Castilla", "Banderas", "Kennedy Central", "Patio Bonito", "Tintal",
    "Timiza", "Class", "Marsella", "Britalia",
  ],
  "Fontibón": [
    "Fontibón Centro", "Modelia", "Hayuelos", "Versalles", "Capellanía",
    "Ciudad Hayuelos", "El Refugio",
  ],
  "Engativá": [
    "Boyacá Real", "Bolivia", "La Granja", "Engativá Centro", "Las Ferias",
    "Bellavista", "Florida", "Villa Luz", "Normandía",
  ],
  "Suba": [
    "Niza", "Mazurén", "Britalia", "Pinar de Suba", "Suba Centro",
    "Tibabuyes", "Salitre Norte", "El Rincón", "Aures", "La Campiña",
    "La Carolina", "Casa Blanca",
  ],
  "Barrios Unidos": [
    "Polo Club", "Los Andes", "La Castellana", "La Patria", "Modelo",
    "Once de Noviembre", "Alcázares", "Concepción Norte",
  ],
  "Teusaquillo": [
    "Galerías", "La Soledad", "Teusaquillo Centro", "Quinta Paredes",
    "Pablo VI", "Sears", "Ciudad Salitre", "Belalcázar", "La Estrella",
  ],
  "Los Mártires": [
    "Santa Isabel", "Voto Nacional", "La Sabana", "San Victorino",
    "Ricaurte", "La Pepita",
  ],
  "Antonio Nariño": [
    "Restrepo", "San Antonio", "Ciudad Berna", "Olaya", "Eduardo Santos",
  ],
  "Puente Aranda": [
    "Centro Industrial", "Ciudad Montes", "Puente Aranda Centro",
    "Salazar Gómez", "La Esperanza Sur", "Pensilvania",
  ],
  "La Candelaria": [
    "La Candelaria", "Egipto", "Belén", "Centro Histórico",
  ],
  "Rafael Uribe Uribe": [
    "Quiroga", "San José", "Marruecos", "Diana Turbay", "Olaya",
  ],
  "Ciudad Bolívar": [
    "Lucero", "Ismael Perdomo", "Jerusalén", "San Francisco", "El Tesoro",
    "Arborizadora",
  ],
  "Sumapaz": [
    "Nazareth", "San Juan",
  ],
};

/**
 * Returns the union of barrios for the given localities, deduplicated and
 * grouped to preserve locality order for display purposes.
 */
export function neighborhoodsForLocalities(
  localities: readonly string[],
): { locality: string; neighborhoods: string[] }[] {
  return localities
    .filter((l): l is BogotaLocality =>
      (BOGOTA_LOCALITIES as readonly string[]).includes(l),
    )
    .map((l) => ({
      locality: l,
      neighborhoods: NEIGHBORHOODS_BY_LOCALITY[l] || [],
    }));
}
