-- 1. Tables for roommate likes and rejections
CREATE TABLE IF NOT EXISTS public.roommate_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    liked_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, liked_user_id)
);

CREATE TABLE IF NOT EXISTS public.roommate_rejections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rejected_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, rejected_user_id)
);

-- 2. Update check_bilateral_match trigger to handle roommates
CREATE OR REPLACE FUNCTION public.check_bilateral_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Case A: Owner just liked a tenant
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

    -- Case B: Student just liked a property
    IF TG_TABLE_NAME = 'property_likes' THEN
        INSERT INTO public.property_matches (user_id, property_id, owner_id)
        SELECT NEW.user_id, NEW.property_id, otl.owner_id
        FROM public.owner_tenant_likes otl
        WHERE otl.user_id = NEW.user_id
          AND otl.property_id = NEW.property_id
        ON CONFLICT (user_id, property_id) DO NOTHING;
    END IF;

    -- Case C: Roommate like
    IF TG_TABLE_NAME = 'roommate_likes' THEN
        -- Check if the liked user already liked this user
        IF EXISTS (
            SELECT 1 FROM public.roommate_likes
            WHERE user_id = NEW.liked_user_id
              AND liked_user_id = NEW.user_id
        ) THEN
            -- Bilateral match!
            -- student_1_id should always be the smaller UUID to ensure uniqueness regardless of order
            INSERT INTO public.roommate_matches (student_1_id, student_2_id, status)
            VALUES (
                CASE WHEN NEW.user_id::text < NEW.liked_user_id::text THEN NEW.user_id ELSE NEW.liked_user_id END,
                CASE WHEN NEW.user_id::text < NEW.liked_user_id::text THEN NEW.liked_user_id ELSE NEW.user_id END,
                'matched'
            )
            ON CONFLICT (student_1_id, student_2_id) DO UPDATE SET status = 'matched';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure trigger is attached to roommate_likes
DROP TRIGGER IF EXISTS trg_roommate_likes ON public.roommate_likes;
CREATE TRIGGER trg_roommate_likes
    AFTER INSERT ON public.roommate_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_bilateral_match();

-- 4. RLS for demo mode
ALTER TABLE public.roommate_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roommate_likes_all" ON public.roommate_likes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.roommate_rejections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roommate_rejections_all" ON public.roommate_rejections FOR ALL USING (true) WITH CHECK (true);
