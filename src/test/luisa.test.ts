import { describe, expect, it } from "vitest";
import { actionSummary, parseLuisaOutput, validateLuisaAction } from "@/lib/luisa";

describe("validateLuisaAction", () => {
  it("aceita despesa válida com descrição e valor", () => {
    const a = validateLuisaAction({
      type: "criar_despesa",
      description: "Mercado",
      amount: 120,
      date: "2026-10-17",
    });
    expect(a).toEqual({
      type: "criar_despesa",
      description: "Mercado",
      amount: 120,
      date: "2026-10-17",
      status: "pendente",
    });
  });

  it("rejeita despesa sem valor (Luísa deve perguntar)", () => {
    expect(validateLuisaAction({ type: "criar_despesa", description: "Mercado" })).toBeNull();
  });

  it("rejeita valor zero, negativo ou absurdo", () => {
    expect(validateLuisaAction({ type: "criar_despesa", description: "X", amount: 0 })).toBeNull();
    expect(validateLuisaAction({ type: "criar_despesa", description: "X", amount: -5 })).toBeNull();
    expect(
      validateLuisaAction({ type: "criar_despesa", description: "X", amount: 1e9 }),
    ).toBeNull();
  });

  it("rejeita data inválida mas mantém a ação sem data", () => {
    const a = validateLuisaAction({
      type: "criar_despesa",
      description: "Gasolina",
      amount: 150,
      date: "17/10/2026",
    });
    expect(a?.date).toBeUndefined();
  });

  it("aceita registro de diário com conteúdo", () => {
    const a = validateLuisaAction({ type: "registrar_diario", content: "Hoje foi um dia calmo." });
    expect(a?.type).toBe("registrar_diario");
    expect(a?.status).toBe("pendente");
  });

  it("rejeita diário vazio e tipos desconhecidos", () => {
    expect(validateLuisaAction({ type: "registrar_diario", content: "   " })).toBeNull();
    expect(validateLuisaAction({ type: "atualizar_vacina" })).toBeNull();
    expect(validateLuisaAction(null)).toBeNull();
    expect(validateLuisaAction("texto")).toBeNull();
  });
});

describe("parseLuisaOutput", () => {
  it("extrai reply e action", () => {
    const r = parseLuisaOutput({
      reply: "Preparei o registro, confirma?",
      action: { type: "criar_despesa", description: "Mercado", amount: 120 },
    });
    expect(r.reply).toContain("confirma");
    expect(r.action?.type).toBe("criar_despesa");
  });

  it("nunca lança com saída quebrada", () => {
    expect(parseLuisaOutput(undefined).reply).toBeTruthy();
    expect(parseLuisaOutput({}).action).toBeNull();
  });
});

describe("actionSummary", () => {
  it("formata despesa em BRL pt-BR", () => {
    const s = actionSummary({
      type: "criar_despesa",
      description: "Mercado",
      amount: 120,
      status: "pendente",
    });
    expect(s).toContain("Mercado");
    expect(s).toContain("120,00");
  });
});
