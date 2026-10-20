import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, ArrowLeftRight, Wallet, PiggyBank, Utensils, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { confirmDiscard } from "@/components/back-button";
import {
  accountBalance,
  ACCOUNT_NAMES,
  type Account,
  type Opening,
  type Transfer,
} from "@/lib/finance-balances";
import { formatBRL, parseBRL, summarizeMonth, type Entry } from "@/lib/finance";
import { todaySP, formatDue } from "@/lib/recurrence";

const cls = "w-full rounded-md border bg-background px-3 py-2 text-sm";
export function useWalletData() {
  return useQuery({
    queryKey: ["fin-wallets"],
    queryFn: async () => {
      const [o, t, h] = await Promise.all([
        supabase.from("fin_openings").select("*"),
        supabase.from("fin_transfers").select("*"),
        supabase.from("fin_opening_history").select("*").order("changed_at", { ascending: false }),
      ]);
      if (o.error || t.error || h.error) throw o.error || t.error || h.error;
      return {
        openings: (o.data ?? []).map((x) => ({ ...x, amount: Number(x.amount) })) as Opening[],
        transfers: (t.data ?? []).map((x) => ({ ...x, amount: Number(x.amount) })) as Transfer[],
        history: h.data ?? [],
      };
    },
  });
}
export function WalletDashboard({ entries, month }: { entries: Entry[]; month: string }) {
  const q = useWalletData();
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Account | null>(null);
  const [amount, setAmount] = useState("");
  const [included, setIncluded] = useState(true);
  const [initial, setInitial] = useState("");
  const [initialIncluded, setInitialIncluded] = useState(true);
  const [transfer, setTransfer] = useState(false);
  const [from, setFrom] = useState<"banco" | "poupanca">("banco");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todaySP());
  const [error, setError] = useState("");
  const run = useMutation({
    mutationFn: async (fn: () => Promise<void>) => fn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-wallets"] });
      setEdit(null);
      setTransfer(false);
      setValue("");
      setError("");
    },
    onError: () => setError("Não foi possível salvar. Tente novamente."),
  });
  if (q.isLoading) return <p className="text-muted-foreground">Carregando carteiras…</p>;
  if (!q.data || q.error)
    return (
      <p role="alert" className="text-destructive">
        Não foi possível carregar as carteiras.
      </p>
    );
  const d = q.data;
  const balance = (a: Account) => accountBalance(entries, d.transfers, d.openings, a, month);
  const pluxee = balance("pluxee"),
    ifood = balance("ifood");
  const summary = summarizeMonth(entries, month);
  const open = (a: Account) => {
    const b = balance(a);
    const v = b.opening === null ? "" : String(b.opening).replace(".", ",");
    setAmount(v);
    setInitial(v);
    setIncluded(b.included);
    setInitialIncluded(b.included);
    setError("");
    setEdit(a);
  };
  const cancel = () => {
    if (confirmDiscard(amount !== initial || included !== initialIncluded)) setEdit(null);
  };
  const amountText = (n: number | null) => (n === null ? "A definir" : formatBRL(n));
  const card = (a: "banco" | "poupanca", icon: typeof Wallet) => {
    const b = balance(a);
    const Icon = icon;
    return (
      <article
        className={a === "banco" ? "fin-hero p-6 sm:p-8" : "fin-surface p-6"}
        aria-label={ACCOUNT_NAMES[a]}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="flex min-w-0 items-center gap-3 text-base font-semibold">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary/60 text-primary">
              <Icon className="size-5" />
            </span>
            {ACCOUNT_NAMES[a]}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar abertura ${ACCOUNT_NAMES[a]}`}
            onClick={() => open(a)}
          >
            <Pencil className="size-4 text-muted-foreground" />
          </Button>
        </div>
        <div
          className={
            a === "banco" ? "mt-7 grid gap-6 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" : "mt-6"
          }
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Saldo real estimado · confirmado</p>
            <p
              className={`mt-3 font-display font-semibold tabular-nums ${a === "banco" ? "text-4xl sm:text-5xl" : "text-3xl"} ${b.closing !== null && b.closing < 0 ? "text-expense" : b.closing === null ? "text-muted-foreground" : "text-foreground"}`}
            >
              {amountText(b.closing)}
            </p>
            {a === "banco" && (
              <div className="mt-7">
                <p className="text-xs text-muted-foreground">Resultado previsto · sem abertura</p>
                <p className="mt-2 text-xl font-medium tabular-nums text-primary">
                  {formatBRL(summary.plannedIn - summary.plannedOut)}
                </p>
              </div>
            )}
          </div>
          <div
            className={
              a === "banco"
                ? "border-t border-border/50 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"
                : "mt-5 border-t border-border/50 pt-4"
            }
          >
            <p className="text-xs text-muted-foreground">Saldo mês anterior</p>
            <p className="mt-2 text-xl font-medium tabular-nums">{amountText(b.opening)}</p>
            {b.label && (
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {b.label}
              </p>
            )}
            <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={b.included}
                disabled={b.opening === null || run.isPending}
                onChange={(e) => {
                  const included = e.target.checked;
                  run.mutate(async () => {
                    if (b.opening === null) return;
                    const old = d.openings.find((o) => o.wallet === a && o.competence === month);
                    const row = {
                      wallet: a,
                      competence: month,
                      amount: b.opening,
                      included,
                      label: old?.label ?? null,
                    };
                    const res = await supabase
                      .from("fin_openings")
                      .upsert(row, { onConflict: "owner_id,wallet,competence" });
                    if (res.error) throw res.error;
                  });
                }}
              />
              Incluir saldo anterior
            </label>
            {!b.included && (
              <p className="mt-2 text-xs text-muted-foreground">
                Saldo anterior excluído do cálculo deste mês.
              </p>
            )}
          </div>
        </div>
        <dl
          className={`mt-6 border-t border-border/50 pt-5 ${a === "banco" ? "grid gap-4 sm:grid-cols-3" : "space-y-3"}`}
        >
          <div>
            <dt className="text-xs text-muted-foreground">Recebimentos confirmados</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-income">
              + {formatBRL(b.movement.incoming)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pagamentos confirmados</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-expense">
              − {formatBRL(b.movement.outgoing)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Transferências líquidas</dt>
            <dd
              className={`mt-1 text-sm font-medium tabular-nums ${b.movement.transferred < 0 ? "text-expense" : "text-muted-foreground"}`}
            >
              {formatBRL(b.movement.transferred)}
            </dd>
          </div>
        </dl>
        {a === "poupanca" && (
          <p className="mt-5 text-xs text-muted-foreground">Metas no Planejamento anual</p>
        )}
      </article>
    );
  };
  return (
    <section className="space-y-5">
      {card("banco", Wallet)}
      <div className="grid gap-5 md:grid-cols-2">
        <article className="fin-surface p-6" aria-label="Alimentação">
          <h2 className="flex items-center gap-3 text-base font-semibold">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <Utensils className="size-5" />
            </span>
            Alimentação
          </h2>
          <p className="mt-6 text-xs text-muted-foreground">Saldo agregado conhecido</p>
          <p
            className={`mt-3 font-display text-3xl font-semibold tabular-nums ${pluxee.closing !== null && ifood.closing !== null && pluxee.closing + ifood.closing < 0 ? "text-expense" : "text-foreground"}`}
          >
            {pluxee.closing === null || ifood.closing === null
              ? "A definir"
              : formatBRL(pluxee.closing + ifood.closing)}
          </p>
          {(["pluxee", "ifood"] as const).map((a) => {
            const b = balance(a);
            return (
              <div key={a} className="mt-5 border-t border-border/50 pt-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <h3 className="min-w-0 text-sm font-medium text-muted-foreground">
                    {ACCOUNT_NAMES[a]}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar abertura ${ACCOUNT_NAMES[a]}`}
                    onClick={() => open(a)}
                  >
                    <Pencil className="size-4 text-muted-foreground" />
                  </Button>
                </div>
                <p
                  className={`text-lg font-medium tabular-nums ${b.closing !== null && b.closing < 0 ? "text-expense" : b.closing === null ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {amountText(b.closing)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Abertura {amountText(b.opening)} · recebido{" "}
                  <span className="text-income">{formatBRL(b.movement.incoming)}</span>
                </p>
              </div>
            );
          })}
        </article>
        {card("poupanca", PiggyBank)}
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setTransfer(true);
            setFrom("banco");
            setDate(todaySP());
            setError("");
          }}
        >
          <ArrowLeftRight />
          Transferir entre contas
        </Button>
      </div>
      <details className="border-t pt-3">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          Transferências e ajustes de saldo
        </summary>
        <ul className="mt-3 space-y-2">
          {d.transfers.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-xs"
            >
              <span>
                {ACCOUNT_NAMES[t.from_wallet]} → {ACCOUNT_NAMES[t.to_wallet]} ·{" "}
                {formatBRL(t.amount)} · {formatDue(t.transfer_date)}
                {t.reversed_at ? " · Revertida" : ""}
              </span>
              {!t.reversed_at && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={run.isPending}
                  onClick={() => {
                    if (window.confirm("Reverter esta transferência? O registro será preservado."))
                      run.mutate(async () => {
                        const r = await supabase
                          .from("fin_transfers")
                          .update({ reversed_at: new Date().toISOString() })
                          .eq("id", t.id)
                          .is("reversed_at", null);
                        if (r.error) throw r.error;
                      });
                  }}
                >
                  Reverter
                </Button>
              )}
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          {d.history.map((h) => (
            <li key={h.id}>
              {ACCOUNT_NAMES[h.wallet as Account] ?? h.wallet} · {formatDue(h.competence)} ·{" "}
              {h.old_amount === null ? "A definir" : formatBRL(Number(h.old_amount))} →{" "}
              {h.new_amount === null ? "Removido" : formatBRL(Number(h.new_amount))} ·{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(h.changed_at))}
            </li>
          ))}
        </ul>
      </details>
      {error && !edit && !transfer && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Dialog
        open={!!edit}
        onOpenChange={(o) => {
          if (!o) cancel();
        }}
      >
        <DialogContent>
          <DialogTitle>Saldo de abertura · {edit ? ACCOUNT_NAMES[edit] : ""}</DialogTitle>
          <DialogDescription>
            Competência {formatDue(month).slice(3)} · sem alterar lançamentos
          </DialogDescription>
          <label className="text-sm">
            Valor (R$)
            <input
              className={`${cls} mt-1`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={included}
              onChange={(e) => setIncluded(e.target.checked)}
            />
            Incluir no cálculo
          </label>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancel}>
              Cancelar
            </Button>
            <Button
              disabled={run.isPending}
              onClick={() => {
                const negative = amount.trim().startsWith("-");
                const unsigned = parseBRL(negative ? amount.trim().slice(1) : amount);
                const parsed = unsigned === null ? null : negative ? -unsigned : unsigned;
                if (!edit || parsed === null) return setError("Informe um valor válido.");
                const wallet = edit;
                run.mutate(async () => {
                  const existing = d.openings.find(
                    (o) => o.wallet === wallet && o.competence === month,
                  );
                  const r = await supabase
                    .from("fin_openings")
                    .upsert(
                      {
                        wallet,
                        competence: month,
                        amount: parsed,
                        included,
                        label: existing?.label ?? null,
                      },
                      { onConflict: "owner_id,wallet,competence" },
                    );
                  if (r.error) throw r.error;
                });
              }}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={transfer}
        onOpenChange={(o) => {
          if (!o && confirmDiscard(!!value || from !== "banco" || date !== todaySP())) {
            setTransfer(false);
            setValue("");
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Transferir entre contas</DialogTitle>
          <DialogDescription>
            Não é receita nem despesa. Benefícios não participam.
          </DialogDescription>
          <label className="text-sm">
            Origem
            <select
              className={cls}
              value={from}
              onChange={(e) => setFrom(e.target.value as "banco" | "poupanca")}
            >
              <option value="banco">Conta corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          </label>
          <p className="text-sm text-muted-foreground">
            Destino: {ACCOUNT_NAMES[from === "banco" ? "poupanca" : "banco"]}
          </p>
          <label className="text-sm">
            Valor (R$)
            <input
              className={cls}
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Data
            <input
              type="date"
              className={cls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (confirmDiscard(!!value || from !== "banco" || date !== todaySP())) {
                  setTransfer(false);
                  setValue("");
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={run.isPending}
              onClick={() => {
                const n = parseBRL(value);
                if (n === null || n <= 0 || !date)
                  return setError("Informe valor positivo e data.");
                run.mutate(async () => {
                  const r = await supabase
                    .from("fin_transfers")
                    .insert({
                      from_wallet: from,
                      to_wallet: from === "banco" ? "poupanca" : "banco",
                      amount: n,
                      transfer_date: date,
                    });
                  if (r.error) throw r.error;
                });
              }}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type Goal = {
  id: string;
  name: string;
  target_amount: number | null;
  target_date: string | null;
  allocated_amount: number | null;
};
export function SavingsGoals() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["fin-goals"],
    queryFn: async () => {
      const r = await supabase.from("fin_savings_goals").select("*").order("created_at");
      if (r.error) throw r.error;
      return r.data as Goal[];
    },
  });
  const [edit, setEdit] = useState<Goal | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [allocated, setAllocated] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const run = useMutation({
    mutationFn: async (fn: () => Promise<void>) => fn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-goals"] });
      setEdit(null);
    },
    onError: () => setError("Não foi possível salvar a meta."),
  });
  const open = (g: Goal) => {
    setEdit(g);
    setName(g.name);
    setTarget(g.target_amount === null ? "" : String(g.target_amount));
    setAllocated(g.allocated_amount === null ? "" : String(g.allocated_amount));
    setDate(g.target_date ?? "");
    setError("");
  };
  const cancel = () => {
    if (
      confirmDiscard(
        !!edit &&
          (name !== edit.name ||
            target !== (edit.target_amount === null ? "" : String(edit.target_amount)) ||
            allocated !== (edit.allocated_amount === null ? "" : String(edit.allocated_amount)) ||
            date !== (edit.target_date ?? "")),
      )
    )
      setEdit(null);
  };
  return (
    <section className="space-y-3 border-t pt-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Metas da Poupança</h2>
        <Button
          variant="outline"
          onClick={() =>
            open({
              id: "",
              name: "",
              target_amount: null,
              target_date: null,
              allocated_amount: null,
            })
          }
        >
          Nova meta
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Valores destinados às metas não são somados novamente ao saldo da Poupança.
      </p>
      {q.error && (
        <p role="alert" className="text-destructive">
          Não foi possível carregar metas.
        </p>
      )}
      {!q.isLoading && !q.data?.length && (
        <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {q.data?.map((g) => (
          <article key={g.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{g.name}</h3>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar meta ${g.name}`}
                  onClick={() => open(g)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir meta ${g.name}`}
                  onClick={() => {
                    if (window.confirm("Excluir esta meta?"))
                      run.mutate(async () => {
                        const r = await supabase.from("fin_savings_goals").delete().eq("id", g.id);
                        if (r.error) throw r.error;
                      });
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <p className="text-sm text-primary">
              Objetivo {g.target_amount === null ? "A definir" : formatBRL(g.target_amount)}
            </p>
            <p className="text-xs text-muted-foreground">
              Destinado {g.allocated_amount === null ? "A definir" : formatBRL(g.allocated_amount)}{" "}
              · {g.target_date ? formatDue(g.target_date) : "Prazo a definir"}
            </p>
            {g.target_amount !== null && g.target_amount > 0 && g.allocated_amount !== null && (
              <progress
                aria-label={`Progresso ${g.name}`}
                className="mt-2 w-full accent-primary"
                value={g.allocated_amount}
                max={g.target_amount}
              />
            )}
          </article>
        ))}
      </div>
      <Dialog
        open={!!edit}
        onOpenChange={(o) => {
          if (!o) cancel();
        }}
      >
        <DialogContent>
          <DialogTitle>{edit?.id ? "Editar meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>Poupança · valores e prazo opcionais</DialogDescription>
          {[
            ["Nome", name, setName],
            ["Objetivo (R$)", target, setTarget],
            ["Valor destinado (R$)", allocated, setAllocated],
            ["Prazo", date, setDate],
          ].map(([label, v, set]) => (
            <label key={label as string} className="text-sm">
              {label as string}
              <input
                className={cls}
                type={label === "Prazo" ? "date" : "text"}
                value={v as string}
                onChange={(e) => (set as (x: string) => void)(e.target.value)}
              />
            </label>
          ))}
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancel}>
              Cancelar
            </Button>
            <Button
              disabled={run.isPending}
              onClick={() => {
                const t = target ? parseBRL(target) : null,
                  a = allocated ? parseBRL(allocated) : null;
                if (!name.trim() || (target && t === null) || (allocated && a === null))
                  return setError("Confira o nome e os valores.");
                run.mutate(async () => {
                  const row = {
                    name: name.trim(),
                    target_amount: t,
                    allocated_amount: a,
                    target_date: date || null,
                  };
                  const r = edit?.id
                    ? await supabase.from("fin_savings_goals").update(row).eq("id", edit.id)
                    : await supabase.from("fin_savings_goals").insert(row);
                  if (r.error) throw r.error;
                });
              }}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
