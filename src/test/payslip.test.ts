import { describe, expect, it } from "vitest";
import { lineChanges, payslipHistory, payslipTotals, type Payslip } from "@/lib/payslip";

const slip = (competence: string, earnings: [string, number][], deductions: [string, number][]) =>
  ({
    id: competence,
    competence,
    paid_month: null,
    employer: "Empresa",
    earnings: earnings.map(([label, amount]) => ({ label, amount })),
    deductions: deductions.map(([label, amount]) => ({ label, amount })),
    notes: null,
  }) satisfies Payslip;

const set = slip("2026-09-01", [["Salário", 3000]], [["INSS", 300.1]]);
const out = slip(
  "2026-10-01",
  [
    ["Salário", 3000],
    ["Hora extra", 250.5],
  ],
  [["INSS", 320.2]],
);

describe("contracheque", () => {
  it("totais em centavos exatos", () => {
    expect(payslipTotals(out)).toEqual({ gross: 3250.5, deductions: 320.2, net: 2930.3 });
  });
  it("histórico do mais recente pro mais antigo, com a diferença do líquido", () => {
    const h = payslipHistory([set, out]);
    expect(h.map((r) => r.slip.competence)).toEqual(["2026-10-01", "2026-09-01"]);
    expect(h[0]?.netDelta).toBe(230.4);
    expect(h[1]?.netDelta).toBeNull();
  });
  it("só compara com o mesmo empregador", () => {
    const outro = { ...set, id: "x", employer: "Outra", competence: "2026-08-01" };
    expect(payslipHistory([outro, set])[0]?.netDelta).toBeNull();
  });
  it("lista linha nova, linha que mudou e linha que sumiu", () => {
    const sem = slip("2026-11-01", [["Salário", 3100]], []);
    expect(lineChanges(out, set)).toEqual([
      { side: "provento", label: "Hora extra", from: null, to: 250.5, delta: 250.5 },
      { side: "desconto", label: "INSS", from: 300.1, to: 320.2, delta: 20.1 },
    ]);
    expect(lineChanges(sem, out).map((c) => [c.label, c.to])).toEqual([
      ["INSS", null],
      ["Hora extra", null],
      ["Salário", 3100],
    ]);
  });
});
