# Frontend — Estructura y Convenciones

## Organización de Carpetas

```
src/
  Landing.jsx              # Página de marketing (/)
  components/              # Componentes de la landing
  utils/
    supabaseClient.ts      # Cliente Supabase (anon key)
    authHelpers.js         # signIn, signUp, signOut
  flow/
    components/
      ui/                  # Componentes shadcn/ui (no modificar)
      owner/               # Vistas del propietario
      Home.tsx             # Descubrir propiedades
      Matches.tsx          # Matches bilaterales
      Favorites.tsx        # Propiedades guardadas
      Onboarding.tsx       # Login / Registro
      Profile.tsx          # Perfil de usuario
      Root.tsx             # Layout con nav lateral y bottom nav
      Chat.tsx / ChatRoom.tsx

app/
  page.jsx                 # Redirige a /app
  layout.jsx               # Layout raíz (HTML, metadata)
  app/                     # Rutas arrendatario
    layout.jsx             # Usa Root.tsx
    page.jsx               # Onboarding
    home/page.jsx
    matches/page.jsx
    favorites/page.jsx
    profile/page.jsx
    chat/[id]/page.jsx
  owner/                   # Rutas propietario
    layout.jsx             # Usa OwnerLayout.tsx
    dashboard/page.jsx
    properties/page.jsx
    interested/page.jsx
    matches/page.jsx
  api/                     # API Routes (server-side)
    properties/route.ts
    likes/route.ts
    matches/route.ts
    rejections/route.ts
    owner/
      find-or-create/route.ts
      properties/route.ts
      interested/route.ts
      like-tenant/route.ts
      matches/route.ts
```

## Convenciones

- Las páginas en `app/` son wrappers delgados que importan desde `src/flow/components/`
- Componentes de arrendatario: TypeScript (`.tsx`)
- Componentes de landing y utils: JSX (`.jsx`)
- El layout usa `h-screen overflow-hidden` + `min-h-0` en flex children para mantener el header fijo
- Identidad sin auth: UUID en `localStorage` como `rentai_user_id` (arrendatario) y `owner_id` (propietario)
