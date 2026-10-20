import { describe, expect, it } from "vitest";
import {
  entryStatus,
  halfHousing,
  halfHousingUpdates,
  projection,
  summarizeMonth,
  type Entry,
  type Recurrence,
} from "@/lib/finance";
import { accountBalance, type Opening } from "@/lib/finance-balances";

const entry: Entry = {
  id: "e",
  kind: "despesa",
  category_id: null,
  description: "x",
  amount_planned: 100,
  amount_paid: 0,
  due_date: "2026-11-05",
  paid_date: null,
  notes: null,
  recurrence_id: null,
  competence: null,
};
const rec = (slug: string, extra: Partial<Recurrence> = {}): Recurrence => ({
  id: slug,
  slug,
  kind: "despesa",
  category_id: null,
  description: slug,
  amount_planned: 0,
  day_of_month: 5,
  start_month: "2026-11-01",
  end_month: null,
  active: true,
  ...extra,
});

describe("B2: valor editado à mão não é sobrescrito pelo repasse", () => {
  const housing = ["aluguel", "condominio", "energia", "internet"].map((s) => rec(s));
  const joici = rec("joici", { kind: "receita", formula: "half_housing" });
  const bills = housing.map((r) => ({
    ...entry,
    id: r.id,
    recurrence_id: r.id,
    competence: "2026-11-01",
  }));
  const repasse: Entry = {
    ...entry,
    id: "j",
    kind: "receita",
    amount_planned: 123,
    recurrence_id: "j",
    competence: "2026-11-01",
  };
  const recs = [...housing, { ...joici, id: "j" }];
  it("recalcula quando não foi editado", () => {
    expect(halfHousingUpdates([...bills, repasse], recs)).toEqual([{ id: "j", v: 200 }]);
  });
  it("ignora quando amount_manual=true", () => {
    expect(halfHousingUpdates([...bills, { ...repasse, amount_manual: true }], recs)).toEqual([]);
  });
});

describe("B7a: saldo transportado arredondado em centavos", () => {
  it("não gera 649,9200000000001", () => {
    const opening: Opening = {
      id: "o",
      wallet: "banco",
      competence: "2026-10-01",
      amount: 600.1,
      included: true,
      label: null,
    };
    const es: Entry[] = [49.82].map((n, i) => ({
      ...entry,
      id: String(i),
      kind: "receita",
      amount_paid: n,
      paid_date: "2026-10-10",
    }));
    const b = accountBalance(es, [], [opening], "banco", "2026-11-01");
    // 600.1 + 49.82 em float dá 649.9200000000001
    expect(b.opening).toBe(649.92);
  });
});

describe("B7c: dia a definir só vence depois que o mês acaba", () => {
  const e = { amount_planned: 100, amount_paid: 0, due_date: "2026-10-05", day_known: false };
  it("no mesmo mês continua previsto", () => {
    expect(entryStatus(e, "2026-10-20")).toBe("pendente");
  });
  it("no mês seguinte fica vencido", () => {
    expect(entryStatus(e, "2026-11-01")).toBe("vencido");
  });
  it("dia conhecido vence no dia seguinte", () => {
    expect(entryStatus({ ...e, day_known: true }, "2026-10-20")).toBe("vencido");
  });
});

describe("B7e: dinheiro em centavos inteiros", () => {
  it("repasse de 50% sem erro de 1 centavo", () => {
    const recs = ["aluguel", "condominio", "energia", "internet"].map((s) => rec(s));
    const vals = [1500.05, 350.15, 210.35, 99.9];
    const es = recs.map((r, i) => ({
      ...entry,
      id: r.id,
      recurrence_id: r.id,
      competence: "2026-11-01",
      amount_planned: vals[i]!,
    }));
    expect(halfHousing(es, recs, "2026-11-01")).toBe(1080.23);
  });
  it("somas do mês fecham em centavos", () => {
    const es: Entry[] = [0.1, 0.2, 0.3].map((n, i) => ({
      ...entry,
      id: String(i),
      amount_planned: n,
    }));
    expect(summarizeMonth(es, "2026-11-01").plannedOut).toBe(0.6);
  });
});

describe("B7b: mês sem lançamentos gerados fica identificável", () => {
  it("count 0 além do horizonte gerado", () => {
    const p = projection([entry], "2026-11-01", 3);
    expect(p.map((m) => m.count)).toEqual([1, 0, 0]);
  });
});
