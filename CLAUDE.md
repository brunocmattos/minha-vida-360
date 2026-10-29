---
tipo: projeto
cliente: tayane
produto: comtay
dominio: pessoal
no_ar: não
atividade: ativo
stack: ["TanStack Start", "React 19", "Supabase", "Tailwind 4", "Vercel"]
ultima_atividade: 2026-10-29
proxima_acao: "Tayane: seguir docs/COMO-CONTINUAR.md (receber o repo, colocar no ar pelo SETUP, depois Carro e Saúde)"
repo: git+remote
tags: [pessoal, lovable-export, vercel, supabase]
---

# comtay (ex-Minha Vida 360)

## Estado atual

**2026-10-29 — projeto passado pra Tayane.** Ela continua com o Claude Code dela; guia passo a passo
em [docs/COMO-CONTINUAR.md](docs/COMO-CONTINUAR.md). Quem decide produto é ela; siga a intenção dela em
[docs/RESPOSTAS-TAYANE.md](docs/RESPOSTAS-TAYANE.md).

**2026-10-23 — entrevista com a Tayane respondida** ([docs/RESPOSTAS-TAYANE.md](docs/RESPOSTAS-TAYANE.md)):
o app passa a se chamar **comtay** (domínio pretendido comtay.com.br), a Luísa vira o centro (registrar
e analisar tudo conversando) e a visão de longo prazo é um mundo tipo jogo com a personagem dela.
Plano refeito em [docs/ROADMAP.md](docs/ROADMAP.md). **Trava:** ela não respondeu 1.1–1.4 (contas,
senha atual, dia da mudança, grátis/pago), sem as quais o SETUP não anda.

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
  `casa-module.tsx` (área Casa), `diary-module.tsx`, `luisa-chat.tsx`, `house-casa.tsx` (casa em SVG),
  `room-scene.tsx`.
  `components/ui/` tem só `button` e `dialog` (shadcn; adicione outros com `npx shadcn add` se precisar).
- `src/lib/` — regras de negócio puras e testadas (`finance.ts`, `finance-balances.ts`,
  `recurrence.ts`, `pet-care.ts`, `payslip.ts`, `casa.ts`, `luisa.ts`), `areas.ts` (as 12 áreas da
  vida) e `fetch-all.ts`.
- `src/lib/luisa.functions.ts` — **única** função de servidor (chamada de IA + gravação confirmada).
- `src/styles.css` — cores e tema (tokens OKLCH), paleta da casa, tema por cômodo.
- `src/assets/pets/` — ilustrações dos pets.
- `drizzle/migrations/` — esquema do banco (19 tabelas, todas com RLS por `owner_id`). Fonte da verdade do schema.
- `scripts/` — `local-supabase.mjs` (dev local), `export-data.mjs` / `import-data.mjs` (mudar de banco).
- `.github/workflows/backup.yml` — backup diário do banco (precisa do segredo `DATABASE_URL`).
- `src/lib/brand.ts` — nome do app (`APP_NAME`), títulos de página e o domínio do login por nome.
- `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` — app instalável (PWA). O service worker
  não guarda cache de dados, só mostra o aviso de "sem internet".
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

- Repositório: `minha-vida-360` (privado, branch `main`). Hoje em `brunocmattos`, a ser transferido pra
  conta da Tayane. Cópia com o histórico inteiro do antigo `brunooutcore/minha-vida-360`, que não é mais usado.
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
  banco; não há tela para criar perfil de pet (contracheque e saldo inicial já têm cadastro/edição:
  `finance-extra.tsx`, `fin_openings`). Backup = workflow `backup`.
- **Intenção da Tayane** está em `docs/RESPOSTAS-TAYANE.md`: consultar antes de decidir produto/UX.
  Ela autorizou a Luísa a ler **todas** as áreas (inclusive diário, saúde, espiritualidade) e o Bruno
  a ver os dados reais pra testar.
- **Toda área nova nasce com 3 peças**: tela + ações da Luísa ("propõe → confirma") + histórico.
- **Fotos ficam em `public/images/`**: trocar o arquivo mantendo o nome troca a foto no app.
- `AGENTS.md` tem as decisões de design de domínio; `roadmap.md` é o histórico do Lovable.
- **Sessões na nuvem (Claude Code web):** não há `.env` de propósito (nada aponta pro banco real). O Docker
  não liga sozinho: rode `dockerd &` antes do `npx supabase start`. As imagens vêm do Docker Hub depois de
  algumas tentativas falhas no ECR/ghcr (normal, demora uns minutos). Postgres remoto (portas 5432/6543)
  não sai do container: migrations e import no banco de verdade rodam no PC ou numa Action.
- `bun.lock` aponta pro registro público do npm. O export do Lovable apontava pro cache privado dele
  (`*-npm.pkg.dev/lovable-core-prod`), que pode sumir; não deixar voltar.
- Na máquina do Bruno (Windows), o `~/.npmrc` tem `cafile` do Kaspersky; isso não vale na nuvem.

## Backlog

Plano completo em [docs/ROADMAP.md](docs/ROADMAP.md). Resumo:

- [ ] Tayane responder 1.1–1.4 + mandar um extrato do Santander (mensagem pronta no worklog de 2026-10-23)
- [ ] Fase 1 — pôr no ar como comtay: SETUP + domínio, e-mail real, 2FA, backup diário, PWA, região `gru1`
- [ ] Fase 1b — ela mexer pelo celular (Claude Pro + prévias da Vercel)
- [ ] Fase 2 — completar Finanças/Meu Dia/Filhos (contas cadastráveis, 24 meses, extrato, novo pet, lembretes)
- [ ] Fase 3 — Luísa integrada com Claude ou GPT (ações por área, leitura de tudo)
- [ ] Fase 4/5 — novas áreas: Casa → Carro → Saúde → demais
- [ ] Fase 6 — histórico, calendário e análises ("como foi meu mês?")
- [ ] Fase 7 — mundo comtay (jogo); antes, decidir de onde vem a arte
- [x] Consertos 🔴/🟠 que não dependiam das contas (ver ACHADOS)
