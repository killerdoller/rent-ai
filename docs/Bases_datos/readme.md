# Base de Datos — RentAI

## Tecnología
**Supabase** (PostgreSQL) — proyecto ref: `nkwemnfunfsxkcpfipyq`

## Archivos

- `esquema_bd.md` — Descripción completa de todas las tablas y relaciones
- `api_guide.md` — Guía de integración de la API de Supabase con el frontend

Las migraciones SQL viven en `supabase/migrations/` (fuente de verdad). Aplicar con:

```bash
npx supabase login
npx supabase link --project-ref nkwemnfunfsxkcpfipyq
npx supabase db push
```

## Migraciones aplicadas

| Archivo | Descripción |
|---|---|
| `20260325154000_init_schema.sql` | Esquema inicial (owners, properties, students) |
| `20260325204304_init_schema.sql` | Ajustes al esquema inicial |
| `20260327194900_fix_bilateral_matching.sql` | Reescritura: profiles, matching bilateral, RLS, triggers |
| `20260407_add_profile_details.sql` | Nuevos campos de perfil (bio, interests, lifestyle_tags, etc.) |
| `20260408_demo_mode.sql` | Relajar FK y RLS para modo demo sin auth |
| `20260409_guest_users.sql` | Tabla guest_users para demo sin autenticación |
| `20260410_fix_owners_rls.sql` | Corrección de políticas RLS de owners |
| `20260415_add_location_fields.sql` | Campos de ubicación (neighborhood, localidad, city) |
| `20260421_chat_system.sql` | Sistema de chat: conversations y messages |
| `20260422_fix_profiles_fk.sql` | Corrección de FK en profiles |
| `20260423_clerk_auth.sql` | Integración Clerk (deprecado — reemplazado por Supabase Auth) |
| `20260424_drop_profiles_auth_fk.sql` | Elimina FK de auth para modo demo |
| `20260425_property_images.sql` | Campo images[] en properties |
| `20260426_roommate_matching.sql` | Tablas roommate_likes, roommate_rejections, roommate_matches |
| `20260427_roommate_chat.sql` | Soporte de chat para matches de roommate |
| `20260428_property_images_bucket.sql` | Bucket property-images en Supabase Storage |
| `20260430_security_reinforcement.sql` | Refuerzo de políticas de seguridad RLS |
| `20260501_supabase_auth.sql` | Migración completa a Supabase Auth (reemplaza Clerk) |
| `20260502_profile_completed.sql` | Campo profile_completed en profiles |
| `20260503_enable_rls.sql` | Habilitar RLS en todas las tablas |
| `20260512_add_recommendation_params.sql` | min_budget, max_budget, exclusion_rules, importance_weights |
| `20260515_create_recommendations.sql` | Tabla recommendations para el motor de IA |
| `20260515144200_secure_all_tables.sql` | Seguridad adicional en todas las tablas |
| `20260518_automation_webhooks.sql` | Triggers para notificar al motor de IA en Hugging Face |
| `20260520_add_property_details.sql` | Campos adicionales de propiedades (bathrooms, area_sqm, stratum, etc.) |
| `20260521124312_spatial_property_match.sql` | Extensión PostGIS + función RPC match_properties |
| `20260521181944_add_property_search_criteria.sql` | Criterios de búsqueda en profiles (desired_localities, etc.) |
| `20260523_property_nearby_pois.sql` | Campo nearby_pois en properties para POIs de Overpass |
| `20260523120000_set_profile_target.sql` | target_location y search_radius_meters en profiles |
| `20260524120000_match_properties_soft_locality.sql` | Soft filter por localidad en match_properties |
| `20260525120000_match_score_curves.sql` | Curvas de score mejoradas en el algoritmo de match |
