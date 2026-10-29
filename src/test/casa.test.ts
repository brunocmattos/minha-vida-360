import { describe, expect, it } from "vitest";
import {
  casaTimeline,
  maintenanceStatus,
  parseShoppingInput,
  routineStats,
  withoutMissing,
} from "@/lib/casa";

describe("lista de compras digitada", () => {
  it("separa por vírgula, ponto e vírgula, quebra de linha e 'e'", () => {
    expect(parseShoppingInput("arroz, feijão e sabão em pó;\nleite").map((i) => i.name)).toEqual([
      "arroz",
      "feijão",
      "sabão em pó",
      "leite",
    ]);
  });
  it("quantidade no começo vira quantidade", () => {
    expect(parseShoppingInput("2 sabão em pó, 1kg de café, 3x iogurte")).toEqual([
      { name: "sabão em pó", quantity: "2" },
      { name: "café", quantity: "1kg" },
      { name: "iogurte", quantity: "3x" },
    ]);
  });
  it("não quebra nome que tem 'e' no meio da palavra e ignora vazios e repetidos", () => {
    expect(parseShoppingInput("pão de queijo, , Leite, leite")).toEqual([
      { name: "pão de queijo", quantity: null },
      { name: "Leite", quantity: null },
    ]);
  });
});

describe("manutenção", () => {
  const base = { scheduled_date: null, done_date: null };
  it("situação pela data", () => {
    expect(maintenanceStatus(base, "2026-10-29")).toBe("pendente");
    expect(maintenanceStatus({ ...base, scheduled_date: "2026-11-02" }, "2026-10-29")).toBe(
      "agendado",
    );
    expect(maintenanceStatus({ ...base, scheduled_date: "2026-10-20" }, "2026-10-29")).toBe(
      "atrasado",
    );
    expect(
      maintenanceStatus({ scheduled_date: "2026-10-20", done_date: "2026-10-21" }, "2026-10-29"),
    ).toBe("feito");
  });
});

describe("histórico da casa", () => {
  it("junta tarefas feitas, compras e manutenções, mais recente primeiro, só no período", () => {
    const t = casaTimeline(
      {
        completions: [
          { task_id: "t1", completed_at: "2026-10-28T13:00:00Z" },
          { task_id: "t1", completed_at: "2026-09-01T13:00:00Z" },
        ],
        doneTasks: [{ id: "t2", title: "Limpar geladeira", completed_at: "2026-10-27T12:00:00Z" }],
        taskTitles: { t1: "Limpar a cozinha" },
        shopping: [{ id: "s1", name: "Arroz", bought_at: "2026-10-26T20:00:00Z" }],
        maintenance: [{ id: "m1", title: "Chuveiro", done_date: "2026-10-25" }],
      },
      "2026-09-29",
    );
    expect(t.map((e) => [e.date, e.kind, e.title])).toEqual([
      ["2026-10-28", "tarefa", "Limpar a cozinha"],
      ["2026-10-27", "tarefa", "Limpar geladeira"],
      ["2026-10-26", "compra", "Arroz"],
      ["2026-10-25", "manutencao", "Chuveiro"],
    ]);
  });
  it("data do registro no fuso de São Paulo", () => {
    const t = casaTimeline(
      {
        completions: [{ task_id: "t1", completed_at: "2026-10-29T01:30:00Z" }],
        doneTasks: [],
        taskTitles: { t1: "Tirar o lixo" },
        shopping: [],
        maintenance: [],
      },
      "2026-10-01",
    );
    expect(t[0]?.date).toBe("2026-10-28");
  });
});

describe("constância da rotina", () => {
  it("conta as vezes nos últimos 30 dias e a última vez", () => {
    const cs = [
      { task_id: "t1", completed_at: "2026-10-28T13:00:00Z" },
      { task_id: "t1", completed_at: "2026-10-21T13:00:00Z" },
      { task_id: "t1", completed_at: "2026-09-01T13:00:00Z" },
      { task_id: "t2", completed_at: "2026-10-28T13:00:00Z" },
    ];
    expect(routineStats(cs, "t1", "2026-10-29")).toEqual({ last30: 2, last: "2026-10-28" });
    expect(routineStats(cs, "t9", "2026-10-29")).toEqual({ last30: 0, last: null });
  });
});

describe("não repetir item da lista", () => {
  it("ignora o que já está faltando na lista, sem diferenciar maiúscula", () => {
    expect(
      withoutMissing(
        [
          { name: "Sabão em pó", quantity: "1" },
          { name: "café", quantity: null },
        ],
        ["sabão em pó", "leite"],
      ),
    ).toEqual([{ name: "café", quantity: null }]);
  });
});
