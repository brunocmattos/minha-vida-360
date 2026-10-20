import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Minha Vida 360" },
      {
        name: "description",
        content: "Organização pessoal acolhedora: tarefas, finanças, saúde, casa e muito mais.",
      },
      { property: "og:title", content: "Minha Vida 360" },
      {
        property: "og:description",
        content: "Organização pessoal acolhedora para todas as áreas da vida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/casa" });
  },
});
