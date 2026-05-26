# Algoritmos — RentAI

## Documentos

| Archivo | Contenido |
|---|---|
| `property_tenant_match.md` | Algoritmo espacial de match inquilino-propiedad (PostGIS + RPC `match_properties`). Score: 50% distancia, 25% amenidades sector, 25% amenidades interior. |
| `roommate_match.md` | Algoritmo híbrido de 4 capas para match de roommates: financiero, conductual, afinidad y semántico (NLP/TF-IDF). |
| `recommendation_system_setup.md` | Setup del motor de recomendación en Hugging Face Spaces (FastAPI + Supabase triggers). |
| `dashboard_analytics.md` | Analytics para propietarios: radar de personalidad, embudo de conversión, indicador de mercado. |

## Motor de recomendación

El código Python del motor vive en `brain/recommendation_engine.py`. Corre en Hugging Face Spaces (`nassirgabba/rent-ai-engine`) como contenedor FastAPI. Los triggers en Supabase lo notifican ante nuevos perfiles o cambios.
