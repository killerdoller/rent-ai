# Esquema de Base de Datos — RentAI

Base de datos: **Supabase (PostgreSQL)**
Proyecto ref: `nkwemnfunfsxkcpfipyq`

## Tablas

### `profiles`
Usuarios arrendatarios vinculados a `auth.users`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Referencia a `auth.users` |
| `first_name` | text | Nombre |
| `last_name` | text | Apellido |
| `email` | text | Email único |
| `phone` | text | Teléfono |
| `university_name` | text | Universidad |
| `city` | text | Ciudad |
| `monthly_budget` | numeric | Presupuesto mensual |
| `user_mode` | text | `find-room` / `find-roommate` / `landlord` |
| `avatar_url` | text | URL de foto de perfil |
| `bio` | text | Descripción personal |
| `job_title` | text | Ocupación |
| `interests` | text[] | Lista de intereses |
| `lifestyle_tags` | text[] | Etiquetas de estilo de vida |
| `cleanliness_level` | integer | Nivel de limpieza (1-10) |
| `social_level` | integer | Nivel social (1-10) |
| `profile_images` | text[] | Fotos adicionales |

### `owners`
Propietarios de inmuebles (no vinculados a auth).

| Columna | Tipo | Descripción |
|---|---|---|
| `owner_id` | uuid PK | ID del propietario |
| `name` | text | Nombre completo |
| `email` | text | Email único |
| `phone` | text | Teléfono |

### `properties`
Propiedades disponibles para arrendar.

| Columna | Tipo | Descripción |
|---|---|---|
| `property_id` | uuid PK | ID de la propiedad |
| `owner_id` | uuid FK → owners | Propietario |
| `title` | text | Título del anuncio |
| `monthly_rent` | numeric | Precio mensual |
| `neighborhood` | text | Barrio |
| `city` | text | Ciudad |
| `bedrooms` | integer | Número de habitaciones |
| `image_url` | text | Imagen principal |
| `description` | text | Descripción |
| `tags` | text[] | Etiquetas |
| `allows_students` | boolean | Acepta estudiantes |
| `requires_co_debtor` | boolean | Requiere codeudor |

### `property_likes`
Arrendatario da swipe right a una propiedad.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | ID del arrendatario |
| `property_id` | uuid FK → properties | Propiedad |
| `created_at` | timestamptz | Fecha |

### `property_rejections`
Arrendatario da swipe left (no vuelve a aparecer).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | ID del arrendatario |
| `property_id` | uuid FK → properties | Propiedad |

### `owner_tenant_likes`
Propietario acepta a un arrendatario.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid FK → owners | Propietario |
| `user_id` | uuid | Arrendatario |
| `property_id` | uuid FK → properties | Propiedad |

### `property_matches`
Match bilateral confirmado. **Creado automáticamente por trigger.**

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | Arrendatario |
| `property_id` | uuid FK → properties | Propiedad |
| `owner_id` | uuid FK → owners | Propietario |
| `match_score` | integer | Puntuación de compatibilidad |

### `guest_users`
Usuarios demo sin autenticación.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Nombre |
| `email` | text | Email (opcional) |
| `user_mode` | text | Modo de uso |

## Flujo de Match Bilateral

```
property_likes (arrendatario da like)
                    +
owner_tenant_likes (propietario acepta)
                    ↓
         TRIGGER automático en BD
                    ↓
        property_matches (match creado)
```

> El match **nunca** se crea manualmente desde el código — siempre lo genera el trigger.
