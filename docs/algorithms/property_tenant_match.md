# Documentación del Diseño: Algoritmo de Match Espacial Inquilino-Propiedad

Esta documentación detalla la arquitectura, las librerías necesarias y las fórmulas matemáticas para implementar el sistema de recomendación de propiedades basado en ubicación, transporte y amenidades en RentAI, siguiendo el patrón de plataformas avanzadas.

## 1. Stack Tecnológico y Librerías Requeridas

Para implementar geolocalización de alto rendimiento y similitud matemática de conjuntos sin saturar el servidor de Node.js, toda la carga pesada se ejecutará directamente en la base de datos de Supabase.

### 1.1 Supabase & PostgreSQL: Extensión PostGIS
- **PostGIS:** Es la extensión estándar de oro en bases de datos relacionales para análisis espacial. Permite almacenar puntos geográficos reales y calcular distancias en metros usando la curvatura de la tierra de forma muy eficiente.
- **¿Cómo se activa?** Ejecutando `CREATE EXTENSION IF NOT EXISTS postgis;` en una migración de Supabase.

### 1.2 Procedimientos Almacenados (RPC)
- El algoritmo se implementará como una **Función RPC (Remote Procedure Call)** en PL/pgSQL. 
- **Ventaja:** En lugar de traer miles de propiedades al frontend y calcular el Match en el navegador o en Next.js (lo cual sería lentísimo y consumiría mucha memoria), el servidor SQL filtra, puntúa, ordena y solo devuelve los mejores 20 resultados al instante.

---

## 2. Modelado de Datos (Cambios Necesarios)

### En la tabla `properties`
Las propiedades ya cuentan con Latitud y Longitud, pero debemos optimizarlas para búsquedas espaciales:
```sql
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS location geography(POINT);
-- Indice espacial para búsquedas en milisegundos:
CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties USING GIST (location);
```

### En la tabla `profiles` (Arrendatarios)
Necesitamos recopilar qué es lo que busca el inquilino en la pantalla de "Completar Perfil". Agregaremos estos campos a su perfil JSON o en nuevas columnas:
- `target_location` (geography(POINT)): El centro del barrio o zona donde quiere vivir.
- `search_radius_meters` (integer): A cuántos metros a la redonda está dispuesto a vivir (Ej: 3000 metros).
- `desired_amenities_sector` (text[]): Ej. `['transporte_publico', 'parques']`.
- `desired_amenities_interior` (text[]): Ej. `['lavanderia', 'ascensor']`.

---

## 3. Fórmulas Matemáticas del Algoritmo

El Match Score (0% a 100%) es el resultado de una suma ponderada de 3 dimensiones.

### 3.1 Filtros Innegociables (Hard Constraints)
Antes de puntuar, se excluyen propiedades si:
- El `monthly_rent` queda fuera del rango `[min_budget, max_budget]` del inquilino.
- El `property_type` no está en `desired_property_types` (cuando el inquilino especificó tipos). Apartamento, Casa y Habitación son categorías discretas — no admiten gradación como la distancia.
- El `bedrooms` está por debajo del `min_bedrooms` del inquilino (cuando lo especificó). Evita mostrar casas grandes a quien busca estudio.

### 3.1.1 Lo que NO es hard filter (importante)
- **`desired_localities`** se respeta como **señal de ranking suave**, no como filtro duro. La preferencia por una localidad se traduce en `target_location` vía geocoding (ver §7), y de ahí entra al algoritmo por el peso espacial del 50%. Una propiedad en una localidad vecina a la deseada puede aparecer si está geográficamente cerca y tiene buen score en las otras dimensiones — es decisión de diseño para no matar el descubrimiento.
- **`desired_neighborhoods`** funciona igual: alimenta `target_location`, no excluye.

Si en el futuro se necesita filtro estricto por localidad/barrio, la forma correcta es exponer un toggle en la pestaña Descubrir y pasarlo como parámetro adicional a la RPC, no hardcodearlo en el WHERE.

### 3.2 Score de Proximidad y Ubicación (50% del peso total)

**Bonus por barrio exacto:** si `properties.neighborhood` matchea (case-insensitive) cualquier barrio en `desired_neighborhoods` del inquilino, el score espacial es **1.0 fijo** — independiente de la distancia al centroide. Esto refleja la intuición del usuario: "elegí este barrio específicamente, una propiedad en ese barrio debería puntuar al máximo en ubicación".

Si NO matchea exacto, se aplica el decaimiento cuadrático:

- **Fórmula de Decaimiento Cuadrático:** 
  `Score_Ubicación = GREATEST(0, 1 - (distancia_en_metros / radio_busqueda_metros)²)`
- *Ejemplo:* Si el usuario busca en Chapinero con un radio de 5km:
  - Propiedad a 500m: `1 - (0.5/5)² = 0.99` (99%)
  - Propiedad a 1500m: `1 - (1.5/5)² = 0.91` (91%)
  - Propiedad a 3000m: `1 - (3/5)² = 0.64` (64%)
  - Propiedad a 5km: 0%

> **¿Por qué cuadrático y no lineal?** El lineal castigaba muy fuerte distancias intermedias — una propiedad a 1500m con radio 5km daba 0.7 (lineal) cuando *está claramente en la zona*. Cuadrático refleja mejor "está en mi barrio" para distancias cortas y solo penaliza fuerte cuando la propiedad ya está lejos. Cambio aplicado en migración `20260525120000_match_score_curves.sql`.

### 3.3 Score de Entorno y Transporte (25% del peso total)
Se mide qué fracción de las amenidades de sector que el usuario **pidió** están presentes en la propiedad.
- **Fórmula (Cobertura):** 
  `|Intersección| / |amenidades_pedidas_por_usuario|`
- *Lógica SQL:* Contar cuántas amenidades del array `desired_amenities_sector` del usuario tiene la propiedad en `amenities_sector`, dividido entre el total de amenidades que el usuario pidió.
- *Ejemplo:* Usuario pide `["Transporte", "Parques", "Comercio"]`, propiedad tiene `["Transporte", "Universidades", "Comercio", "Parques", "Farmacias"]` → 3 de 3 pedidas cubiertas → score `1.0` (100%). Las amenidades extra de la propiedad NO penalizan.

#### Vocabulario unificado de amenidades

Los tres formularios (perfil tenant en CompleteProfile, edición en Profile, publicación owner en NewProperty) consumen las mismas listas exportadas desde [src/utils/bogotaAmenities.ts](../../src/utils/bogotaAmenities.ts):

- `SECTOR_AMENITIES` — 8 opciones (mismo set que `deriveSectorAmenities()` en nearby.ts deriva de los POIs)
- `PROPERTY_AMENITIES_INTERIOR` + `PROPERTY_AMENITIES_EXTERIOR` — divididas para que el owner publique de forma organizada
- `PROPERTY_AMENITIES_FOR_TENANT` — lista plana combinada que ve el tenant (no tiene que distinguir interior vs exterior)

Si añades un concepto nuevo: edítalo aquí y también extiende la función SQL `canonical_amenity` para que las variantes que pueda guardar el scraper sigan matcheando.

#### Normalización canónica de amenidades

Las strings de amenidades en la BD son inconsistentes: el scraper de FincaRaíz guarda `"Garaje(s)"` o `"Parqueadero Visitantes - Exterior"`, el usuario podría escribir `"Parking"` o `"Parqueadero"`. Para que estos matcheen entre sí, la RPC los pasa por una función `public.canonical_amenity(text)` que mapea variantes al mismo concepto canónico:

| Variantes en la BD | Forma canónica |
|---|---|
| Garaje, Parqueadero, Parking, Cochera, Garaje(s) | `parqueadero` |
| Aire acondicionado, A/C, AC | `aire_acondicionado` |
| Piscina, Pool | `piscina` |
| Gimnasio, Gym, Fitness | `gimnasio` |
| Sauna, Turco, Jacuzzi, Spa | `spa` |
| ... | ... |

Ver [supabase/migrations/20260525120000_match_score_curves.sql](../../supabase/migrations/20260525120000_match_score_curves.sql) para la lista completa. Para añadir un concepto: editar la función `canonical_amenity` agregando un `WHEN ... THEN`. Si una amenidad no matchea ninguna regla, cae al fallback (string normalizada sin acentos/mayúsculas) — así dos amenidades custom escritas igual siguen matcheando aunque no estén en la lista.

> **¿Por qué Cobertura y no Jaccard?** Jaccard (intersection/union) penalizaba propiedades en zonas muy completas con muchos POIs derivados — una propiedad con TODO lo que el usuario pidió y comodidades extra bajaba a ~43% en vez de 100%. Cobertura mide lo que realmente importa: "¿este lugar tiene lo que necesito?". Cambio aplicado en la misma migración.

### 3.4 Score de Características de la Propiedad (25% del peso total)
Misma fórmula de Cobertura aplicada a `desired_amenities_interior` vs **la unión** de `amenities_interior` + `amenities_exterior` de la propiedad.

> **¿Por qué la unión?** El tenant pide cosas como "Parqueadero", "Gimnasio", "Ascensor" sin distinguir si están dentro del apartamento o son áreas comunes del edificio — para el inquilino es la misma pregunta ("¿la propiedad lo tiene?"). El owner sí los separa al publicar (organización), pero esa distinción no debe afectar el matching. La unión evita el bug donde un tenant pidiendo "Parqueadero" obtenía 0% interior porque el owner lo categorizó como exterior.

### 3.5 Cálculo Final
```sql
MATCH_SCORE_PORCENTAJE = (
  (Score_Ubicación * 0.50) +   -- cuadrático
  (Score_Entorno * 0.25) +     -- cobertura
  (Score_Características * 0.25) -- cobertura
) * 100
```

**Ejemplo concreto:** usuario busca en 3 barrios de Chapinero con radio 5km, pidió 4 amenidades de sector y 3 interiores. Una propiedad a 1km del centroide, con 3 de 4 sector + 3 de 3 interior:
- Ubicación: `1 - (1/5)² = 0.96` → contribución `0.48`
- Sector: `3/4 = 0.75` → contribución `0.1875`
- Interior: `3/3 = 1.0` → contribución `0.25`
- **Total: 92%** (antes daba ~50% con lineal + Jaccard)

---

## 4. Estructura del Código a Implementar (Skill Set)

### Archivo 1: Migración SQL (`supabase/migrations/xxxx_match_algorithm.sql`)
1. Habilitar la extensión `postgis`.
2. Migrar las coordenadas actuales (`lat`/`lng`) al campo espacial `location geography(POINT)`.
3. Crear el índice `GIST`.
4. Crear la función `match_properties(user_id uuid) RETURNS TABLE(...)`.

### Archivo 2: Actualización de Interfaz (`CompleteProfile.tsx`)
1. Agregar un mapa pequeño o un buscador de direcciones (usando la API de Google Maps o Mapbox) para que el inquilino defina el punto central de su búsqueda.
2. Agregar multi-selects para "Amenidades de la zona deseadas" y "Amenidades del apartamento deseadas".

### Archivo 3: Actualización del API en Next.js (`app/api/matches/properties/route.ts`)
1. Endpoint que llama a `supabase.rpc('match_properties', { user_id })`.
2. Devuelve la lista de propiedades junto con la columna virtual `match_score_percentage` y `distance_meters`.

---

## 5. Pipeline de POIs (amenidades de sector verificadas)

Las amenidades de sector (`properties.amenities_sector`) que el algoritmo compara contra las preferencias del inquilino **no son texto manual del propietario**. Se derivan de POIs reales de OpenStreetMap consultados vía Overpass API, de modo que el Jaccard del 25% sectorial se calcule contra realidad observada y no contra promesas del listado.

### Componentes

- **Motor de búsqueda:** [`src/utils/nearby.ts`](../../src/utils/nearby.ts) consulta Overpass en un radio de 1 km y categoriza los POIs en 9 grupos: TransMilenio, transporte público, universidades, supermercados, parques, farmacias, gimnasios, restaurantes y vida nocturna.
- **Almacenamiento:** [`supabase/migrations/20260523_property_nearby_pois.sql`](../../supabase/migrations/20260523_property_nearby_pois.sql) añade `properties.nearby_pois jsonb` (con `places`, `summary`, `radius`) y `nearby_computed_at timestamptz`.
- **Override de tags:** la función `deriveSectorAmenities` traduce los POIs encontrados a los strings del vocabulario del inquilino (`"Transporte público"`, `"Universidades"`, `"Zona tranquila"`, etc.) y **sobrescribe** `amenities_sector` para que el Jaccard compare manzanas con manzanas.
- **UI:** [`src/flow/components/EnvironmentSummary.tsx`](../../src/flow/components/EnvironmentSummary.tsx) renderiza el resumen "Qué hay alrededor" en el detail sheet de la propiedad.

> ⚠️ **Vocabulario acoplado:** las constantes `SECTOR_TAG` en `nearby.ts` y `scripts/backfill-pois.mjs` deben coincidir exactamente con las opciones de `desired_amenities_sector` en `CompleteProfile.tsx`. Si cambias un string en un lado sin actualizar el otro, el Jaccard cae a 0 silenciosamente.

### Quién dispara la computación

| Origen | ¿Auto-computa POIs? | Cómo |
|---|---|---|
| **Owner UI** — `POST /api/owner/properties` | ✅ Sí | Inline tras el insert, llamando `computeAndStorePois` |
| **Owner UI** — `PATCH` con cambio de coordenadas | ✅ Sí | Solo si `latitude` o `longitude` cambian |
| **Scraper** — `webscrapper/scraper_to_supabase.py` | ❌ No | Escribe directo a Supabase, salta la API |

**Por qué el scraper no lo hace inline:** cada llamada a Overpass cuesta 2–5 s y puede fallar; meterla en el scraper lo haría lento, frágil ante caídas de Overpass, y dejaría a Playwright bloqueado esperando. La separación scrape → backfill es decisión de diseño.

---

## 6. Operación: backfill y troubleshooting de POIs

### Cuándo correr el backfill
Después de cada batch del scraper, o cuando veas propiedades sin la sección "Qué hay alrededor" en su detalle.

```bash
# Solo las que tienen nearby_pois NULL (idempotente, retoma donde quedó)
node --env-file=.env.local scripts/backfill-pois.mjs

# Recomputar TODAS (útil si cambias el vocabulario de tags en nearby.ts)
node --env-file=.env.local scripts/backfill-pois.mjs --force
```

> Correr desde **PowerShell de Windows**, no desde WSL, salvo que tengas Node 20+ instalado en WSL.

### Rate-limiting de Overpass

El servidor público (`overpass-api.de`) limita ~10 k requests/día y **cierra conexiones bajo carga**, lo que aparece como un escueto `fetch failed` sin código HTTP. El script lo maneja con:

1. **Retry con backoff exponencial** — hasta 4 intentos por propiedad, esperando 2 s → 4 s → 8 s.
2. **Throttle de 2 s** entre propiedades (`THROTTLE_MS`).
3. **Runs idempotentes** — sin `--force` solo procesa las `NULL`, así puedes re-correrlo cuantas veces haga falta sin desperdiciar requests.

### Qué hacer si sigues viendo fallas

| Síntoma | Acción |
|---|---|
| Muchas fallan en un solo run | Espera 5–10 min y vuelve a correr **sin** `--force`. Cada pasada llena más. |
| Una propiedad falla 4 veces seguidas | Revisa que su `latitude`/`longitude` sean válidos (ej. que no esté en el océano o en otro país). |
| Overpass público caído por horas | Cambia `OVERPASS_ENDPOINT` en el script a `https://overpass.kumi.systems/api/interpreter` (mirror). |
| Recuperar 1–2 propiedades puntuales | Ábrelas en `/owner/properties` y guarda sin cambios — el PATCH re-dispara `computeAndStorePois` para esa fila. |

Los detalles operativos extendidos están en el header del propio script: [`scripts/backfill-pois.mjs`](../../scripts/backfill-pois.mjs).

---

## 6.5 Incidente: drift entre migración y BD (2026-05-24)

La función `match_properties` en producción tuvo durante varios días tres `WHERE` adicionales (`monthly_budget`, `desired_property_types`, `desired_localities`) que no estaban en el archivo de migración. El filtro de `desired_localities` cruzado con `properties.localidad = NULL` (el scraper no llenaba la columna) excluía todas las propiedades scrapeadas cuando el inquilino seleccionaba alguna localidad.

**Lo que se hizo:**
1. **Scraper:** `webscrapper/scraper_to_supabase.py` ahora extrae `localidad` del JSON de FincaRaíz (`locations.locality` → `location_main.name` → fallback) y la normaliza al nombre canónico (`"Chapinero"`, `"Usaquén"`, etc.) que también usa el formulario del inquilino.
2. **Backfill manual:** las filas existentes se actualizaron con un UPDATE que mapea `neighborhood ILIKE '%chapiner%'` → `localidad = 'Chapinero'` (ver historial de SQL editor; no quedó en migración porque depende de cómo se vea cada BD).
3. **RPC:** la migración `20260524120000_match_properties_soft_locality.sql` recrea la función con localidad como soft ranking y reconcilia el archivo con lo deployado.

**Lección:** modificar funciones SQL directamente en el dashboard de Supabase sin escribir migración hace que las migraciones del repo dejen de ser fuente de verdad. Si alguien reaplica las migraciones desde cero, la app se comporta diferente. Política: cualquier cambio a una RPC pasa por archivo en `supabase/migrations/`.

---

## 7. Setup del centro de búsqueda del inquilino (`target_location`)

El peso espacial (50 %) solo se aplica si el perfil tiene `target_location`. Esto se calcula así:

1. En el onboarding ([`CompleteProfile.tsx`](../../src/flow/components/CompleteProfile.tsx)) o al editar perfil ([`Profile.tsx`](../../src/flow/components/Profile.tsx)), el inquilino elige `desired_localities` (general) y opcionalmente `desired_neighborhoods` (refinamiento). Los barrios disponibles se filtran por las localidades elegidas usando [`bogotaZones.ts`](../../src/utils/bogotaZones.ts), con escape hatch de input libre para barrios no listados.
2. Al guardar, [`geocodeWeightedTarget`](../../src/utils/geocodeTarget.ts) geocodifica ambas listas vía `/api/maps/geocode` (Google → Nominatim → Photon) y calcula un **centroide ponderado**:
   - **60 %** del peso lo aportan las localidades (uniforme entre ellas)
   - **40 %** del peso lo aportan los barrios (uniforme entre ellos)
   - Si solo se proporciona una de las dos listas, esa toma el 100 %
3. El PATCH a `/api/profile` recibe `target_lat`/`target_lng` y llama la RPC [`set_profile_target`](../../supabase/migrations/20260523120000_set_profile_target.sql), que escribe el `geography(POINT)` (Supabase REST no acepta tipos PostGIS directamente, por eso la RPC).

### Por qué la localidad pesa más que los barrios

El usuario promedio que busca apartamento por primera vez en Bogotá conoce las **localidades** (Chapinero, Usaquén, Suba) mejor que los **barrios** (El Nogal vs Quinta Camacho). La localidad es la señal más confiable de "dónde quiero vivir en general", mientras que los barrios son un refinamiento opcional. Al pesar 60/40, evitamos que un mal pick de barrio (o un barrio mal geocodificado por Nominatim) desplace el centroide a una zona que el usuario no quería realmente.

Ejemplo: usuario pide `Chapinero` + `El Chicó`. El centroide queda mayormente en el centro de Chapinero (~60%) con un sesgo hacia El Chicó (~40%). Una propiedad en Quinta Camacho (vecina) sigue rankeando bien aunque no esté en El Chicó.

Si `target_location` queda `NULL` (geocoder cayó, o el usuario no eligió zonas), la RPC `match_properties` cae al default `0.5` para el componente espacial — el ranking sigue funcionando pero pierde su mejor señal.
