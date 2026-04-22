# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server (after build)
npm run lint     # ESLint

# Supabase migrations (requires login first: npx supabase login)
npx supabase link --project-ref nkwemnfunfsxkcpfipyq
npx supabase db push                          # Apply pending migrations to remote
npx supabase migration repair --status applied <timestamp>  # Mark migration as applied if already run manually
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Used by API routes to bypass RLS
```

## Architecture

The project was originally a Vite/React app and was migrated to **Next.js 16 (App Router)**. There are two separate UI layers coexisting:

### 1. Landing (`src/Landing.jsx`)
Public marketing page. Accessible at `/landing` (root `/` redirects to `/app`). Components live in `src/components/`.

### 2. App — Arrendatario (`app/app/...`)
The tenant-facing app. Layout is `Root.tsx` (sidebar on desktop, bottom nav on mobile).

| Route | Component |
|---|---|
| `/app` | `Onboarding.tsx` — Login/register form (Supabase Auth) |
| `/app/home` | `Home.tsx` — Swipe cards (like/reject properties) |
| `/app/matches` | `Matches.tsx` — Bilateral matches |
| `/app/favorites` | `Favorites.tsx` — Liked properties |
| `/app/chat/[id]` | `ChatRoom.tsx` |
| `/app/profile` | `Profile.tsx` |

### 3. App — Propietario (`app/owner/...`)
Owner-facing app. Layout is `OwnerLayout.tsx` (same sidebar/bottom nav pattern, different color `#D87D6F`).

| Route | Component |
|---|---|
| `/owner/dashboard` | `OwnerDashboard.tsx` |
| `/owner/properties` | `OwnerProperties.tsx` |
| `/owner/interested` | `OwnerInterested.tsx` — Tenants who liked their properties |
| `/owner/matches` | `OwnerMatches.tsx` |

All owner components are in `src/flow/components/owner/`.

### 4. API Routes (`app/api/...`)
Server-side routes that use `SUPABASE_SERVICE_ROLE_KEY` (falls back to anon key). These bypass RLS.

| Route | Purpose |
|---|---|
| `GET /api/properties` | List available properties |
| `POST /api/likes` / `GET /api/likes?user_id=` | Tenant likes a property |
| `POST /api/rejections` | Tenant rejects a property |
| `GET /api/matches?user_id=` | Tenant's bilateral matches |
| `GET /api/profile` / `PATCH /api/profile` | Get or update authenticated user's profile |
| `POST /api/owner/find-or-create` | Find or create owner by email |
| `GET /api/owner/properties?owner_id=` | Owner's properties |
| `GET /api/owner/interested?owner_id=` | Tenants who liked owner's properties |
| `POST /api/owner/like-tenant` | Owner accepts a tenant → triggers match |
| `GET /api/owner/matches?owner_id=` | Owner's confirmed matches |
| `POST /api/user/register` | Register a guest (no-auth) user |

## Bilateral Match Logic

The match is created automatically by a **Supabase database trigger** — never in application code:

```
property_likes (tenant swipes right)
                    + owner_tenant_likes (owner accepts)
                    → trigger check_bilateral_match() → property_matches created automatically
```

Two triggers fire: `trg_student_likes_property` (on `property_likes`) and `trg_owner_likes_tenant` (on `owner_tenant_likes`). **Never create `property_matches` records directly from code.**

## Auth & Identity

- **With auth:** `supabase.auth` + `src/utils/authHelpers.js`. After login, `userId` or `ownerId` is stored in `localStorage` for backward compatibility.
- **Without auth (demo mode):** A UUID is generated and stored as `rentai_user_id` in `localStorage`. Owners use `owner_id` in `localStorage`.
- The Supabase trigger `on_auth_user_created` auto-creates a `profiles` row on signup — never manually INSERT into `profiles` for new users, only UPDATE.
- Owners do not use `auth.users` — they have a separate `owners` table. Owner creation must go through `/api/owner/find-or-create` (server-side) to bypass RLS.

## Database

- Supabase project ref: `nkwemnfunfsxkcpfipyq`
- Migrations are in `supabase/migrations/`. Apply with `npx supabase db push`.
- `20260408_demo_mode.sql` drops FK constraints on `user_id` columns (so guest UUIDs not in `auth.users` are accepted) and relaxes all RLS to `USING (true)`. This is intentional and temporary.
- `guest_users` table holds tenant identity for demo flows (no FK to `auth.users`).
- Supabase client for server-side: `createClient(url, SUPABASE_SERVICE_ROLE_KEY)` — bypasses RLS. Client-side uses anon key via `src/utils/supabaseClient.ts`.

### Key Tables

| Table | Purpose |
|---|---|
| `profiles` | Tenant identity (linked to `auth.users`). Fields: basic info + `bio`, `job_title`, `interests`, `lifestyle_tags`, `cleanliness_level`, `social_level`, `profile_images` |
| `owners` | Owner identity (separate from `auth.users`) |
| `properties` | Listings with `image_url`, `description`, `tags` |
| `property_likes` | Tenant swipes right |
| `property_rejections` | Tenant swipes left |
| `owner_tenant_likes` | Owner accepts a tenant |
| `property_matches` | Bilateral matches (trigger-created only) |
| `guest_users` | Demo-mode tenants without auth |

## UI / Styling

- **Tailwind CSS v4** with shadcn/ui-style components (Radix UI primitives) in `src/flow/components/ui/`.
- Use `cn()` from `src/flow/components/ui/utils.ts` for conditional class merging.
- `lucide-react` for icons, `framer-motion` / `gsap` for animations, `recharts` for charts.
- Three.js via `@react-three/fiber` + `@react-three/drei` (used in landing 3D hero).

## Key Conventions

- Page files in `app/` are thin wrappers that import from `src/flow/components/`.
- All flow components are TypeScript (`.tsx`), landing/utils are JSX (`.jsx`).
- `userMode` in localStorage: `"find-room"` | `"find-roommate"` | `"landlord"`.
- The `Root.tsx` layout requires `h-screen overflow-hidden` + `min-h-0` on flex children to keep the header sticky and prevent full-page scroll.
- `matchScore` in `GET /api/properties` is currently a random value (75–95). Real AI-based scoring is a pending TODO.
