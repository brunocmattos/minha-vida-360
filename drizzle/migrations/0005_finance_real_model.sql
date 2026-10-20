ALTER TYPE public.fin_nature ADD VALUE IF NOT EXISTS 'temporaria' BEFORE 'anual';

ALTER TABLE public.fin_recurrences
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS wallet text NOT NULL DEFAULT 'banco' CHECK (wallet IN ('banco','beneficio')),
  ADD COLUMN IF NOT EXISTS group_label text CHECK (group_label IS NULL OR char_length(group_label) <= 60),
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS day_known boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS installment_first smallint CHECK (installment_first IS NULL OR installment_first BETWEEN 1 AND 999),
  ADD COLUMN IF NOT EXISTS installment_total smallint CHECK (installment_total IS NULL OR installment_total BETWEEN 1 AND 999),
  ADD COLUMN IF NOT EXISTS formula text CHECK (formula IS NULL OR formula IN ('half_housing')),
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'mensal' CHECK (frequency IN ('mensal','periodica'));
CREATE UNIQUE INDEX IF NOT EXISTS fin_recurrences_owner_slug ON public.fin_recurrences(owner_id, slug) WHERE slug IS NOT NULL;

ALTER TABLE public.fin_entries
  ADD COLUMN IF NOT EXISTS wallet text NOT NULL DEFAULT 'banco' CHECK (wallet IN ('banco','beneficio')),
  ADD COLUMN IF NOT EXISTS group_label text CHECK (group_label IS NULL OR char_length(group_label) <= 60),
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS day_known boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS installment_no smallint,
  ADD COLUMN IF NOT EXISTS installment_total smallint;

CREATE TABLE IF NOT EXISTS public.fin_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  competence date NOT NULL CHECK (EXTRACT(day FROM competence) = 1),
  paid_month date CHECK (paid_month IS NULL OR EXTRACT(day FROM paid_month) = 1),
  employer text NOT NULL CHECK (char_length(employer) BETWEEN 1 AND 60),
  earnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  deductions jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, employer, competence)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_payslips TO authenticated;
GRANT ALL ON public.fin_payslips TO service_role;
ALTER TABLE public.fin_payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY fp_select ON public.fin_payslips FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY fp_insert ON public.fin_payslips FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY fp_update ON public.fin_payslips FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY fp_delete ON public.fin_payslips FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER fin_payslips_touch BEFORE UPDATE ON public.fin_payslips FOR EACH ROW EXECUTE FUNCTION public.fin_touch();

CREATE TABLE IF NOT EXISTS public.fin_credit_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  slug text NOT NULL,
  creditor text NOT NULL CHECK (char_length(btrim(creditor)) BETWEEN 1 AND 80),
  amount numeric NOT NULL CHECK (amount >= 0 AND amount <= 99999999),
  source text NOT NULL DEFAULT 'SPC/Serasa',
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_credit_records TO authenticated;
GRANT ALL ON public.fin_credit_records TO service_role;
ALTER TABLE public.fin_credit_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY fcr_select ON public.fin_credit_records FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY fcr_insert ON public.fin_credit_records FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY fcr_update ON public.fin_credit_records FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY fcr_delete ON public.fin_credit_records FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER fin_credit_records_touch BEFORE UPDATE ON public.fin_credit_records FOR EACH ROW EXECUTE FUNCTION public.fin_touch();