---
tipo: projeto
cliente: tayane
produto: Minha Vida 360
no_ar: não
atividade: ativo
stack: ["TanStack Start", "React 19", "Supabase", "Tailwind 4", "Vercel"]
ultima_atividade: 2026-10-20
proxima_acao: "Exportar os dados do Lovable e criar o Supabase próprio (Fase 1 do docs/ROADMAP.md)"
repo: git-local
tags: [pessoal, lovable-export, vercel, supabase]
---
# Minha Vida 360

## Estado atual
Export do Lovable, saindo do Lovable Cloud para Vercel + Supabase próprio. Em 2026-10-20 o app
roda local (contra um Supabase local), testes 42/42, TypeScript limpo, build para Vercel validado.
**Ainda não está no ar fora do Lovable** e os dados reais da Tayane continuam no banco do Lovable.
Próximo passo: Fase 1 do [docs/ROADMAP.md](docs/ROADMAP.md). Problemas conhecidos em
[docs/ACHADOS.md](docs/ACHADOS.md); ideias em [docs/SUGESTOES.md](docs/SUGESTOES.md).

## O que é
App pessoal da Tayane para organizar a vida: uma casa ilustrada onde cada cômodo abre uma área
(finanças, filhos/pets, diário, saúde, carreira…), checklist do dia e a assistente Luísa (chat com IA
que registra despesas e diário, sempre pedindo confirmação).

## Stack & como rodar
TanStack Start (React 19, SSR via Nitro) · Vite 8 · Tailwind 4 · Supabase (auth + Postgres + RLS) ·
migrations SQL via drizzle-kit · bun (há `bun.lock`; use bun para instalar).

```bash
npx -y bun install --frozen-lockfile        # dependências exatas do lockfile
npx vitest run                              # testes (42)
node node_modules/typescript/bin/tsc --noEmit
```

Rodar contra um banco **local e descartável** (recomendado para testar):
```bash
npx supabase start -x studio,storage-api,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit
LOVABLE_DB_MIGRATION_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres node node_modules/drizzle-kit/bin.cjs migrate
node scripts/local-supabase.mjs seed        # cria o usuário de teste (login: "teste")
node scripts/local-supabase.mjs dev         # app em http://localhost:8080 apontando pro banco local
```
`npx vite dev` puro usa o `.env`, que hoje aponta para o **banco real** do Lovable.

Build para Vercel: `NITRO_PRESET=vercel npx vite build` → `.vercel/output`.

## Estrutura
- `src/routes/` — páginas (rotas por arquivo). `_authenticated/` exige login. `casa.tsx` é a home.
- `src/components/` — módulos de tela: `finance-*.tsx`, `pets-module.tsx`, `task-checklist.tsx`,
  `diary-module.tsx`, `luisa-chat.tsx`, `house-casa.tsx` (casa em SVG), `room-scene.tsx`.
  `components/ui/` são componentes shadcn (só `button` e `dialog` são usados).
- `src/lib/` — regras de negócio puras e testadas (`finance.ts`, `finance-balances.ts`,
  `recurrence.ts`, `pet-care.ts`, `luisa.ts`) + `areas.ts` (lista das 12 áreas da vida).
- `src/lib/luisa.functions.ts` — **única** função de servidor (chamada de IA + gravação confirmada).
- `src/styles.css` — cores e tema (tokens OKLCH), paleta da casa, tema por cômodo.
- `src/assets/pets/` — ilustrações dos pets.
- `drizzle/migrations/` — esquema do banco (17 tabelas, todas com RLS por `owner_id`). Fonte da verdade do schema.
- `scripts/local-supabase.mjs` — seed do usuário de teste + dev contra banco local.
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
- Supabase atual (Lovable, **dados reais**): projeto `veqjplvuafhdnqrccibt` — gerenciado pelo Lovable.
- Variáveis que o app lê: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY` e `LOVABLE_API_KEY` (Luísa). O `.env` é segredo: nunca commitar.
- `SUPABASE_SERVICE_ROLE_KEY` **não** é usada pelo app — não configurar na Vercel.
- Chaves do `scripts/local-supabase.mjs` são as de demonstração do Supabase CLI (só funcionam em 127.0.0.1).

## Decisões & gotchas
- **Login é por nome**: "tayane" vira `tayane@minhavida360.app` (`usernameToEmail` em `src/routes/auth.tsx`).
  É um e-mail falso, então "esqueci a senha" por e-mail não funciona.
- **Toda segurança dos dados é o RLS**: o navegador fala direto com o Supabase. Toda tabela nova precisa
  de `owner_id uuid not null default auth.uid()` e policies `owner_id = auth.uid()` com `WITH CHECK`.
- **Dados não estão no repo**: perfis dos pets, recorrências, contracheques e dívidas foram gravados
  direto no banco pelo Lovable e não há tela para criar alguns deles. Perder o banco = perder isso.
- **Luísa só funciona no Lovable** hoje (gateway de IA do Lovable). Ver docs/SUGESTOES.md.
- **4 imagens da página Meus Filhos** (`src/assets/pets/*.asset.json`) apontam para o CDN do Lovable e
  não existem no repo — quebram fora do Lovable.
- `AGENTS.md` e `roadmap.md` são do Lovable (histórico de decisões); este arquivo prevalece.
- npm trava nesta máquina do Bruno por `cafile` do Kaspersky no `~/.npmrc` (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`);
  use bun com `--cafile=<bundle com os CAs do Node + o do Kaspersky>`.

## Backlog
Plano completo em [docs/ROADMAP.md](docs/ROADMAP.md). Resumo:
- [ ] Fase 1 — sair do Lovable: exportar dados + 4 imagens, Supabase próprio, Vercel, validar com ela
- [ ] Fase 2 — corrigir os achados 🔴/🟠 de [docs/ACHADOS.md](docs/ACHADOS.md)
- [ ] Fase 3 — deixar fácil de mudar (tema/conteúdo/imagens num lugar só, limpeza)
- [ ] Fase 4 — Luísa com IA barata e configurável
- [ ] Fase 5 — mapa/mini-jogo das áreas da vida
