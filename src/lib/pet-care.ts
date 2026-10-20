export type CareDates = { done_date: string | null; next_date: string | null; overdue_since: string | null };

export function careStatus(care: CareDates, today: string) {
  if (care.overdue_since) return "regularizar" as const;
  if (care.next_date) return care.next_date < today ? "atrasado" as const : "previsto" as const;
  return care.done_date ? "realizado" as const : "a_definir" as const;
}

export function careScheduleDate(care: CareDates) {
  return care.overdue_since ?? care.next_date;
}