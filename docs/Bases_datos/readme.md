# Base de Datos — RentAI

## Tecnología
**Supabase** (PostgreSQL) — proyecto ref: `nkwemnfunfsxkcpfipyq`

## Archivos

- `esquema_bd.md` — Descripción completa de todas las tablas y relaciones
- `migraciones/` — Scripts SQL aplicados al proyecto en orden cronológico

## Migraciones aplicadas

| Archivo | Descripción |
|---|---|
| `20260325154000_init_schema.sql` | Esquema inicial (owners, properties, students) |
| `20260325204304_init_schema.sql` | Ajustes al esquema inicial |
| `20260327194900_fix_bilateral_matching.sql` | Reescritura: profiles, matching bilateral, RLS, triggers |
| `20260407_add_profile_details.sql` | Nuevos campos de perfil (bio, interests, lifestyle_tags, etc.) |
| `20260408_demo_mode.sql` | Relajar FK y RLS para modo demo sin auth |
| `20260409_guest_users.sql` | Tabla guest_users para demo sin autenticación |

## Cómo aplicar migraciones

```bash
npx supabase login
npx supabase link --project-ref nkwemnfunfsxkcpfipyq
npx supabase db push
```
