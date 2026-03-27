-- 1. owners
CREATE TABLE public.owners (
    owner_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. properties
CREATE TABLE public.properties (
    property_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid REFERENCES public.owners(owner_id) ON DELETE CASCADE,
    title text NOT NULL,
    monthly_rent numeric NOT NULL,
    neighborhood text,
    city text NOT NULL,
    allows_students boolean DEFAULT true,
    requires_co_debtor boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. students
CREATE TABLE public.students (
    student_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    university_name text,
    city text,
    semester integer,
    age integer,
    monthly_budget numeric,
    has_co_debtor boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. applications
CREATE TABLE public.applications (
    application_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.students(student_id) ON DELETE CASCADE,
    property_id uuid REFERENCES public.properties(property_id) ON DELETE CASCADE,
    status text DEFAULT 'pending', -- pending, accepted, rejected
    application_date timestamp with time zone DEFAULT now()
);

-- 5. roommate_profiles
CREATE TABLE public.roommate_profiles (
    student_id uuid PRIMARY KEY REFERENCES public.students(student_id) ON DELETE CASCADE,
    sleep_schedule text,
    study_habits text,
    cleanliness_level text,
    smoking boolean DEFAULT false,
    pets boolean DEFAULT false,
    preferred_budget_min numeric,
    preferred_budget_max numeric
);

-- 6. roommate_matches
CREATE TABLE public.roommate_matches (
    match_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_1_id uuid REFERENCES public.students(student_id) ON DELETE CASCADE,
    student_2_id uuid REFERENCES public.students(student_id) ON DELETE CASCADE,
    compatibility_score numeric,
    status text DEFAULT 'pending', -- liked, matched, rejected
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(student_1_id, student_2_id)
);

-- User Flow addition: saved properties (Guardados)
CREATE TABLE public.saved_properties (
    save_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.students(student_id) ON DELETE CASCADE,
    property_id uuid REFERENCES public.properties(property_id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(student_id, property_id)
);
