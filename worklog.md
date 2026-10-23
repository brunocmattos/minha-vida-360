# Worklog — Minha Vida 360 (Tayane)

## 2026-10-23 · main · Brainstorm

**O quê:** entrevista com a Tayane (negócio + decisões técnicas que dependem dela) antes de avançar · **Objetivo:** saber o que ela quer de verdade e destravar o SETUP
**Feito:** `docs/ENTREVISTA-TAYANE.md` (7 partes, ~35 perguntas, ⭐ nas que travam); respostas dela condensadas em `docs/RESPOSTAS-TAYANE.md`; `docs/ROADMAP.md` reescrito pelas prioridades dela (nome **comtay**, domínio comtay.com.br provavelmente livre via RDAP, e-mail real + 2FA, backup diário, PWA Android, contas cadastráveis, 24 meses, extrato Santander, novo pet, lembretes 30/10 dias, Luísa integrada, Casa→Carro→Saúde, histórico/análises, mundo tipo jogo). Corrigido no CLAUDE.md: contracheque e saldo inicial já têm cadastro.
**Riscos / quem afeta:** ela pulou 1.1–1.4 (contas, senha atual, dia da mudança, grátis/pago), então o SETUP segue travado; ela continua no Lovable com os bugs antigos até a mudança; Pix Automático não serve pra API de IA (só cartão); Claude Pro não paga a Luísa; a arte do mundo-jogo (personagem e cachorros fiéis) não tem origem nem custo definidos; escopo agora é de meses.
**Próximo:** mandar pra ela a mensagem com as 4 perguntas que faltaram + pedir um extrato exportado do Santander. Enquanto isso dá pra adiantar o que não depende dela (renomear pra comtay, backup diário, PWA, região `gru1`, projeção de 24 meses).

## 2026-10-20 · main · Desenvolvimento

**O quê:** arrumar o "OS" da Tayane feito no Lovable, fazer funcionar e pôr na Vercel com Supabase · **Objetivo:** app fora do Lovable, pronto pra deploy, com o mínimo de trabalho manual pro Bruno
**Feito:** export do Lovable versionado (a293068) sem `.env`; teste funcional logado num Supabase local (`scripts/local-supabase.mjs`); auditoria → `docs/ACHADOS.md`, `SUGESTOES.md`, `ROADMAP.md`, `CLAUDE.md`; consertos de finanças (3d84e07: paginação >1000, `amount_manual` via migration 0010, salvar-antes-de-fechar, centavos), Luísa com provedor configurável/DeepSeek + trava atômica de confirmação (91a390a), pets/diário/tarefas/mobile (7422636); build sem Lovable com preset Vercel e cabeçalhos de segurança (8ca655e); scripts export/import + backup GitHub Actions + `docs/SETUP.md` (4188a61); 44 componentes e 42 deps removidos, lint 1878 → 0 erros (ea1c096); 4 fotos trazidas do CDN do Lovable (63cbdb5); repo privado criado e enviado. 69 testes; modo produção testado contra o banco local.
**Riscos / quem afeta:** dados reais da Tayane ainda só no banco do Lovable (`veqjplvuafhdnqrccibt`) até rodar export/import; repo na conta de TRABALHO `brunooutcore` (Bruno aceitou, vai migrar); backup falha a cada 3 dias até cadastrar o segredo `DATABASE_URL`; modo JSON do DeepSeek não testado com o modelo real.
**Próximo:** Bruno segue `docs/SETUP.md` passos 1–3 e 5 (export com a senha dela, Supabase novo, import, Vercel) e valida com a Tayane no celular.
