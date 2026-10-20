import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpRight as NavArrow,
  ShieldCheck,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { FinanceChart } from "@/components/finance-chart";
import { WalletDashboard, SavingsGoals } from "@/components/finance-wallets";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreditRecords, Payslips } from "@/components/finance-extra";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CalendarFlow, EntryBrowser } from "@/components/finance-views";
import { SoftCard, EmptyNote } from "@/components/cards";
import { confirmDiscard } from "@/components/back-button";
import { fetchAllRows } from "@/lib/fetch-all";
import { todaySP, formatDue } from "@/lib/recurrence";
import {
  addMonths,
  entryStatus,
  formatBRL,
  monthLabel,
  monthOf,
  parseBRL,
  projection,
  recurrenceOccurrences,
  NATURE_LABEL,
  halfHousingUpdates,
  statusLabel,
  type Nature,
  type Entry,
  type Kind,
  type Recurrence,
} from "@/lib/finance";

type Category = { id: string; kind: Kind; name: string };
type Data = { categories: Category[]; recurrences: Recurrence[]; entries: Entry[] };
const KEY = ["fin"];

async function fetchAll(): Promise<Data> {
  // paginado: o Supabase corta em 1000 linhas; o desempate por id evita páginas cruzadas
  const [c, r, e] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("fin_categories")
        .select("id,kind,name")
        .order("name")
        .order("id")
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase.from("fin_recurrences").select("*").order("created_at").order("id").range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase.from("fin_entries").select("*").order("due_date").order("id").range(from, to),
    ),
  ]);
  return {
    categories: c as Category[],
    recurrences: r.map((x) => ({
      ...x,
      amount_planned: Number(x.amount_planned),
    })) as Recurrence[],
    entries: e.map((x) => ({
      ...x,
      amount_planned: Number(x.amount_planned),
      amount_paid: Number(x.amount_paid),
    })) as Entry[],
  };
}

/** Gera ocorrências faltantes; a chave única (owner, recorrência, competência) impede duplicação. */
async function generate(recs: Recurrence[], currentMonth: string) {
  const rows = recs.flatMap((r) => recurrenceOccurrences(r, currentMonth));
  if (!rows.length) return;
  const { error } = await supabase
    .from("fin_entries")
    .upsert(rows, { onConflict: "owner_id,recurrence_id,competence", ignoreDuplicates: true });
  if (error) throw error;
}

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const btn =
  "inline-flex items-center justify-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition disabled:opacity-50";
const btnPrimary = `${btn} bg-primary text-primary-foreground shadow-soft hover:shadow-lift`;
const btnGhost = `${btn} border bg-card hover:bg-muted`;
const iconBtn =
  "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground";

function friendly(e: unknown): string {
  const m = (e as { message?: string })?.message ?? "";
  if (m.includes("fin_categories_owner_kind_name")) return "Já existe uma categoria com esse nome.";
  if (m.includes("foreign key")) return "Esta categoria está em uso e não pode ser excluída.";
  if (m.includes("paid_needs_date")) return "Informe a data do pagamento.";
  if (m.includes("check")) return "Algum valor ou data está fora do permitido.";
  return "Não foi possível salvar. Tente novamente.";
}

export type FinancePage = "dashboard" | "receitas" | "despesas" | "dividas" | "planejamento";
export function FinanceModule({
  page = "dashboard",
  selectedMonth,
  onMonthChange,
}: {
  page?: FinancePage;
  selectedMonth?: string | undefined;
  onMonthChange?: (m: string) => void;
}) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: KEY, queryFn: fetchAll });
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todaySP()), []);
  const current = today ? monthOf(today) : null;
  const [month, setMonth] = useState<string | null>(selectedMonth ?? null);
  useEffect(() => {
    if (selectedMonth) setMonth(selectedMonth);
  }, [selectedMonth]);
  const changeMonth = (m: string) => {
    setMonth(m);
    onMonthChange?.(m);
  };
  useEffect(() => {
    if (current && !month) setMonth(current);
  }, [current, month]);
  const [tab, setTab] = useState<
    "overview" | "entries" | "calendar" | "proj" | "payslip" | "settings" | "spc"
  >("overview");
  const [msg, setMsg] = useState<string | null>(null);
  const generated = useRef(false);

  useEffect(() => {
    if (!q.data || !current || generated.current) return;
    generated.current = true;
    const active = q.data.recurrences.filter((r) => r.active);
    if (active.length)
      generate(active, current)
        .then(() => qc.invalidateQueries({ queryKey: KEY }))
        .catch((e) => {
          generated.current = false; // permite tentar de novo no próximo carregamento
          setMsg(friendly(e));
        });
  }, [q.data, current, qc]);

  // Joici: previsão = 50% de aluguel+condomínio+energia+internet previstos na mesma competência. Valores já recebidos não mudam.
  useEffect(() => {
    if (!q.data) return;
    const ups = halfHousingUpdates(q.data.entries, q.data.recurrences);
    if (!ups.length) return;
    Promise.all(
      ups.map(async (u) => {
        const { error } = await supabase
          .from("fin_entries")
          .update({ amount_planned: u.v })
          .eq("id", u.id)
          .eq("amount_paid", 0)
          .eq("amount_manual", false)
          .is("paid_date", null);
        if (error) throw error;
      }),
    )
      .then(() => qc.invalidateQueries({ queryKey: KEY }))
      .catch((e) => setMsg(friendly(e)));
  }, [q.data, qc]);

  const run = useMutation({
    mutationFn: async (fn: () => Promise<void>) => fn(),
    onSuccess: () => {
      setMsg(null);
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e) => setMsg(friendly(e)),
  });
  // Para formulários: devolve a promessa para fechar só se salvou; o erro aparece no próprio formulário.
  const save = (fn: () => Promise<void>) =>
    run.mutateAsync(fn).catch((e) => {
      setMsg(null);
      throw e;
    });

  if (q.isLoading || !today || !month || !current)
    return (
      <SoftCard>
        <Loader2
          className="mx-auto size-5 animate-spin text-muted-foreground"
          aria-label="Carregando"
        />
      </SoftCard>
    );
  if (q.error)
    return (
      <SoftCard>
        <p className="text-sm">Não foi possível carregar as finanças.</p>
        <Button variant="ghost" className={`${btnGhost} mt-3`} onClick={() => q.refetch()}>
          Tentar novamente
        </Button>
      </SoftCard>
    );
  const data = q.data;
  if (!data) return null;
  const catName = (id: string | null) =>
    data.categories.find((c) => c.id === id)?.name ?? "Sem categoria";
  const monthEntries = data.entries.filter(
    (e) =>
      monthOf(e.due_date) === month &&
      (page === "receitas"
        ? e.kind === "receita"
        : page === "despesas"
          ? e.kind === "despesa"
          : true),
  );

  const entryRow = (e: Entry) => (
    <EntryRow
      key={e.id}
      e={e}
      today={today}
      cat={catName(e.category_id)}
      categories={data.categories}
      rec={data.recurrences.find((r) => r.id === e.recurrence_id)}
      run={(fn) => run.mutate(fn)}
      save={save}
      busy={run.isPending}
    />
  );

  return (
    <div className="finance-ui space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pb-1">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mês anterior"
            onClick={() => changeMonth(addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <h2 className="text-base font-semibold capitalize sm:text-lg">{monthLabel(month)}</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Próximo mês"
            onClick={() => changeMonth(addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        {month !== current && (
          <Button variant="ghost" onClick={() => changeMonth(current)}>
            Mês atual
          </Button>
        )}
      </div>

      {msg && (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {msg}
        </p>
      )}

      {(page === "receitas" || page === "despesas") && (
        <EntryForm
          defaultKind={page === "receitas" ? "receita" : "despesa"}
          categories={data.categories}
          busy={run.isPending}
          onSave={(row, rec) =>
            save(async () => {
              if (rec) {
                const { data: r, error } = await supabase
                  .from("fin_recurrences")
                  .insert({
                    nature: row.nature,
                    kind: row.kind,
                    category_id: row.category_id,
                    description: row.description,
                    amount_planned: row.amount_planned,
                    day_of_month: Number(row.due_date.slice(8, 10)),
                    start_month: monthOf(row.due_date),
                  })
                  .select("*")
                  .single();
                if (error) throw error;
                await generate(
                  [{ ...r, amount_planned: Number(r.amount_planned) } as Recurrence],
                  current,
                );
              } else {
                const { error } = await supabase.from("fin_entries").insert(row);
                if (error) throw error;
              }
            })
          }
        />
      )}

      {page === "dashboard" && (
        <>
          <WalletDashboard entries={data.entries} month={month} />
          <nav aria-label="Seções de Finanças" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["/area/financas/receitas", "Receitas", "Recebimentos", ArrowDownLeft],
                ["/area/financas/despesas", "Despesas", "Contas e pagamentos", ArrowUpRight],
                ["/area/financas/dividas", "Dívidas", "SPC/Serasa", ShieldCheck],
                [
                  "/area/financas/planejamento",
                  "Planejamento anual",
                  "12 meses e metas",
                  CalendarRange,
                ],
              ] as const
            ).map(([to, label, sub, Icon]) => (
              <Button
                asChild
                variant="ghost"
                key={to}
                className="fin-nav-card h-auto min-h-40 justify-start whitespace-normal p-5 text-left"
              >
                <Link to={to} search={{ mes: month.slice(0, 7) }}>
                  <div className="w-full min-w-0">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                        <Icon className="size-5" />
                      </span>
                      <NavArrow className="size-4 text-muted-foreground" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">{label}</h2>
                    <p className="mt-2 text-xs font-normal text-muted-foreground">{sub}</p>
                  </div>
                </Link>
              </Button>
            ))}
          </nav>
          <FinanceChart entries={data.entries} month={month} />
        </>
      )}
      {(page === "receitas" || page === "despesas") && (
        <>
          <div className="flex flex-wrap gap-2 border-b pb-3">
            <Button
              variant={tab === "calendar" ? "secondary" : "ghost"}
              onClick={() => setTab(tab === "calendar" ? "entries" : "calendar")}
            >
              Calendário/fluxo
            </Button>
            <Button
              variant={tab === "settings" ? "secondary" : "ghost"}
              onClick={() => setTab(tab === "settings" ? "entries" : "settings")}
            >
              Recorrências e categorias
            </Button>
            {page === "despesas" && (
              <Button
                variant={tab === "proj" ? "secondary" : "ghost"}
                onClick={() => setTab(tab === "proj" ? "entries" : "proj")}
              >
                Anuais / periódicas
              </Button>
            )}
          </div>
          {(tab === "overview" || tab === "entries") && (
            <EntryBrowser
              entries={monthEntries}
              today={today}
              categories={data.categories}
              recurrences={data.recurrences}
              expenseView={page === "despesas"}
              renderRow={entryRow}
              categoryView={(es) => <ByCategory entries={es} catName={catName} />}
            />
          )}
          {tab === "calendar" && (
            <CalendarFlow
              entries={data.entries.filter(
                (e) => e.kind === (page === "receitas" ? "receita" : "despesa"),
              )}
              month={month}
            />
          )}
        </>
      )}
      {page === "planejamento" && (
        <>
          <section>
            <h2 className="mb-3 text-base font-semibold">Planejamento anual · 12 meses</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Resultado previsto sem saldo de abertura. Benefícios, transferências, consignados e
              SPC/Serasa não entram no resultado bancário.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-3">Mês</th>
                    <th>Receitas previstas</th>
                    <th>Despesas previstas</th>
                    <th>Resultado previsto</th>
                    <th>Alimentação · separado</th>
                  </tr>
                </thead>
                <tbody>
                  {projection(data.entries, month).map((p) => (
                    <tr key={p.month} className="border-t">
                      <td className="py-3 capitalize">{monthLabel(p.month)}</td>
                      {p.count === 0 ? (
                        <td colSpan={4} className="text-muted-foreground">
                          Ainda não gerado
                        </td>
                      ) : (
                        <>
                          <td className="text-income">{formatBRL(p.plannedIn)}</td>
                          <td className="text-expense">{formatBRL(p.plannedOut)}</td>
                          <td className={p.balance < 0 ? "text-expense" : "text-primary"}>
                            {formatBRL(p.balance)}
                          </td>
                          <td className="text-muted-foreground">{formatBRL(p.benefit)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <Periodic
            recs={data.recurrences.filter((r) => r.frequency === "periodica")}
            entries={data.entries}
            busy={run.isPending}
            save={save}
          />
          <SavingsGoals />
        </>
      )}
      {page === "dividas" && <CreditRecords />}
      {(page === "receitas" || page === "despesas") && tab === "settings" && (
        <SoftCard>
          <h3 className="mb-3 font-semibold">Recorrências</h3>
          {data.recurrences.length === 0 ? (
            <EmptyNote>
              Nenhuma recorrência. Marque "Repetir todo mês" ao criar um lançamento.
            </EmptyNote>
          ) : (
            <ul className="space-y-2">
              {data.recurrences
                .filter(
                  (r) =>
                    r.frequency !== "periodica" &&
                    r.kind === (page === "receitas" ? "receita" : "despesa"),
                )
                .map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">
                        {r.description}{" "}
                        <span className="text-xs text-muted-foreground">({r.kind})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(r.amount_planned)} ·{" "}
                        {NATURE_LABEL[r.nature ?? "nao_classificada"]} ·{" "}
                        {r.day_known === false ? "dia a definir" : `dia ${r.day_of_month}`}
                        {r.group_label ? ` · ${r.group_label}` : ""}
                        {r.installment_total
                          ? ` · parcelas ${r.installment_first}–${r.installment_total}`
                          : ""}{" "}
                        · {catName(r.category_id)} ·{" "}
                        {r.active
                          ? "ativa"
                          : `encerrada${r.end_month ? ` em ${formatDue(r.end_month).slice(3)}` : ""}`}
                      </p>
                    </div>
                    {r.active && (
                      <Button
                        variant="ghost"
                        className={btnGhost}
                        disabled={run.isPending}
                        onClick={() => {
                          if (
                            !confirm(
                              "Encerrar esta recorrência? Lançamentos futuros não pagos serão removidos; pagos e passados ficam no histórico.",
                            )
                          )
                            return;
                          run.mutate(async () => {
                            const { error } = await supabase
                              .from("fin_recurrences")
                              .update({
                                active: false,
                                end_month: current < r.start_month ? r.start_month : current,
                              })
                              .eq("id", r.id);
                            if (error) throw error;
                            const { error: e2 } = await supabase
                              .from("fin_entries")
                              .delete()
                              .eq("recurrence_id", r.id)
                              .gt("competence", current)
                              .eq("amount_paid", 0);
                            if (e2) throw e2;
                          });
                        }}
                      >
                        Encerrar
                      </Button>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </SoftCard>
      )}

      {page === "despesas" && (tab === "proj" || tab === "settings") && (
        <Periodic
          recs={data.recurrences.filter((r) => r.frequency === "periodica")}
          entries={data.entries}
          busy={run.isPending}
          save={save}
        />
      )}
      {(page === "receitas" || page === "despesas") && tab === "settings" && (
        <Categories
          categories={data.categories}
          busy={run.isPending}
          run={(fn) => run.mutate(fn)}
          save={save}
        />
      )}
    </div>
  );
}

type Row = {
  nature: Nature;
  kind: Kind;
  category_id: string | null;
  description: string;
  amount_planned: number;
  due_date: string;
  notes: string | null;
};

function EntryForm({
  categories,
  onSave,
  busy,
  defaultKind = "despesa",
}: {
  defaultKind?: Kind;
  categories: Category[];
  busy: boolean;
  onSave: (r: Row, recurring: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [nature, setNature] = useState<Nature>("nao_classificada");
  const [cat, setCat] = useState("");
  const [notes, setNotes] = useState("");
  const [rec, setRec] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const reset = () => {
    setKind(defaultKind);
    setNature("nao_classificada");
    setCat("");
    setDesc("");
    setAmount("");
    setDue("");
    setNotes("");
    setRec(false);
    setErr(null);
    setOpen(false);
  };
  const cancel = () => {
    const dirty =
      nature !== "nao_classificada" ||
      kind !== defaultKind ||
      !!(cat || desc || amount || due || notes) ||
      rec;
    if (confirmDiscard(dirty)) reset();
  };
  if (!open)
    return (
      <Button variant="ghost" className={btnPrimary} onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Novo lançamento
      </Button>
    );
  const submit = async () => {
    const v = parseBRL(amount);
    if (!desc.trim()) return setErr("Informe uma descrição.");
    if (v === null) return setErr("Valor previsto inválido. Use, por exemplo, 150,00.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return setErr("Informe a data de vencimento.");
    setErr(null);
    try {
      await onSave(
        {
          nature,
          kind,
          category_id: cat || null,
          description: desc.trim(),
          amount_planned: v,
          due_date: due,
          notes: notes.trim() || null,
        },
        rec,
      );
      reset();
    } catch (e) {
      setErr(friendly(e));
    }
  };
  return (
    <SoftCard>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Novo lançamento</h3>
        <Button variant="ghost" className={iconBtn} aria-label="Fechar sem salvar" onClick={cancel}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo">
          <select
            className={inputCls}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind);
              setCat("");
            }}
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </Field>
        <Field label="Categoria">
          <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories
              .filter((c) => c.kind === kind)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Descrição">
          <input
            className={inputCls}
            maxLength={120}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </Field>
        <Field label="Valor previsto (R$)">
          <input
            className={inputCls}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Vencimento">
          <input
            type="date"
            className={inputCls}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </Field>
        <NatureField value={nature} onChange={setNature} />
        <Field label="Observações">
          <input
            className={inputCls}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={rec} onChange={(e) => setRec(e.target.checked)} />{" "}
        <Repeat className="size-4" /> Repetir todo mês (gera os próximos 12 meses)
      </label>
      {err && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {err}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ghost" type="button" className={btnGhost} onClick={cancel}>
          Cancelar
        </Button>
        <Button variant="ghost" className={btnPrimary} disabled={busy} onClick={submit}>
          Salvar
        </Button>
      </div>
    </SoftCard>
  );
}

function NatureField({ value, onChange }: { value: Nature; onChange: (value: Nature) => void }) {
  return (
    <Field label="Natureza">
      <select
        aria-label="Natureza"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value as Nature)}
      >
        {Object.entries(NATURE_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground">
      {label}
      <div className="mt-1 text-foreground">{children}</div>
    </label>
  );
}

function EntryRow({
  e,
  today,
  cat,
  categories,
  rec,
  run,
  busy,
  save,
}: {
  e: Entry;
  today: string;
  cat: string;
  categories: Category[];
  rec?: Recurrence | undefined;
  busy: boolean;
  run: (fn: () => Promise<void>) => void;
  save: (fn: () => Promise<void>) => Promise<void>;
}) {
  const [mode, setMode] = useState<null | "pay" | "edit">(null);
  const [details, setDetails] = useState(false);
  const [slip, setSlip] = useState(false);
  const st = entryStatus(e, today);
  const tone = { pago: "bg-sage", parcial: "bg-cream", pendente: "bg-sky", vencido: "bg-rose" }[st];
  const canDelete = !e.recurrence_id
    ? true
    : e.amount_paid === 0 && (!rec?.active || rec?.frequency === "periodica");
  return (
    <>
      <tr className="border-t align-top">
        <td className="max-w-56 px-3 py-4">
          <p className="break-words font-medium text-foreground">
            {e.description}{" "}
            {e.recurrence_id && (
              <Repeat className="inline size-3 text-muted-foreground" aria-label="recorrente" />
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {e.kind === "receita" ? "Receita" : "Despesa"}
            {e.installment_no && e.installment_total
              ? ` · parcela ${e.installment_no}/${e.installment_total}`
              : ""}
            {e.wallet === "beneficio" ? " · carteira benefício (fora do caixa)" : ""}
          </p>
          {(e.installment_total || e.group_label) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-auto px-0 text-xs text-primary"
              onClick={() => setDetails(true)}
            >
              Ver detalhes
            </Button>
          )}
          {e.kind === "receita" &&
            /^guarida(?:\s|$)/i.test(e.description.trim()) &&
            e.wallet !== "beneficio" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto px-0 text-xs text-primary"
                onClick={() => setSlip(true)}
              >
                Ver contracheque
              </Button>
            )}
        </td>
        <td className="px-3 py-4">{cat}</td>
        <td className="px-3 py-4">{NATURE_LABEL[e.nature ?? "nao_classificada"]}</td>
        <td
          className={`whitespace-nowrap px-3 py-4 tabular-nums ${e.kind === "receita" ? "text-income" : "text-expense"}`}
        >
          {formatBRL(e.amount_planned)}
        </td>
        <td
          className={`whitespace-nowrap px-3 py-4 tabular-nums ${e.kind === "receita" ? "text-income" : "text-expense"}`}
        >
          {formatBRL(e.amount_paid)}
          {e.paid_date && <p className="text-xs text-muted-foreground">{formatDue(e.paid_date)}</p>}
        </td>
        <td className="whitespace-nowrap px-3 py-4">
          {e.day_known === false ? (
            <span className="text-muted-foreground">A definir</span>
          ) : (
            formatDue(e.due_date)
          )}
        </td>
        <td className="px-3 py-4">
          <span
            className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-secondary-foreground ${tone}`}
          >
            {statusLabel(st, e.kind)}
          </span>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setMode(mode === "pay" ? null : "pay")}
            >
              <Check />
              {e.kind === "receita" ? "Confirmar recebimento" : "Confirmar pagamento"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Editar lançamento"
              aria-label="Editar"
              disabled={busy}
              onClick={() => setMode(mode === "edit" ? null : "edit")}
            >
              <Pencil />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                title="Excluir lançamento"
                aria-label="Excluir"
                disabled={busy}
                onClick={() => {
                  if (confirm("Excluir este lançamento?"))
                    run(async () => {
                      const { error } = await supabase.from("fin_entries").delete().eq("id", e.id);
                      if (error) throw error;
                    });
                }}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        </td>
      </tr>
      <tr className="hidden">
        <td colSpan={8}>
          <Dialog open={details} onOpenChange={setDetails}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogTitle>{e.description} · detalhes</DialogTitle>
              <DialogDescription>
                {e.group_label ?? "Parcela"} · competência{" "}
                {monthLabel(e.competence ?? monthOf(e.due_date))}
              </DialogDescription>
              <p className="text-sm text-muted-foreground">
                {e.notes ?? "Sem observações cadastradas."}
              </p>
              <p className="text-sm">
                Previsto {formatBRL(e.amount_planned)} · realizado {formatBRL(e.amount_paid)}
              </p>
              {e.installment_total && (
                <>
                  <p className="text-sm">
                    Parcela {e.installment_no ?? "A definir"}/{e.installment_total} · restantes{" "}
                    {e.installment_no
                      ? Math.max(0, e.installment_total - e.installment_no)
                      : "A definir"}
                  </p>
                  <progress
                    className="w-full accent-primary"
                    aria-label="Progresso das parcelas"
                    value={e.installment_no ?? 0}
                    max={e.installment_total}
                  />
                  <p className="text-sm">
                    Fim: {rec?.end_month ? monthLabel(rec.end_month) : "A definir"}
                  </p>
                </>
              )}
              <Button variant="outline" onClick={() => setDetails(false)}>
                Fechar
              </Button>
            </DialogContent>
          </Dialog>
          <Dialog open={slip} onOpenChange={setSlip}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
              <DialogTitle>Contracheque Guarida</DialogTitle>
              <DialogDescription>Detalhamento separado do caixa</DialogDescription>
              <Payslips />
            </DialogContent>
          </Dialog>
        </td>
      </tr>
      {mode && (
        <tr className="border-t">
          <td colSpan={8} className="p-3">
            {mode === "pay" ? (
              <PayForm e={e} today={today} busy={busy} onDone={() => setMode(null)} save={save} />
            ) : (
              <EditForm
                e={e}
                categories={categories}
                rec={rec}
                busy={busy}
                onDone={() => setMode(null)}
                save={save}
              />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function PayForm({
  e,
  today,
  busy,
  save,
  onDone,
}: {
  e: Entry;
  today: string;
  busy: boolean;
  onDone: () => void;
  save: (fn: () => Promise<void>) => Promise<void>;
}) {
  const [amount, setAmount] = useState(
    String(e.amount_paid > 0 ? e.amount_paid : e.amount_planned).replace(".", ","),
  );
  const [date, setDate] = useState(e.paid_date ?? today);
  const [err, setErr] = useState<string | null>(null);
  const persist = async (value: number, d: string | null) => {
    setErr(null);
    try {
      await save(async () => {
        const { error } = await supabase
          .from("fin_entries")
          .update({ amount_paid: value, paid_date: d })
          .eq("id", e.id);
        if (error) throw error;
      });
      onDone();
    } catch (x) {
      setErr(friendly(x));
    }
  };
  return (
    <div className="mt-3 grid gap-2 rounded-md bg-muted/60 p-3 sm:grid-cols-3">
      <Field label="Valor efetivo total (R$)">
        <input
          className={inputCls}
          inputMode="decimal"
          value={amount}
          onChange={(x) => setAmount(x.target.value)}
        />
      </Field>
      <Field label="Data">
        <input
          type="date"
          className={inputCls}
          value={date}
          onChange={(x) => setDate(x.target.value)}
        />
      </Field>
      <div className="flex flex-wrap items-end gap-2">
        <Button
          variant="ghost"
          type="button"
          className={btnGhost}
          onClick={() => {
            const dirty =
              amount !==
                String(e.amount_paid > 0 ? e.amount_paid : e.amount_planned).replace(".", ",") ||
              date !== (e.paid_date ?? today);
            if (confirmDiscard(dirty)) onDone();
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="ghost"
          className={btnPrimary}
          disabled={busy}
          onClick={() => {
            const v = parseBRL(amount);
            if (v === null || v === 0) return setErr("Informe um valor maior que zero.");
            if (!date) return setErr("Informe a data.");
            persist(v, date);
          }}
        >
          Salvar
        </Button>
        {e.amount_paid > 0 && (
          <Button
            variant="ghost"
            className={btnGhost}
            disabled={busy}
            onClick={() => persist(0, null)}
          >
            Desfazer
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-3">
        Valor menor que o previsto fica como parcial.{" "}
        {err && (
          <span role="alert" className="text-destructive">
            {err}
          </span>
        )}
      </p>
    </div>
  );
}

function EditForm({
  e,
  categories,
  rec,
  busy,
  save,
  onDone,
}: {
  e: Entry;
  categories: Category[];
  rec?: Recurrence | undefined;
  busy: boolean;
  onDone: () => void;
  save: (fn: () => Promise<void>) => Promise<void>;
}) {
  const [nature, setNature] = useState<Nature>(e.nature ?? "nao_classificada");
  const [desc, setDesc] = useState(e.description);
  const [amount, setAmount] = useState(String(e.amount_planned).replace(".", ","));
  const [due, setDue] = useState(e.due_date);
  const [cat, setCat] = useState(e.category_id ?? "");
  const [notes, setNotes] = useState(e.notes ?? "");
  const [scope, setScope] = useState<"one" | "future">("one");
  const [err, setErr] = useState<string | null>(null);
  const recurring = !!(e.recurrence_id && rec?.active);
  const submit = async () => {
    const v = parseBRL(amount);
    if (!desc.trim()) return setErr("Informe uma descrição.");
    if (v === null) return setErr("Valor inválido.");
    if (!due) return setErr("Informe o vencimento.");
    const category_id = cat || null;
    // valor mudou à mão: o cálculo automático do repasse não pode mais sobrescrever
    const manual = v !== e.amount_planned ? { amount_manual: true } : {};
    setErr(null);
    try {
      await save(async () => {
        const { error } = await supabase
          .from("fin_entries")
          .update({
            nature,
            description: desc.trim(),
            amount_planned: v,
            due_date: due,
            category_id,
            notes: notes.trim() || null,
            ...manual,
          })
          .eq("id", e.id);
        if (error) throw error;
        if (recurring && scope === "future" && e.competence && e.recurrence_id) {
          const { error: e1 } = await supabase
            .from("fin_recurrences")
            .update({ nature, description: desc.trim(), amount_planned: v, category_id })
            .eq("id", e.recurrence_id);
          if (e1) throw e1;
          const { error: e2 } = await supabase
            .from("fin_entries")
            .update({ nature, description: desc.trim(), amount_planned: v, category_id, ...manual })
            .eq("recurrence_id", e.recurrence_id)
            .gt("competence", e.competence)
            .eq("amount_paid", 0);
          if (e2) throw e2;
        }
      });
      onDone();
    } catch (x) {
      setErr(friendly(x));
    }
  };
  return (
    <div className="mt-3 grid gap-2 rounded-md bg-muted/60 p-3 sm:grid-cols-2">
      <Field label="Descrição">
        <input
          className={inputCls}
          maxLength={120}
          value={desc}
          onChange={(x) => setDesc(x.target.value)}
        />
      </Field>
      <Field label="Valor previsto (R$)">
        <input
          className={inputCls}
          inputMode="decimal"
          value={amount}
          onChange={(x) => setAmount(x.target.value)}
        />
      </Field>
      <Field label="Vencimento">
        <input
          type="date"
          className={inputCls}
          value={due}
          onChange={(x) => setDue(x.target.value)}
        />
      </Field>
      <Field label="Categoria">
        <select className={inputCls} value={cat} onChange={(x) => setCat(x.target.value)}>
          <option value="">Sem categoria</option>
          {categories
            .filter((c) => c.kind === e.kind)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </Field>
      <NatureField value={nature} onChange={setNature} />
      <Field label="Observações">
        <input
          className={inputCls}
          maxLength={1000}
          value={notes}
          onChange={(x) => setNotes(x.target.value)}
        />
      </Field>
      {recurring && (
        <fieldset className="text-sm sm:col-span-2">
          <legend className="text-xs font-semibold text-muted-foreground">Aplicar a</legend>
          <label className="mr-4">
            <input type="radio" checked={scope === "one"} onChange={() => setScope("one")} /> Só
            esta ocorrência
          </label>
          <label>
            <input type="radio" checked={scope === "future"} onChange={() => setScope("future")} />{" "}
            Esta e as futuras não pagas (data só nesta)
          </label>
        </fieldset>
      )}
      {err && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {err}
        </p>
      )}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button
          variant="ghost"
          type="button"
          className={btnGhost}
          onClick={() => {
            const dirty =
              nature !== (e.nature ?? "nao_classificada") ||
              scope !== "one" ||
              desc !== e.description ||
              amount !== String(e.amount_planned).replace(".", ",") ||
              due !== e.due_date ||
              cat !== (e.category_id ?? "") ||
              notes !== (e.notes ?? "");
            if (confirmDiscard(dirty)) onDone();
          }}
        >
          Cancelar
        </Button>
        <Button variant="ghost" className={btnPrimary} disabled={busy} onClick={submit}>
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

function ByCategory({
  entries,
  catName,
}: {
  entries: Entry[];
  catName: (id: string | null) => string;
}) {
  const groups = useMemo(() => {
    const m = new Map<string, { planned: number; paid: number; n: number }>();
    for (const e of entries) {
      const k = catName(e.category_id);
      const g = m.get(k) ?? { planned: 0, paid: 0, n: 0 };
      g.planned += e.amount_planned;
      g.paid += e.amount_paid;
      g.n++;
      m.set(k, g);
    }
    return [...m.entries()].sort((a, b) => b[1].planned - a[1].planned);
  }, [entries, catName]);
  return (
    <SoftCard>
      {groups.length === 0 ? (
        <EmptyNote>Nenhuma despesa neste mês.</EmptyNote>
      ) : (
        <ul className="space-y-2">
          {groups.map(([k, g]) => (
            <li
              key={k}
              className="flex flex-wrap justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <span className="font-semibold">
                {k} <span className="text-xs text-muted-foreground">({g.n})</span>
              </span>
              <span>
                Previsto {formatBRL(g.planned)} · Pago {formatBRL(g.paid)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SoftCard>
  );
}

function Categories({
  categories,
  busy,
  run,
  save,
}: {
  categories: Category[];
  busy: boolean;
  run: (fn: () => Promise<void>) => void;
  save: (fn: () => Promise<void>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("despesa");
  const [err, setErr] = useState<string | null>(null);
  return (
    <SoftCard>
      <h3 className="mb-3 font-semibold">Categorias</h3>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Tipo da categoria"
          className={`${inputCls} w-auto`}
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
        >
          <option value="despesa">Despesa</option>
          <option value="receita">Receita</option>
        </select>
        <input
          aria-label="Nome da categoria"
          placeholder="Nome da categoria"
          maxLength={60}
          className={`${inputCls} flex-1`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          variant="ghost"
          type="button"
          className={btnGhost}
          disabled={!name}
          onClick={() => setName("")}
        >
          Cancelar
        </Button>
        <Button
          variant="ghost"
          className={btnPrimary}
          disabled={busy || !name.trim()}
          onClick={async () => {
            const n = name.trim();
            setErr(null);
            try {
              await save(async () => {
                const { error } = await supabase.from("fin_categories").insert({ kind, name: n });
                if (error) throw error;
              });
              setName("");
            } catch (x) {
              setErr(friendly(x));
            }
          }}
        >
          Salvar
        </Button>
      </div>
      {err && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {err}
        </p>
      )}
      {(["despesa", "receita"] as Kind[]).map((k) => (
        <div key={k} className="mt-4">
          <h3 className="mb-2 text-sm font-semibold">
            {k === "despesa" ? "Despesas" : "Receitas"}
          </h3>
          {categories.filter((c) => c.kind === k).length === 0 ? (
            <EmptyNote>Nenhuma categoria.</EmptyNote>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {categories
                .filter((c) => c.kind === k)
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-1 rounded-md border bg-card py-1 pl-3 pr-1 text-sm"
                  >
                    {c.name}
                    <Button
                      variant="ghost"
                      className={iconBtn}
                      aria-label={`Excluir ${c.name}`}
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const { error } = await supabase
                            .from("fin_categories")
                            .delete()
                            .eq("id", c.id);
                          if (error) throw error;
                        })
                      }
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ))}
    </SoftCard>
  );
}

function Periodic({
  recs,
  entries,
  busy,
  save,
}: {
  recs: Recurrence[];
  entries: Entry[];
  busy: boolean;
  save: (fn: () => Promise<void>) => Promise<void>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  if (!recs.length) return null;
  const close = () => {
    setOpenId(null);
    setAmount("");
    setDue("");
    setErr(null);
  };
  return (
    <SoftCard>
      <h3 className="mb-1 font-semibold">Despesas anuais / periódicas</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Não geram lançamentos automáticos. Use "Lançar previsão" quando souber valor e data.
      </p>
      <ul className="space-y-2">
        {recs.map((r) => {
          const n = entries.filter((e) => e.recurrence_id === r.id).length;
          return (
            <li key={r.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Previsto {formatBRL(r.amount_planned)} ·{" "}
                    {n ? `${n} lançamento(s)` : "nenhum lançamento"}
                  </p>
                </div>
                {openId !== r.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      close();
                      setOpenId(r.id);
                    }}
                  >
                    <Plus />
                    Lançar previsão
                  </Button>
                )}
              </div>
              {openId === r.id && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Field label="Valor previsto (R$)">
                    <input
                      className={inputCls}
                      inputMode="decimal"
                      value={amount}
                      onChange={(x) => setAmount(x.target.value)}
                    />
                  </Field>
                  <Field label="Vencimento">
                    <input
                      type="date"
                      className={inputCls}
                      value={due}
                      onChange={(x) => setDue(x.target.value)}
                    />
                  </Field>
                  <div className="flex items-end gap-2">
                    <Button
                      variant="ghost"
                      className={btnGhost}
                      onClick={() => {
                        if (confirmDiscard(!!(amount || due))) close();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="ghost"
                      className={btnPrimary}
                      disabled={busy}
                      onClick={async () => {
                        const v = parseBRL(amount);
                        if (v === null) return setErr("Valor inválido.");
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(due))
                          return setErr("Informe o vencimento.");
                        setErr(null);
                        try {
                          await save(async () => {
                            const { error } = await supabase.from("fin_entries").insert({
                              kind: r.kind,
                              nature: r.nature ?? "anual",
                              category_id: r.category_id,
                              description: r.description,
                              amount_planned: v,
                              due_date: due,
                              recurrence_id: r.id,
                              competence: monthOf(due),
                              sort_order: r.sort_order ?? 100,
                            });
                            if (error) throw error;
                          });
                          close();
                        } catch (x) {
                          setErr(friendly(x));
                        }
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                  {err && (
                    <p role="alert" className="text-sm text-destructive sm:col-span-3">
                      {err}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </SoftCard>
  );
}
