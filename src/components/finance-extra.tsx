import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SoftCard, EmptyNote } from "@/components/cards";
import { confirmDiscard } from "@/components/back-button";
import { formatBRL, monthLabel, parseBRL } from "@/lib/finance";

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
type Line = {
  label: string;
  amount: number;
  consignado?: boolean;
  installment_no?: number;
  installment_total?: number;
  ref_month?: string;
};
type Slip = {
  id: string;
  competence: string;
  paid_month: string | null;
  employer: string;
  earnings: Line[];
  deductions: Line[];
  notes: string | null;
};
const sum = (ls: Line[]) => Math.round(ls.reduce((n, l) => n + Number(l.amount), 0) * 100) / 100;
const money = (n: number) => String(n).replace(".", ",");

export function Payslips() {
  const qc = useQueryClient();
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
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Detalhamento de referência. Os consignados já estão descontados do líquido: nunca são
        despesas de caixa adicionais.
      </p>
      {save.error && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível salvar. Verifique se já existe contracheque dessa competência.
        </p>
      )}
      {!q.data?.length ? (
        <EmptyNote>Nenhum contracheque cadastrado.</EmptyNote>
      ) : (
        q.data.map((s) => (
          <SlipCard key={s.id} s={s} busy={save.isPending} onSave={(x) => save.mutate(x)} />
        ))
      )}
    </div>
  );
}

function SlipCard({
  s,
  busy,
  onSave,
}: {
  s: Slip;
  busy: boolean;
  onSave: (s: Slip & { isNew?: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<null | "edit" | "copy">(null);
  const gross = sum(s.earnings),
    ded = sum(s.deductions);
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
            Líquido{" "}
            <span className="text-income">{formatBRL(Math.round((gross - ded) * 100) / 100)}</span>
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
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
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
          {s.notes && <p className="text-xs text-muted-foreground md:col-span-2">{s.notes}</p>}
        </div>
      )}
      {edit && (
        <SlipForm
          s={s}
          copy={edit === "copy"}
          busy={busy}
          onCancel={() => setEdit(null)}
          onSave={(x) => {
            onSave(x);
            setEdit(null);
          }}
        />
      )}
    </SoftCard>
  );
}

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
  onSave: (s: Slip & { isNew?: boolean }) => void;
}) {
  const init = {
    comp: copy ? "" : s.competence.slice(0, 7),
    e: s.earnings.map((l) => money(l.amount)),
    d: s.deductions.map((l) => money(l.amount)),
  };
  const [comp, setComp] = useState(init.comp);
  const [e, setE] = useState(init.e);
  const [d, setD] = useState(init.d);
  const [err, setErr] = useState<string | null>(null);
  const dirty = comp !== init.comp || e.join() !== init.e.join() || d.join() !== init.d.join();
  const submit = () => {
    if (!/^\d{4}-\d{2}$/.test(comp)) return setErr("Informe a competência.");
    const pe = e.map(parseBRL),
      pd = d.map(parseBRL);
    if (pe.includes(null) || pd.includes(null)) return setErr("Algum valor está inválido.");
    onSave({
      ...s,
      isNew: copy,
      competence: `${comp}-01`,
      paid_month: copy ? null : s.paid_month,
      earnings: s.earnings.map((l, i) => ({ ...l, amount: pe[i]! })),
      deductions: s.deductions.map((l, i) => ({ ...l, amount: pd[i]! })),
      notes: copy ? null : s.notes,
    });
  };
  const row = (l: Line, v: string, set: (v: string) => void) => (
    <label key={l.label} className="flex items-center justify-between gap-2 text-sm">
      <span>{l.label}</span>
      <input
        className={`${inputCls} w-32`}
        inputMode="decimal"
        value={v}
        onChange={(x) => set(x.target.value)}
      />
    </label>
  );
  return (
    <div className="mt-4 space-y-3 rounded-md bg-muted/60 p-3">
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Proventos</h4>
          {s.earnings.map((l, i) =>
            row(l, e[i] ?? "", (v) => setE(e.map((x, j) => (j === i ? v : x)))),
          )}
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Descontos</h4>
          {s.deductions.map((l, i) =>
            row(l, d[i] ?? "", (v) => setD(d.map((x, j) => (j === i ? v : x)))),
          )}
        </div>
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
      {save.error && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível salvar.
        </p>
      )}
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
                    onSave={(v) => {
                      save.mutate({ id: r.id, ...v });
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
  onSave: (v: { amount: number; notes: string | null }) => void;
}) {
  const [amount, setAmount] = useState(money(r.amount));
  const [notes, setNotes] = useState(r.notes ?? "");
  const [err, setErr] = useState(false);
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
            Valor inválido
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
            onClick={() => {
              const v = parseBRL(amount);
              if (v === null) return setErr(true);
              onSave({ amount: v, notes: notes.trim() || null });
            }}
          >
            Salvar
          </Button>
        </div>
      </td>
    </tr>
  );
}
