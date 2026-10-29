// Área Casa: regras puras (lista de compras, manutenções, histórico). Testes em src/test/casa.test.ts.

export type ShoppingDraft = { name: string; quantity: string | null };

// "2", "1kg", "3x", "500 g", "2 un" no começo do item
const QTY = /^(\d+(?:[.,]\d+)?\s*(?:x|un|kg|g|l|ml|pct|cx|dz)?)\s+(?:de\s+)?(.+)$/i;

/** "arroz, 2 sabão em pó e leite" → itens. Separa por vírgula, ponto e vírgula, linha e " e ". */
export function parseShoppingInput(text: string): ShoppingDraft[] {
  const seen = new Set<string>();
  const out: ShoppingDraft[] = [];
  for (const part of text.split(/[,;\n]+|\s+e\s+/i)) {
    const raw = part.trim().replace(/\s+/g, " ");
    if (!raw) continue;
    const m = QTY.exec(raw);
    const name = (m ? m[2]! : raw).slice(0, 120);
    const key = name.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, quantity: m ? m[1]!.replace(/\s+/g, "").slice(0, 40) : null });
  }
  return out;
}

/** Tira os itens que já estão faltando na lista (mesmo nome, sem diferenciar maiúscula). */
export function withoutMissing(items: ShoppingDraft[], missingNames: string[]) {
  const have = new Set(missingNames.map((n) => n.trim().toLocaleLowerCase("pt-BR")));
  return items.filter((i) => !have.has(i.name.trim().toLocaleLowerCase("pt-BR")));
}

export type MaintenanceDates = { scheduled_date: string | null; done_date: string | null };
export type MaintenanceStatus = "feito" | "atrasado" | "agendado" | "pendente";

export function maintenanceStatus(m: MaintenanceDates, today: string): MaintenanceStatus {
  if (m.done_date) return "feito";
  if (m.scheduled_date) return m.scheduled_date < today ? "atrasado" : "agendado";
  return "pendente";
}

/** Dia (aaaa-mm-dd) de um instante, no fuso de São Paulo. */
export const daySP = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export type Completion = { task_id: string; completed_at: string };
export type CasaEvent = {
  key: string;
  date: string;
  kind: "tarefa" | "compra" | "manutencao";
  title: string;
};

/** Linha do tempo da casa desde `since` (inclusive): tarefas feitas, compras e manutenções concluídas. */
export function casaTimeline(
  src: {
    completions: Completion[]; // rotinas (cada vez que foi feita)
    doneTasks: { id: string; title: string; completed_at: string | null }[]; // tarefas avulsas feitas
    taskTitles: Record<string, string>;
    shopping: { id: string; name: string; bought_at: string | null }[];
    maintenance: { id: string; title: string; done_date: string | null }[];
  },
  since: string,
): CasaEvent[] {
  const ev: CasaEvent[] = [];
  src.completions.forEach((c, i) =>
    ev.push({
      key: `c${i}:${c.task_id}`,
      date: daySP(c.completed_at),
      kind: "tarefa",
      title: src.taskTitles[c.task_id] ?? "Tarefa",
    }),
  );
  for (const t of src.doneTasks)
    if (t.completed_at)
      ev.push({ key: `t:${t.id}`, date: daySP(t.completed_at), kind: "tarefa", title: t.title });
  for (const s of src.shopping)
    if (s.bought_at)
      ev.push({ key: `s:${s.id}`, date: daySP(s.bought_at), kind: "compra", title: s.name });
  for (const m of src.maintenance)
    if (m.done_date)
      ev.push({ key: `m:${m.id}`, date: m.done_date, kind: "manutencao", title: m.title });
  return ev.filter((e) => e.date >= since).sort((a, b) => b.date.localeCompare(a.date));
}

/** Quantas vezes a rotina foi feita nos últimos 30 dias (contando hoje) e quando foi a última. */
export function routineStats(completions: Completion[], taskId: string, today: string) {
  const days = completions
    .filter((c) => c.task_id === taskId)
    .map((c) => daySP(c.completed_at))
    .sort();
  const since = addDays(today, -29);
  return { last30: days.filter((d) => d >= since).length, last: days.at(-1) ?? null };
}
