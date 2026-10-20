export type Recurrence = "none" | "daily" | "alternate" | "weekly" | "monthly";
export type Priority = "baixa" | "normal" | "alta";

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: "Não repete",
  daily: "Diária",
  alternate: "Dia sim, dia não",
  weekly: "Semanal (flexível)",
  monthly: "Mensal (flexível)",
};
export const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
};

/** Hoje (YYYY-MM-DD) no fuso America/Sao_Paulo. */
export function todaySP(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

/** Próxima data: regras flexíveis contam a partir do dia em que foi feita. */
export function nextDueDate(rule: Recurrence, doneOn: string): string | null {
  if (rule === "none") return null;
  const [y = 0, m = 1, d = 1] = doneOn.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (rule === "daily") dt.setUTCDate(dt.getUTCDate() + 1);
  else if (rule === "alternate") dt.setUTCDate(dt.getUTCDate() + 2);
  else if (rule === "weekly") dt.setUTCDate(dt.getUTCDate() + 7);
  else {
    const target = new Date(Date.UTC(y, m, 1));
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, last));
    return target.toISOString().slice(0, 10);
  }
  return dt.toISOString().slice(0, 10);
}

export function formatDue(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
