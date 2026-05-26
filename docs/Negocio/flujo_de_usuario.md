# Flujo de Usuario — RentAI

## 1. Landing Page (`/`)

Página informativa pública con Hero, Características, animación 3D y Footer.
El CTA principal redirige a `/app`.

## 2. Autenticación (`/app`)

`Onboarding.tsx` gestiona login/registro usando **Supabase Auth** (email/contraseña, Google OAuth, OTP).

Flujo OAuth:
1. El usuario autoriza en Google → redirige a `/auth/callback`
2. `/auth/callback` intercambia el código por sesión con `supabase.auth.exchangeCodeForSession()`
3. Si es un usuario nuevo OAuth que no eligió rol → va a `/app/role-selection` primero
4. `/app/sync` llama a `POST /api/auth/sync` para crear el registro en `profiles` u `owners`
5. Tras sync: `rentai_user_id` o `owner_id` se guardan en `localStorage`

> El trigger `on_auth_user_created` crea automáticamente la fila en `profiles` al registrarse. Nunca hacer INSERT manual en `profiles`.

## 3. Selección de modo

El usuario define su intención (un solo registro puede cambiar entre modos):
1. **"Busco Habitación"** — encuentra propiedades disponibles
2. **"Busco Roommate"** — encuentra compañeros de cuarto
3. **"Soy Propietario"** — gestiona sus propiedades (`/owner/dashboard`)

El modo se guarda en `profiles.user_mode` y en `localStorage` como `userMode`.

## 4. App Inquilino (`/app/home` en adelante)

Layout: `Root.tsx` — sidebar en desktop, barra inferior en móvil. Requiere `h-screen overflow-hidden` + `min-h-0` en hijos flex.

### Descubrir (`/app/home`)
Vista tipo Tinder. Las tarjetas vienen del endpoint `GET /api/matches/properties?user_id=` (algoritmo espacial + amenidades, ver `docs/algorithms/property_tenant_match.md`).
- Swipe derecho / botón corazón → `property_likes`
- Swipe izquierdo → `property_rejections`
- Las propiedades ya vistas no reaparecen.

### Matches (`/app/matches`)
Un match se crea **solo cuando ambas partes se aceptan mutuamente** (trigger en BD):
```
Inquilino swipe right → property_likes
                                         → TRIGGER → property_matches ✅
Propietario acepta   → owner_tenant_likes
```

### Favoritos (`/app/favorites`)
Propiedades que el inquilino marcó con like pero aún no tienen match bilateral.

### Chat (`/app/chat/[id]`)
Mensajería en tiempo real via Supabase Realtime (un canal por `conversation_id`).

### Perfil (`/app/profile`)
Edición de datos, presupuesto, preferencias de búsqueda y dealbreakers para el algoritmo de roommates.

## 5. App Propietario (`/owner/...`)

Layout: `OwnerLayout.tsx`

| Ruta | Función |
|---|---|
| `/owner/dashboard` | Resumen con métricas y analytics |
| `/owner/properties` | Listado de propiedades |
| `/owner/properties/new` | Publicar nueva propiedad |
| `/owner/interested` | Inquilinos que dieron like |
| `/owner/matches` | Matches bilaterales confirmados |

## 6. Tablas clave

| Tabla | Propósito |
|---|---|
| `profiles` | Identidad del inquilino. FK → `auth.users` |
| `owners` | Propietarios. FK → `auth.users` via `auth_user_id` |
| `properties` | Listados con ubicación, amenidades, imágenes |
| `property_likes` / `property_rejections` | Swipes del inquilino |
| `owner_tenant_likes` | Propietario acepta a un inquilino |
| `property_matches` | Match bilateral (creado por trigger) |
| `roommate_likes` / `roommate_rejections` | Swipes de roommate |
| `roommate_matches` | Match bilateral de roommates (trigger) |
| `conversations` / `messages` | Chat (soporta property_match_id y roommate_match_id) |
