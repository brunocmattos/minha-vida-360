import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Repeat,
  SlidersHorizontal,
  Trash2,
  Undo2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyNote } from "@/components/cards";
import { confirmDelete, confirmDiscard } from "@/components/back-button";
import { fetchAllRows } from "@/lib/fetch-all";
import { AREAS, getArea } from "@/lib/areas";
import {
  PRIORITY_LABEL,
  RECURRENCE_LABEL,
  formatDue,
  nextDueDate,
  todaySP,
  type Priority,
  type Recurrence,
} from "@/lib/recurrence";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  done: boolean;
  completed_at: string | null;
  area_slug: string | null;
  priority: Priority;
  due_date: string | null;
  recurrence: Recurrence;
};
type Fields = Pick<Task, "title" | "area_slug" | "priority" | "due_date" | "recurrence">;
const KEY = ["tasks"];
const EMPTY: Fields = {
  title: "",
  area_slug: null,
  priority: "normal",
  due_date: null,
  recurrence: "none",
};
const PRIO_ORDER: Record<Priority, number> = { alta: 0, normal: 1, baixa: 2 };

async function fetchTasks(): Promise<Task[]> {
  const rows = await fetchAllRows((from, to) =>
    supabase
      .from("tasks")
      .select("id,title,done,completed_at,area_slug,priority,due_date,recurrence")
      .order("created_at")
      .order("id")
      .range(from, to),
  );
  return rows as Task[];
}

const dtFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
function formatCompletedAt(iso: string | null): string {
  if (!iso) return "data a definir";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "data a definir" : dtFmt.format(d);
}

const inputCls =
  "w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function TaskFields({ v, set }: { v: Fields; set: (f: Fields) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs font-semibold text-muted-foreground">
        Área
        <select
          className={inputCls}
          value={v.area_slug ?? ""}
          onChange={(e) => set({ ...v, area_slug: e.target.value || null })}
        >
          <option value="">Sem área</option>
          {AREAS.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.short}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-muted-foreground">
        Prioridade
        <select
          className={inputCls}
          value={v.priority}
          onChange={(e) => set({ ...v, priority: e.target.value as Priority })}
        >
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-muted-foreground">
        Vencimento (opcional)
        <input
          type="date"
          className={inputCls}
          value={v.due_date ?? ""}
          onChange={(e) => set({ ...v, due_date: e.target.value || null })}
        />
      </label>
      <label className="text-xs font-semibold text-muted-foreground">
        Repetição
        <select
          className={inputCls}
          value={v.recurrence}
          onChange={(e) => set({ ...v, recurrence: e.target.value as Recurrence })}
        >
          {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((r) => (
            <option key={r} value={r}>
              {RECURRENCE_LABEL[r]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function TaskChecklist() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Fields>(EMPTY);
  const [more, setMore] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Fields>(EMPTY);
  const [err, setErr] = useState("");
  const [showDone, setShowDone] = useState(false);
  const q = useQuery({ queryKey: KEY, queryFn: fetchTasks });
  const onError = () => setErr("Não foi possível salvar. Tente novamente.");
  const refresh = () => {
    setErr("");
    return qc.invalidateQueries({ queryKey: KEY });
  };

  const add = useMutation({
    mutationFn: async (f: Fields) => {
      const { error } = await supabase.from("tasks").insert(f);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(EMPTY);
      setMore(false);
      return refresh();
    },
    onError,
  });
  const save = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: Fields }) => {
      const { error } = await supabase.from("tasks").update(f).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditId(null);
      return refresh();
    },
    onError,
  });
  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      if (!t.done && t.recurrence !== "none") {
        const nextDue = nextDueDate(
          t.recurrence,
          todaySP(),
          t.due_date ? Number(t.due_date.slice(8, 10)) : undefined,
        );
        if (!nextDue) throw new Error("Próxima data indisponível");
        const { error } = await supabase.rpc("complete_recurring_task", {
          p_task_id: t.id,
          p_next_due: nextDue,
        });
        if (error) throw error;
        return;
      }
      const done = !t.done;
      const { error } = await supabase
        .from("tasks")
        .update({ done, completed_at: done ? new Date().toISOString() : null })
        .eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError,
  });

  function askDelete(t: Task) {
    if (confirmDelete(t.title, "a tarefa")) remove.mutate(t.id);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = form.title.trim();
    if (t) add.mutate({ ...form, title: t.slice(0, 200) });
  }

  const today = todaySP();
  const pending = (q.data ?? [])
    .filter((t) => !t.done)
    .sort(
      (a, b) =>
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
        PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority],
    );
  const completed = (q.data ?? [])
    .filter((t) => t.done)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="space-y-2">
        <div className="flex gap-2">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={200}
            placeholder="Nova tarefa..."
            aria-label="Nova tarefa"
            className="min-w-0 flex-1 rounded-md border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="ghost"
            type="button"
            onClick={() => setMore((v) => !v)}
            aria-expanded={more}
            aria-label="Mais opções"
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-md border bg-card",
              more && "ring-2 ring-ring",
            )}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
          <Button
            variant="ghost"
            disabled={add.isPending || !form.title.trim()}
            aria-label="Adicionar tarefa"
            className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition disabled:opacity-50"
          >
            {add.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </div>
        {more && <TaskFields v={form} set={setForm} />}
        {(more || form.title) && (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                if (confirmDiscard(JSON.stringify(form) !== JSON.stringify(EMPTY))) {
                  setForm(EMPTY);
                  setMore(false);
                }
              }}
              className="rounded-md border bg-card px-3 py-1.5 text-sm"
            >
              Cancelar
            </Button>
            <Button
              variant="ghost"
              type="submit"
              disabled={add.isPending || !form.title.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Salvar
            </Button>
          </div>
        )}
      </form>

      {err && (
        <p role="alert" className="text-sm text-destructive">
          {err}
        </p>
      )}

      {q.isPending ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </p>
      ) : q.isError ? (
        <EmptyNote>
          Não foi possível carregar suas tarefas.{" "}
          <Button
            variant="ghost"
            onClick={() => q.refetch()}
            className="font-semibold text-primary"
          >
            Tentar de novo
          </Button>
        </EmptyNote>
      ) : (
        <>
          {pending.length === 0 ? (
            <EmptyNote>
              {completed.length > 0
                ? "Tudo concluído por aqui. Adicione uma nova tarefa acima quando quiser."
                : "Nenhuma tarefa ainda. Adicione a primeira acima."}
            </EmptyNote>
          ) : (
            <ul className="space-y-1.5" aria-label="Tarefas pendentes">
              {pending.map((t) =>
                editId === t.id ? (
                  <li key={t.id} className="space-y-2 rounded-md bg-muted/60 p-3">
                    <input
                      value={edit.title}
                      onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                      maxLength={200}
                      aria-label="Título da tarefa"
                      className={inputCls}
                    />
                    <TaskFields v={edit} set={setEdit} />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          const dirty =
                            edit.title !== t.title ||
                            edit.area_slug !== t.area_slug ||
                            edit.priority !== t.priority ||
                            edit.due_date !== t.due_date ||
                            edit.recurrence !== t.recurrence;
                          if (confirmDiscard(dirty)) setEditId(null);
                        }}
                        className="rounded-md border bg-card px-3 py-1.5 text-sm"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="ghost"
                        type="button"
                        disabled={!edit.title.trim() || save.isPending}
                        onClick={() =>
                          save.mutate({
                            id: t.id,
                            f: { ...edit, title: edit.title.trim().slice(0, 200) },
                          })
                        }
                        className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        Salvar
                      </Button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={t.id}
                    className="group flex items-center gap-3 rounded-md bg-muted/60 px-3 py-2"
                  >
                    <Button
                      variant="ghost"
                      onClick={() => toggle.mutate(t)}
                      disabled={toggle.isPending}
                      aria-label={`Concluir "${t.title}"`}
                      className="group/check size-10 shrink-0 p-0"
                    >
                      <span className="size-6 rounded-full border-2 border-primary transition group-hover/check:bg-primary/10" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{t.title}</p>
                      <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        {t.priority !== "normal" && (
                          <span
                            className={cn(t.priority === "alta" && "font-semibold text-primary")}
                          >
                            Prioridade {PRIORITY_LABEL[t.priority].toLowerCase()}
                          </span>
                        )}
                        {t.area_slug && <span>{getArea(t.area_slug)?.short ?? t.area_slug}</span>}
                        {t.due_date && (
                          <span className={cn(t.due_date < today && "text-destructive")}>
                            {t.due_date === today
                              ? "Hoje"
                              : t.due_date < today
                                ? `Atrasada (${formatDue(t.due_date)})`
                                : formatDue(t.due_date)}
                          </span>
                        )}
                        {t.recurrence !== "none" && (
                          <span className="inline-flex items-center gap-1">
                            <Repeat className="size-3" aria-hidden />
                            {RECURRENCE_LABEL[t.recurrence]}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditId(t.id);
                          setEdit({
                            title: t.title,
                            area_slug: t.area_slug,
                            priority: t.priority,
                            due_date: t.due_date,
                            recurrence: t.recurrence,
                          });
                        }}
                        aria-label={`Editar "${t.title}"`}
                        className="size-10 rounded-md p-0 text-muted-foreground hover:bg-card hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => askDelete(t)}
                        aria-label={`Excluir "${t.title}"`}
                        className="size-10 rounded-md p-0 text-muted-foreground hover:bg-card hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}

          {completed.length > 0 && (
            <div className="rounded-md border bg-muted/40">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                aria-controls="concluidas-lista"
                className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold"
              >
                <span>Concluídas ({completed.length})</span>
                <ChevronDown
                  className={cn("size-4 transition-transform", showDone && "rotate-180")}
                />
              </Button>
              {showDone && (
                <ul
                  id="concluidas-lista"
                  className="space-y-1.5 px-3 pb-3"
                  aria-label="Tarefas concluídas"
                >
                  {completed.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-md bg-card px-3 py-2">
                      <Check className="size-4 shrink-0 text-primary" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-muted-foreground line-through">
                          {t.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Concluída em {formatCompletedAt(t.completed_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => toggle.mutate(t)}
                        aria-label={`Reabrir "${t.title}"`}
                        className="size-10 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Undo2 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => askDelete(t)}
                        aria-label={`Excluir "${t.title}"`}
                        className="ml-1 size-10 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
