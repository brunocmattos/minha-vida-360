export type CareDates = {
  done_date: string | null;
  next_date: string | null;
  overdue_since: string | null;
};

// Vacina vencida deixa de ser pendência quando há aplicação feita desde o vencimento.
function pendingRegularization(care: CareDates) {
  return !!care.overdue_since && !(care.done_date && care.done_date >= care.overdue_since);
}

export function careStatus(care: CareDates, today: string) {
  if (pendingRegularization(care)) return "regularizar" as const;
  if (care.next_date) return care.next_date < today ? ("atrasado" as const) : ("previsto" as const);
  return care.done_date ? ("realizado" as const) : ("a_definir" as const);
}

export function careScheduleDate(care: CareDates) {
  return pendingRegularization(care) ? care.overdue_since : care.next_date;
}
