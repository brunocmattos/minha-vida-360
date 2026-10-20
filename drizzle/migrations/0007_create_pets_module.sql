CREATE TABLE public.pet_profiles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL DEFAULT auth.uid(), slug TEXT NOT NULL, name TEXT NOT NULL, photo_url TEXT, birth_date DATE, weight_kg NUMERIC, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (owner_id, slug));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_profiles TO authenticated;
GRANT ALL ON public.pet_profiles TO service_role;
ALTER TABLE public.pet_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY pp_select ON public.pet_profiles FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY pp_insert ON public.pet_profiles FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY pp_update ON public.pet_profiles FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY pp_delete ON public.pet_profiles FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.pet_care_records (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL DEFAULT auth.uid(), pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE, kind TEXT NOT NULL, title TEXT NOT NULL, done_date DATE, next_date DATE, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_care_records TO authenticated;
GRANT ALL ON public.pet_care_records TO service_role;
ALTER TABLE public.pet_care_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY pcr_select ON public.pet_care_records FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY pcr_insert ON public.pet_care_records FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.pet_profiles p WHERE p.id = pet_id AND p.owner_id = auth.uid()));
CREATE POLICY pcr_update ON public.pet_care_records FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY pcr_delete ON public.pet_care_records FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.pet_contacts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL DEFAULT auth.uid(), name TEXT NOT NULL, role TEXT, phone TEXT, address TEXT, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_contacts TO authenticated;
GRANT ALL ON public.pet_contacts TO service_role;
ALTER TABLE public.pet_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY pc_select ON public.pet_contacts FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY pc_insert ON public.pet_contacts FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY pc_update ON public.pet_contacts FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY pc_delete ON public.pet_contacts FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TRIGGER pet_profiles_touch BEFORE UPDATE ON public.pet_profiles FOR EACH ROW EXECUTE FUNCTION fin_touch();
CREATE TRIGGER pet_care_records_touch BEFORE UPDATE ON public.pet_care_records FOR EACH ROW EXECUTE FUNCTION fin_touch();
CREATE TRIGGER pet_contacts_touch BEFORE UPDATE ON public.pet_contacts FOR EACH ROW EXECUTE FUNCTION fin_touch();