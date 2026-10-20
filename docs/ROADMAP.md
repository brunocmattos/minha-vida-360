# Roadmap — Minha Vida 360

Objetivo: a Tayane parar de depender do Lovable e usar o app num endereço próprio na Vercel,
com banco Supabase dela, conseguindo pedir mudanças ao Claude Code pelo celular.

Detalhes de cada problema em [ACHADOS.md](ACHADOS.md) (códigos A1, B2…); ideias em [SUGESTOES.md](SUGESTOES.md).
O `roadmap.md` na raiz é o histórico do que foi feito dentro do Lovable.

---

## ✅ Fase 0 — Entender e preparar (2026-10-20)

- [x] Export do Lovable versionado em git (sem o `.env`, que é segredo)
- [x] Rodando local com as dependências exatas; Supabase local com o esquema completo + usuário de teste
- [x] Teste funcional logado de todas as telas e fluxos; auditoria de segurança, bugs e deploy

## ✅ Fase 2 — Consertos (2026-10-20, feita antes da Fase 1 porque não dependia das contas)

- [x] B1–B9 e a maior parte de C (placar em ACHADOS.md); 69 testes, lint com 0 erros
- [x] Testado em modo produção contra o Supabase local (login, finanças, tarefas, diário, Luísa, pets)

---

## Fase 1 — Pôr no ar (falta: o que precisa das contas/senha deles)

**Já pronto no código**

- [x] Build sem Lovable, preset Vercel, cabeçalhos de segurança, fora do Google
- [x] Scripts de export/import testados ponta a ponta; backup automático (GitHub Actions)
- [x] Passo a passo em [SETUP.md](SETUP.md)

**Decidido** (técnico): Supabase gratuito + backup a cada 3 dias, que também evita a pausa por
inatividade; Luísa com provedor configurável, padrão DeepSeek.

**Falta** (precisa de conta ou senha — SETUP.md):

- [ ] Baixar as 4 imagens do Lovable (A2) — aguarda o OK do Bruno
- [ ] Decidir de quem são as contas (GitHub, Vercel, Supabase). Recomendo no nome da Tayane, com o
      Bruno como colaborador
- [ ] Export dos dados com a senha dela → Supabase novo → migrations → import (SETUP 1–3)
- [ ] GitHub privado + segredo `DATABASE_URL` (SETUP 4)
- [ ] Vercel + variáveis (SETUP 5)
- [ ] Validar com ela no celular; só então largar o Lovable (SETUP 7)

---

## Fase 3 — Fácil de mudar, pelo celular

- [ ] Configuração num lugar só: `theme.css`, `content.ts`, `public/images/` (SUGESTOES §2, ACHADOS C2)
- [ ] Dividir `finance-wallets.tsx` / `finance-module.tsx` (C1); imagens em WebP (C4)
- [ ] PWA instalável; foco e Esc no chat/menu (C5)
- [ ] Guia curto para a Tayane: como pedir uma mudança, conferir a prévia e publicar
- [ ] Testar o fluxo com ela: uma mudança de cor pedida pelo celular até ir ao ar

---

## Fase 4 — Luísa no ar

- [x] Provedor configurável (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`), padrão DeepSeek
- [x] Confirmação dupla travada; histórico recente; "prevista × paga"; limite diário
- [ ] Criar a chave DeepSeek (SETUP 6) e validar com conversas reais (o modo JSON do DeepSeek
      ainda não foi testado com o modelo de verdade)
- [ ] Relatórios só de leitura; novas ações no padrão "propõe → confirma"

---

## Fase 5 — Mapa da vida (mini-jogo)

Em partes, cada uma já útil sozinha (SUGESTOES §3):

- [ ] Mapa estático com os lugares (casa, hospital, veterinário, Guarida, banco…) e o número de
      pendências de cada um; tocar abre a lista
- [ ] Bonequinha que anda até o lugar tocado
- [ ] Módulos de verdade para as áreas que hoje estão "em construção" (saúde, carreira, casa…)
- [ ] Personalizar a bonequinha
