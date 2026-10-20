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

function cleanDate(v: unknown): string | undefined {
  if (typeof v !== "string" || !ISO_DATE.test(v)) return undefined;
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : v;
}

/** Sanitiza a ação devolvida pelo modelo. Retorna null se a intenção não for gravável. */
export function validateLuisaAction(raw: unknown): LuisaAction | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const type = r["type"];
  if (type === "criar_despesa") {
    const description = cleanText(r["description"], 120);
    const amount = cleanAmount(r["amount"]);
    if (!description || amount == null) return null; // falta dado → a Luísa pergunta no texto
    return { type, description, amount, date: cleanDate(r["date"]), status: "pendente" };
  }
  if (type === "registrar_diario") {
    const content = cleanText(r["content"], 2000);
    if (!content) return null;
    return {
      type,
      content,
      date: cleanDate(r["date"]),
      area_slug: cleanText(r["area_slug"], 40),
      status: "pendente",
    };
  }
  return null;
}

/** Interpreta a saída JSON do modelo: { reply, action? }. Nunca lança. */
export function parseLuisaOutput(raw: unknown): { reply: string; action: LuisaAction | null } {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const reply =
    cleanText(obj["reply"], 4000) ?? "Não consegui entender. Pode repetir de outro jeito?";
  return { reply, action: validateLuisaAction(obj["action"]) };
}

export function actionSummary(a: LuisaAction): string {
  if (a.type === "criar_despesa") {
    const valor = a.amount != null ? `R$ ${a.amount.toFixed(2).replace(".", ",")}` : "a definir";
    return `Despesa: ${a.description} — ${valor}${a.date ? ` — ${a.date.split("-").reverse().join("/")}` : ""}`;
  }
  return `Diário: ${a.content?.slice(0, 80)}${(a.content?.length ?? 0) > 80 ? "…" : ""}`;
}
