// Tipos e validação compartilhados das ações da assistente Luísa (client-safe).

export type LuisaActionType = "none" | "criar_despesa" | "registrar_diario";

export type LuisaAction = {
  type: LuisaActionType;
  description?: string | undefined;
  amount?: number | undefined;
  date?: string | undefined; // ISO yyyy-mm-dd
  content?: string | undefined;
  area_slug?: string | undefined;
  status: "pendente" | "confirmada" | "cancelada";
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(v: unknown, max = 500): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

function cleanAmount(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > 99_999_999) return undefined;
  return Math.round(n * 100) / 100;
}

/** Aceita só datas reais: o JS "rola" 2026-02-31 para março, então conferimos a ida e volta. */
export function cleanDate(v: unknown): string | undefined {
  if (typeof v !== "string" || !ISO_DATE.test(v)) return undefined;
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? undefined : v;
}

const STATUSES: LuisaAction["status"][] = ["pendente", "confirmada", "cancelada"];

/**
 * Sanitiza uma ação. Retorna null se a intenção não for gravável.
 * Saída nova do modelo → sempre "pendente". Ação já gravada no banco (`stored`) → mantém o status salvo.
 */
export function validateLuisaAction(raw: unknown, stored = false): LuisaAction | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const type = r["type"];
  const st = STATUSES.find((s) => s === r["status"]);
  const status = stored && st ? st : "pendente";
  if (type === "criar_despesa") {
    const description = cleanText(r["description"], 120);
    const amount = cleanAmount(r["amount"]);
    if (!description || amount == null) return null; // falta dado → a Luísa pergunta no texto
    return { type, description, amount, date: cleanDate(r["date"]), status };
  }
  if (type === "registrar_diario") {
    const content = cleanText(r["content"], 2000);
    if (!content) return null;
    return {
      type,
      content,
      date: cleanDate(r["date"]),
      area_slug: cleanText(r["area_slug"], 40),
      status,
    };
  }
  return null;
}

const FALLBACK_REPLY = "Tive um problema para responder. Tente de novo?";

/** Interpreta a saída JSON do modelo: { reply, action? }. Nunca lança. */
export function parseLuisaOutput(raw: unknown): { reply: string; action: LuisaAction | null } {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const reply =
    cleanText(obj["reply"], 4000) ?? "Não consegui entender. Pode repetir de outro jeito?";
  return { reply, action: validateLuisaAction(obj["action"]) };
}

/** Texto bruto devolvido pelo modelo (JSON em string). Vazio ou inválido → resposta amigável. Nunca lança. */
export function parseLuisaContent(content: unknown): {
  reply: string;
  action: LuisaAction | null;
} {
  if (typeof content !== "string" || !content.trim())
    return { reply: FALLBACK_REPLY, action: null };
  try {
    return parseLuisaOutput(JSON.parse(content));
  } catch {
    return { reply: FALLBACK_REPLY, action: null };
  }
}

/** Data de hoje (aaaa-mm-dd) no fuso de São Paulo. */
export function todaySP(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** Despesa com data futura entra como prevista (não paga); hoje ou passado, como paga. */
export function expensePayment(amount: number, date: string, today: string) {
  const paid = date <= today;
  return { paid, amount_paid: paid ? amount : 0, paid_date: paid ? date : null };
}

export function actionSummary(a: LuisaAction, today: string = todaySP()): string {
  if (a.type === "criar_despesa") {
    const valor = a.amount != null ? `R$ ${a.amount.toFixed(2).replace(".", ",")}` : "a definir";
    const situacao = expensePayment(a.amount ?? 0, a.date ?? today, today).paid
      ? "paga"
      : "prevista";
    return `Despesa: ${a.description} — ${valor}${a.date ? ` — ${a.date.split("-").reverse().join("/")}` : ""} (${situacao})`;
  }
  return `Diário: ${a.content}`;
}
