import { expect, it } from "vitest";
import {
  halfHousingUpdates,
  projection,
  recurrenceOccurrences,
  type Entry,
  type Recurrence,
} from "@/lib/finance";

const joici: Recurrence = {
  id: "j",
  slug: "joici",
  formula: "half_housing",
  kind: "receita",
  category_id: null,
  description: "Repasse",
  amount_planned: 0,
  day_of_month: 7,
  start_month: "2026-11-01",
  end_month: "2026-11-01",
  active: true,
};
const housing = ["aluguel", "condominio", "energia", "internet"].map((slug) => ({
  ...joici,
  id: slug,
  slug,
  kind: "despesa" as const,
  formula: null,
  end_month: null,
}));
const base: Entry = {
  id: "j-nov",
  kind: "receita",
  category_id: null,
  description: "Repasse",
  amount_planned: 0,
  amount_paid: 0,
  due_date: "2026-11-07",
  paid_date: null,
  notes: null,
  recurrence_id: "j",
  competence: "2026-11-01",
};
const bills = (month: string): Entry[] =>
  housing.map((r) => ({
    ...base,
    id: `${r.id}-${month}`,
    kind: "despesa",
    recurrence_id: r.id,
    due_date: `${month.slice(0, 7)}-05`,
    competence: month,
    amount_planned: 100,
  }));

it("novembro mantém 50% das quatro contas sem confirmar recebimento", () => {
  expect(halfHousingUpdates([...bills("2026-11-01"), base], [...housing, joici])).toEqual([
    { id: "j-nov", v: 200 },
  ]);
  expect(base.amount_paid).toBe(0);
});
it("recorrência termina em novembro, inclusive ao gerar a partir de dezembro", () => {
  expect(recurrenceOccurrences(joici, "2026-11-01").map((e) => e.competence)).toEqual([
    "2026-11-01",
  ]);
  expect(recurrenceOccurrences(joici, "2026-12-01").some((e) => e.competence >= "2026-12-01")).toBe(
    false,
  );
});
it("efeito não recalcula Joici em dezembro nem em meses posteriores", () => {
  for (const month of ["2026-12-01", "2027-01-01"]) {
    expect(
      halfHousingUpdates([...bills(month), { ...base, competence: month }], [...housing, joici]),
    ).toEqual([]);
  }
});
it("repasse efetivamente recebido é preservado", () => {
  expect(
    halfHousingUpdates(
      [...bills("2026-11-01"), { ...base, amount_paid: 75, paid_date: "2026-11-07" }],
      [...housing, joici],
    ),
  ).toEqual([]);
});
it("dezembro mantém 100% das contas sem duplicação nem repasse previsto", () => {
  const december = projection(bills("2026-12-01"), "2026-12-01", 1)[0];
  expect(december).toMatchObject({ plannedIn: 0, plannedOut: 400, balance: -400, count: 4 });
});
