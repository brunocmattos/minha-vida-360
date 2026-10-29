import { createFileRoute } from "@tanstack/react-router";
import { HouseCasa } from "@/components/house-casa";
import { formatDateLong, greeting } from "@/lib/areas";
import { useEffect, useState } from "react";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/casa")({
  head: () => ({
    meta: [
      { title: pageTitle("Minha Casa") },
      {
        name: "description",
        content: "Sua casa em corte transversal: cada cômodo abre uma área da sua vida.",
      },
      { property: "og:title", content: pageTitle("Minha Casa") },
      {
        property: "og:description",
        content: "Sua casa em corte transversal: cada cômodo abre uma área da sua vida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CasaPage,
});

function CasaPage() {
  const { user } = Route.useRouteContext();
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const name = (meta["full_name"] || meta["name"] || "").split(" ")[0];
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  return (
    <div className="space-y-6">
      <div className="border-b pb-5 pt-2">
        <p className="text-sm font-semibold capitalize text-muted-foreground">
          {now ? formatDateLong(now) : " "}
        </p>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">
          {now ? greeting(now) : "Olá"}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">Bem-vinda à sua casa.</p>
      </div>

      <HouseCasa />
    </div>
  );
}
