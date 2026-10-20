import { describe, expect, it } from "vitest";
import { fetchAllRows } from "@/lib/fetch-all";

const rows = Array.from({ length: 2500 }, (_, i) => i);
const pager = (from: number, to: number) =>
  Promise.resolve({ data: rows.slice(from, to + 1), error: null });

describe("fetchAllRows", () => {
  it("junta todas as páginas além do limite de 1000", async () => {
    expect(await fetchAllRows(pager)).toEqual(rows);
  });
  it("para quando a página exata termina vazia", async () => {
    const exact = (from: number, to: number) =>
      Promise.resolve({ data: rows.slice(0, 2000).slice(from, to + 1), error: null });
    expect((await fetchAllRows(exact)).length).toBe(2000);
  });
  it("propaga erro em vez de devolver lista parcial", async () => {
    const failing = () => Promise.resolve({ data: null, error: new Error("rede") });
    await expect(fetchAllRows(failing)).rejects.toThrow("rede");
  });
});
