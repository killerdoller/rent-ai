# 🤖 Sistema de Recomendación Híbrido - RentAI

Este documento describe la actualización del sistema de matching de RentAI, que ahora permite una recomendación personalizada basada en un modelo híbrido de contenido, presupuesto y preferencias dinámicas.

## 🌟 Nuevas Características

### 1. Perfil Inteligente (UI/UX)
Se ha actualizado la interfaz de usuario en `Profile.tsx` para permitir:
- **Rango de Presupuesto**: Los usuarios ya no eligen un monto fijo, sino un rango (`min_budget` y `max_budget`).
- **Prioridades Dinámicas**: Sliders que permiten al usuario ponderar qué es más importante (Presupuesto, Estilo de Vida, Intereses o Personalidad).
- **Innegociables (Dealbreakers)**: Filtros estrictos para fumadores, mascotas y género.

### 2. Estructura de Datos (Supabase)
La tabla `profiles` ha sido expandida a **24 columnas** para soportar el algoritmo:
- `min_budget` & `max_budget`: Tipo `NUMERIC` para manejar pesos colombianos con precisión.
- `exclusion_rules`: JSONB que almacena reglas binarias de SÍ/NO.
- `importance_weights`: JSONB para almacenar los pesos del algoritmo (0.0 a 1.0).

## 🧠 El Algoritmo de Matching

El score de compatibilidad (0-100%) se calcula mediante la combinación de cuatro capas:

1. **Capa Financiera**: Evalúa la proximidad de los rangos de presupuesto.
2. **Capa Conductual**: Mide la distancia entre `cleanliness_level` y `social_level`.
3. **Capa de Afinidad**: Identifica coincidencias en `lifestyle_tags` e `interests`.
4. **Capa Semántica (NLP)**: Analiza la biografía del usuario para encontrar similitudes de "vibe" y hábitos no tagueados.

## 📊 Análisis de Datos (Simulación)

Se ha creado un entorno de pruebas con:
- **Notebook de Análisis**: `perfiles/analisis_perfiles.ipynb` para limpieza y estadísticas.
- **Dataset de Prueba**: Un archivo con **2,000 registros simulados** (`perfiles_simulados_2000.csv`) totalmente poblados y sin valores nulos para estresar el modelo.

## 🚀 Próximas Fases
- [ ] Implementar la función de scoring en `/api/recommendations`.
- [ ] Integrar el modelo semántico de NLP (Embeddings).
- [ ] Desplegar el ordenamiento automático en la pantalla de Swipe de `Home.tsx`.

---
*Documentación actualizada al 12 de Mayo de 2026.*
