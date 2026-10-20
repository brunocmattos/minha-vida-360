DROP POLICY fe_delete ON public.fin_entries;
CREATE POLICY fe_delete ON public.fin_entries FOR DELETE TO authenticated USING (owner_id = auth.uid() AND (recurrence_id IS NULL OR amount_paid = 0));