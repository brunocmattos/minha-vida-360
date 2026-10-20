CREATE TABLE public.fin_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('receita','despesa')),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fin_categories_owner_kind_name ON public.fin_categories(owner_id, kind, lower(btrim(name)));

CREATE TABLE public.fin_recurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('receita','despesa')),
  category_id uuid REFERENCES public.fin_categories(id) ON DELETE RESTRICT,
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 120),
  amount_planned numeric(12,2) NOT NULL CHECK (amount_planned >= 0 AND amount_planned <= 99999999),
  day_of_month smallint NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  start_month date NOT NULL CHECK (extract(day from start_month) = 1 AND start_month BETWEEN '2000-01-01' AND '2100-12-01'),
  end_month date CHECK (end_month IS NULL OR (extract(day from end_month) = 1 AND end_month >= start_month)),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('receita','despesa')),
  category_id uuid REFERENCES public.fin_categories(id) ON DELETE RESTRICT,
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 120),
  amount_planned numeric(12,2) NOT NULL CHECK (amount_planned >= 0 AND amount_planned <= 99999999),
  amount_paid numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0 AND amount_paid <= 99999999),
  due_date date NOT NULL CHECK (due_date BETWEEN '2000-01-01' AND '2100-12-31'),
  paid_date date CHECK (paid_date IS NULL OR paid_date BETWEEN '2000-01-01' AND '2100-12-31'),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  recurrence_id uuid REFERENCES public.fin_recurrences(id) ON DELETE RESTRICT,
  competence date CHECK (competence IS NULL OR extract(day from competence) = 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fin_entries_paid_needs_date CHECK (amount_paid = 0 OR paid_date IS NOT NULL),
  CONSTRAINT fin_entries_rec_competence UNIQUE (owner_id, recurrence_id, competence)
);
CREATE INDEX fin_entries_owner_due ON public.fin_entries(owner_id, due_date);
COMMENT ON TABLE public.fin_entries IS 'Lançamentos. Extensão futura: debt_id/installment_no para dívidas e parcelamentos; reserve_id para reservas.';

CREATE OR REPLACE FUNCTION public.fin_touch() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE TRIGGER fin_entries_touch BEFORE UPDATE ON public.fin_entries FOR EACH ROW EXECUTE FUNCTION public.fin_touch();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_categories, public.fin_recurrences, public.fin_entries TO authenticated;
GRANT ALL ON public.fin_categories, public.fin_recurrences, public.fin_entries TO service_role;
ALTER TABLE public.fin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY fc_select ON public.fin_categories FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY fc_insert ON public.fin_categories FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY fc_update ON public.fin_categories FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY fc_delete ON public.fin_categories FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY fr_select ON public.fin_recurrences FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY fr_insert ON public.fin_recurrences FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (category_id IS NULL OR EXISTS (SELECT 1 FROM public.fin_categories c WHERE c.id = category_id AND c.owner_id = auth.uid())));
CREATE POLICY fr_update ON public.fin_recurrences FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND (category_id IS NULL OR EXISTS (SELECT 1 FROM public.fin_categories c WHERE c.id = category_id AND c.owner_id = auth.uid())));

CREATE POLICY fe_select ON public.fin_entries FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY fe_insert ON public.fin_entries FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid()
  AND (category_id IS NULL OR EXISTS (SELECT 1 FROM public.fin_categories c WHERE c.id = category_id AND c.owner_id = auth.uid()))
  AND (recurrence_id IS NULL OR EXISTS (SELECT 1 FROM public.fin_recurrences r WHERE r.id = recurrence_id AND r.owner_id = auth.uid())));
CREATE POLICY fe_update ON public.fin_entries FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid()
  AND (category_id IS NULL OR EXISTS (SELECT 1 FROM public.fin_categories c WHERE c.id = category_id AND c.owner_id = auth.uid()))
  AND (recurrence_id IS NULL OR EXISTS (SELECT 1 FROM public.fin_recurrences r WHERE r.id = recurrence_id AND r.owner_id = auth.uid())));
CREATE POLICY fe_delete ON public.fin_entries FOR DELETE TO authenticated USING (owner_id = auth.uid() AND recurrence_id IS NULL);