// Catálogo curado de instituciones educativas y comerciales clave de Bogotá.
//
// Existe porque OSM no tiene coverage confiable para varias universidades
// importantes (especialmente Universidad Pedagógica Nacional). Iterando los
// tags de Overpass nos quedamos cortos repetidamente — la realidad es que la
// data de OSM en Bogotá tiene gaps en las instituciones grandes.
//
// Estas coordenadas se agregan a los resultados de Overpass (con dedup por
// nombre cuando OSM ya tenía algo equivalente), garantizando que las
// instituciones más relevantes para un inquilino siempre aparezcan si están
// dentro del radio de búsqueda.
//
// Si una coordenada está mal o falta una institución importante, edita aquí.
// El cambio se refleja después de re-correr el backfill con --force.

import type { AmenityCategory } from "./nearby";

export type CuratedPOI = {
  name: string;
  category: AmenityCategory;
  lat: number;
  lng: number;
};

export const CURATED_POIS: CuratedPOI[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // UNIVERSIDADES (sedes principales, coordenadas aproximadas)
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Universidad Pedagógica Nacional — Sede Calle 72", category: "university", lat: 4.6605, lng: -74.0700 },
  { name: "Universidad Pedagógica Nacional — Sede Valmaría", category: "university", lat: 4.7245, lng: -74.0517 },
  { name: "Universidad Nacional de Colombia — Ciudad Universitaria", category: "university", lat: 4.6376, lng: -74.0833 },
  { name: "Universidad de los Andes", category: "university", lat: 4.6019, lng: -74.0660 },
  { name: "Pontificia Universidad Javeriana", category: "university", lat: 4.6275, lng: -74.0651 },
  { name: "Universidad Externado de Colombia", category: "university", lat: 4.5973, lng: -74.0727 },
  { name: "Universidad Sergio Arboleda", category: "university", lat: 4.6764, lng: -74.0507 },
  { name: "Universidad El Bosque", category: "university", lat: 4.7060, lng: -74.0420 },
  { name: "Universidad Católica de Colombia", category: "university", lat: 4.6298, lng: -74.0666 },
  { name: "Universidad Jorge Tadeo Lozano", category: "university", lat: 4.6065, lng: -74.0712 },
  { name: "Universidad de la Salle — Centro", category: "university", lat: 4.6151, lng: -74.0721 },
  { name: "Universidad de la Salle — Chapinero", category: "university", lat: 4.6432, lng: -74.0651 },
  { name: "Universidad EAN", category: "university", lat: 4.6796, lng: -74.0541 },
  { name: "Universidad Manuela Beltrán", category: "university", lat: 4.6286, lng: -74.0670 },
  { name: "Universidad Santo Tomás — Sede Aquinate", category: "university", lat: 4.6442, lng: -74.0626 },
  { name: "Universidad Antonio Nariño", category: "university", lat: 4.6122, lng: -74.0700 },
  { name: "Universidad Piloto de Colombia", category: "university", lat: 4.6395, lng: -74.0683 },
  { name: "Politécnico Grancolombiano", category: "university", lat: 4.6447, lng: -74.0710 },
  { name: "Universidad Central", category: "university", lat: 4.6212, lng: -74.0723 },
  { name: "Universidad Distrital — Sede Macarena", category: "university", lat: 4.6261, lng: -74.0696 },
  { name: "Universidad Distrital — Sede Tecnológica", category: "university", lat: 4.5757, lng: -74.1374 },
  { name: "ESAP — Escuela Superior de Administración Pública", category: "university", lat: 4.6275, lng: -74.0670 },
  { name: "Universidad ECCI", category: "university", lat: 4.6294, lng: -74.0686 },
  { name: "Universidad Militar Nueva Granada — Sede Calle 100", category: "university", lat: 4.6883, lng: -74.0489 },
  { name: "Fundación Universitaria Konrad Lorenz", category: "university", lat: 4.6469, lng: -74.0631 },
  { name: "SENA — Distrito Capital (Calle 65)", category: "university", lat: 4.6478, lng: -74.0676 },

  // ──────────────────────────────────────────────────────────────────────────
  // TRANSMILENIO — estaciones principales por troncal.
  // Las añadimos curadas porque OSM tiene tagging inconsistente: muchas
  // paradas individuales no tienen `network=TransMilenio` y caen como
  // transporte genérico. Coordenadas aproximadas; corregir si alguna está mal.
  // ──────────────────────────────────────────────────────────────────────────
  // Troncal Caracas (Carrera 14) — sur a norte
  { name: "Estación Avenida Jiménez (TransMilenio)", category: "transmilenio", lat: 4.6012, lng: -74.0720 },
  { name: "Estación Calle 26 (TransMilenio)", category: "transmilenio", lat: 4.6203, lng: -74.0703 },
  { name: "Estación Profamilia - Calle 34 (TransMilenio)", category: "transmilenio", lat: 4.6296, lng: -74.0681 },
  { name: "Estación Calle 39 (TransMilenio)", category: "transmilenio", lat: 4.6333, lng: -74.0679 },
  { name: "Estación Calle 45 (TransMilenio)", category: "transmilenio", lat: 4.6376, lng: -74.0669 },
  { name: "Estación Marly (TransMilenio)", category: "transmilenio", lat: 4.6419, lng: -74.0671 },
  { name: "Estación Calle 57 (TransMilenio)", category: "transmilenio", lat: 4.6463, lng: -74.0667 },
  { name: "Estación Calle 63 (TransMilenio)", category: "transmilenio", lat: 4.6521, lng: -74.0664 },
  { name: "Estación Flores - Calle 72 (TransMilenio)", category: "transmilenio", lat: 4.6594, lng: -74.0660 },
  { name: "Estación Calle 76 (TransMilenio)", category: "transmilenio", lat: 4.6635, lng: -74.0660 },
  { name: "Estación Héroes (TransMilenio)", category: "transmilenio", lat: 4.6671, lng: -74.0660 },
  // Caracas norte (Autonorte)
  { name: "Estación Calle 85 (TransMilenio)", category: "transmilenio", lat: 4.6707, lng: -74.0620 },
  { name: "Estación Virrey (TransMilenio)", category: "transmilenio", lat: 4.6722, lng: -74.0573 },
  { name: "Estación Calle 100 (TransMilenio)", category: "transmilenio", lat: 4.6878, lng: -74.0577 },
  { name: "Estación Calle 106 (TransMilenio)", category: "transmilenio", lat: 4.7008, lng: -74.0507 },
  { name: "Estación Pepe Sierra (TransMilenio)", category: "transmilenio", lat: 4.7079, lng: -74.0479 },
  { name: "Estación Calle 127 (TransMilenio)", category: "transmilenio", lat: 4.7142, lng: -74.0454 },
  { name: "Estación Calle 142 (TransMilenio)", category: "transmilenio", lat: 4.7298, lng: -74.0454 },
  { name: "Estación Mazurén (TransMilenio)", category: "transmilenio", lat: 4.7489, lng: -74.0492 },
  { name: "Estación Toberín (TransMilenio)", category: "transmilenio", lat: 4.7556, lng: -74.0419 },
  // Caracas sur
  { name: "Estación Hortúa (TransMilenio)", category: "transmilenio", lat: 4.5972, lng: -74.0794 },
  { name: "Estación Hospital (TransMilenio)", category: "transmilenio", lat: 4.5876, lng: -74.0866 },
  { name: "Estación Tercer Milenio (TransMilenio)", category: "transmilenio", lat: 4.5988, lng: -74.0903 },
  // Eje Ambiental (Avenida Jiménez)
  { name: "Estación Las Aguas (TransMilenio)", category: "transmilenio", lat: 4.6024, lng: -74.0681 },
  { name: "Estación Museo del Oro (TransMilenio)", category: "transmilenio", lat: 4.6014, lng: -74.0731 },
  // Troncal NQS (Carrera 30)
  { name: "Estación Universidad Nacional (TransMilenio)", category: "transmilenio", lat: 4.6382, lng: -74.0843 },
  { name: "Estación NQS Calle 75 (TransMilenio)", category: "transmilenio", lat: 4.6598, lng: -74.0837 },
  { name: "Estación Polo (TransMilenio)", category: "transmilenio", lat: 4.6648, lng: -74.0828 },
  { name: "Estación NQS Calle 100 (TransMilenio)", category: "transmilenio", lat: 4.6856, lng: -74.0728 },
  // Troncal Calle 80
  { name: "Estación Quirigua (TransMilenio)", category: "transmilenio", lat: 4.7079, lng: -74.1108 },
  { name: "Estación Minuto de Dios (TransMilenio)", category: "transmilenio", lat: 4.7028, lng: -74.1083 },
  { name: "Estación Granja - Carrera 53 (TransMilenio)", category: "transmilenio", lat: 4.6888, lng: -74.0973 },
  { name: "Estación Carrera 47 (TransMilenio)", category: "transmilenio", lat: 4.6800, lng: -74.0911 },
  // Troncal Suba
  { name: "Estación Suba Calle 95 (TransMilenio)", category: "transmilenio", lat: 4.7135, lng: -74.0773 },
  { name: "Estación Suba TV (TransMilenio)", category: "transmilenio", lat: 4.7299, lng: -74.0805 },

  // ──────────────────────────────────────────────────────────────────────────
  // CENTROS COMERCIALES principales (los que no fallan en OSM no hace daño
  // tenerlos aquí — el dedup por nombre evita duplicados)
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Centro Andino", category: "mall", lat: 4.6677, lng: -74.0530 },
  { name: "El Retiro Centro Comercial", category: "mall", lat: 4.6670, lng: -74.0535 },
  { name: "Atlantis Plaza", category: "mall", lat: 4.6677, lng: -74.0541 },
  { name: "Centro Comercial Unicentro", category: "mall", lat: 4.7027, lng: -74.0419 },
  { name: "Hacienda Santa Bárbara", category: "mall", lat: 4.6928, lng: -74.0294 },
  { name: "Gran Estación", category: "mall", lat: 4.6541, lng: -74.1057 },
  { name: "Salitre Plaza", category: "mall", lat: 4.6557, lng: -74.0989 },
  { name: "Plaza Imperial", category: "mall", lat: 4.7437, lng: -74.0954 },
  { name: "Titán Plaza", category: "mall", lat: 4.6906, lng: -74.0852 },
  { name: "Centro Mayor", category: "mall", lat: 4.5818, lng: -74.1283 },
];
