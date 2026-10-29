# Roadmap — comtay (ex-Minha Vida 360)

Objetivo: a Tayane usar o **comtay** todo dia, no celular (Android, instalado como app) e no computador,
num endereço próprio, com os dados dela num Supabase dela. A longo prazo, um **mundo visual tipo jogo**
onde a personagem dela anda entre os lugares da vida, e a **Luísa** registra e analisa tudo conversando.

Fonte da intenção: [RESPOSTAS-TAYANE.md](RESPOSTAS-TAYANE.md) (entrevista de 2026-10-23).
Problemas técnicos: [ACHADOS.md](ACHADOS.md) (códigos A1, B2…). Ideias: [SUGESTOES.md](SUGESTOES.md).
O `roadmap.md` na raiz é o histórico do que foi feito dentro do Lovable.

**Regra de toda área nova (Fases 4–5):** ela nasce com 3 peças: a **tela**, as **ações da Luísa**
(sempre "propõe → confirma num toque") e o **histórico** (que alimenta a Fase 6). Área sem as 3 não está pronta.

---

## ✅ Fase 0 — Entender e preparar (2026-10-20)

- [x] Export do Lovable versionado; rodando local; teste funcional e auditoria

## ✅ Consertos que não dependiam das contas (2026-10-20)

- [x] B1–B9 e a maior parte de C (placar em ACHADOS.md); 69 testes, lint com 0 erros

---

## Fase 1 — Pôr no ar como comtay

**Trava:** ela não respondeu 1.1–1.4 (de quem são as contas, como entrar com a senha atual, dia da mudança,
grátis ou pago). Sem isso o SETUP não anda.

- [ ] Contas (GitHub, Vercel, Supabase) e dia da mudança: perguntas 1.1–1.4
- [ ] Export → Supabase novo → import → Vercel ([SETUP.md](SETUP.md) passos 1–5)
- [ ] Domínio **comtay.com.br** no registro.br (~R$ 40/ano, aceita Pix) apontado pra Vercel
- [x] Renomear tudo para **comtay** (constante única em `src/lib/brand.ts`; o login por nome segue `@minhavida360.app` até virar e-mail real)
- [ ] Login por **e-mail real** + "esqueci a senha" (precisa de SMTP próprio, ex.: Resend no domínio
      comtay.com.br; o e-mail padrão do Supabase é limitado demais)
- [ ] **2FA** por app autenticador (TOTP, grátis no Supabase; código por SMS teria custo)
- [x] **Backup diário** (`.github/workflows/backup.yml`, 03:17 de Brasília)
- [x] **PWA instalável** no Android (ícone, tela cheia, aviso offline); funções da Vercel na região `gru1`
- [ ] Ela usa por alguns dias e lista o que ainda **não salva / não aparece no celular** na versão nova

## Fase 1b — Ela mexer pelo celular

- [ ] Confirmar o plano: o Claude Pro inclui o Claude Code (web/app) pra ela pedir mudanças; a
      prévia por branch vem da Vercel, sem custo. **Não cobre a Luísa** (a API de IA é cobrada à parte)
- [ ] Repo/projeto acessíveis pela conta dela; guia curto: pedir → conferir prévia → publicar

---

## Fase 2 — Consertar e completar o que ela mais usa (Finanças, Meu Dia, Filhos)

**Finanças**

- [ ] **Contas e cartões cadastráveis** (hoje são 4 carteiras fixas no código: `Account` em
      `lib/finance-balances.ts`). Precisa de tabela nova + migration
- [ ] Saldo inicial por conta: **já existe** (`fin_openings` em `finance-wallets.tsx`). Estender às contas novas
- [x] Projeção de recorrentes em **24 meses** (`PROJECTION_MONTHS` em `lib/finance.ts`)
- [x] Contracheque: aba própria em Receitas, contracheque novo, linhas editáveis, **comparação entre meses**
      e o que mudou linha a linha (`lib/payslip.ts`)
- [ ] **Importar extrato do Santander** com revisão antes de salvar (pedir a ela um arquivo exemplo: OFX/CSV/Excel?)
- [ ] Joici até nov/2026: já feito no Lovable. Conferir que dez/2026 em diante fica 100% dela

**Filhos**

- [x] **Cadastrar pet novo** ("Adicionar filho" em Meus Filhos)
- [ ] Trocar foto: o campo já existe no perfil. Conferir se ela acha e consegue usar
- [ ] **Lembretes 30 e 10 dias antes**: push no Android (Web Push via PWA) + e-mail, numa rotina diária

**Geral**

- [ ] Registro rápido no celular sem passar por várias telas; navegação revista (a partir do que ela listar na Fase 1)

## Fase 3 — Luísa integrada (fundação)

- [ ] Trocar o provedor para **Claude ou GPT** (ela deixou a escolha conosco; o código já aceita qualquer
      provedor compatível). Pagamento: as APIs cobram em cartão, não em Pix (ver nota abaixo)
- [x] Ações da Casa no padrão existente (`luisa.functions.ts`): **tarefa/lembrete com data**, **tarefa feita**
      (conclui a rotina certa pelo id ou registra como feito) e **itens na lista de compras**
- [ ] Demais ações: registrar cuidado de pet + gasto junto, atividade de saúde
- [ ] Leitura de **todas** as áreas (ela autorizou, inclusive diário, saúde e espiritualidade)
- [ ] Validar com conversas reais e medir o custo por mês

## Fase 4 — Novas áreas: Casa → Carro → Saúde

- [x] **Casa** (`casa-module.tsx`, `lib/casa.ts`, migration 0011): tarefas e rotinas com constância
      (vezes em 30 dias, última vez), lista de compras (vários itens de uma vez), manutenções/serviços,
      histórico de 30 dias. Lembretes = tarefa com data (notificação no celular ainda não)
- [ ] **Meu Carro**: manutenções, documentação (IPVA, licenciamento), lembretes
- [ ] **Saúde**: atividades (academia + frequência), consultas, exames

## Fase 5 — Demais áreas, na ordem dela

Carreira → Desenvolvimento → Intelecto → Autocuidado → Vida Social → Espiritualidade.

## Fase 6 — Histórico, calendário e análises

- [ ] Linha do tempo/calendário de todas as áreas por dia, semana, mês e ano
- [ ] Frequência e constância, comparação de períodos, evolução de gastos
- [ ] "Luísa, como foi meu mês?": resumo de todas as áreas

## Fase 7 — O mundo comtay (o jogo)

Um lugar para cada área, a personagem dela andando entre eles com roupas por ambiente, e Dobby, Zara e Paco.
Arquitetura em [SUGESTOES.md](SUGESTOES.md) §3: lugares como dados, a casa atual vira o "interior".

- [ ] **Decidir de onde vem a arte** (é o gargalo, não o código): ilustradora contratada, geração por IA
      (barato, difícil manter a personagem igual em todas as poses e roupas) ou um avatar montável por peças.
      Precisa parecer com ela e com os cachorros de verdade
- [ ] Motor do mapa com arte provisória: lugares tocáveis, personagem anda, contador de pendências por lugar
- [ ] Trocar pela arte final; roupas e acessórios por ambiente

---

## Notas de custo (2026-10-23, conferir na hora de contratar)

- **Vercel + Supabase**: grátis. **Domínio**: ~R$ 40/ano no registro.br (aceita Pix).
- **Luísa (API Claude/GPT)**: créditos pré-pagos **só com cartão**, sem Pix Automático. Saídas: cartão
  virtual do banco dela, ou o Bruno paga e ela reembolsa com um Pix agendado recorrente.
- **Claude Pro** (dela): serve pra ela mexer no app pelo Claude Code; **não** paga a Luísa.
- **E-mail** (Resend etc.): plano grátis basta pra uma pessoa.
- **Arte do mundo**: o maior custo em aberto (Fase 7).
