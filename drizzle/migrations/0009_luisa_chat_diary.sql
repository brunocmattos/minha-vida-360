CREATE TABLE public.luisa_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'Conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.luisa_conversations TO authenticated;
GRANT ALL ON public.luisa_conversations TO service_role;
ALTER TABLE public.luisa_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY lc_select ON public.luisa_conversations FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY lc_insert ON public.luisa_conversations FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY lc_update ON public.luisa_conversations FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY lc_delete ON public.luisa_conversations FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.luisa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  conversation_id uuid NOT NULL REFERENCES public.luisa_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  action jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.luisa_messages TO authenticated;
GRANT ALL ON public.luisa_messages TO service_role;
ALTER TABLE public.luisa_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY lm_select ON public.luisa_messages FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY lm_insert ON public.luisa_messages FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.luisa_conversations c WHERE c.id = conversation_id AND c.owner_id = auth.uid()));
CREATE POLICY lm_update ON public.luisa_messages FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY lm_delete ON public.luisa_messages FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX lm_conversation_idx ON public.luisa_messages (conversation_id, created_at);

CREATE TABLE public.diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  entry_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  area_slug text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entries TO authenticated;
GRANT ALL ON public.diary_entries TO service_role;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY de_select ON public.diary_entries FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY de_insert ON public.diary_entries FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY de_update ON public.diary_entries FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY de_delete ON public.diary_entries FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER diary_entries_touch BEFORE UPDATE ON public.diary_entries FOR EACH ROW EXECUTE FUNCTION fin_touch();
CREATE TRIGGER luisa_conversations_touch BEFORE UPDATE ON public.luisa_conversations FOR EACH ROW EXECUTE FUNCTION fin_touch();