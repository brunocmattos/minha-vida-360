import { describe, expect, it } from "vitest";
import {
  entryStatus,
  halfHousing,
  parseBRL,
  recurrenceOccurrences,
  summarizeMonth,
  dueInMonth,
  type Entry,
} from "@/lib/finance";

const base: Entry = {
  id: "1",
  kind: "receita",
  category_id: null,
  description: "x",
  amount_planned: 100,
  amount_paid: 0,
  due_date: "2026-10-10",
  paid_date: null,
  notes: null,
  recurrence_id: null,
  competence: null,
};

describe("finanças", () => {
  it("valor inválido ou negativo é recusado", () => {
    expect(parseBRL("-5")).toBeNull();
    expect(parseBRL("abc")).toBeNull();
    expect(parseBRL("1.234,56")).toBe(1234.56);
  });
  it("status: pago, parcial, vencido, pendente", () => {
    expect(
      entryStatus({ amount_planned: 100, amount_paid: 100, due_date: "2026-10-01" }, "2026-10-16"),
    ).toBe("pago");
    expect(
      entryStatus({ amount_planned: 100, amount_paid: 40, due_date: "2026-10-20" }, "2026-10-16"),
    ).toBe("parcial");
    expect(
      entryStatus({ amount_planned: 100, amount_paid: 40, due_date: "2026-10-01" }, "2026-10-16"),
    ).toBe("vencido");
    expect(
      entryStatus({ amount_planned: 100, amount_paid: 0, due_date: "2026-10-20" }, "2026-10-16"),
    ).toBe("pendente");
  });
  it("receita pendente não conta como caixa", () => {
    const s = summarizeMonth([base], "2026-10-01");
    expect(s.plannedIn).toBe(100);
    expect(s.cash).toBe(0);
  });
  it("movimentação confirmada usa recebidos menos pagos pela data efetiva sem saldo inicial", () => {
    const entries: Entry[] = [
      {
        ...base,
        amount_planned: 300,
        amount_paid: 80,
        paid_date: "2026-10-12",
        due_date: "2026-09-30",
      },
      {
        ...base,
        id: "2",
        kind: "despesa",
        amount_planned: 100,
        amount_paid: 30,
        paid_date: "2026-10-13",
      },
      { ...base, id: "3", amount_paid: 200, paid_date: "2026-11-01" },
    ];
    const s = summarizeMonth(entries, "2026-10-01");
    expect(s.realizedIn).toBe(80);
    expect(s.realizedOut).toBe(30);
    expect(s.cash).toBe(50);
    expect(s.plannedIn - s.plannedOut).toBe(0);
  });
  it("recorrência sem natureza gera não classificada", () => {
    const rows = recurrenceOccurrences(
      {
        id: "r",
        kind: "despesa",
        category_id: null,
        description: "a",
        amount_planned: 10,
        day_of_month: 5,
        start_month: "2026-10-01",
        end_month: null,
        active: true,
      },
      "2026-10-01",
    );
    expect(rows[0]?.nature).toBe("nao_classificada");
  });
  it("natureza anual permanece independente da repetição mensal e da categoria", () => {
    const rows = recurrenceOccurrences(
      {
        id: "r",
        nature: "anual",
        kind: "despesa",
        category_id: "category",
        description: "a",
        amount_planned: 10,
        day_of_month: 5,
        start_month: "2026-10-01",
        end_month: null,
        active: true,
      },
      "2026-10-01",
    );
    expect(rows).toHaveLength(12);
    expect(rows.every((r) => r.nature === "anual" && r.category_id === "category")).toBe(true);
  });
  it("vencimento dia 31 respeita fim de fevereiro", () =>
    expect(dueInMonth("2026-02-01", 31)).toBe("2026-02-28"));
  it("recorrência gera uma ocorrência por competência em 12 meses", () => {
    const rows = recurrenceOccurrences(
      {
        id: "r",
        kind: "despesa",
        category_id: null,
        description: "a",
        amount_planned: 10,
        day_of_month: 5,
        start_month: "2026-10-01",
        end_month: null,
        active: true,
      },
      "2026-10-01",
    );
    expect(rows).toHaveLength(12);
    expect(new Set(rows.map((r) => r.competence)).size).toBe(12);
  });
});

describe("modelo real", () => {
  const rec = {
    id: "r",
    kind: "despesa" as const,
    category_id: null,
    description: "Padrasto item",
    amount_planned: 39,
    day_of_month: 1,
    start_month: "2026-11-01",
    end_month: "2027-03-01",
    active: true,
    installment_first: 6,
    installment_total: 10,
  };
  it("parcela 6/10 em nov/2026 gera até 10/10 e para", () => {
    const occ = recurrenceOccurrences(rec, "2026-10-01");
    expect(occ.length).toBe(5);
    expect(occ[0]?.installment_no).toBe(6);
    expect(occ.at(-1)?.installment_no).toBe(10);
  });
  it("anual/periódica não gera lançamentos automáticos", () => {
    expect(recurrenceOccurrences({ ...rec, frequency: "periodica" }, "2026-10-01")).toEqual([]);
  });
  it("Joici = 50% de aluguel+condomínio+energia+internet previstos da competência", () => {
    const recs = ["aluguel", "condominio", "energia", "internet"].map((slug) => ({
      ...rec,
      id: slug,
      slug,
    }));
    const vals = { aluguel: 1738, condominio: 800, energia: 275, internet: 99 } as Record<
      string,
      number
    >;
    const es = recs.map((r) => ({
      ...base,
      id: r.id,
      recurrence_id: r.id,
      competence: "2026-11-01",
      amount_planned: vals[r.id]!,
    }));
    expect(halfHousing(es, recs, "2026-11-01")).toBe(1456);
    expect(halfHousing(es, recs, "2026-12-01")).toBe(0);
  });
  it("Pluxee fica fora do caixa bancário", () => {
    const s = summarizeMonth(
      [
        {
          ...base,
          wallet: "beneficio",
          amount_planned: 600,
          amount_paid: 600,
          paid_date: "2026-10-05",
        },
      ],
      "2026-10-01",
    );
    expect(s.plannedIn).toBe(0);
    expect(s.cash).toBe(0);
    expect(s.benefitReceived).toBe(600);
  });
});
