ALTER TABLE public.pet_care_records ADD COLUMN IF NOT EXISTS overdue_since date, ADD COLUMN IF NOT EXISTS shared_group text;
COMMENT ON COLUMN public.pet_care_records.overdue_since IS 'Vaccine overdue date, never an application date or inferred future validity';
COMMENT ON COLUMN public.pet_care_records.shared_group IS 'Display grouping for a shared appointment, each pet retains its own care record';
ALTER POLICY pcr_update ON public.pet_care_records WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.pet_profiles p WHERE p.id = pet_id AND p.owner_id = auth.uid()));