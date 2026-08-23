-- 0. Ensure global clinic exists (required for foreign key constraints on global audit logs)
INSERT INTO public."Clinic" (id, name, subdomain, "primaryColor", status, "updatedAt")
VALUES ('global', 'Global Platform', 'global', '#3b82f6', 'VERIFIED', now())
ON CONFLICT (id) DO NOTHING;

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('patient', 'doctor', 'receptionist', 'admin', 'super_admin')),
    clinic_id text,
    full_name text,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END
$$;

-- 4. Create trigger to automatically insert a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_role text;
    v_full_name text;
    v_clinic_id text;
    v_super_admin_email text;
BEGIN
    v_super_admin_email := 'kumaradarsh1234567@gmail.com';

    IF lower(new.email) = lower(v_super_admin_email) THEN
        v_role := 'super_admin';
    ELSE
        -- Extract role from metadata, default to patient
        v_role := lower(coalesce(new.raw_user_meta_data->>'role', 'patient'));
        -- Standardize role values
        IF v_role NOT IN ('patient', 'doctor', 'receptionist', 'admin', 'super_admin') THEN
            v_role := 'patient';
        END IF;
    END IF;

    -- Extract full name
    v_full_name := coalesce(
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
    );

    -- Extract clinic_id (which could be in metadata)
    v_clinic_id := coalesce(
        new.raw_user_meta_data->>'clinic_id',
        new.raw_user_meta_data->>'clinicId'
    );

    INSERT INTO public.profiles (id, role, clinic_id, full_name, email, created_at, updated_at)
    VALUES (
        new.id,
        v_role,
        v_clinic_id,
        v_full_name,
        new.email,
        coalesce(new.created_at, now()),
        coalesce(new.created_at, now())
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        role = EXCLUDED.role,
        clinic_id = coalesce(EXCLUDED.clinic_id, public.profiles.clinic_id),
        full_name = coalesce(EXCLUDED.full_name, public.profiles.full_name),
        email = coalesce(EXCLUDED.email, public.profiles.email),
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Migrate existing data from Prisma tables (Patient, Doctor, Receptionist, ClinicAdmin) into profiles
-- First populate from auth.users to ensure all auth users have profiles
INSERT INTO public.profiles (id, role, clinic_id, full_name, email, created_at, updated_at)
SELECT 
    u.id,
    CASE 
        WHEN lower(u.email) = 'kumaradarsh1234567@gmail.com' THEN 'super_admin'
        ELSE lower(coalesce(u.raw_user_meta_data->>'role', 'patient'))
    END as role,
    coalesce(u.raw_user_meta_data->>'clinic_id', u.raw_user_meta_data->>'clinicId') as clinic_id,
    coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
    u.email,
    coalesce(u.created_at, now()),
    coalesce(u.updated_at, now())
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Now update profiles based on data in specific role tables (ClinicAdmin)
UPDATE public.profiles p
SET role = 'admin',
    clinic_id = ca."clinicId",
    full_name = ca.name
FROM "ClinicAdmin" ca
WHERE (ca."userId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND p.id = ca."userId"::uuid)
   OR p.email = ca.email;

-- Update profiles based on Doctor
UPDATE public.profiles p
SET role = 'doctor',
    clinic_id = d."clinicId",
    full_name = d.name
FROM "Doctor" d
WHERE (d."userId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND p.id = d."userId"::uuid)
   OR p.email = d.email;

-- Update profiles based on Receptionist
UPDATE public.profiles p
SET role = 'receptionist',
    clinic_id = r."clinicId",
    full_name = r.name
FROM "Receptionist" r
WHERE (r."userId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND p.id = r."userId"::uuid)
   OR p.email = r.email;

-- Update profiles based on Patient
UPDATE public.profiles p
SET role = 'patient',
    clinic_id = pat."clinicId",
    full_name = pat.name
FROM "Patient" pat
WHERE (pat."userId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND p.id = pat."userId"::uuid)
   OR (pat.email IS NOT NULL AND p.email = pat.email);

-- Ensure all users in role-specific tables with valid auth userIds are inserted if missing
INSERT INTO public.profiles (id, role, clinic_id, full_name, email)
SELECT 
    ca."userId"::uuid,
    'admin',
    ca."clinicId",
    ca.name,
    ca.email
FROM "ClinicAdmin" ca
WHERE ca."userId" IS NOT NULL 
  AND ca."userId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = ca."userId"::uuid)
ON CONFLICT (id) DO UPDATE SET role = 'admin', clinic_id = EXCLUDED.clinic_id, full_name = EXCLUDED.full_name;

INSERT INTO public.profiles (id, role, clinic_id, full_name, email)
SELECT 
    d."userId"::uuid,
    'doctor',
    d."clinicId",
    d.name,
    d.email
FROM "Doctor" d
WHERE d."userId" IS NOT NULL 
  AND d."userId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = d."userId"::uuid)
ON CONFLICT (id) DO UPDATE SET role = 'doctor', clinic_id = EXCLUDED.clinic_id, full_name = EXCLUDED.full_name;

INSERT INTO public.profiles (id, role, clinic_id, full_name, email)
SELECT 
    r."userId"::uuid,
    'receptionist',
    r."clinicId",
    r.name,
    r.email
FROM "Receptionist" r
WHERE r."userId" IS NOT NULL 
  AND r."userId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = r."userId"::uuid)
ON CONFLICT (id) DO UPDATE SET role = 'receptionist', clinic_id = EXCLUDED.clinic_id, full_name = EXCLUDED.full_name;

INSERT INTO public.profiles (id, role, clinic_id, full_name, email)
SELECT 
    pat."userId"::uuid,
    'patient',
    pat."clinicId",
    pat.name,
    pat.email
FROM "Patient" pat
WHERE pat."userId" IS NOT NULL 
  AND pat."userId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = pat."userId"::uuid)
ON CONFLICT (id) DO UPDATE SET role = 'patient', clinic_id = EXCLUDED.clinic_id, full_name = EXCLUDED.full_name;
