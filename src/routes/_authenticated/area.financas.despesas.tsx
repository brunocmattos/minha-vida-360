import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FinanceModule } from "@/components/finance-module";
export const Route = createFileRoute("/_authenticated/area/financas/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — Minha Vida 360" },
      { name: "description", content: "Despesas no seu espaço financeiro privado." },
      { property: "og:title", content: "Despesas — Minha Vida 360" },
      { property: "og:description", content: "Organização financeira pessoal privada: Despesas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinanceScreen,
});
function FinanceScreen() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <>
      <h1 className="text-2xl font-semibold">Despesas</h1>
      <FinanceModule
        page="despesas"
        selectedMonth={search.mes ? `${search.mes}-01` : undefined}
        onMonthChange={(m) =>
          navigate({ to: ".", search: { mes: m.slice(0, 7) }, replace: true, resetScroll: false })
        }
      />
    </>
  );
}
