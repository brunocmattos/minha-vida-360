import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  History,
  Loader2,
  Plus,
  RotateCcw,
  ShoppingCart,
  Trash2,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyNote, SectionCard } from "@/components/cards";
import { confirmDelete, confirmDiscard } from "@/components/back-button";
import { TaskChecklist } from "@/components/task-checklist";
import { fetchAllRows } from "@/lib/fetch-all";
import { formatBRL, parseBRL } from "@/lib/finance";
import { formatDue, todaySP, RECURRENCE_LABEL, type Recurrence } from "@/lib/recurrence";
import {
  casaTimeline,
  daySP,
  maintenanceStatus,
  parseShoppingInput,
  routineStats,
  withoutMissing,
  type CasaEvent,
  type MaintenanceStatus,
} from "@/lib/casa";

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

type Shopping = { id: string; name: string; quantity: string | null; bought_at: string | null };
type Maintenance = {
  id: string;
  title: string;
  kind: "manutencao" | "conserto" | "servico";
  scheduled_date: string | null;
  done_date: string | null;
  provider: string | null;
  cost: number | null;
  notes: string | null;
};
type CasaTask = {
  id: string;
  title: string;
  done: boolean;
  completed_at: string | null;
  recurrence: Recurrence;
};

const KIND_LABEL: Record<Maintenance["kind"], string> = {
  manutencao: "Manutenção",
  conserto: "Conserto",
  servico: "Serviço",
};
const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  pendente: "Sem data",
  agendado: "Agendado",
  atrasado: "Atrasado",
  feito: "Feito",
};
// Chaves debaixo de ["tasks"]: o checklist invalida ["tasks"] e o histórico da casa se atualiza junto.
const TASKS_KEY = ["tasks", "casa"];
const SHOP_KEY = ["casa-shopping"];
const MAINT_KEY = ["casa-maintenance"];

/** Área Casa: rotinas, lista de compras, manutenções e o histórico dos últimos 30 dias. */
export function CasaModule() {
  return (
    <div className="space-y-5">
      <SectionCard icon={ClipboardList} title="Tarefas e rotinas" tone="bg-sage">
        <TaskChecklist area="casa" />
        <RoutineStats />
      </SectionCard>
      <ShoppingList />
      <MaintenanceList />
      <CasaHistory />
    </div>
  );
}

function useCasaTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: async () => {
      const [tasks, completions] = await Promise.all([
        fetchAllRows((from, to) =>
          supabase
            .from("tasks")
            .select("id,title,done,completed_at,recurrence")
            .eq("area_slug", "casa")
            .order("created_at")
            .order("id")
            .range(from, to),
        ),
        fetchAllRows((from, to) =>
          supabase
            .from("task_completions")
            .select("task_id,completed_at")
            .order("completed_at", { ascending: false })
            .order("id")
            .range(from, to),
        ),
      ]);
      const ts = tasks as CasaTask[];
      const ids = new Set(ts.map((t) => t.id));
      return { tasks: ts, completions: completions.filter((c) => ids.has(c.task_id)) };
    },
  });
}

/** Constância das rotinas: quantas vezes nos últimos 30 dias e a última vez. */
function RoutineStats() {
  const q = useCasaTasks();
  const routines = (q.data?.tasks ?? []).filter((t) => t.recurrence !== "none");
  if (!routines.length) return null;
  const today = todaySP();
  return (
    <div className="mt-5 border-t pt-4">
      <h3 className="mb-2 text-sm font-semibold">Constância das rotinas</h3>
      <ul className="divide-y text-sm">
        {routines.map((t) => {
          const s = routineStats(q.data!.completions, t.id, today);
          return (
            <li key={t.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1 py-2">
              <span>
                {t.title}{" "}
                <span className="text-xs text-muted-foreground">
                  · {RECURRENCE_LABEL[t.recurrence]}
                </span>
              </span>
              <span className="text-muted-foreground tabular-nums">
                {s.last30}× em 30 dias{s.last ? ` · última ${formatDue(s.last)}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function useShopping() {
  return useQuery({
    queryKey: SHOP_KEY,
    queryFn: async () =>
      (await fetchAllRows((from, to) =>
        supabase
          .from("shopping_items")
          .select("id,name,quantity,bought_at")
          .order("created_at")
          .order("id")
          .range(from, to),
      )) as Shopping[],
  });
}

function useMaintenance() {
  return useQuery({
    queryKey: MAINT_KEY,
    queryFn: async () => {
      const rows = await fetchAllRows((from, to) =>
        supabase
          .from("home_maintenance")
          .select("id,title,kind,scheduled_date,done_date,provider,cost,notes")
          .order("created_at")
          .order("id")
          .range(from, to),
      );
      return rows.map((r) => ({
        ...r,
        cost: r.cost == null ? null : Number(r.cost),
      })) as Maintenance[];
    },
  });
}

function ShoppingList() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [showBought, setShowBought] = useState(false);
  const q = useShopping();
  const done = () => {
    setErr("");
    return qc.invalidateQueries({ queryKey: SHOP_KEY });
  };
  const onError = () => setErr("Não foi possível salvar. Tente novamente.");
  const add = useMutation({
    mutationFn: async (items: ReturnType<typeof parseShoppingInput>) => {
      const { error } = await supabase.from("shopping_items").insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      return done();
    },
    onError,
  });
  const toggle = useMutation({
    mutationFn: async (s: Shopping) => {
      const { error } = await supabase
        .from("shopping_items")
        .update({ bought_at: s.bought_at ? null : new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: done,
    onError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shopping_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
    onError,
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const items = withoutMissing(
      parseShoppingInput(text),
      missing.map((s) => s.name),
    );
    if (items.length) add.mutate(items);
    else setText(""); // tudo já estava na lista
  };
  const all = q.data ?? [];
  const missing = all.filter((s) => !s.bought_at);
  const bought = all
    .filter((s) => s.bought_at)
    .sort((a, b) => b.bought_at!.localeCompare(a.bought_at!))
    .slice(0, 30);
  const row = (s: Shopping) => (
    <li key={s.id} className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        className="size-5 shrink-0 accent-[var(--primary)]"
        checked={!!s.bought_at}
        disabled={toggle.isPending}
        aria-label={s.bought_at ? `Voltar ${s.name} pra lista` : `Comprei ${s.name}`}
        onChange={() => toggle.mutate(s)}
      />
      <span className={`min-w-0 flex-1 ${s.bought_at ? "text-muted-foreground line-through" : ""}`}>
        {s.name}
        {s.quantity && <span className="ml-2 text-xs text-muted-foreground">{s.quantity}</span>}
        {s.bought_at && (
          <span className="block text-xs no-underline">
            comprado em {formatDue(daySP(s.bought_at))}
          </span>
        )}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Excluir ${s.name}`}
        onClick={() => {
          if (confirmDelete(s.name, "o item")) remove.mutate(s.id);
        }}
      >
        <Trash2 className="size-4 text-muted-foreground" />
      </Button>
    </li>
  );
  return (
    <SectionCard icon={ShoppingCart} title="Lista de compras" tone="bg-peach">
      <form onSubmit={submit} className="flex gap-2">
        <input
          className={inputCls}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="arroz, 2 sabão em pó, leite…"
          aria-label="Itens para comprar"
          maxLength={600}
        />
        <Button
          type="submit"
          disabled={add.isPending || !text.trim()}
          aria-label="Adicionar à lista"
        >
          {add.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
        </Button>
      </form>
      <p className="mt-1 text-xs text-muted-foreground">
        Dá pra digitar vários de uma vez, separados por vírgula.
      </p>
      {err && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {err}
        </p>
      )}
      {q.isLoading ? (
        <Loader2 className="mx-auto mt-4 size-5 animate-spin" aria-label="Carregando" />
      ) : q.error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Não foi possível carregar a lista.
        </p>
      ) : !missing.length ? (
        <div className="mt-3">
          <EmptyNote>Nada faltando por enquanto.</EmptyNote>
        </div>
      ) : (
        <ul className="mt-2 divide-y">{missing.map(row)}</ul>
      )}
      {bought.length > 0 && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showBought}
            onClick={() => setShowBought(!showBought)}
          >
            {showBought ? "Ocultar comprados" : `Ver comprados (${bought.length})`}
          </Button>
          {showBought && <ul className="divide-y">{bought.map(row)}</ul>}
        </div>
      )}
    </SectionCard>
  );
}

type MaintForm = {
  title: string;
  kind: Maintenance["kind"];
  scheduled_date: string;
  provider: string;
  cost: string;
  notes: string;
};
const EMPTY_MAINT: MaintForm = {
  title: "",
  kind: "manutencao",
  scheduled_date: "",
  provider: "",
  cost: "",
  notes: "",
};
const toForm = (m: Maintenance): MaintForm => ({
  title: m.title,
  kind: m.kind,
  scheduled_date: m.scheduled_date ?? "",
  provider: m.provider ?? "",
  cost: m.cost != null ? String(m.cost).replace(".", ",") : "",
  notes: m.notes ?? "",
});

function MaintenanceList() {
  const qc = useQueryClient();
  const [form, setForm] = useState<{ id: string | null; v: MaintForm; init: MaintForm } | null>(
    null,
  );
  const [err, setErr] = useState("");
  const [showDone, setShowDone] = useState(false);
  const q = useMaintenance();
  const refresh = () => {
    setErr("");
    return qc.invalidateQueries({ queryKey: MAINT_KEY });
  };
  const save = useMutation({
    mutationFn: async ({ id, v }: { id: string | null; v: MaintForm }) => {
      if (!v.title.trim()) throw new Error("Informe o que precisa ser feito.");
      const cost = v.cost.trim() ? parseBRL(v.cost) : null;
      if (v.cost.trim() && cost === null) throw new Error("Valor inválido.");
      const row = {
        title: v.title.trim(),
        kind: v.kind,
        scheduled_date: v.scheduled_date || null,
        provider: v.provider.trim() || null,
        cost,
        notes: v.notes.trim() || null,
      };
      const { error } = id
        ? await supabase.from("home_maintenance").update(row).eq("id", id)
        : await supabase.from("home_maintenance").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(null);
      return refresh();
    },
    onError: (e) => setErr(e.message || "Não foi possível salvar. Tente novamente."),
  });
  const setDone = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from("home_maintenance")
        .update({ done_date: done ? todaySP() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => setErr("Não foi possível salvar. Tente novamente."),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("home_maintenance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(null);
      return refresh();
    },
    onError: () => setErr("Não foi possível excluir. Tente novamente."),
  });
  const today = todaySP();
  const all = q.data ?? [];
  const open = all
    .filter((m) => !m.done_date)
    .sort((a, b) => (a.scheduled_date ?? "9999").localeCompare(b.scheduled_date ?? "9999"));
  const done = all
    .filter((m) => m.done_date)
    .sort((a, b) => b.done_date!.localeCompare(a.done_date!));
  const set = (patch: Partial<MaintForm>) =>
    form && setForm({ ...form, v: { ...form.v, ...patch } });
  const item = (m: Maintenance) => {
    const st = maintenanceStatus(m, today);
    return (
      <li key={m.id} className="flex items-start gap-3 py-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label={m.done_date ? `Reabrir ${m.title}` : `Marcar ${m.title} como feito`}
          disabled={setDone.isPending}
          onClick={() => setDone.mutate({ id: m.id, done: !m.done_date })}
        >
          {m.done_date ? (
            <RotateCcw className="size-4 text-muted-foreground" />
          ) : (
            <CheckCircle2 className="size-5 text-primary" />
          )}
        </Button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left text-sm"
          onClick={() => {
            const v = toForm(m);
            setForm({ id: m.id, v, init: v });
          }}
        >
          <span className="font-medium">{m.title}</span>
          <span className="block text-xs text-muted-foreground">
            {KIND_LABEL[m.kind]} ·{" "}
            <span className={st === "atrasado" ? "font-medium text-expense" : ""}>
              {st === "feito"
                ? `Feito em ${formatDue(m.done_date)}`
                : m.scheduled_date
                  ? `${STATUS_LABEL[st]} · ${formatDue(m.scheduled_date)}`
                  : STATUS_LABEL[st]}
            </span>
            {m.provider ? ` · ${m.provider}` : ""}
            {m.cost != null ? ` · ${formatBRL(m.cost)}` : ""}
          </span>
        </button>
      </li>
    );
  };
  return (
    <SectionCard
      icon={Wrench}
      title="Manutenções e serviços"
      tone="bg-sky"
      action={
        !form && (
          <Button
            size="sm"
            onClick={() => setForm({ id: null, v: EMPTY_MAINT, init: EMPTY_MAINT })}
          >
            <Plus />
            Novo
          </Button>
        )
      }
    >
      {form && (
        <div className="mb-4 space-y-3 rounded-md bg-muted/60 p-3">
          <label className="block text-sm">
            O que precisa ser feito
            <input
              className={inputCls}
              value={form.v.title}
              maxLength={160}
              placeholder="Trocar resistência do chuveiro"
              onChange={(e) => set({ title: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Tipo
              <select
                className={inputCls}
                value={form.v.kind}
                onChange={(e) => set({ kind: e.target.value as Maintenance["kind"] })}
              >
                {Object.entries(KIND_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Data marcada
              <input
                type="date"
                className={inputCls}
                value={form.v.scheduled_date}
                onChange={(e) => set({ scheduled_date: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Quem faz (opcional)
              <input
                className={inputCls}
                value={form.v.provider}
                maxLength={120}
                onChange={(e) => set({ provider: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Valor (opcional)
              <input
                className={inputCls}
                inputMode="decimal"
                value={form.v.cost}
                onChange={(e) => set({ cost: e.target.value })}
              />
            </label>
          </div>
          <label className="block text-sm">
            Observações
            <textarea
              className={inputCls}
              rows={2}
              maxLength={1000}
              value={form.v.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirmDiscard(JSON.stringify(form.v) !== JSON.stringify(form.init)))
                  setForm(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={save.isPending}
              onClick={() => save.mutate({ id: form.id, v: form.v })}
            >
              {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
            {form.id && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-destructive"
                onClick={() => {
                  if (confirmDelete(form.v.title, "o registro")) remove.mutate(form.id!);
                }}
              >
                <Trash2 />
                Excluir
              </Button>
            )}
          </div>
        </div>
      )}
      {err && (
        <p role="alert" className="mb-2 text-sm text-destructive">
          {err}
        </p>
      )}
      {q.isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin" aria-label="Carregando" />
      ) : q.error ? (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível carregar as manutenções.
        </p>
      ) : !open.length ? (
        <EmptyNote>Nenhuma manutenção pendente.</EmptyNote>
      ) : (
        <ul className="divide-y">{open.map(item)}</ul>
      )}
      {done.length > 0 && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showDone}
            onClick={() => setShowDone(!showDone)}
          >
            {showDone ? "Ocultar feitas" : `Ver feitas (${done.length})`}
          </Button>
          {showDone && <ul className="divide-y">{done.map(item)}</ul>}
        </div>
      )}
    </SectionCard>
  );
}

const KIND_EVENT: Record<CasaEvent["kind"], string> = {
  tarefa: "Feito",
  compra: "Comprado",
  manutencao: "Manutenção",
};
const dayFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

/** O que aconteceu na casa nos últimos 30 dias, por dia. */
function CasaHistory() {
  const tasks = useCasaTasks();
  const shop = useShopping();
  const maint = useMaintenance();
  const today = todaySP();
  const since = (() => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 29);
    return d.toISOString().slice(0, 10);
  })();
  const ts = tasks.data?.tasks ?? [];
  const events = casaTimeline(
    {
      completions: tasks.data?.completions ?? [],
      doneTasks: ts.filter((t) => t.recurrence === "none" && t.done),
      taskTitles: Object.fromEntries(ts.map((t) => [t.id, t.title])),
      shopping: shop.data ?? [],
      maintenance: maint.data ?? [],
    },
    since,
  );
  const days = [...new Set(events.map((e) => e.date))];
  return (
    <SectionCard icon={History} title="Histórico · 30 dias" tone="bg-lavender">
      {tasks.isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin" aria-label="Carregando" />
      ) : !events.length ? (
        <EmptyNote>
          Quando você concluir tarefas, compras e manutenções, elas aparecem aqui.
        </EmptyNote>
      ) : (
        <ol className="space-y-4">
          {days.map((d) => (
            <li key={d}>
              <h3 className="mb-1 text-xs font-semibold capitalize text-muted-foreground">
                {d === today ? "Hoje" : dayFmt.format(new Date(`${d}T12:00:00Z`))}
              </h3>
              <ul className="space-y-1 text-sm">
                {events
                  .filter((e) => e.date === d)
                  .map((e) => (
                    <li key={e.key}>
                      <span className="text-muted-foreground">{KIND_EVENT[e.kind]} · </span>
                      {e.title}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
