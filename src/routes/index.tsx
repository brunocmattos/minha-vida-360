import { createFileRoute, redirect } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: APP_NAME },
      {
        name: "description",
        content: "Organização pessoal acolhedora: tarefas, finanças, saúde, casa e muito mais.",
      },
      { property: "og:title", content: APP_NAME },
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
