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
Antes de puntuar, se excluyen automáticamente (Score = 0 o descartados del query) las propiedades si:
- El `price` de la propiedad es mayor al `max_budget` del inquilino.
- *(Opcional)* Si chocan restricciones estrictas (Ej. el edificio no permite mascotas y el inquilino tiene perro).

### 3.2 Score de Proximidad y Ubicación (50% del peso total)
Si la propiedad está dentro del radio de búsqueda del usuario, se le da un puntaje basado en qué tan cerca está del punto central deseado.
- **Fórmula de Decaimiento Lineal:** 
  `Score_Ubicación = GREATEST(0, 1 - (distancia_en_metros / radio_busqueda_metros))`
- *Ejemplo:* Si el usuario busca en Chapinero con un radio de 5km, y la propiedad está a 1km, el score es `1 - (1/5) = 0.8` (80%). Si está a 5km, el score es 0%.

### 3.3 Score de Entorno y Transporte (25% del peso total)
Se calcula la similitud entre las amenidades de sector que pide el usuario y las que tiene la propiedad.
- **Fórmula (Similitud de Jaccard):** 
  `Intersección / Unión`
- *Lógica SQL:* Contar cuántas amenidades coinciden entre el array `desired_amenities_sector` del usuario y el array `amenities_sector` de la propiedad, dividido por el total de amenidades únicas entre ambos.

### 3.4 Score de Características Internas (25% del peso total)
Misma fórmula de Jaccard aplicada a `desired_amenities_interior` vs `amenities_interior` de la propiedad.

### 3.5 Cálculo Final
```sql
MATCH_SCORE_PORCENTAJE = (
  (Score_Ubicación * 0.50) + 
  (Score_Entorno * 0.25) + 
  (Score_Características * 0.25)
) * 100
```

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
