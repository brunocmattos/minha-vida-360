ALTER TABLE public.fin_entries ADD COLUMN IF NOT EXISTS amount_manual boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.fin_entries.amount_manual IS 'Valor previsto editado à mão: o cálculo automático (repasse) não sobrescreve';
