import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClientOnly } from "@tanstack/react-router";
import { formatBRL, monthLabel, summarizeMonth, type Entry } from "@/lib/finance";

/** Presentation only: use the same bank-only summary as the wallet. */
export function FinanceChart({ entries, month }: { entries: Entry[]; month: string }) {
  const s = summarizeMonth(entries, month);
  const data = [
    { name: "Receitas", previsto: s.plannedIn, confirmado: s.realizedIn },
    { name: "Despesas", previsto: s.plannedOut, confirmado: s.realizedOut },
  ];
  return (
    <section aria-label="Receitas versus despesas" className="fin-surface p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Receitas e despesas</h2>
          <p className="mt-1 text-xs capitalize text-muted-foreground">
            {monthLabel(month)} · conta corrente
          </p>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted-foreground" />
            Previsto
          </p>
          <p className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            Confirmado
          </p>
        </div>
      </div>
      <div className="mt-5 h-56 min-w-0" aria-hidden="true">
        <ClientOnly fallback={<div className="h-full bg-muted/20 rounded-lg" />}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              barGap={8}
              barSize={32}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 6"
                opacity={0.45}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                width={54}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(Number(v))
                }
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="fin-surface p-3 text-xs shadow-soft">
                      <p className="mb-2 font-semibold">{label}</p>
                      {payload.map((p) => (
                        <p key={p.dataKey} className="py-1 text-muted-foreground">
                          {p.dataKey === "previsto"
                            ? "Previsto"
                            : label === "Receitas"
                              ? "Recebido"
                              : "Pago"}
                          :{" "}
                          <span className={label === "Receitas" ? "text-income" : "text-expense"}>
                            {formatBRL(Number(p.value))}
                          </span>
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Bar
                dataKey="previsto"
                fill="var(--muted-foreground)"
                fillOpacity={0.45}
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="confirmado"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
      <dl className="mt-5 grid gap-4 border-t border-border/50 pt-4 sm:grid-cols-2">
        {data.map((d) => (
          <div key={d.name} className="min-w-0">
            <dt className="text-sm font-medium">{d.name}</dt>
            <dd className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <span>
                Previsto
                <strong
                  className={`mt-1 block text-sm font-medium tabular-nums ${d.name === "Receitas" ? "text-income" : "text-expense"}`}
                >
                  {formatBRL(d.previsto)}
                </strong>
              </span>
              <span>
                {d.name === "Receitas" ? "Recebido" : "Pago"}
                <strong
                  className={`mt-1 block text-sm font-medium tabular-nums ${d.name === "Receitas" ? "text-income" : "text-expense"}`}
                >
                  {formatBRL(d.confirmado)}
                </strong>
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
