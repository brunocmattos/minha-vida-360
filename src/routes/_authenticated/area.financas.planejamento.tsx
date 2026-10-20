import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FinanceModule } from "@/components/finance-module";
export const Route = createFileRoute("/_authenticated/area/financas/planejamento")({
 head:()=>({meta:[{title:"Planejamento anual — Minha Vida 360"},{name:"description",content:"Planejamento anual no seu espaço financeiro privado."},{property:"og:title",content:"Planejamento anual — Minha Vida 360"},{property:"og:description",content:"Organização financeira pessoal privada: Planejamento anual."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),
 component: FinanceScreen,
});
function FinanceScreen(){const search=Route.useSearch();const navigate=useNavigate({from:Route.fullPath});return <><h1 className="text-2xl font-semibold">Planejamento anual</h1><FinanceModule page="planejamento" selectedMonth={search.mes?`${search.mes}-01`:undefined} onMonthChange={m=>navigate({to:".",search:{mes:m.slice(0,7)},replace:true,resetScroll:false})}/></>;}
