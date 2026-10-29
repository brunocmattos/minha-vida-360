import {
  Sun,
  Wallet,
  PawPrint,
  Briefcase,
  Palette,
  HeartPulse,
  Home,
  Car,
  Sparkles,
  BookOpen,
  Flower2,
  Users,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

export type Area = {
  slug: string;
  name: string;
  short: string;
  icon: LucideIcon;
  tone: "lavender" | "rose" | "cream" | "sage" | "sky" | "peach";
  description: string;
  planned: string[];
};

/** Áreas da vida (exceto "Meu Dia", que tem rota própria). */
export const AREAS: Area[] = [
  {
    slug: "diario",
    name: "Diário 360",
    short: "Diário",
    icon: NotebookPen,
    tone: "lavender",
    description: "Registro central de atividades e acontecimentos, de forma leve.",
    planned: [
      "Registros por data e área",
      "Categorias e sentimentos",
      "Histórico pesquisável",
      "Anexos futuros",
    ],
  },
  {
    slug: "financas",
    name: "Finanças",
    short: "Finanças",
    icon: Wallet,
    tone: "sage",
    description: "Receitas, despesas, cartões, metas e planejamento em R$.",
    planned: [
      "Receitas e despesas",
      "Cartões, dívidas e parcelamentos",
      "Calendário de vencimentos",
      "Metas de reserva e relatórios mensais",
    ],
  },
  {
    slug: "cachorros",
    name: "Meus Filhos",
    short: "Filhos",
    icon: PawPrint,
    tone: "peach",
    description: "Fichas do Dobby, da Zara e do Paco, com todos os cuidados.",
    planned: [
      "Ficha individual com foto",
      "Vacinas, vermífugos e antiparasitários",
      "Consultas e veterinários",
      "Próximas doses e despesas",
    ],
  },
  {
    slug: "carreira",
    name: "Carreira — Guarida",
    short: "Carreira",
    icon: Briefcase,
    tone: "sky",
    description: "Linha do tempo, PDI, competências e trilhas de aprendizado.",
    planned: [
      "PDI e competências",
      "Trilhas de SQL, APIs, Cloud e IA",
      "Entregas mensais e conquistas",
      "Cronômetro de estudos",
    ],
  },
  {
    slug: "desenvolvimento",
    name: "Desenvolvimento Profissional",
    short: "Desenvolvimento",
    icon: Palette,
    tone: "rose",
    description: "Figma, design gráfico, freelas e portfólio.",
    planned: [
      "Estudos de Figma e design",
      "Projetos freelancer",
      "Portfólio",
      "Progresso de cursos",
    ],
  },
  {
    slug: "saude",
    name: "Saúde",
    short: "Saúde",
    icon: HeartPulse,
    tone: "rose",
    description: "Bem-estar físico e emocional, com total privacidade.",
    planned: [
      "Humor diário e diário pós-terapia",
      "Consultas, exames e profissionais",
      "Alimentação e hidratação",
      "Atividades físicas",
    ],
  },
  {
    slug: "casa",
    name: "Casa",
    short: "Casa",
    icon: Home,
    tone: "cream",
    description: "Rotinas de limpeza, lista de compras e manutenções, com histórico.",
    planned: [
      "Tarefas recorrentes flexíveis",
      "Última execução e histórico",
      "Checklist de compras",
      "Alertas de pendências",
    ],
  },
  {
    slug: "carro",
    name: "Meu Carro",
    short: "Carro",
    icon: Car,
    tone: "sky",
    description: "Manutenções, documentação e planejamento do veículo.",
    planned: [
      "Cadastro do veículo",
      "Manutenções por prioridade de segurança",
      "IPVA e licenciamento",
      "Checklist de manutenção",
    ],
  },
  {
    slug: "autocuidado",
    name: "Autocuidado",
    short: "Autocuidado",
    icon: Sparkles,
    tone: "lavender",
    description: "Rotinas, skincare e pequenos cuidados com você.",
    planned: [
      "Rotinas matinal e noturna",
      "Skincare, cabelo, unhas e corpo",
      "Produtos e lista de compras",
      "Histórico de realização",
    ],
  },
  {
    slug: "intelecto",
    name: "Intelecto e Conhecimento",
    short: "Intelecto",
    icon: BookOpen,
    tone: "cream",
    description: "Biblioteca, leituras e reflexões.",
    planned: [
      "Biblioteca pessoal",
      "Meta de leitura",
      "Histórico de leituras",
      "Aprendizados e reflexões",
    ],
  },
  {
    slug: "espiritualidade",
    name: "Espiritualidade",
    short: "Espiritualidade",
    icon: Flower2,
    tone: "sage",
    description: "Práticas pessoais, orações e reflexões, com respeito.",
    planned: [
      "Hábitos espirituais",
      "Orações diárias",
      "Reflexões e compromissos",
      "Histórico de atividades",
    ],
  },
  {
    slug: "social",
    name: "Vida Social",
    short: "Social",
    icon: Users,
    tone: "peach",
    description: "Pessoas importantes, encontros e memórias.",
    planned: [
      "Pessoas importantes",
      "Encontros e passeios",
      "Visitas à Liz",
      "Memórias e fotografias",
    ],
  },
];

export const MEU_DIA = { name: "Meu Dia", icon: Sun };

export function getArea(slug: string) {
  return AREAS.find((a) => a.slug === slug);
}

export const TONE_BG: Record<Area["tone"], string> = {
  lavender: "bg-lavender",
  rose: "bg-rose",
  cream: "bg-cream",
  sage: "bg-sage",
  sky: "bg-sky",
  peach: "bg-peach",
};

const TZ = "America/Sao_Paulo";
export function formatDateLong(d = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}
export function greeting(d = new Date()) {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "numeric", hour12: false }).format(d),
  );
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
