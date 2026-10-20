import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarHeart,
  CheckCircle2,
  ListTodo,
  Moon,
  NotebookPen,
  Star,
  Sunrise,
  HeartHandshake,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SectionCard, EmptyNote, SoftCard } from "@/components/cards";
import { TaskChecklist } from "@/components/task-checklist";
import { AREAS, TONE_BG, formatDateLong, greeting } from "@/lib/areas";

export const Route = createFileRoute("/_authenticated/meu-dia")({
  head: () => ({
    meta: [
      { title: "Meu Dia — Minha Vida 360" },
      { name: "description", content: "Tarefas e organização pessoal em seu espaço privado." },
      { property: "og:title", content: "Meu Dia — Minha Vida 360" },
      {
        property: "og:description",
        content: "Tarefas e organização pessoal em seu espaço privado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeuDia,
});

function MeuDia() {
  const { user } = Route.useRouteContext();
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const name = (meta["full_name"] || meta["name"] || "").split(" ")[0];
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  return (
    <div className="space-y-6">
      <div className="border-b pb-6 pt-2">
        <p className="text-sm font-semibold capitalize text-secondary-foreground/80">
          {now ? formatDateLong(now) : "\u00a0"}
        </p>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">
          {now ? greeting(now) : "Olá"}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-2 max-w-md text-secondary-foreground/80">
          Um passo de cada vez. O que fizer hoje já conta.
        </p>
        <Link
          to="/area/$slug"
          params={{ slug: "diario" }}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:shadow-lift"
        >
          <NotebookPen className="size-4" /> Abrir Diário 360
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard icon={Star} title="Prioridades com carinho" tone="bg-rose">
          <EmptyNote>Nenhuma prioridade cadastrada ainda.</EmptyNote>
        </SectionCard>
        <SectionCard icon={CheckCircle2} title="Checklist do dia" tone="bg-sage">
          <TaskChecklist />
        </SectionCard>
        <SectionCard icon={Sunrise} title="Hábitos da manhã" tone="bg-cream">
          <EmptyNote>A definir.</EmptyNote>
        </SectionCard>
        <SectionCard icon={Moon} title="Hábitos da noite" tone="bg-lavender">
          <EmptyNote>A definir.</EmptyNote>
        </SectionCard>
        <SectionCard icon={ListTodo} title="Tarefas pendentes" tone="bg-sky">
          <EmptyNote>Sem tarefas pendentes registradas.</EmptyNote>
        </SectionCard>
        <SectionCard icon={CalendarHeart} title="Próximos compromissos" tone="bg-peach">
          <EmptyNote>Nenhum compromisso registrado.</EmptyNote>
        </SectionCard>
      </div>

      <SectionCard icon={HeartHandshake} title="Cuidados por área">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {AREAS.map((a) => (
            <Link
              key={a.slug}
              to="/area/$slug"
              params={{ slug: a.slug }}
              className="group flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl ${TONE_BG[a.tone]}`}
              >
                <a.icon className="size-4 text-secondary-foreground" />
              </span>
              <span className="text-sm font-semibold leading-tight">{a.short}</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SoftCard className="bg-muted/50 text-sm text-muted-foreground">
        Esta é a primeira versão. Nenhum dado fictício é exibido — tudo aqui será preenchido por
        você.
      </SoftCard>
    </div>
  );
}
