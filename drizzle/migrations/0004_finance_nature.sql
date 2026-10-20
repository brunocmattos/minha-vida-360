CREATE TYPE public.fin_nature AS ENUM ('nao_classificada', 'fixa', 'variavel', 'anual');
ALTER TABLE public.fin_entries ADD COLUMN nature public.fin_nature NOT NULL DEFAULT 'nao_classificada';
ALTER TABLE public.fin_recurrences ADD COLUMN nature public.fin_nature NOT NULL DEFAULT 'nao_classificada';
COMMENT ON COLUMN public.fin_entries.nature IS 'Classification independent of category and recurrence frequency';
COMMENT ON COLUMN public.fin_recurrences.nature IS 'Default nature for generated occurrences; annual is classification only';