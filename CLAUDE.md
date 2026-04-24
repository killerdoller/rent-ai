# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

# Clerk (auth — pending migration to Supabase Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## Architecture

The project was originally a Vite/React app migrated to **Next.js 16 (App Router)**. Two UI layers coexist:

### 1. Landing (`src/Landing.jsx`)
Public marketing page at `/landing` (root `/` redirects to `/app`). Components in `src/components/`.

### 2. App — Arrendatario (`app/app/...`)
Tenant-facing app. Layout: `Root.tsx` (sidebar on desktop, bottom nav on mobile).

| Route | Component |
|---|---|
| `/app` | `Onboarding.tsx` — Login/register (Clerk auth) |
| `/app/home` | `Home.tsx` — Swipe cards |
| `/app/matches` | `Matches.tsx` — Bilateral matches |
| `/app/favorites` | `Favorites.tsx` — Liked properties |
| `/app/chat/[id]` | `ChatRoom.tsx` |
| `/app/profile` | `Profile.tsx` |

### 3. App — Propietario (`app/owner/...`)
Owner-facing app. Layout: `OwnerLayout.tsx`. All components in `src/flow/components/owner/`.

| Route | Component |
|---|---|
| `/owner/dashboard` | `OwnerDashboard.tsx` |
| `/owner/properties` | `OwnerProperties.tsx` |
| `/owner/interested` | `OwnerInterested.tsx` |
| `/owner/matches` | `OwnerMatches.tsx` |
| `/owner/chat` | Chat (owner mode) |

### 4. API Routes (`app/api/...`)

All API routes use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). Never use anon key in API routes.

| Route | Purpose |
|---|---|
| `GET /api/properties` | List available properties |
| `POST /api/likes` / `GET /api/likes?user_id=` | Tenant likes a property |
| `POST /api/rejections` | Tenant rejects |
| `GET /api/matches?user_id=` | Tenant bilateral matches (property + roommate) |
| `GET /api/roommates` | Roommate discovery cards |
| `POST /api/roommate-likes` | Like a roommate |
| `POST /api/roommate-rejections` | Reject a roommate |
| `GET /api/roommate/interested?user_id=` | Who liked current user (roommate) |
| `GET /api/profile` / `PATCH /api/profile` | Get or update tenant profile |
| `POST /api/owner/find-or-create` | Find or create owner by email |
| `GET /api/owner/properties?owner_id=` | Owner's listings |
| `GET /api/owner/interested?owner_id=` | Tenants interested in owner's properties |
| `POST /api/owner/like-tenant` | Owner accepts tenant → triggers match |
| `GET /api/owner/matches?owner_id=` | Owner confirmed matches |
| `POST /api/upload` | Upload image to Supabase Storage (`property-images` bucket) |
| `GET /api/chat/conversations` | Conversation list (property + roommate matches) |
| `GET /api/chat/room?match_id=` | Load a chat room |
| `POST /api/clerk/sync` | Sync Clerk user → Supabase profiles/owners |

## Auth & Identity

**Current setup (Clerk):** Clerk handles email/password, Google OAuth, and OTP. After login, `app/app/sync/page.jsx` calls `/api/clerk/sync` to bridge `clerk_id` → Supabase `profiles`/`owners`. Then `userId` or `ownerId` is stored in `localStorage`.

**Planned migration to Supabase Auth** — Clerk has known v7 API instability issues. Supabase Auth would eliminate the sync bridge and the `clerk_id` columns.

- The Supabase trigger `on_auth_user_created` auto-creates a `profiles` row on signup — never manually INSERT into `profiles` for new users, only UPDATE.
- Owners do not use `auth.users` — separate `owners` table. Owner creation goes through `/api/owner/find-or-create`.
- Demo mode: UUID stored as `rentai_user_id` in `localStorage` (no FK to `auth.users`, enforced by `20260408_demo_mode.sql`).

## Bilateral Match Logic

Matches are **trigger-created only** — never create `property_matches` or `roommate_matches` from application code:

```
property_likes + owner_tenant_likes → trg_student_likes_property / trg_owner_likes_tenant → property_matches
roommate_likes (both directions)    → check_bilateral_match trigger                        → roommate_matches
```

## Database

- Supabase project ref: `nkwemnfunfsxkcpfipyq`
- Migrations in `supabase/migrations/`. Apply with `npx supabase db push`.
- `20260408_demo_mode.sql` drops FK constraints and relaxes all RLS to `USING (true)` — intentional for demo.
- Supabase Storage bucket `property-images` (public, 10 MB limit) for property photos.

### Key Tables

| Table | Purpose |
|---|---|
| `profiles` | Tenant identity. Fields: basic info + `bio`, `job_title`, `interests`, `lifestyle_tags`, `cleanliness_level`, `social_level`, `profile_images`, `clerk_id` |
| `owners` | Owner identity (separate from `auth.users`). Fields: `name`, `email`, `clerk_id` |
| `properties` | Listings: `image_url`, `images[]`, `description`, `tags`, `latitude`, `longitude`, `address` |
| `property_likes` / `property_rejections` | Tenant swipe actions |
| `owner_tenant_likes` | Owner accepts a tenant |
| `property_matches` | Bilateral matches (trigger-created) |
| `roommate_likes` / `roommate_rejections` | Roommate swipe actions |
| `roommate_matches` | Roommate bilateral matches (trigger-created) |
| `conversations` | Supports both `property_match_id` and `roommate_match_id` (partial unique indexes) |
| `messages` | Chat messages with `sender_id`, `sender_type` (`user`\|`owner`) |
| `guest_users` | Demo-mode tenants without auth |

## UI / Styling

- **Tailwind CSS v4** — no `tailwind.config.js`, configured via `@theme` in `globals.css`.
- `cn()` from `src/flow/components/ui/utils.ts` for conditional class merging.
- `lucide-react` icons, `framer-motion` animations, `recharts` charts.
- Three.js via `@react-three/fiber` + `@react-three/drei` (landing 3D hero only).
- Design tokens: terra `#D87D6F`, coffee `#82554D`, cream `#F7F2EC` (consistent across owner views).

## Key Conventions

- Page files in `app/` are thin wrappers importing from `src/flow/components/`.
- All flow components are TypeScript (`.tsx`), landing/utils are JSX (`.jsx`).
- `userMode` in localStorage: `"find-room"` | `"find-roommate"` | `"landlord"`.
- `Root.tsx` layout requires `h-screen overflow-hidden` + `min-h-0` on flex children. Auth pages (`hideNav=true`) get `overflow: hidden` on `main` so auth layouts handle their own scroll.
- `matchScore` in `GET /api/properties` is random (75–95) — real AI scoring is a pending TODO.
- Never push directly to `master` branch.
- Supabase Realtime: one channel per `conversation_id` in `Chat.tsx` for live message updates.
- Image uploads go through `/api/upload` (service role) → Supabase Storage → returns public URL.
