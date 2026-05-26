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

# Backfill nearby POIs for scraped properties (scraper skips the API so POIs
# stay NULL until this runs). Handles Overpass rate-limits with retry+backoff.
# Run from Windows PowerShell, not WSL, unless Node 20+ is installed there.
# Full docs (pipeline + troubleshooting) in docs/algorithms/property_tenant_match.md.
node --env-file=.env.local scripts/backfill-pois.mjs           # only missing
node --env-file=.env.local scripts/backfill-pois.mjs --force   # recompute all

# Backfill neighborhood/localidad via Nominatim reverse-geocode. Fixes the
# common case where FincaRaíz owners wrote the locality (Chapinero) where the
# form asked for barrio (El Nogal). Targets properties whose `neighborhood`
# matches a locality name, OR with NULL localidad. See script header for details.
node --env-file=.env.local scripts/backfill-neighborhoods.mjs            # only suspect rows
node --env-file=.env.local scripts/backfill-neighborhoods.mjs --force    # all with coords
node --env-file=.env.local scripts/backfill-neighborhoods.mjs --dry-run  # preview changes
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Used by API routes to bypass RLS

GOOGLE_MAPS_API_KEY=             # Optional — maps routes fall back to Nominatim/Photon if absent

# Clerk — DEPRECATED, kept for backward compatibility only
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
| `/app` | `Onboarding.tsx` — Login/register (Supabase Auth) |
| `/app/role-selection` | Role picker shown during OAuth signup before sync |
| `/app/sync` | Bridges Supabase Auth user → Supabase profiles/owners |
| `/app/home` | `Home.tsx` — Swipe cards |
| `/app/matches` | `Matches.tsx` — Bilateral matches |
| `/app/favorites` | `Favorites.tsx` — Liked properties |
| `/app/chat/[id]` | `ChatRoom.tsx` |
| `/app/profile` | `Profile.tsx` |
| `/app/profile/[id]` | `ProfileView.tsx` — View another user's profile |
| `/auth/callback` | Exchanges Supabase Auth code for session, routes to sync or reset-password |
| `/auth/reset-password` | Password reset form |

### 3. App — Propietario (`app/owner/...`)
Owner-facing app. Layout: `OwnerLayout.tsx`. All components in `src/flow/components/owner/`.

| Route | Component |
|---|---|
| `/owner/dashboard` | `OwnerDashboard.tsx` |
| `/owner/properties` | `OwnerProperties.tsx` |
| `/owner/properties/[id]` | Property detail/edit |
| `/owner/properties/new` | `NewProperty.tsx` |
| `/owner/interested` | `OwnerInterested.tsx` |
| `/owner/matches` | `OwnerMatches.tsx` |
| `/owner/chat` | Chat (owner mode) |

### 4. API Routes (`app/api/...`)

All API routes use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). Never use anon key in API routes.

| Route | Purpose |
|---|---|
| `POST /api/auth/sync` | Sync Supabase Auth user → profiles/owners (replaces the old Clerk sync) |
| `GET /api/properties` | List available properties |
| `GET /api/matches/properties?user_id=` | AI-ranked properties via `match_properties` RPC (spatial + amenity scoring) |
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
| `GET /api/owner/analytics?owner_id=&propertyId=` | Funnel, radar chart, and market price data |
| `POST /api/upload` | Upload image to Supabase Storage (`property-images` bucket) |
| `GET /api/chat/conversations` | Conversation list (property + roommate matches) |
| `GET /api/chat/room?match_id=` | Load a chat room |
| `GET /api/chat/messages` | Fetch messages for a conversation |
| `GET /api/maps/geocode?q=&city=` | Address geocoding (Google → Nominatim → Photon fallback) |
| `GET /api/maps/autocomplete?q=` | Address autocomplete suggestions |
| `GET /api/maps/reverse?lat=&lng=` | Reverse geocoding |
| `GET /api/maps/nearby` | Nearby POI search |
| `POST /api/user/register` | Register a new user |
| `POST /api/clerk/sync` | Legacy Clerk sync — kept for backward compatibility |

## Auth & Identity

**Current setup (Supabase Auth):** Supabase handles email/password, Google OAuth, and OTP. The old Clerk integration has been replaced.

Auth flow:
1. User signs up/in via `Onboarding.tsx` using the Supabase JS client.
2. OAuth redirects land at `/auth/callback`, which calls `supabase.auth.exchangeCodeForSession()`.
3. `/app/sync` reads the active session and calls `POST /api/auth/sync` to bridge the Supabase `auth.users` record → `profiles`/`owners`.
4. For new OAuth users who haven't picked a role yet, `/app/role-selection` is shown first; it stores `pending_role` / `pending_mode` in `localStorage`, then redirects to `/app/sync`.
5. After sync: `rentai_user_id` (tenant) or `owner_id` + `owner_email` (owner) are stored in `localStorage`.

- The Supabase trigger `on_auth_user_created` auto-creates a `profiles` row on signup — never manually INSERT into `profiles` for new users, only UPDATE.
- Owners do not use `auth.users` directly — they have a separate `owners` table with an `auth_user_id` FK. Owner creation goes through `POST /api/auth/sync` with `role: "owner"`.
- Demo mode: UUID stored as `rentai_user_id` in `localStorage` (no FK to `auth.users`, enforced by `20260408_demo_mode.sql`).

## Bilateral Match Logic

Matches are **trigger-created only** — never create `property_matches` or `roommate_matches` from application code:

```
property_likes + owner_tenant_likes → trg_student_likes_property / trg_owner_likes_tenant → property_matches
roommate_likes (both directions)    → check_bilateral_match trigger                        → roommate_matches
```

## Spatial AI Matching

`GET /api/matches/properties?user_id=` uses the `match_properties` Postgres RPC (PostGIS required):

Score breakdown (all computed in-database):
- **50%** spatial: `1 - (ST_Distance(property.location, profile.target_location) / search_radius_meters)` — defaults to 0.5 if no coordinates
- **25%** sector amenities Jaccard similarity (`amenities_sector` vs `desired_amenities_sector`)
- **25%** interior amenities Jaccard similarity (`amenities_interior` vs `desired_amenities_interior`)

Budget filter (`min_budget` / `max_budget`) is applied in the API route after fetching the top 50 RPC results.

## Maps API

`/api/maps/geocode` queries providers in order: **Google Maps** (if `GOOGLE_MAPS_API_KEY` is set) → **Nominatim** → **Photon**. Results are de-duplicated and ranked by a scoring function that rewards house-number precision and penalizes UPZ/locality-level results. All geocoding is biased toward Bogotá.

## Database

- Supabase project ref: `nkwemnfunfsxkcpfipyq`
- Migrations in `supabase/migrations/`. Apply with `npx supabase db push`.
- `20260408_demo_mode.sql` drops FK constraints and relaxes all RLS to `USING (true)` — intentional for demo.
- `20260521124312_spatial_property_match.sql` enables the PostGIS extension and creates the `match_properties` function.
- Supabase Storage bucket `property-images` (public, 10 MB limit) for property photos.

### Key Tables

| Table | Purpose |
|---|---|
| `profiles` | Tenant identity. Key fields: `bio`, `job_title`, `interests`, `lifestyle_tags`, `cleanliness_level`, `social_level`, `profile_images`, `min_budget`, `max_budget`, `target_location` (geography), `search_radius_meters`, `desired_amenities_interior[]`, `desired_amenities_sector[]`, `desired_property_types[]`, `desired_localities[]`, `desired_neighborhoods[]` |
| `owners` | Owner identity. Fields: `name`, `email`, `auth_user_id` (FK to `auth.users`) |
| `properties` | Listings: `image_url`, `images[]`, `description`, `tags`, `latitude`, `longitude`, `location` (geography), `address`, `neighborhood`, `localidad`, `city`, `property_type`, `bathrooms`, `area_sqm`, `stratum`, `floor_number`, `building_floors`, `amenities_interior[]`, `amenities_exterior[]`, `amenities_sector[]`, `utilities_included[]` |
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
- Leaflet + react-leaflet for interactive maps in `PropertyMap.tsx` and `MapPicker.tsx`.
- Fonts: **Fraunces** (display/headings, `--font-fraunces`) + **Inter** (body, `--font-inter`).
- Design tokens: terra `#D87D6F`, coffee `#82554D`, cream `#F7F2EC`, ink `#0D0D0D`.

## Key Conventions

- Page files in `app/` are thin wrappers importing from `src/flow/components/`.
- All flow components are TypeScript (`.tsx`), landing/utils are JSX (`.jsx`).
- `userMode` in localStorage: `"find-room"` | `"find-roommate"` | `"landlord"`.
- `Root.tsx` layout requires `h-screen overflow-hidden` + `min-h-0` on flex children. Auth pages (`hideNav=true`) get `overflow: hidden` on `main` so auth layouts handle their own scroll.
- Supabase Realtime: one channel per `conversation_id` in `Chat.tsx` for live message updates.
- Image uploads go through `/api/upload` (service role) → Supabase Storage → returns public URL.
- Never push directly to `master` branch.
