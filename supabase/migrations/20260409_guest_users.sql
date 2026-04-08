-- Tabla para arrendatarios en modo demo (sin auth)
CREATE TABLE IF NOT EXISTS public.guest_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL DEFAULT '',
    email text,
    phone text,
    user_mode text DEFAULT 'find-room',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.guest_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guest_users_select_demo" ON public.guest_users FOR SELECT USING (true);
CREATE POLICY "guest_users_insert_demo" ON public.guest_users FOR INSERT WITH CHECK (true);
CREATE POLICY "guest_users_update_demo" ON public.guest_users FOR UPDATE USING (true);
