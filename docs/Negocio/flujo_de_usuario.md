# Documentación del Flujo de Usuario - RentAI

Basado en la estructura actual del proyecto en Next.js, este es el flujo de usuario principal de la aplicación.

## 1. Landing Page (`/`)
La primera pantalla que ve el usuario. Es una página informativa y atractiva que explica la propuesta de valor de RentAI.
* **Componentes principales:** Hero (con buscador visual), Características, Animación interactiva, Casos de uso y Footer.
* **Acción principal (CTA):** Los botones interactivos como "Buscar" en el Hero o los botones del Navbar redirigen al usuario hacia la zona de la aplicación (`/app`).

## 2. Onboarding y Selección de Modo (`/app`)
Al ingresar a la aplicación web, el usuario debe definirse dentro de la plataforma.
* **Flujo:** Se le pide al usuario que seleccione su intención principal mediante 3 opciones:
  1. **"Busco Habitación"**: Para encontrar un lugar donde vivir.
  2. **"Busco Roommate"**: Para buscar compañeros con quienes compartir un lugar.
  3. **"Soy Propietario"**: Para ofrecer una propiedad.
* **Lógica subyacente:** La selección se guarda en `profiles.user_mode` (Supabase) y localmente en `localStorage` como `userMode`. Tras seleccionar, el usuario es redirigido a `/app/home`.

## 3. Navegación Global (Layout Base - `Root.tsx`)
Una vez en el Dashboard (`/app/home` en adelante), el usuario está inmerso en un Layout principal gestionado por `Root.tsx`:
* **Desktop:** Se muestra un menú lateral (Sidebar) anclado a la izquierda.
* **Mobile:** Se muestra una barra de navegación inferior (Bottom Navigation).
* Todas las vistas dentro de este espacio tienen acceso rápido a 4 secciones principales: **Descubrir**, **Matches**, **Chats** y **Perfil**.

## 4. Secciones Principales (Dashboard)

### A. Descubrir (`/app/home`)
* **Flujo:** Es la vista principal "tipo Tinder". El usuario visualiza tarjetas emergentes que se ajustan al modo que eligió en el Onboarding (habitaciones o roommates).
* **Interacción:** El usuario puede **deslizar a la izquierda** (para descartar → `property_rejections`) o **deslizar a la derecha** / pulsar el botón de corazón (Like → `property_likes`).
* Las propiedades ya vistas (likes + rechazos) no vuelven a aparecer.
* **⚠️ Un like NO es un match.** El like solo indica interés del estudiante.

### B. Matches (`/app/matches`) — BILATERAL
* **Flujo:** Un match se crea **solo cuando ambas partes se aceptan mutuamente**:
  1. El estudiante da **swipe right** a una propiedad → se registra en `property_likes`
  2. El propietario ve la lista de estudiantes interesados en sus propiedades
  3. El propietario **acepta al estudiante** → se registra en `owner_tenant_likes`
  4. Un **trigger automático** en la BD detecta que ambos lados coinciden y crea el registro en `property_matches`
* **Interacción:** Muestra una lista de matches confirmados. Al pulsar en uno se redirige al chat privado (`/app/chat/[id]`).

### C. Chats (`/app/chat`)
* **Flujo:** Interfaz de mensajería para entablar comunicación directa con los Matches o propietarios para coordinar y negociar arriendos.

### D. Perfil (`/app/profile`)
* **Flujo:** Ficha del usuario actual donde puede consultar su información pública.
* **Interacción:**
  * Modificación de foto y datos personales.
  * **Historial de Likes:** Lista de propiedades a las que el usuario dio like (antes "Guardados"), consultada desde `property_likes`.
  * Resumen estadístico (número de matches, likes, porcentaje de compatibilidad).
  * Panel de configuración de presupuesto, preferencias y privacidad.
  * Posibilidad de **Cerrar Sesión** o **Cambiar modo de búsqueda**.

---

## 5. Esquema de Base de Datos (Supabase)

### Tablas principales

| Tabla | Propósito |
|---|---|
| `profiles` | Usuarios (FK → `auth.users`). Incluye nombre, universidad, presupuesto, `user_mode` |
| `owners` | Propietarios de inmuebles |
| `properties` | Propiedades disponibles (FK → `owners`) |
| `property_likes` | Estudiante da swipe right a una propiedad |
| `property_rejections` | Estudiante da swipe left (para no repetir) |
| `owner_tenant_likes` | Propietario acepta a un estudiante para su propiedad |
| `property_matches` | Match bilateral confirmado (auto-creado por trigger) |
| `roommate_profiles` | Perfil de preferencias para matching de roommates |
| `roommate_matches` | Match entre dos estudiantes buscando roommate |

### Flujo de Match Bilateral

```
Estudiante swipe right  →  property_likes
                                            ↘
                                             TRIGGER → property_matches ✅
                                            ↗
Propietario acepta      →  owner_tenant_likes
```

> [!NOTE]
> Todas las tablas tienen RLS (Row Level Security) habilitado. Cada usuario solo puede ver/editar sus propios datos. Un trigger en `auth.users` crea automáticamente el perfil del usuario al registrarse.
