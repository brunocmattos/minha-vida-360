---
tipo: projeto
cliente: tayane
produto: Minha Vida 360
no_ar: não
atividade: ativo
stack: ["TanStack Start", "React 19", "Supabase", "Tailwind 4", "Vercel"]
ultima_atividade: 2026-10-20
proxima_acao: "Bruno: seguir docs/SETUP.md (export dos dados, Supabase, GitHub, Vercel)"
repo: git-local
tags: [pessoal, lovable-export, vercel, supabase]
---

# Minha Vida 360

## Estado atual

Código pronto para Vercel + Supabase próprio, **sem dependência do Lovable**. Em 2026-10-20:
69 testes, TypeScript e lint (0 erros) passando; build da Vercel validado; app testado em modo
produção contra um Supabase local; scripts de export/import de dados testados ponta a ponta.
**Ainda não está no ar** — falta o que precisa das contas/senha deles: [docs/SETUP.md](docs/SETUP.md).
Os dados reais da Tayane continuam no banco do Lovable até o passo 3 do SETUP.
Problemas abertos e resolvidos: [docs/ACHADOS.md](docs/ACHADOS.md). Plano: [docs/ROADMAP.md](docs/ROADMAP.md).

## O que é

App pessoal da Tayane para organizar a vida: uma casa ilustrada onde cada cômodo abre uma área
(finanças, filhos/pets, diário, saúde, carreira…), checklist do dia e a assistente Luísa (chat com IA
que registra despesas e diário, sempre pedindo confirmação).

## Stack & como rodar

TanStack Start (React 19, SSR via Nitro) · Vite 8 · Tailwind 4 · Supabase (auth + Postgres + RLS) ·
migrations SQL via drizzle-kit · bun (`bun.lock` é a fonte das versões; Node 22).

```bash
npx -y bun install --frozen-lockfile        # dependências exatas do lockfile
npx vitest run                              # testes (69)
node node_modules/typescript/bin/tsc --noEmit
npx eslint .                                # 0 erros esperados
npx vite build                              # build Vercel → .vercel/output (NITRO_PRESET=node-server para Node)
```

Rodar contra um banco **local e descartável** (recomendado para testar):

```bash
npx supabase start -x studio,storage-api,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres node node_modules/drizzle-kit/bin.cjs migrate
node scripts/local-supabase.mjs seed        # cria o usuário de teste (login: "teste")
node scripts/local-supabase.mjs dev         # app em http://localhost:8080 apontando pro banco local
```

`npx vite dev` puro usa o `.env`, que hoje aponta para o **banco real** do Lovable.

## Estrutura

- `src/routes/` — páginas (rotas por arquivo). `_authenticated/` exige login. `casa.tsx` é a home.
- `src/components/` — módulos de tela: `finance-*.tsx`, `pets-module.tsx`, `task-checklist.tsx`,
  `diary-module.tsx`, `luisa-chat.tsx`, `house-casa.tsx` (casa em SVG), `room-scene.tsx`.
  `components/ui/` tem só `button` e `dialog` (shadcn; adicione outros com `npx shadcn add` se precisar).
- `src/lib/` — regras de negócio puras e testadas (`finance.ts`, `finance-balances.ts`,
  `recurrence.ts`, `pet-care.ts`, `luisa.ts`), `areas.ts` (as 12 áreas da vida) e `fetch-all.ts`.
- `src/lib/luisa.functions.ts` — **única** função de servidor (chamada de IA + gravação confirmada).
- `src/styles.css` — cores e tema (tokens OKLCH), paleta da casa, tema por cômodo.
- `src/assets/pets/` — ilustrações dos pets.
- `drizzle/migrations/` — esquema do banco (17 tabelas, todas com RLS por `owner_id`). Fonte da verdade do schema.
- `scripts/` — `local-supabase.mjs` (dev local), `export-data.mjs` / `import-data.mjs` (mudar de banco).
- `.github/workflows/backup.yml` — backup do banco a cada 3 dias (precisa do segredo `DATABASE_URL`).
- `src/test/` — testes Vitest.

### Quando quem pede a mudança é a Tayane

Ela não é desenvolvedora e usa o Claude Code (muitas vezes pelo celular). Então:

- Explique em português simples, sem jargão; mostre o resultado, não o código.
- Mudanças visuais (cor, foto, texto, nome) são o caso comum: prefira editar `src/styles.css`,
  `src/lib/areas.ts` e imagens, sem mexer em lógica.
- Trabalhe sempre num branch, nunca direto no principal; a Vercel gera um link de prévia por branch
  para ela conferir no celular antes de publicar.
- Rode os testes antes de dizer que terminou.
- **Nunca** altere migrations, apague dados ou mude regras de acesso (RLS) sem ela confirmar
  explicitamente o que vai acontecer com os dados dela.

## Ambiente & acessos

- Variáveis do app (Vercel / `.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`; Luísa: `LLM_API_KEY` (+ opcionais `LLM_BASE_URL`,
  padrão `https://api.deepseek.com`, e `LLM_MODEL`, padrão `deepseek-flash`).
- Migrations e backup: `DATABASE_URL` (connection string "Session pooler" do Supabase).
- `SUPABASE_SERVICE_ROLE_KEY` **não** é usada pelo app — não configurar na Vercel.
- Supabase antigo (Lovable, **dados reais** até a migração): projeto `veqjplvuafhdnqrccibt`.
- O `.env` é segredo: nunca commitar. Chaves do `scripts/local-supabase.mjs` são as de demonstração do
  Supabase CLI (só funcionam em 127.0.0.1).

## Decisões & gotchas

- **Login é por nome**: "tayane" vira `tayane@minhavida360.app` (`usernameToEmail` em `src/routes/auth.tsx`).
  É um e-mail falso, então "esqueci a senha" por e-mail não funciona; redefinir pelo painel do Supabase.
- **Toda segurança dos dados é o RLS**: o navegador fala direto com o Supabase. Toda tabela nova precisa
  de `owner_id uuid not null default auth.uid()` e policies `owner_id = auth.uid()` com `WITH CHECK`,
  e entra em `scripts/tables.mjs` (export/import).
- **Consultas que crescem usam `fetchAllRows`** com ordem estável: o Supabase corta em 1000 linhas sem avisar.
- **Valor previsto editado à mão** (`fin_entries.amount_manual`) não é recalculado pela fórmula do repasse.
- **Luísa** fala com qualquer provedor compatível com OpenAI (chat completions, modo JSON). O modelo só
  propõe; gravar exige confirmação, reservada de forma atômica (`action->>status = 'pendente'`).
- **Dados não estão no repo**: perfis dos pets, recorrências, contracheques e dívidas existem só no
  banco; não há tela para criar perfil de pet nem contracheque. Backup = workflow `backup`.
- **4 imagens da página Meus Filhos** (`src/assets/pets/*.asset.json`) ainda apontam para o CDN do
  Lovable — ver ACHADOS A2.
- `AGENTS.md` tem as decisões de design de domínio; `roadmap.md` é o histórico do Lovable.
- npm trava na máquina do Bruno por `cafile` do Kaspersky no `~/.npmrc` (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`);
  use bun com `--cafile=<bundle com os CAs do Node + o do Kaspersky>`.

## Backlog

Plano completo em [docs/ROADMAP.md](docs/ROADMAP.md). Resumo:

- [ ] Fase 1 — pôr no ar: seguir [docs/SETUP.md](docs/SETUP.md) (contas, export/import, Vercel) + 4 imagens (A2)
- [x] Fase 2 — consertos 🔴/🟠 que não dependem das contas (ver ACHADOS)
- [ ] Fase 3 — deixar fácil de mudar (tema/conteúdo/imagens num lugar só)
- [ ] Fase 4 — Luísa: criar a chave DeepSeek e validar com uso real
- [ ] Fase 5 — mapa/mini-jogo das áreas da vida
