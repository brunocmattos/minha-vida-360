import { describe, expect, it } from "vitest";
import { actionSummary, validateLuisaAction } from "@/lib/luisa";

const ID = "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

describe("Luísa · tarefas", () => {
  it("cria tarefa com data, área e repetição válidas", () => {
    expect(
      validateLuisaAction({
        type: "criar_tarefa",
        title: "Trocar a roupa de cama",
        date: "2026-10-31",
        area_slug: "casa",
        recurrence: "weekly",
      }),
    ).toEqual({
      type: "criar_tarefa",
      title: "Trocar a roupa de cama",
      date: "2026-10-31",
      area_slug: "casa",
      recurrence: "weekly",
      status: "pendente",
    });
  });
  it("descarta área e repetição desconhecidas, mas mantém a tarefa", () => {
    const a = validateLuisaAction({
      type: "criar_tarefa",
      title: "Ligar pro encanador",
      area_slug: "garagem",
      recurrence: "toda hora",
    });
    expect(a?.area_slug).toBeUndefined();
    expect(a?.recurrence).toBe("none");
  });
  it("tarefa sem título não é gravável", () => {
    expect(validateLuisaAction({ type: "criar_tarefa", title: "  " })).toBeNull();
  });
  it("concluir aceita o id de uma tarefa existente ou só o título (registra como feito)", () => {
    expect(
      validateLuisaAction({ type: "concluir_tarefa", title: "Limpar a cozinha", task_id: ID }),
    ).toMatchObject({ task_id: ID, title: "Limpar a cozinha" });
    const solto = validateLuisaAction({
      type: "concluir_tarefa",
      title: "Limpei o banheiro",
      task_id: "nao-e-uuid",
      area_slug: "casa",
    });
    expect(solto?.task_id).toBeUndefined();
    expect(solto?.area_slug).toBe("casa");
  });
});

describe("Luísa · lista de compras", () => {
  it("aceita itens como texto ou objeto, com quantidade", () => {
    expect(
      validateLuisaAction({
        type: "adicionar_compra",
        items: ["sabão em pó", { name: "leite", quantity: "2" }, "  "],
      }),
    ).toEqual({
      type: "adicionar_compra",
      items: [
        { name: "sabão em pó", quantity: null },
        { name: "leite", quantity: "2" },
      ],
      status: "pendente",
    });
  });
  it("sem nenhum item válido não é gravável", () => {
    expect(validateLuisaAction({ type: "adicionar_compra", items: [] })).toBeNull();
    expect(validateLuisaAction({ type: "adicionar_compra", items: "arroz" })).toMatchObject({
      items: [{ name: "arroz", quantity: null }],
    });
  });
});

describe("Luísa · resumo para confirmar", () => {
  it("descreve cada ação nova", () => {
    const t = validateLuisaAction({
      type: "criar_tarefa",
      title: "Trocar a roupa de cama",
      date: "2026-10-31",
      recurrence: "weekly",
    })!;
    expect(actionSummary(t)).toBe(
      "Tarefa: Trocar a roupa de cama — 31/10/2026 — Semanal (flexível)",
    );
    const c = validateLuisaAction({ type: "concluir_tarefa", title: "Limpar a cozinha" })!;
    expect(actionSummary(c)).toBe("Feito: Limpar a cozinha");
    const s = validateLuisaAction({ type: "adicionar_compra", items: ["arroz", "2 leite"] })!;
    expect(actionSummary(s)).toBe("Lista de compras: arroz, leite (2)");
  });
});
