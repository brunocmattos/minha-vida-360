import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { getArea, TONE_BG } from "@/lib/areas";
import { SoftCard } from "@/components/cards";
import { FinanceModule } from "@/components/finance-module";
import { PetsModule } from "@/components/pets-module";
import { DiaryModule } from "@/components/diary-module";
import { CasaModule } from "@/components/casa-module";
import { RoomScene, roomFor } from "@/components/room-scene";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/area/$slug")({
  validateSearch: (s: Record<string, unknown>): { comodo?: string } =>
    typeof s["comodo"] === "string" ? { comodo: s["comodo"] as string } : {},
  loader: ({ params }) => {
    const area = getArea(params.slug);
    if (!area) throw notFound();
    return { slug: area.slug };
  },
  head: ({ loaderData }) => {
    const a = loaderData ? getArea(loaderData.slug) : undefined;
    const title = a ? pageTitle(a.name) : pageTitle("Área");
    const description = a?.description ?? "Seu espaço privado de organização pessoal.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Área não encontrada</h1>
      <Link to="/meu-dia" className="mt-4 inline-block font-semibold text-primary">
        Voltar para Meu Dia
      </Link>
    </div>
  ),
  component: AreaPage,
});

function AreaPage() {
  const { slug } = Route.useLoaderData();
  const { comodo } = Route.useSearch();
  const area = getArea(slug);
  if (!area) return null;
  const Icon = area.icon;
  const room = roomFor(slug, comodo);
  const header = (
    <div className="flex items-start gap-4">
      <span
        className={`grid size-14 shrink-0 place-items-center rounded-3xl shadow-soft ${TONE_BG[area.tone]}`}
      >
        <Icon className="size-6 text-secondary-foreground" />
      </span>
      <div>
        <h1 className="text-3xl font-semibold md:text-4xl">{area.name}</h1>
        <p className="mt-1 text-muted-foreground">{area.description}</p>
      </div>
    </div>
  );
  const body =
    slug === "financas" ? (
      <FinanceModule />
    ) : slug === "cachorros" ? (
      <PetsModule />
    ) : slug === "diario" ? (
      <DiaryModule />
    ) : slug === "casa" ? (
      <CasaModule />
    ) : (
      <SoftCard>
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
          <Hammer className="size-4" /> Em construção — será desenvolvida nas próximas etapas
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {area.planned.map((p) => (
            <li key={p} className="rounded-2xl bg-muted/70 px-4 py-3 text-sm">
              {p}
            </li>
          ))}
        </ul>
      </SoftCard>
    );
  return (
    <div className="space-y-6">
      <BackButton />
      {slug === "cachorros" ? (
        body
      ) : room ? (
        <RoomScene room={room} title={area.short}>
          <div className="space-y-6">
            {header}
            {body}
          </div>
        </RoomScene>
      ) : (
        <>
          {header}
          {body}
        </>
      )}
    </div>
  );
}
