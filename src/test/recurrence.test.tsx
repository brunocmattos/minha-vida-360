import { describe, expect, it } from "vitest";
import { nextDueDate } from "@/lib/recurrence";

describe("nextDueDate", () => {
  it("não recorrente não tem próxima data", () =>
    expect(nextDueDate("none", "2026-10-16")).toBeNull());
  it("diária avança 1 dia", () => expect(nextDueDate("daily", "2026-10-31")).toBe("2026-11-01"));
  it("dia sim dia não avança 2 dias a partir da execução", () =>
    expect(nextDueDate("alternate", "2026-10-16")).toBe("2026-10-18"));
  it("semanal avança 7 dias", () => expect(nextDueDate("weekly", "2026-12-28")).toBe("2027-01-04"));
  it("mensal respeita fim de mês", () =>
    expect(nextDueDate("monthly", "2026-01-31")).toBe("2026-02-28"));
  it("mensal volta ao dia original depois de um mês curto", () => {
    expect(nextDueDate("monthly", "2026-02-28", 31)).toBe("2026-03-31");
    expect(nextDueDate("monthly", "2026-12-20", 15)).toBe("2027-01-15");
  });
});
