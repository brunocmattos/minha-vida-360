import { describe, expect, it } from "vitest";
import {
  actionSummary,
  cleanDate,
  expensePayment,
  parseLuisaContent,
  validateLuisaAction,
} from "@/lib/luisa";

const despesa = { type: "criar_despesa", description: "Mercado", amount: 120 };

describe("status guardado (B3)", () => {
  it("saída nova do modelo sempre vira pendente, mesmo se o modelo mandar outro status", () => {
    expect(validateLuisaAction({ ...despesa, status: "confirmada" })?.status).toBe("pendente");
  });

  it("ação lida do banco mantém o status salvo", () => {
    expect(validateLuisaAction({ ...despesa, status: "confirmada" }, true)?.status).toBe(
      "confirmada",
    );
    expect(validateLuisaAction({ ...despesa, status: "cancelada" }, true)?.status).toBe(
      "cancelada",
    );
  });

  it("status ausente ou inválido no banco cai para pendente", () => {
    expect(validateLuisaAction(despesa, true)?.status).toBe("pendente");
    expect(validateLuisaAction({ ...despesa, status: "xyz" }, true)?.status).toBe("pendente");
  });
});

describe("cleanDate", () => {
  it("aceita datas reais, inclusive 29/02 de ano bissexto", () => {
    expect(cleanDate("2026-10-17")).toBe("2026-10-17");
    expect(cleanDate("2028-02-29")).toBe("2028-02-29");
  });

  it("rejeita datas impossíveis que o JS 'rola' para o mês seguinte", () => {
    expect(cleanDate("2026-02-31")).toBeUndefined();
    expect(cleanDate("2027-02-29")).toBeUndefined();
    expect(cleanDate("2026-04-31")).toBeUndefined();
    expect(cleanDate("2026-13-01")).toBeUndefined();
  });

  it("rejeita formato errado e tipos não-string", () => {
    expect(cleanDate("17/10/2026")).toBeUndefined();
    expect(cleanDate(20261017)).toBeUndefined();
  });
});

describe("expensePayment (data futura = prevista)", () => {
  const today = "2026-10-20";
  it("hoje ou passado: paga na própria data", () => {
    expect(expensePayment(50, "2026-10-20", today)).toEqual({
      paid: true,
      amount_paid: 50,
      paid_date: "2026-10-20",
    });
    expect(expensePayment(50, "2026-10-01", today).paid).toBe(true);
  });

  it("futuro: prevista, sem pagamento", () => {
    expect(expensePayment(200, "2026-10-21", today)).toEqual({
      paid: false,
      amount_paid: 0,
      paid_date: null,
    });
  });

  it("o resumo diz se é paga ou prevista e mostra o diário inteiro", () => {
    const base = {
      type: "criar_despesa",
      description: "Luz",
      amount: 10,
      status: "pendente",
    } as const;
    expect(actionSummary({ ...base, date: "2026-10-25" }, today)).toContain("(prevista)");
    expect(actionSummary({ ...base, date: "2026-10-19" }, today)).toContain("(paga)");
    expect(actionSummary(base, today)).toContain("(paga)");
    const long = "a".repeat(300);
    expect(
      actionSummary({ type: "registrar_diario", content: long, status: "pendente" }, today),
    ).toContain(long);
  });
});

describe("parseLuisaContent", () => {
  it("interpreta JSON válido com ação", () => {
    const r = parseLuisaContent(
      JSON.stringify({ reply: "Confirma?", action: { ...despesa, date: "2026-10-17" } }),
    );
    expect(r.reply).toBe("Confirma?");
    expect(r.action?.status).toBe("pendente");
  });

  it("conteúdo vazio, ausente ou só espaços → resposta amigável, sem ação", () => {
    for (const c of ["", "   ", null, undefined, 42]) {
      const r = parseLuisaContent(c);
      expect(r.reply).toMatch(/Tente de novo/);
      expect(r.action).toBeNull();
    }
  });

  it("JSON inválido ou truncado → resposta amigável, sem lançar", () => {
    expect(parseLuisaContent('{"reply":"oi","action":{"type":').action).toBeNull();
    expect(parseLuisaContent("não é json").reply).toMatch(/Tente de novo/);
  });

  it("JSON que não é objeto cai na resposta padrão do parseLuisaOutput", () => {
    expect(parseLuisaContent("[1,2]").action).toBeNull();
    expect(parseLuisaContent("null").reply).toBeTruthy();
  });
});
