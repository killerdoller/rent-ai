# RentAI — Pitch de Producto y Modelo de Negocio

---

## El problema

Encontrar vivienda en arriendo en Bogotá es un proceso lento, frustrante e ineficiente para ambas partes:

- **El inquilino** navega portales con cientos de listados sin filtros inteligentes, manda mensajes a propietarios que no responden, y descubre tarde que no cumplen los requisitos (presupuesto, mascotas, convivencia).
- **El propietario** recibe decenas de solicitudes sin poder evaluar rápidamente la compatibilidad de los candidatos ni entender el mercado en el que compite.

El resultado: procesos que duran semanas, con alta tasa de contactos irrelevantes y decisiones basadas en intuición, no en datos.

---

## La solución: RentAI

RentAI es una plataforma de **matching inteligente bilateral** para arrendamiento. Conecta inquilinos y propietarios —y a personas que buscan roommate— a través de un sistema de compatibilidad basado en datos reales, geolocalización y aprendizaje de preferencias.

La interfaz es familiar (tipo Tinder: swipe para descubrir), pero por debajo opera una capa de inteligencia que ordena, filtra y puntúa cada opción antes de mostrársela al usuario.

---

## Cómo funciona

### Para el inquilino

1. **Crea su perfil inteligente:** define rango de presupuesto, zona deseada en Bogotá (localidad + barrio), amenidades que necesita en el sector (TransMilenio, universidades, parques) y en la propiedad (ascensor, lavandería), estilo de vida y dealbreakers.
2. **Descubre propiedades ordenadas:** el algoritmo calcula un score de compatibilidad para cada propiedad y muestra primero las más relevantes. No es orden aleatorio ni cronológico: es el ranking que más le conviene a ese usuario específico.
3. **Da like o rechaza:** el like no es suficiente para contactar al propietario.
4. **Match bilateral → chat:** solo cuando el propietario también acepta al inquilino se habilita el chat. Ambas partes eligieron al otro.

### Para el propietario

1. **Publica su propiedad** con fotos, descripción, amenidades y ubicación. La plataforma enriquece automáticamente el listado con datos de POIs reales del entorno (qué transporte, comercio y servicios hay cerca) consultando OpenStreetMap.
2. **Ve quién está interesado:** lista de inquilinos que dieron like, con su perfil de compatibilidad y datos psicográficos.
3. **Acepta candidatos que le convencen:** al aceptar a alguien que ya le dio like, el match se crea automáticamente y se abre el chat.
4. **Accede a su dashboard de analytics:** visualiza métricas de su propiedad y entiende su posición en el mercado.

### Para quien busca roommate

Flujo paralelo al de propiedades: el usuario puede activar el modo "busco roommate", construir su perfil de convivencia y descubrir personas compatibles. El match también es bilateral: los dos deben aceptarse para poder chatear.

---

## Diferenciadores tecnológicos

### 1. Matching bilateral (no unilateral)

En los portales tradicionales, el inquilino aplica y espera. En RentAI, **ambas partes se eligen mutuamente**. Esto reduce el ruido: los matches son de mayor calidad porque representan afinidad confirmada en dos sentidos. El match se crea a nivel de base de datos mediante un trigger que detecta automáticamente cuando ambos lados han expresado interés.

---

### 2. Algoritmo espacial de match inquilino-propiedad

El orden en que el inquilino ve las propiedades no es aleatorio. Cada propiedad recibe un **score de compatibilidad (0–100%)** calculado en PostgreSQL mediante una función RPC con PostGIS, que considera tres dimensiones:

| Dimensión | Peso | Cómo se mide |
|---|---|---|
| Proximidad a la zona deseada | 50% | Distancia geográfica real con decaimiento cuadrático |
| Amenidades del sector | 25% | Cobertura: ¿la propiedad tiene lo que el inquilino pidió en el entorno? |
| Amenidades de la propiedad | 25% | Cobertura: ¿el apartamento tiene lo que el inquilino necesita? |

**El decaimiento cuadrático (no lineal):** una propiedad a 1.5 km dentro de un radio de 5 km obtiene 91% en ubicación —no 70% como daría un modelo lineal—, porque en la práctica *sigue estando en la zona*. El modelo cuadrático refleja mejor la percepción humana de "cercanía relativa".

**Centroide ponderado de búsqueda:** el inquilino puede elegir localidades (Chapinero, Usaquén) y refinar por barrios (El Chicó, Quinta Camacho). El sistema geocodifica ambas listas y calcula un punto central ponderado: las localidades aportan el 60% del peso y los barrios el 40%, porque el usuario promedio de Bogotá conoce mejor las localidades que los barrios específicos. Esto evita que una mala selección de barrio distorsione el resultado.

**Filtros duros vs. señales de ranking:** el presupuesto y el tipo de propiedad son filtros estrictos (si la propiedad no cabe en el presupuesto, no aparece). La localidad y el barrio preferidos son señales de ranking suave: una propiedad en una zona vecina puede aparecer si está geográficamente cerca y tiene buen score en las otras dimensiones, preservando el descubrimiento.

---

### 3. POIs reales de OpenStreetMap

Las amenidades de sector que entran al algoritmo **no son texto libre del propietario**. Se derivan de puntos de interés reales consultados a OpenStreetMap vía Overpass API en un radio de 1 km alrededor de cada propiedad. El sistema categoriza los POIs encontrados en 8 grupos: TransMilenio, transporte público, universidades, supermercados, parques, farmacias, gimnasios y restaurantes.

Esto garantiza que el 25% de peso sectorial del algoritmo compare datos objetivos, no promesas del anuncio. Una propiedad que dice "cerca a universidades" pero está a 4 km no engaña al modelo: el modelo sabe la verdad.

---

### 4. Algoritmo híbrido de 4 capas para matching de roommates

El matching entre personas que buscan convivir es más complejo que el de propiedades. RentAI implementa un motor de compatibilidad de **4 capas acumulativas**:

**Capa 1 — Financiera:** evalúa el solapamiento entre los rangos de presupuesto de ambas personas. Si los rangos no se cruzan en absoluto, el score financiero es bajo pero no nulo (distancia proporcional al gap).

**Capa 2 — Conductual:** mide la distancia euclidiana entre el nivel de limpieza (`cleanliness_level`) y el nivel de socialización (`social_level`) de ambos perfiles. Dos personas con hábitos extremadamente distintos de convivencia recibirán un score bajo en esta capa independientemente de sus intereses.

**Capa 3 — Afinidad:** cuenta las intersecciones entre `lifestyle_tags` (música, deporte, cocina, gaming…) e `interests` de ambos usuarios. La similitud de intereses es un predictor fuerte de que dos personas vayan a disfrutar convivir.

**Capa 4 — Semántica (NLP):** analiza el texto libre de la biografía de cada usuario con TF-IDF y similitud coseno (scikit-learn). Esta capa captura afinidades que los tags no pueden expresar: el "vibe", el ritmo de vida, los planes de convivencia que la persona describe con sus propias palabras.

El score final pondera las cuatro capas, y el usuario puede ajustar los pesos desde su perfil (sliders de importancia), de modo que quien prioriza el presupuesto sobre los intereses comunes puede configurarlo así.

**Motor desplegado:** el algoritmo corre en un contenedor FastAPI alojado en Hugging Face Spaces. La base de datos notifica al motor mediante triggers cuando se crea o actualiza un perfil, y el motor precalcula los scores de compatibilidad. Si el motor está inactivo o la red falla, el trigger tiene manejo de excepciones que no bloquea el registro del usuario: la experiencia del usuario es prioritaria sobre la IA.

---

### 5. Dashboard de Business Intelligence para propietarios

El propietario no solo publica y espera: recibe inteligencia accionable sobre su propiedad.

**Gráfico de radar de personalidad:** muestra el perfil psicográfico promedio de los inquilinos que le dieron like (nivel de limpieza, nivel de socialización, rango de presupuesto promedio). El propietario puede ver en segundos qué tipo de persona está atrayendo.

**Embudo de conversión:** visualiza las tres etapas del funnel — vistas → likes → matches — y muestra dónde se produce la mayor caída. Si hay muchas vistas pero pocos likes, el problema puede ser el precio o las fotos. Si hay likes pero pocos matches, el propietario puede revisar su criterio de selección.

**Indicador de mercado:** compara automáticamente el precio de la propiedad contra el precio promedio de todas las propiedades en la plataforma. El propietario sabe si está por encima o por debajo del mercado sin necesidad de investigar manualmente.

---

### 6. Pipeline de datos propio (webscraping)

Las propiedades en la plataforma no son solo las que suben los propietarios. RentAI tiene un pipeline de extracción de datos de FincaRaíz que:

1. Scrapea listados reales con Playwright (manejo de JavaScript y paginación dinámica).
2. Sube las propiedades directamente a Supabase con sus imágenes en storage.
3. Enriquece cada propiedad con POIs de OpenStreetMap en un proceso de backfill asíncrono posterior.

Esto permite tener un catálogo con volumen desde el día uno, sin depender únicamente de que los propietarios adopten la plataforma.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React, Tailwind CSS v4, Framer Motion |
| Backend | Next.js API Routes (Node.js) |
| Base de datos | Supabase (PostgreSQL + PostGIS + Realtime) |
| Algoritmo espacial | PL/pgSQL, función RPC `match_properties` |
| Motor de roommates | Python, FastAPI, scikit-learn (TF-IDF), Hugging Face Spaces |
| Geocodificación | Google Maps → Nominatim → Photon (fallback en cascada) |
| POIs | OpenStreetMap vía Overpass API |
| Scraping | Playwright, Python |
| Autenticación | Supabase Auth (email, Google OAuth, OTP) |
| Mapas UI | Leaflet + react-leaflet |

---

## Modelo de negocio

### Propuesta de valor por actor

| Actor | Valor que recibe |
|---|---|
| **Inquilino** | Propiedades ordenadas por compatibilidad real. No pierde tiempo con opciones que no le sirven. Contacto solo con propietarios que también lo eligieron a él. |
| **Propietario** | Candidatos filtrados, datos del mercado, analítica de su propiedad. Menos fricción para encontrar un buen inquilino. |

### Monetización

**Fase 1 — Tracción (actual):** plataforma gratuita para construir red de usuarios y datos de comportamiento. El valor del producto se demuestra con el volumen y la calidad de los matches.

**Fase 2 — Freemium para propietarios:**
- Plan gratuito: publicar hasta 1 propiedad, ver interesados, acceso básico al dashboard.
- **Plan Premium ($X/mes):** hasta 5 propiedades, dashboard completo, mayor visibilidad en el ranking de propiedades mostradas a inquilinos, badge de "propietario verificado".

**Fase 3 — Comisión por cierre:**
- Comisión sobre el primer mes de arriendo de los contratos firmados a través de la plataforma.
- Habilitado por funcionalidades futuras: firma digital integrada, verificación de identidad, gestión del contrato.

**Servicios adicionales (mediano plazo):**
- Verificación de antecedentes (alianza con empresas de data crediticia).
- Seguro de arrendamiento integrado.
- Panel para inmobiliarias (gestión de múltiples propiedades y propietarios).

### Por qué el modelo escala

El algoritmo mejora con datos: más perfiles → mejores scores → mejores matches → más retención. Este efecto de red de datos es una barrera de entrada que los portales tradicionales (sin algoritmo de compatibilidad) no pueden replicar sin reconstruir toda su infraestructura.

---

## Resumen ejecutivo

RentAI resuelve la ineficiencia del mercado de arrendamiento estudiantil en Bogotá reemplazando la búsqueda por scroll con un sistema de compatibilidad inteligente. La combinación de matching bilateral, algoritmo espacial con datos reales de OpenStreetMap, motor NLP para roommates y dashboard analítico para propietarios no existe en ningún portal del mercado colombiano. El producto está construido sobre infraestructura moderna y escalable, con un modelo de monetización que se activa naturalmente a medida que crece la base de usuarios.
