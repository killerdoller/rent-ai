-- ============================================================
-- Migration: fix_bilateral_matching
-- Fixes relationships between users, properties, and matches.
-- Match is BILATERAL: student likes property + owner accepts = match
-- ============================================================

-- ============================================
-- 1. DROP OLD TABLES (order matters for FK deps)
-- ============================================
DROP TABLE IF EXISTS public.saved_properties CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.roommate_matches CASCADE;
DROP TABLE IF EXISTS public.roommate_profiles CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;

-- ============================================
-- 2. PROFILES — replaces students, linked to auth.users
-- ============================================
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text NOT NULL DEFAULT '',
    last_name text NOT NULL DEFAULT '',
    email text UNIQUE NOT NULL,
    phone text,
    university_name text,
    city text,
    semester integer,
    age integer,
    monthly_budget numeric,
    has_co_debtor boolean DEFAULT false,
    user_mode text DEFAULT 'find-room'
        CHECK (user_mode IN ('find-room', 'find-roommate', 'landlord')),
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. PROPERTIES — add missing columns for discover cards
-- ============================================
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS image_url text,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- ============================================
-- 4. PROPERTY_LIKES — student swipes RIGHT on a property
-- ============================================
CREATE TABLE public.property_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(property_id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, property_id)
);

-- ============================================
-- 5. PROPERTY_REJECTIONS — student swipes LEFT (don't show again)
-- ============================================
CREATE TABLE public.property_rejections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(property_id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, property_id)
);

-- ============================================
-- 6. OWNER_TENANT_LIKES — owner accepts a tenant for their property
-- ============================================
CREATE TABLE public.owner_tenant_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.owners(owner_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(property_id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(owner_id, user_id, property_id)
);

-- ============================================
-- 7. PROPERTY_MATCHES — bilateral match (auto-created by trigger)
-- Only exists when BOTH sides have liked each other
-- ============================================
CREATE TABLE public.property_matches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(property_id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.owners(owner_id) ON DELETE CASCADE,
    match_score integer,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, property_id)
);

-- ============================================
-- 8. ROOMMATE_PROFILES — updated to reference profiles
-- ============================================
CREATE TABLE public.roommate_profiles (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    sleep_schedule text,
    study_habits text,
    cleanliness_level text,
    smoking boolean DEFAULT false,
    pets boolean DEFAULT false,
    preferred_budget_min numeric,
    preferred_budget_max numeric
);

-- ============================================
-- 9. ROOMMATE_MATCHES — updated to reference profiles
-- ============================================
CREATE TABLE public.roommate_matches (
    match_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_1_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_2_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    compatibility_score numeric,
    status text DEFAULT 'pending'
        CHECK (status IN ('pending', 'liked', 'matched', 'rejected')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(student_1_id, student_2_id)
);

-- ============================================
-- 10. TRIGGER: Auto-create match when both sides agree
-- ============================================
CREATE OR REPLACE FUNCTION public.check_bilateral_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Case A: Owner just liked a tenant → check if tenant already liked the property
    IF TG_TABLE_NAME = 'owner_tenant_likes' THEN
        IF EXISTS (
            SELECT 1 FROM public.property_likes
            WHERE user_id = NEW.user_id
              AND property_id = NEW.property_id
        ) THEN
            INSERT INTO public.property_matches (user_id, property_id, owner_id)
            VALUES (NEW.user_id, NEW.property_id, NEW.owner_id)
            ON CONFLICT (user_id, property_id) DO NOTHING;
        END IF;
    END IF;

    -- Case B: Student just liked a property → check if owner already liked this tenant
    IF TG_TABLE_NAME = 'property_likes' THEN
        INSERT INTO public.property_matches (user_id, property_id, owner_id)
        SELECT NEW.user_id, NEW.property_id, otl.owner_id
        FROM public.owner_tenant_likes otl
        WHERE otl.user_id = NEW.user_id
          AND otl.property_id = NEW.property_id
        ON CONFLICT (user_id, property_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_owner_likes_tenant
    AFTER INSERT ON public.owner_tenant_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_bilateral_match();

CREATE TRIGGER trg_student_likes_property
    AFTER INSERT ON public.property_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_bilateral_match();

-- ============================================
-- 11. ROW LEVEL SECURITY
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all"
    ON public.profiles FOR SELECT
    USING (true);
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Properties (public read)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties_select_all"
    ON public.properties FOR SELECT
    USING (true);
CREATE POLICY "properties_insert_owner"
    ON public.properties FOR INSERT
    WITH CHECK (true);

-- Owners (public read)
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_select_all"
    ON public.owners FOR SELECT
    USING (true);

-- Property likes (user's own)
ALTER TABLE public.property_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_likes_select_own"
    ON public.property_likes FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "property_likes_insert_own"
    ON public.property_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "property_likes_delete_own"
    ON public.property_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Property rejections (user's own)
ALTER TABLE public.property_rejections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_rejections_select_own"
    ON public.property_rejections FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "property_rejections_insert_own"
    ON public.property_rejections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Owner tenant likes
ALTER TABLE public.owner_tenant_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_tenant_likes_select"
    ON public.owner_tenant_likes FOR SELECT
    USING (true);
CREATE POLICY "owner_tenant_likes_insert"
    ON public.owner_tenant_likes FOR INSERT
    WITH CHECK (true);

-- Property matches (user sees their own matches)
ALTER TABLE public.property_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_matches_select_own"
    ON public.property_matches FOR SELECT
    USING (auth.uid() = user_id);

-- Roommate profiles
ALTER TABLE public.roommate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roommate_profiles_select_all"
    ON public.roommate_profiles FOR SELECT
    USING (true);
CREATE POLICY "roommate_profiles_insert_own"
    ON public.roommate_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "roommate_profiles_update_own"
    ON public.roommate_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Roommate matches
ALTER TABLE public.roommate_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roommate_matches_select_own"
    ON public.roommate_matches FOR SELECT
    USING (auth.uid() = student_1_id OR auth.uid() = student_2_id);

-- ============================================
-- 12. INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_property_likes_user
    ON public.property_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_property_likes_property
    ON public.property_likes(property_id);
CREATE INDEX IF NOT EXISTS idx_property_rejections_user
    ON public.property_rejections(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_tenant_likes_property
    ON public.owner_tenant_likes(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_tenant_likes_user
    ON public.owner_tenant_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_property_matches_user
    ON public.property_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_property_matches_property
    ON public.property_matches(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner
    ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_city
    ON public.properties(city);
