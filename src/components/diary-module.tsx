import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetch-all";
import { SoftCard } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { openLuisaChat } from "@/components/luisa-chat";

type DiaryEntry = {
  id: string;
  entry_date: string;
  area_slug: string | null;
  content: string;
  created_at: string;
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));

// A chave é compartilhada: a Luísa invalida ["diary"] depois de anotar um registro.
const KEY = ["diary"];

export function DiaryModule() {
  const qc = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [content, setContent] = useState("");
  const [date, setDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()),
  );

  const q = useQuery({
    queryKey: KEY,
    queryFn: () =>
      fetchAllRows<DiaryEntry>((from, to) =>
        supabase
          .from("diary_entries")
          .select("id, entry_date, area_slug, content, created_at")
          .order("entry_date", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id")
          .range(from, to),
      ),
  });
  // Em erro de recarga o react-query mantém o último dado bom.
  const entries = q.data ?? [];

  function cancel() {
    if (content.trim() && !window.confirm("Descartar o registro não salvo?")) return;
    setFormOpen(false);
    setContent("");
  }

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("diary_entries")
        .insert({ content: content.trim(), entry_date: date });
      if (error) throw error;
    },
    onSuccess: async () => {
      setFormOpen(false);
      setContent("");
      await qc.invalidateQueries({ queryKey: KEY });
    },
    onError: () => setActionError("Não consegui salvar o registro."),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diary_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => setActionError("Não consegui excluir o registro."),
  });

  function submit() {
    if (!content.trim() || save.isPending) return;
    setActionError(null);
    save.mutate();
  }

  function remove(id: string) {
    if (!window.confirm("Excluir este registro do diário?")) return;
    setActionError(null);
    del.mutate(id);
  }

  return (
    <div className="space-y-4">
      <SoftCard className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Seus registros ficam privados e só você os vê. Você também pode pedir para a Luísa anotar
          por você.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={openLuisaChat}>
            Pedir para a Luísa
          </Button>
          <Button className="rounded-full" onClick={() => setFormOpen(true)}>
            Novo registro
          </Button>
        </div>
      </SoftCard>

      {formOpen && (
        <SoftCard>
          <label className="block text-sm font-semibold" htmlFor="diary-date">
            Data
          </label>
          <input
            id="diary-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded-xl border bg-background px-3 py-2 text-sm"
          />
          <label className="mt-3 block text-sm font-semibold" htmlFor="diary-content">
            Registro
          </label>
          <textarea
            id="diary-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Como foi seu dia? O que aconteceu?"
            className="mt-1 w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" className="rounded-full" onClick={cancel}>
              Cancelar
            </Button>
            <Button
              className="rounded-full"
              disabled={save.isPending || !content.trim()}
              onClick={submit}
            >
              Salvar
            </Button>
          </div>
        </SoftCard>
      )}

      {actionError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}
      {q.isError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Não consegui carregar seus registros.{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void q.refetch()}
          >
            Tentar de novo
          </button>
        </p>
      )}
      {q.isPending ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : entries.length === 0 ? (
        !q.isError && (
          <SoftCard className="text-sm text-muted-foreground">
            Nenhum registro ainda. Quando você escrever — aqui ou pela Luísa — ele aparece nesta
            lista.
          </SoftCard>
        )
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id}>
              <SoftCard className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {fmtDate(e.entry_date)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{e.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir registro"
                  onClick={() => remove(e.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </SoftCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
