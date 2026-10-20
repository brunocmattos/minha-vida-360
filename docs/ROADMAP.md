# Roadmap — Minha Vida 360

Objetivo: a Tayane parar de depender do Lovable e usar o app num endereço próprio na Vercel,
com banco Supabase dela, conseguindo pedir mudanças ao Claude Code pelo celular.

Detalhes de cada problema em [ACHADOS.md](ACHADOS.md) (códigos A1, B2…); ideias em [SUGESTOES.md](SUGESTOES.md).
O `roadmap.md` na raiz é o histórico do que foi feito dentro do Lovable.

---

## ✅ Fase 0 — Entender e preparar (feito em 2026-10-20)
- [x] Export do Lovable versionado em git (sem o `.env`, que é segredo)
- [x] Rodando local com as dependências exatas (`bun.lock`); 42 testes, TypeScript e build ok
- [x] Supabase local com o esquema completo + usuário de teste (`scripts/local-supabase.mjs`)
- [x] Teste funcional logado de todas as telas e fluxos principais
- [x] Build para Vercel validado (`NITRO_PRESET=vercel`)
- [x] Auditoria de segurança, bugs e deploy → ACHADOS.md, SUGESTOES.md, este roadmap

---

## Fase 1 — Sair do Lovable (meta: ela usando na Vercel)

**Decisões antes de começar** (são de vocês, não técnicas):
- [ ] De quem é cada conta — GitHub, Vercel e Supabase no nome da Tayane (ela é dona e paga, se
      houver custo) ou no do Bruno? Recomendo no dela, com o Bruno como colaborador.
- [ ] Supabase gratuito ou pago? O gratuito pausa após ~1 semana sem uso e tem backup limitado
      (SUGESTOES §5).
- [ ] O Lovable fica ativo até a Fase 1 terminar — ele é a única cópia dos dados e das 4 imagens.

**Passos** (nesta ordem — o export vem antes de tudo):
1. [ ] **Salvar o que só existe no Lovable** (A2, A3)
   - Baixar as 4 imagens do app publicado para `public/images/`.
   - Exportar os dados: script que entra **como ela** (com a senha dela, rodado por ela ou na frente
     dela) e lê todas as tabelas — o RLS já garante que só vêm os dados dela. Salvar em JSON fora do repo.
   - Conferir quantos lançamentos ela tem em `fin_entries` (diz se o B1 já está afetando).
2. [ ] **Repositório privado no GitHub** com este código.
3. [ ] **Supabase novo**
   - Rodar as 10 migrations (`drizzle-kit migrate`; renomear `LOVABLE_DB_MIGRATION_URL` → `DATABASE_URL`).
   - Desligar cadastro público (A4); criar a usuária dela; senha forte.
   - Importar os dados trocando o `owner_id` antigo pelo novo id dela; desligar os gatilhos durante a
     importação (`fin_audit_opening` cria histórico, `*_touch` mexe em datas).
   - Conferir as contagens tabela por tabela contra o export.
4. [ ] **Imagens e build sem Lovable**
   - Trocar os `.asset.json` por `/images/...` (A2).
   - `vite.config.ts` próprio (sem `@lovable.dev/vite-tanstack-config`) com preset `vercel`.
   - Remover `previewAuthStorage`, `lovable-error-reporting`, a pasta `integrations/lovable` (C3).
5. [ ] **Vercel**
   - Conectar ao GitHub; Node 22; variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
     `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (sem a service role).
   - No Supabase: Site URL = domínio da Vercel.
6. [ ] **Validar com ela, no celular**: login, finanças do mês batendo com o que ela via no Lovable,
   pets com fotos, diário, tarefas. Só então parar de usar o Lovable.

A Luísa fica desligada nesta fase (ela avisa que não está configurada) — volta na Fase 4.

---

## Fase 2 — Consertar o que ela sente no uso
Ordem por impacto:
- [ ] B1 — finanças carregar só uma janela de meses (fim do corte silencioso em 1000)
- [ ] B2 — repasse automático não sobrescrever edição manual
- [ ] B5 — formulários só fecharem quando salvou
- [ ] B6 — confirmação clara antes de excluir; botões afastados
- [ ] B7 — arredondamentos, projeção além de 12 meses, "dia a definir" não virar vencido
- [ ] B8, B9 — diário em erro; página de pets aceitar um 4º pet
- [ ] C7 — miudezas (páginas de erro em português, textos desatualizados)
Cada correção com um teste pequeno em `src/test/`.

---

## Fase 3 — Fácil de mudar, pelo celular
- [ ] `prettier --write` uma vez (o lint volta a servir de alarme) e dividir `finance-wallets.tsx` /
      `finance-module.tsx` (C1)
- [ ] Configuração num lugar só: `theme.css`, `content.ts`, `public/images/` (SUGESTOES §2, ACHADOS C2)
- [ ] Remover os 44 componentes e ~35 dependências sem uso (C3); imagens em WebP (C4)
- [ ] Ajustes de celular: toques de 44px, campos em 16px, PWA instalável (SUGESTOES §4)
- [ ] Guia curto para a Tayane: como pedir uma mudança, conferir a prévia e publicar
- [ ] Testar o fluxo de ponta a ponta com ela: uma mudança de cor pedida pelo celular até ir ao ar

---

## Fase 4 — Luísa com IA barata
- [ ] Provedor configurável por variável (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`) — SUGESTOES §1
- [ ] Decidir o provedor (DeepSeek ou equivalente — ver a nota de privacidade)
- [ ] Corrigir B3 (confirmação dupla) e B4 (histórico, "já paga", limites de uso)
- [ ] Relatórios só de leitura; novas ações no padrão "propõe → confirma"

---

## Fase 5 — Mapa da vida (mini-jogo)
Em partes, cada uma já útil sozinha (SUGESTOES §3):
- [ ] Mapa estático com os lugares (casa, hospital, veterinário, Guarida, banco…) e o número de
      pendências de cada um; tocar abre a lista
- [ ] Bonequinha que anda até o lugar tocado
- [ ] Módulos de verdade para as áreas que hoje estão "em construção" (saúde, carreira, casa…)
- [ ] Personalizar a bonequinha
