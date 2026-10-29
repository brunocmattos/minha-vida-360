-- Área Casa: lista de compras e manutenções/serviços. Só tabelas novas; nada existente muda.
-- Tarefas e rotinas da casa usam a tabela tasks (area_slug = 'casa') e o histórico em task_completions.
CREATE TABLE public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  quantity text CHECK (quantity IS NULL OR char_length(quantity) <= 40),
  bought_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shopping_items_owner_idx ON public.shopping_items(owner_id, bought_at, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_items TO authenticated;
GRANT ALL ON public.shopping_items TO service_role;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY si_own ON public.shopping_items FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER shopping_items_touch BEFORE UPDATE ON public.shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.fin_touch();

CREATE TABLE public.home_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  kind text NOT NULL DEFAULT 'manutencao' CHECK (kind IN ('manutencao','conserto','servico')),
  scheduled_date date,
  done_date date,
  provider text CHECK (provider IS NULL OR char_length(provider) <= 120),
  cost numeric CHECK (cost IS NULL OR cost BETWEEN 0 AND 99999999),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX home_maintenance_owner_idx ON public.home_maintenance(owner_id, done_date, scheduled_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_maintenance TO authenticated;
GRANT ALL ON public.home_maintenance TO service_role;
ALTER TABLE public.home_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY hm_own ON public.home_maintenance FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER home_maintenance_touch BEFORE UPDATE ON public.home_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.fin_touch();
