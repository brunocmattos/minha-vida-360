━━━ HANDOFF → próxima sessão ━━━
Projeto: comtay (ex-Minha Vida 360, Tayane) — Projetos/Tayane/app   ·   Frente/Branch: main
Na sessão passada (2026-10-23): entrevista enviada e respondida pela Tayane → docs/RESPOSTAS-TAYANE.md; docs/ROADMAP.md reescrito pelas prioridades dela (Fases 1–7). Nenhum código mexido.
Decidimos: nome "comtay" (domínio comtay.com.br); Luísa com Claude ou GPT (escolha nossa), lê todas as áreas; Bruno pode ver dados reais; toda área nova = tela + ações da Luísa + histórico; e-mail real + 2FA (TOTP); backup diário; PWA Android; ordem Casa → Carro → Saúde; mundo-jogo é a visão de longo prazo (arte é o gargalo).
Ficou pendente: respostas 1.1–1.4 (contas, senha atual, dia da mudança, grátis/pago) + extrato exemplo do Santander; decisão da origem da arte (ilustradora / IA / avatar por peças); como ela paga a API da Luísa (só cartão, sem Pix).
Próximo objetivo: se ela já respondeu → SETUP (Fase 1). Senão, adiantar o que não depende dela: renomear pra comtay (constante única), cron do backup diário, PWA instalável, região gru1 na Vercel, projeção 24 meses (lib/finance.ts horizon/months = 12).
Atenção: dados reais só no banco do Lovable até o import (não apagar nada lá); `npx vite dev` puro usa o .env = banco REAL (use scripts/local-supabase.mjs dev); npm/bun nesta máquina precisam do --cafile (Kaspersky).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
