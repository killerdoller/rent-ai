# Stack Tecnológico — RentAI

## Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 16.x | Framework principal (App Router) |
| **React** | 19.x | Librería de UI |
| **TypeScript** | 6.x | Tipado estático |
| **Tailwind CSS** | 4.x | Estilos utilitarios |
| **shadcn/ui** | — | Componentes de interfaz base |
| **Framer Motion** | 12.x | Animaciones |
| **Lucide React** | — | Iconografía |
| **GSAP** | 3.x | Animaciones avanzadas (landing) |
| **Three.js / R3F** | — | Elementos 3D (landing) |

## Backend / API

| Tecnología | Rol |
|---|---|
| **Next.js API Routes** | Endpoints REST server-side |
| **Supabase** | Base de datos, Auth, Storage |
| **PostgreSQL** | Motor de base de datos (via Supabase) |

## Infraestructura

| Servicio | Rol |
|---|---|
| **Vercel** | Deploy y hosting del frontend |
| **Supabase Cloud** | Base de datos en producción |
| **GitHub** | Control de versiones |

## Estructura de Rutas

```
/              → Redirige a /app
/app           → Login / Registro (Onboarding)
/app/home      → Descubrir propiedades (arrendatario)
/app/matches   → Matches bilaterales (arrendatario)
/app/favorites → Propiedades con like (arrendatario)
/app/chat      → Mensajería
/app/profile   → Perfil del usuario
/owner/dashboard   → Panel propietario
/owner/properties  → Mis propiedades
/owner/interested  → Arrendatarios interesados
/owner/matches     → Matches del propietario
```

## Variables de Entorno Requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx   # solo server-side
```
