import { describe, expect, it } from "vitest";
import { careStatus, careScheduleDate } from "@/lib/pet-care";

describe("Cuidados sem inferir aplicações", () => {
  it("vacina vencida permanece pendência, sem data de aplicação ou validade inferida", () => {
    const care = { overdue_since: "2026-08-18", done_date: null, next_date: null };
    expect(careStatus(care, "2026-10-17")).toBe("regularizar");
    expect(careScheduleDate(care)).toBe("2026-08-18");
    expect(care.done_date).toBeNull();
  });
  it("próxima dose de Endogard é previsão separada da aplicação", () => {
    expect(
      careStatus(
        { overdue_since: null, done_date: "2026-10-12", next_date: "2026-10-27" },
        "2026-10-17",
      ),
    ).toBe("previsto");
  });
  it("Bravecto previsto não representa aplicação", () => {
    const care = { overdue_since: null, done_date: null, next_date: "2026-11-05" };
    expect(careStatus(care, "2026-10-17")).toBe("previsto");
    expect(care.done_date).toBeNull();
  });
  it("previsão passada fica atrasada sem marcar realização", () => {
    expect(
      careStatus({ overdue_since: null, done_date: null, next_date: "2026-10-27" }, "2026-10-28"),
    ).toBe("atrasado");
  });
});
