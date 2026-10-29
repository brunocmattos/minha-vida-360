import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FinanceModule } from "@/components/finance-module";
import { pageTitle } from "@/lib/brand";
export const Route = createFileRoute("/_authenticated/area/financas/dividas")({
  head: () => ({
    meta: [
      { title: pageTitle("Dívidas · SPC/Serasa") },
      { name: "description", content: "Dívidas · SPC/Serasa no seu espaço financeiro privado." },
      { property: "og:title", content: pageTitle("Dívidas · SPC/Serasa") },
      {
        property: "og:description",
        content: "Organização financeira pessoal privada: Dívidas · SPC/Serasa.",
      },
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
      <h1 className="text-2xl font-semibold">Dívidas · SPC/Serasa</h1>
      <FinanceModule
        page="dividas"
        selectedMonth={search.mes ? `${search.mes}-01` : undefined}
        onMonthChange={(m) =>
          navigate({ to: ".", search: { mes: m.slice(0, 7) }, replace: true, resetScroll: false })
        }
      />
    </>
  );
}
