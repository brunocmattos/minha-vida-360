ALTER TABLE public.fin_entries ADD COLUMN benefit_account text CHECK (benefit_account IS NULL OR benefit_account IN ('pluxee','ifood'));
ALTER TABLE public.fin_recurrences ADD COLUMN benefit_account text CHECK (benefit_account IS NULL OR benefit_account IN ('pluxee','ifood'));
UPDATE public.fin_entries SET benefit_account = 'pluxee' WHERE wallet = 'beneficio';
UPDATE public.fin_recurrences SET benefit_account = 'pluxee' WHERE wallet = 'beneficio';
CREATE TABLE public.fin_openings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid(),
 wallet text NOT NULL CHECK(wallet IN ('banco','poupanca','pluxee','ifood')),
 competence date NOT NULL CHECK(EXTRACT(day FROM competence)=1),
 amount numeric NOT NULL CHECK(amount BETWEEN -99999999 AND 99999999),
 included boolean NOT NULL DEFAULT true, label text CHECK(char_length(label)<=180),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id,wallet,competence)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.fin_openings TO authenticated;
GRANT ALL ON public.fin_openings TO service_role;
ALTER TABLE public.fin_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY fo_own ON public.fin_openings FOR ALL TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
CREATE TABLE public.fin_opening_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid(),
 opening_id uuid NOT NULL, wallet text NOT NULL, competence date NOT NULL,
 old_amount numeric, new_amount numeric, old_included boolean, new_included boolean, changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fin_opening_history TO authenticated;
GRANT ALL ON public.fin_opening_history TO service_role;
ALTER TABLE public.fin_opening_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY foh_read ON public.fin_opening_history FOR SELECT TO authenticated USING(owner_id=auth.uid());
CREATE OR REPLACE FUNCTION public.fin_audit_opening() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  INSERT INTO public.fin_opening_history(owner_id,opening_id,wallet,competence,new_amount,new_included) VALUES(NEW.owner_id,NEW.id,NEW.wallet,NEW.competence,NEW.amount,NEW.included);
 ELSIF TG_OP='UPDATE' THEN
  IF NEW.owner_id<>OLD.owner_id OR NEW.wallet<>OLD.wallet OR NEW.competence<>OLD.competence THEN RAISE EXCEPTION 'opening identity is immutable'; END IF;
  INSERT INTO public.fin_opening_history(owner_id,opening_id,wallet,competence,old_amount,new_amount,old_included,new_included) VALUES(NEW.owner_id,NEW.id,NEW.wallet,NEW.competence,OLD.amount,NEW.amount,OLD.included,NEW.included);
 ELSE
  INSERT INTO public.fin_opening_history(owner_id,opening_id,wallet,competence,old_amount,old_included) VALUES(OLD.owner_id,OLD.id,OLD.wallet,OLD.competence,OLD.amount,OLD.included);
 END IF;
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER fin_opening_audit AFTER INSERT OR UPDATE OR DELETE ON public.fin_openings FOR EACH ROW EXECUTE FUNCTION public.fin_audit_opening();
CREATE TRIGGER fin_openings_touch BEFORE UPDATE ON public.fin_openings FOR EACH ROW EXECUTE FUNCTION public.fin_touch();
CREATE TABLE public.fin_transfers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid(),
 from_wallet text NOT NULL CHECK(from_wallet IN ('banco','poupanca')), to_wallet text NOT NULL CHECK(to_wallet IN ('banco','poupanca')),
 amount numeric NOT NULL CHECK(amount>0 AND amount<=99999999), transfer_date date NOT NULL,
 reversed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), CHECK(from_wallet<>to_wallet)
);
GRANT SELECT,INSERT ON public.fin_transfers TO authenticated;
GRANT UPDATE(reversed_at) ON public.fin_transfers TO authenticated;
GRANT ALL ON public.fin_transfers TO service_role;
ALTER TABLE public.fin_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY ft_read ON public.fin_transfers FOR SELECT TO authenticated USING(owner_id=auth.uid());
CREATE POLICY ft_insert ON public.fin_transfers FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid() AND reversed_at IS NULL);
CREATE POLICY ft_reverse ON public.fin_transfers FOR UPDATE TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
CREATE OR REPLACE FUNCTION public.fin_guard_transfer() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.id<>OLD.id OR NEW.owner_id<>OLD.owner_id OR NEW.from_wallet<>OLD.from_wallet OR NEW.to_wallet<>OLD.to_wallet OR NEW.amount<>OLD.amount OR NEW.transfer_date<>OLD.transfer_date OR NEW.created_at<>OLD.created_at THEN RAISE EXCEPTION 'transfer is immutable'; END IF;
 IF OLD.reversed_at IS NOT NULL THEN NEW.reversed_at:=OLD.reversed_at;
 ELSIF NEW.reversed_at IS NOT NULL THEN NEW.reversed_at:=now(); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fin_transfer_guard BEFORE UPDATE ON public.fin_transfers FOR EACH ROW EXECUTE FUNCTION public.fin_guard_transfer();
CREATE TABLE public.fin_savings_goals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid(),
 name text NOT NULL CHECK(char_length(btrim(name)) BETWEEN 1 AND 100),
 target_amount numeric CHECK(target_amount BETWEEN 0 AND 99999999), target_date date,
 allocated_amount numeric CHECK(allocated_amount BETWEEN 0 AND 99999999),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.fin_savings_goals TO authenticated;
GRANT ALL ON public.fin_savings_goals TO service_role;
ALTER TABLE public.fin_savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY fsg_own ON public.fin_savings_goals FOR ALL TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
CREATE TRIGGER fin_goals_touch BEFORE UPDATE ON public.fin_savings_goals FOR EACH ROW EXECUTE FUNCTION public.fin_touch();