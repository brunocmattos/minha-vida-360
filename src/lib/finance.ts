export type Nature = "nao_classificada" | "fixa" | "variavel" | "temporaria" | "anual";
export const NATURE_LABEL: Record<Nature, string> = {
  fixa: "Fixa",
  variavel: "Variável",
  temporaria: "Temporária",
  anual: "Anual / periódica",
  nao_classificada: "Não classificada",
};
export const NATURE_ORDER: Nature[] = [
  "fixa",
  "variavel",
  "temporaria",
  "anual",
  "nao_classificada",
];
export type Wallet = "banco" | "beneficio";
export type Kind = "receita" | "despesa";
export type Status = "pendente" | "parcial" | "pago" | "vencido";

export type Entry = {
  benefit_account?: "pluxee" | "ifood" | null;
  nature?: Nature;
  id: string;
  kind: Kind;
  category_id: string | null;
  description: string;
  amount_planned: number;
  amount_paid: number;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  recurrence_id: string | null;
  competence: string | null;
  wallet?: Wallet;
  group_label?: string | null;
  sort_order?: number;
  day_known?: boolean;
  installment_no?: number | null;
  installment_total?: number | null;
  amount_manual?: boolean;
};
export type Recurrence = {
  benefit_account?: "pluxee" | "ifood" | null;
  nature?: Nature;
  id: string;
  kind: Kind;
  category_id: string | null;
  description: string;
  amount_planned: number;
  day_of_month: number;
  start_month: string;
  end_month: string | null;
  active: boolean;
  slug?: string | null;
  wallet?: Wallet;
  group_label?: string | null;
  sort_order?: number;
  day_known?: boolean;
  installment_first?: number | null;
  installment_total?: number | null;
  formula?: string | null;
  frequency?: "mensal" | "periodica";
};

export const STATUS_LABEL: Record<Status, string> = {
  pendente: "Previsto",
  parcial: "Parcial",
  pago: "Pago / Recebido",
  vencido: "Vencido",
};
export function statusLabel(st: Status, kind: Kind): string {
  if (st === "pago") return kind === "receita" ? "Recebido" : "Pago";
  return STATUS_LABEL[st];
}
const cents = (n: number) => Math.round(n * 100);
const monthsBetween = (a: string, b: string) =>
  (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 +
  Number(b.slice(5, 7)) -
  Number(a.slice(5, 7));

/** Ordem fixa: natureza (fixa, variável, temporária, anual), depois ordem cadastrada; nunca pelo dia. */
export function sortEntries<
  T extends Pick<Entry, "nature" | "sort_order" | "description" | "kind">,
>(es: T[]): T[] {
  return [...es].sort(
    (a, b) =>
      (a.kind === b.kind ? 0 : a.kind === "receita" ? -1 : 1) ||
      NATURE_ORDER.indexOf(a.nature ?? "nao_classificada") -
        NATURE_ORDER.indexOf(b.nature ?? "nao_classificada") ||
      (a.sort_order ?? 100) - (b.sort_order ?? 100) ||
      a.description.localeCompare(b.description, "pt-BR"),
  );
}

export const HOUSING_SLUGS = ["aluguel", "condominio", "energia", "internet"];
/** 50% da soma dos valores PREVISTOS de moradia da mesma competência. */
export function halfHousing(entries: Entry[], recs: Recurrence[], competence: string): number {
  const ids = new Set(
    recs.filter((r) => r.slug && HOUSING_SLUGS.includes(r.slug)).map((r) => r.id),
  );
  const sum = entries
    .filter((e) => e.recurrence_id && ids.has(e.recurrence_id) && e.competence === competence)
    .reduce((n, e) => n + cents(e.amount_planned), 0);
  return Math.round(sum / 2) / 100;
}

/** Recalcula apenas previsões dentro da vigência; recebimentos, datas confirmadas e valores editados à mão são preservados. */
export function halfHousingUpdates(entries: Entry[], recs: Recurrence[]) {
  return entries.flatMap((e) => {
    if (e.kind !== "receita" || e.amount_paid !== 0 || e.paid_date || !e.competence) return [];
    if (e.amount_manual) return [];
    const r = recs.find((r) => r.id === e.recurrence_id && r.formula === "half_housing");
    if (!r || e.competence < r.start_month || (r.end_month && e.competence > r.end_month))
      return [];
    const v = halfHousing(entries, recs, e.competence);
    return v !== e.amount_planned ? [{ id: e.id, v }] : [];
  });
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (n: number) => brl.format(n);

/** Aceita "1.234,56", "1234.56", "1234". Retorna null se inválido, negativo ou acima do limite. */
export function parseBRL(input: string): number | null {
  const s = input.trim().replace(/^R\$\s*/, "");
  if (!s) return null;
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  if (!/^\d+(\.\d{1,2})?$/.test(norm)) return null;
  const n = Number(norm);
  return n <= 99_999_999 ? Math.round(n * 100) / 100 : null;
}

export const monthOf = (iso: string) => `${iso.slice(0, 7)}-01`;
export function addMonths(month: string, n: number): string {
  const [y = 0, m = 1] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}
export function dueInMonth(month: string, day: number): string {
  const [y = 0, m = 1] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month.slice(0, 7)}-${String(Math.min(day, last)).padStart(2, "0")}`;
}
export function monthLabel(month: string): string {
  const [y = 0, m = 1] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 15)));
}

export function entryStatus(
  e: Pick<Entry, "amount_planned" | "amount_paid" | "due_date" | "day_known">,
  today: string,
): Status {
  if (e.amount_paid > 0 && e.amount_paid >= e.amount_planned) return "pago";
  // dia a definir: o dia gravado é só um marcador, então só vence depois que o mês acaba
  const late =
    e.day_known === false ? e.due_date.slice(0, 7) < today.slice(0, 7) : e.due_date < today;
  if (late) return "vencido";
  if (e.amount_paid > 0) return "parcial";
  return "pendente";
}

/** Meses à frente que as recorrências geram e a projeção mostra (pedido da Tayane: 24). */
export const PROJECTION_MONTHS = 24;

/** Ocorrências de uma recorrência mensal entre o início e (mês atual + horizonte-1). Uma por competência. */
export function recurrenceOccurrences(
  r: Recurrence,
  currentMonth: string,
  horizon = PROJECTION_MONTHS,
) {
  if (!r.active || r.frequency === "periodica") return [];
  const until = addMonths(currentMonth, horizon - 1);
  const stop = r.end_month && r.end_month < until ? r.end_month : until;
  const rows = [];
  for (let m = r.start_month; m <= stop; m = addMonths(m, 1)) {
    rows.push({
      nature: r.nature ?? "nao_classificada",
      kind: r.kind,
      category_id: r.category_id,
      description: r.description,
      amount_planned: r.amount_planned,
      due_date: dueInMonth(m, r.day_of_month),
      recurrence_id: r.id,
      competence: m,
      wallet: r.wallet ?? "banco",
      benefit_account: r.benefit_account ?? null,
      group_label: r.group_label ?? null,
      sort_order: r.sort_order ?? 100,
      day_known: r.day_known ?? true,
      installment_no: r.installment_first
        ? r.installment_first + monthsBetween(r.start_month, m)
        : null,
      installment_total: r.installment_total ?? null,
    });
  }
  return rows;
}

export type MonthSummary = {
  plannedIn: number;
  plannedOut: number;
  realizedIn: number;
  realizedOut: number;
  cash: number;
  benefitPlanned: number;
  benefitReceived: number;
};
/** Previsto = por vencimento no mês. Efetivo (caixa) = somente valores pagos/recebidos com data no mês. */
export function summarizeMonth(entries: Entry[], month: string): MonthSummary {
  // soma em centavos inteiros para não acumular erro de ponto flutuante
  const c = {
    plannedIn: 0,
    plannedOut: 0,
    realizedIn: 0,
    realizedOut: 0,
    benefitPlanned: 0,
    benefitReceived: 0,
  };
  for (const e of entries) {
    const dueNow = monthOf(e.due_date) === month;
    const paidNow = !!e.paid_date && e.amount_paid > 0 && monthOf(e.paid_date) === month;
    if (e.wallet === "beneficio") {
      if (dueNow) c.benefitPlanned += cents(e.amount_planned);
      if (paidNow) c.benefitReceived += cents(e.amount_paid);
      continue;
    }
    if (dueNow) c[e.kind === "receita" ? "plannedIn" : "plannedOut"] += cents(e.amount_planned);
    if (paidNow) c[e.kind === "receita" ? "realizedIn" : "realizedOut"] += cents(e.amount_paid);
  }
  return {
    plannedIn: c.plannedIn / 100,
    plannedOut: c.plannedOut / 100,
    realizedIn: c.realizedIn / 100,
    realizedOut: c.realizedOut / 100,
    cash: (c.realizedIn - c.realizedOut) / 100,
    benefitPlanned: c.benefitPlanned / 100,
    benefitReceived: c.benefitReceived / 100,
  };
}

export function projection(entries: Entry[], fromMonth: string, months = PROJECTION_MONTHS) {
  return Array.from({ length: months }, (_, i) => {
    const m = addMonths(fromMonth, i);
    const s = summarizeMonth(entries, m);
    return {
      month: m,
      plannedIn: s.plannedIn,
      plannedOut: s.plannedOut,
      balance: Math.round((s.plannedIn - s.plannedOut) * 100) / 100,
      benefit: s.benefitPlanned,
      count: entries.filter((e) => monthOf(e.due_date) === m).length,
    };
  });
}
