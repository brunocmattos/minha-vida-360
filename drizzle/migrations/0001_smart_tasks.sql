ALTER TABLE public.tasks
  ADD COLUMN area_slug text,
  ADD COLUMN priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta')),
  ADD COLUMN due_date date,
  ADD COLUMN recurrence text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','alternate','weekly','monthly'));

CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  completed_at timestamptz NOT NULL DEFAULT now(),
  due_date date
);
CREATE INDEX task_completions_task_idx ON public.task_completions(task_id, completed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_completions TO authenticated;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tc_select_own ON public.task_completions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY tc_insert_own ON public.task_completions FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.owner_id = auth.uid()));
CREATE POLICY tc_update_own ON public.task_completions FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY tc_delete_own ON public.task_completions FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.complete_recurring_task(p_task_id uuid, p_next_due date)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_due date;
BEGIN
  SELECT due_date INTO v_due FROM public.tasks
   WHERE id = p_task_id AND owner_id = auth.uid() AND recurrence <> 'none' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found or not recurring'; END IF;
  INSERT INTO public.task_completions(task_id, due_date) VALUES (p_task_id, v_due);
  UPDATE public.tasks SET due_date = p_next_due, done = false WHERE id = p_task_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.complete_recurring_task(uuid, date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.complete_recurring_task(uuid, date) TO authenticated;