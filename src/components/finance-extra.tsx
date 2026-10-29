import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SoftCard, EmptyNote } from "@/components/cards";
import { confirmDiscard } from "@/components/back-button";
import { formatBRL, monthLabel, parseBRL } from "@/lib/finance";
import {
  lineChanges,
  payslipHistory,
  payslipTotals,
  previousPayslip,
  type Payslip as Slip,
  type PayslipLine as Line,
} from "@/lib/payslip";

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const money = (n: number) => String(n).replace(".", ",");
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${formatBRL(Math.abs(n))}`;
const BLANK: Slip = {
  id: "",
  competence: "",
  paid_month: null,
  employer: "",
  earnings: [{ label: "Salário", amount: 0 }],
  deductions: [{ label: "INSS", amount: 0 }],
  notes: null,
};

export function Payslips() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const q = useQuery({
    queryKey: ["fin-payslips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_payslips")
        .select("*")
        .order("competence", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Slip[];
    },
  });
  const save = useMutation({
    mutationFn: async (s: Slip & { isNew?: boolean }) => {
      const row = {
        competence: s.competence,
        paid_month: s.paid_month,
        employer: s.employer,
        earnings: s.earnings,
        deductions: s.deductions,
        notes: s.notes,
      };
      const { error } = s.isNew
        ? await supabase.from("fin_payslips").insert(row)
        : await supabase.from("fin_payslips").update(row).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin-payslips"] }),
  });
  if (q.isLoading)
    return (
      <SoftCard>
        <Loader2 className="mx-auto size-5 animate-spin" aria-label="Carregando" />
      </SoftCard>
    );
  if (q.error)
    return (
      <SoftCard>
        <p className="text-sm">Não foi possível carregar o contracheque.</p>
      </SoftCard>
    );
  const all = q.data ?? [];
  // modelo do contracheque novo: o mais recente (mesmas linhas, valores pra conferir), ou um em branco
  const template = all[0] ?? BLANK;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-xs text-muted-foreground">
          Detalhamento de referência. Os consignados já estão descontados do líquido: nunca são
          despesas de caixa adicionais.
        </p>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus />
            Novo contracheque
          </Button>
        )}
      </div>
      {creating && (
        <SoftCard>
          <h3 className="font-semibold">Novo contracheque</h3>
          <SlipForm
            s={template}
            copy
            busy={save.isPending}
            onCancel={() => setCreating(false)}
            onSave={async (x) => {
              await save.mutateAsync(x);
              setCreating(false);
            }}
          />
        </SoftCard>
      )}
      {all.length > 1 && <Comparison all={all} />}
      {!all.length
        ? !creating && <EmptyNote>Nenhum contracheque cadastrado.</EmptyNote>
        : all.map((s) => (
            <SlipCard
              key={s.id}
              s={s}
              prev={previousPayslip(s, all)}
              busy={save.isPending}
              onSave={(x) => save.mutateAsync(x)}
            />
          ))}
    </div>
  );
}

/** Mês a mês: bruto, descontos, líquido e quanto o líquido mudou em relação ao mês anterior. */
function Comparison({ all }: { all: Slip[] }) {
  const rows = payslipHistory(all).slice(0, 12);
  const employers = new Set(all.map((s) => s.employer)).size;
  return (
    <SoftCard>
      <h3 className="mb-3 font-semibold">Comparar meses</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 font-medium">Competência</th>
              <th className="hidden font-medium sm:table-cell">Bruto</th>
              <th className="hidden font-medium sm:table-cell">Descontos</th>
              <th className="font-medium">Líquido</th>
              <th className="font-medium">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slip.id} className="border-t">
                <td className="py-2 capitalize">
                  {monthLabel(r.slip.competence)}
                  {employers > 1 && (
                    <span className="block text-xs normal-case text-muted-foreground">
                      {r.slip.employer}
                    </span>
                  )}
                </td>
                <td className="hidden sm:table-cell">{formatBRL(r.gross)}</td>
                <td className="hidden text-expense sm:table-cell">{formatBRL(r.deductions)}</td>
                <td className="font-semibold">{formatBRL(r.net)}</td>
                <td
                  className={
                    r.netDelta === null
                      ? "text-muted-foreground"
                      : r.netDelta < 0
                        ? "text-expense"
                        : "text-income"
                  }
                >
                  {r.netDelta === null ? "—" : signed(r.netDelta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SoftCard>
  );
}

function SlipCard({
  s,
  prev,
  busy,
  onSave,
}: {
  s: Slip;
  prev: Slip | null;
  busy: boolean;
  onSave: (s: Slip & { isNew?: boolean }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<null | "edit" | "copy">(null);
  const { gross, deductions: ded, net } = payslipTotals(s);
  const changes = prev ? lineChanges(s, prev) : [];
  return (
    <SoftCard>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">
            {s.employer} · competência{" "}
            <span className="capitalize">{monthLabel(s.competence)}</span>
          </h3>
          {s.paid_month && (
            <p className="text-xs text-muted-foreground">
              Pago em <span className="capitalize">{monthLabel(s.paid_month)}</span>
            </p>
          )}
        </div>
        <div className="text-right text-sm tabular-nums text-muted-foreground">
          <p>
            Bruto <span className="text-income">{formatBRL(gross)}</span>
          </p>
          <p>
            Descontos <span className="text-expense">{formatBRL(ded)}</span>
          </p>
          <p className="font-semibold">
            Líquido <span className="text-income">{formatBRL(net)}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          <ChevronDown className={open ? "rotate-180" : ""} />
          {open ? "Ocultar detalhes" : "Ver detalhes"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEdit("edit")}>
          <Pencil />
          Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEdit("copy")}>
          Nova competência a partir deste
        </Button>
      </div>
      {open && !edit && (
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Proventos
            </h4>
            <ul className="divide-y">
              {s.earnings.map((l, i) => (
                <li key={i} className="flex justify-between py-1">
                  <span>{l.label}</span>
                  <span className="tabular-nums">{formatBRL(Number(l.amount))}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Descontos
            </h4>
            <ul className="divide-y">
              {s.deductions.map((l, i) => (
                <li key={i} className="flex justify-between gap-2 py-1">
                  <span>
                    {l.label}
                    {l.consignado && (
                      <span className="block text-xs text-muted-foreground">
                        Consignado · parcela {l.installment_no}/{l.installment_total}
                        {l.ref_month ? ` em ${monthLabel(`${l.ref_month}-01`)}` : ""} · restam{" "}
                        {(l.installment_total ?? 0) - (l.installment_no ?? 0)} após esta
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">{formatBRL(Number(l.amount))}</span>
                </li>
              ))}
            </ul>
          </div>
          {prev && (
            <div className="md:col-span-2">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Mudou em relação a{" "}
                <span className="normal-case">{monthLabel(prev.competence)}</span>
              </h4>
              {!changes.length ? (
                <p className="text-muted-foreground">Nenhuma linha mudou.</p>
              ) : (
                <ul className="divide-y">
                  {changes.map((c) => (
                    <li key={`${c.side}:${c.label}`} className="flex justify-between gap-2 py-1">
                      <span>
                        {c.label}{" "}
                        <span className="text-xs text-muted-foreground">
                          · {c.side}
                          {c.from === null ? " novo" : c.to === null ? " saiu" : ""}
                        </span>
                      </span>
                      <span
                        className={`tabular-nums ${(c.side === "desconto" ? -c.delta : c.delta) < 0 ? "text-expense" : "text-income"}`}
                      >
                        {signed(c.delta)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {s.notes && <p className="text-xs text-muted-foreground md:col-span-2">{s.notes}</p>}
        </div>
      )}
      {edit && (
        <SlipForm
          s={s}
          copy={edit === "copy"}
          busy={busy}
          onCancel={() => setEdit(null)}
          onSave={async (x) => {
            await onSave(x);
            setEdit(null);
          }}
        />
      )}
    </SoftCard>
  );
}

type Draft = { line: Line; label: string; amount: string };
const toDraft = (ls: Line[]): Draft[] =>
  ls.map((l) => ({ line: l, label: l.label, amount: money(l.amount) }));
const draftKey = (ds: Draft[]) => ds.map((d) => `${d.label}=${d.amount}`).join("|");

/** Edita um contracheque ou, com `copy`, cria outro a partir dele (mesmas linhas, competência nova). */
function SlipForm({
  s,
  copy,
  busy,
  onCancel,
  onSave,
}: {
  s: Slip;
  copy: boolean;
  busy: boolean;
  onCancel: () => void;
  onSave: (s: Slip & { isNew?: boolean }) => Promise<void>;
}) {
  const init = {
    comp: copy ? "" : s.competence.slice(0, 7),
    employer: s.employer,
    e: toDraft(s.earnings),
    d: toDraft(s.deductions),
  };
  const [comp, setComp] = useState(init.comp);
  const [employer, setEmployer] = useState(init.employer);
  const [e, setE] = useState(init.e);
  const [d, setD] = useState(init.d);
  const [err, setErr] = useState<string | null>(null);
  const dirty =
    comp !== init.comp ||
    employer !== init.employer ||
    draftKey(e) !== draftKey(init.e) ||
    draftKey(d) !== draftKey(init.d);
  const parse = (ds: Draft[]) =>
    ds
      .filter((x) => x.label.trim() || x.amount.trim())
      .map((x) => ({ ...x, value: parseBRL(x.amount || "0") }));
  const submit = async () => {
    if (!/^\d{4}-\d{2}$/.test(comp)) return setErr("Informe a competência.");
    if (!employer.trim()) return setErr("Informe a empresa.");
    const pe = parse(e),
      pd = parse(d);
    if ([...pe, ...pd].some((x) => !x.label.trim())) return setErr("Toda linha precisa de nome.");
    if ([...pe, ...pd].some((x) => x.value === null)) return setErr("Algum valor está inválido.");
    setErr(null);
    // mantém os detalhes de cada linha (ex.: consignado), trocando só nome e valor
    const lines = (xs: typeof pe) =>
      xs.map((x) => ({ ...x.line, label: x.label.trim(), amount: x.value! }));
    try {
      await onSave({
        ...s,
        isNew: copy,
        competence: `${comp}-01`,
        employer: employer.trim(),
        paid_month: copy ? null : s.paid_month,
        earnings: lines(pe),
        deductions: lines(pd),
        notes: copy ? null : s.notes,
      });
    } catch {
      setErr("Não foi possível salvar. Verifique se já existe contracheque dessa competência.");
    }
  };
  const side = (title: string, ds: Draft[], set: (ds: Draft[]) => void) => (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase text-muted-foreground">{title}</legend>
      {ds.map((x, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            aria-label={`${title}: nome da linha ${i + 1}`}
            className={inputCls}
            value={x.label}
            onChange={(ev) =>
              set(ds.map((y, j) => (j === i ? { ...y, label: ev.target.value } : y)))
            }
          />
          <input
            aria-label={`${title}: valor de ${x.label || `linha ${i + 1}`}`}
            className={`${inputCls} w-28 shrink-0`}
            inputMode="decimal"
            value={x.amount}
            onChange={(ev) =>
              set(ds.map((y, j) => (j === i ? { ...y, amount: ev.target.value } : y)))
            }
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Tirar ${x.label || "linha"}`}
            onClick={() => set(ds.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => set([...ds, { line: { label: "", amount: 0 }, label: "", amount: "" }])}
      >
        <Plus />
        Linha
      </Button>
    </fieldset>
  );
  return (
    <div className="mt-4 space-y-3 rounded-md bg-muted/60 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-muted-foreground">
          Competência
          <input
            type="month"
            disabled={!copy}
            className={`${inputCls} mt-1`}
            value={comp}
            onChange={(x) => setComp(x.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          Empresa
          <input
            className={`${inputCls} mt-1`}
            value={employer}
            maxLength={60}
            onChange={(x) => setEmployer(x.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {side("Proventos", e, setE)}
        {side("Descontos", d, setD)}
      </div>
      {err && (
        <p role="alert" className="text-sm text-destructive">
          {err}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (confirmDiscard(dirty)) onCancel();
          }}
        >
          Cancelar
        </Button>
        <Button disabled={busy} onClick={submit}>
          {copy ? "Salvar" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}

type Rec = { id: string; creditor: string; amount: number; notes: string | null; source: string };
export function CreditRecords() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["fin-credit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_credit_records")
        .select("id,creditor,amount,notes,source")
        .order("creditor");
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Rec[];
    },
  });
  const save = useMutation({
    mutationFn: async (r: { id: string; amount: number; notes: string | null }) => {
      const { error } = await supabase
        .from("fin_credit_records")
        .update({ amount: r.amount, notes: r.notes })
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin-credit"] }),
  });
  const [editing, setEditing] = useState<string | null>(null);
  if (q.isLoading)
    return (
      <SoftCard>
        <Loader2 className="mx-auto size-5 animate-spin" aria-label="Carregando" />
      </SoftCard>
    );
  if (q.error)
    return (
      <SoftCard>
        <p className="text-sm">Não foi possível carregar o inventário.</p>
      </SoftCard>
    );
  const rows = q.data ?? [];
  return (
    <SoftCard>
      <h3 className="font-semibold">Inventário SPC/Serasa</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Separado da carteira e do fluxo mensal. Não conta como conta a pagar nem na projeção
        enquanto não houver acordo ativo. Valores informados por você.
      </p>
      {!rows.length ? (
        <EmptyNote>Nenhum registro.</EmptyNote>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2">Credor</th>
                <th>Valor informado</th>
                <th>Observações</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) =>
                editing === r.id ? (
                  <CreditEdit
                    key={r.id}
                    r={r}
                    busy={save.isPending}
                    onCancel={() => setEditing(null)}
                    onSave={async (v) => {
                      await save.mutateAsync({ id: r.id, ...v });
                      setEditing(null);
                    }}
                  />
                ) : (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 font-medium">{r.creditor}</td>
                    <td className="tabular-nums text-expense">{formatBRL(r.amount)}</td>
                    <td className="text-xs text-muted-foreground">{r.notes ?? "—"}</td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${r.creditor}`}
                        onClick={() => setEditing(r.id)}
                      >
                        <Pencil />
                      </Button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold">
                <td className="py-2">Total</td>
                <td className="tabular-nums text-expense">
                  {formatBRL(Math.round(rows.reduce((n, r) => n + r.amount, 0) * 100) / 100)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </SoftCard>
  );
}

function CreditEdit({
  r,
  busy,
  onCancel,
  onSave,
}: {
  r: Rec;
  busy: boolean;
  onCancel: () => void;
  onSave: (v: { amount: number; notes: string | null }) => Promise<void>;
}) {
  const [amount, setAmount] = useState(money(r.amount));
  const [notes, setNotes] = useState(r.notes ?? "");
  const [err, setErr] = useState<string | null>(null);
  return (
    <tr className="border-t">
      <td className="py-2 font-medium">{r.creditor}</td>
      <td>
        <input
          aria-label="Valor"
          className={`${inputCls} w-32`}
          inputMode="decimal"
          value={amount}
          onChange={(x) => setAmount(x.target.value)}
        />
        {err && (
          <span role="alert" className="block text-xs text-destructive">
            {err}
          </span>
        )}
      </td>
      <td>
        <input
          aria-label="Observações"
          className={inputCls}
          maxLength={1000}
          value={notes}
          onChange={(x) => setNotes(x.target.value)}
        />
      </td>
      <td>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirmDiscard(amount !== money(r.amount) || notes !== (r.notes ?? "")))
                onCancel();
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              const v = parseBRL(amount);
              if (v === null) return setErr("Valor inválido");
              setErr(null);
              try {
                await onSave({ amount: v, notes: notes.trim() || null });
              } catch {
                setErr("Não foi possível salvar.");
              }
            }}
          >
            Salvar
          </Button>
        </div>
      </td>
    </tr>
  );
}
