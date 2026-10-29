// Contracheque: totais e comparação entre competências. Funções puras, testadas em src/test/payslip.test.ts.
export type PayslipLine = {
  label: string;
  amount: number;
  consignado?: boolean;
  installment_no?: number;
  installment_total?: number;
  ref_month?: string;
};
export type Payslip = {
  id: string;
  competence: string;
  paid_month: string | null;
  employer: string;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  notes: string | null;
};

const cents = (n: number) => Math.round(Number(n) * 100);
export const sumLines = (ls: PayslipLine[]) => ls.reduce((n, l) => n + cents(l.amount), 0) / 100;

export function payslipTotals(s: Payslip) {
  const gross = sumLines(s.earnings);
  const deductions = sumLines(s.deductions);
  return { gross, deductions, net: (cents(gross) - cents(deductions)) / 100 };
}

/** Contracheque anterior do mesmo empregador (competência imediatamente menor que a dele). */
export function previousPayslip(s: Payslip, all: Payslip[]) {
  return (
    all
      .filter((x) => x.employer === s.employer && x.competence < s.competence)
      .sort((a, b) => b.competence.localeCompare(a.competence))[0] ?? null
  );
}

/** Linha da tabela de comparação: totais do mês e a diferença do líquido para o mês anterior. */
export function payslipHistory(all: Payslip[]) {
  return [...all]
    .sort(
      (a, b) => b.competence.localeCompare(a.competence) || a.employer.localeCompare(b.employer),
    )
    .map((s) => {
      const t = payslipTotals(s);
      const prev = previousPayslip(s, all);
      return {
        slip: s,
        ...t,
        netDelta: prev ? (cents(t.net) - cents(payslipTotals(prev).net)) / 100 : null,
      };
    });
}

export type LineChange = {
  side: "provento" | "desconto";
  label: string;
  from: number | null; // null = não existia no mês anterior
  to: number | null; // null = sumiu neste mês
  delta: number;
};

/** O que mudou linha a linha entre dois contracheques (mesmo rótulo = mesma linha). */
export function lineChanges(curr: Payslip, prev: Payslip): LineChange[] {
  const out: LineChange[] = [];
  const side = (key: "earnings" | "deductions", name: LineChange["side"]) => {
    const total = (ls: PayslipLine[]) => {
      const m = new Map<string, number>();
      for (const l of ls) m.set(l.label.trim(), (m.get(l.label.trim()) ?? 0) + cents(l.amount));
      return m;
    };
    const a = total(prev[key]);
    const b = total(curr[key]);
    for (const label of new Set([...a.keys(), ...b.keys()])) {
      const from = a.get(label);
      const to = b.get(label);
      if (from === to) continue;
      out.push({
        side: name,
        label,
        from: from === undefined ? null : from / 100,
        to: to === undefined ? null : to / 100,
        delta: ((to ?? 0) - (from ?? 0)) / 100,
      });
    }
  };
  side("earnings", "provento");
  side("deductions", "desconto");
  return out.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}
