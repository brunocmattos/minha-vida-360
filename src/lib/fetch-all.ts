// O Supabase devolve no máximo 1000 linhas por requisição e corta o resto sem avisar.
// Busca página por página até acabar. A consulta precisa de ordem estável (ex.: .order("id")).
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  size = 1000,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < size) return all;
  }
}
