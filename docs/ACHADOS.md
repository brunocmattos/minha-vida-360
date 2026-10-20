# Achados — Minha Vida 360

Levantamento de 2026-10-20: teste funcional logado contra um Supabase local + leitura do código
(segurança, bugs, deploy). Nada aqui foi corrigido ainda.

**Origem de cada item**
- ✔ **verificado** — reproduzido em teste ou conferido linha a linha.
- 📖 **lido no código** — encontrado na auditoria do código, com arquivo:linha, mas não reproduzido rodando.
- ❓ **suspeito** — depende de configuração que não dá pra ver daqui (painel do Supabase/Lovable).

**Gravidade**: 🔴 impede sair do Lovable ou arrisca os dados · 🟠 erro que a Tayane sente no uso ·
🟡 manutenção, limpeza ou detalhe.

---

## O que está bom (não mexer sem motivo)
- ✔ Login, as 19 telas, tarefas (criar/concluir/reabrir/excluir), finanças (lançar, pagar,
  recorrência de 12 meses), contatos, diário: tudo funciona e grava no banco com o dono certo.
- ✔ Celular: nenhuma tela tem rolagem horizontal em 375px.
- ✔ 42 testes passando, TypeScript sem erros, build de produção ok.
- ✔ **Build para Vercel funciona sem mudar código** (`NITRO_PRESET=vercel`).
- ✔ Esquema do banco reproduzível: as 10 migrations recriam as 17 tabelas idênticas ao banco real.
- 📖 Segurança de base sólida: todas as 17 tabelas com RLS, todas as policies amarradas a
  `owner_id = auth.uid()` com `WITH CHECK`, nenhum acesso anônimo, nenhum segredo no código do navegador.

---

## 🔴 Bloqueiam a saída do Lovable / arriscam os dados

### A1. A Luísa não funciona fora do Lovable — ✔
`src/lib/luisa.functions.ts:7-8,78,103-109` chama o gateway de IA do Lovable
(`ai.gateway.lovable.dev`, modelo `openai/gpt-6-astra`) com `LOVABLE_API_KEY`, que o Lovable só
injeta no servidor dele. Fora do Lovable o chat responde "Integração de IA não configurada no servidor".
**Correção:** trocar por um provedor próprio e configurável (ver docs/SUGESTOES.md §1).

### A2. Quatro imagens só existem no Lovable — ✔
`src/assets/pets/jardim-{garden,dobby,zara,paco}.jpg.asset.json` são ponteiros para o CDN do Lovable
(`/__l5e/assets-v1/...`); os arquivos não vieram no export. Na Vercel, o banner do jardim e os 3
retratos da página Meus Filhos dão 404 (`pets-module.tsx:5-10,110,127`).
**Correção:** baixar as 4 imagens do app publicado no Lovable **enquanto ele existir**, salvar em
`public/images/` e trocar os imports por caminhos.

### A3. Os dados dela só existem no banco do Lovable — ✔
Perfis dos pets, recorrências, contracheques e dívidas foram gravados direto no banco pelo Lovable.
Não estão nas migrations nem no repo, e **não há tela para criar perfil de pet nem contracheque**.
Trocar de Supabase sem exportar = perder isso de vez.
**Correção:** exportar antes de qualquer coisa (roteiro na Fase 1 do docs/ROADMAP.md).

### A4. Cadastro público pode estar aberto — ❓
O app só chama `signInWithPassword` (`src/routes/auth.tsx:41`), mas esconder o formulário não fecha
a porta: com a chave pública (que vai no navegador) qualquer um pode chamar a API de cadastro, a menos
que "Allow new users to sign up" esteja desligado no painel. Um intruso **não** vê os dados dela
(o RLS isola), mas pode criar conta e gastar a IA da Luísa em loop.
**Correção:** no Supabase novo, desligar cadastro público e criar a usuária manualmente.

---

## 🟠 Erros que ela sente no uso

### B1. Finanças carrega tudo sem limite → corte silencioso em 1000 linhas — ✔ código / ❓ impacto atual
`src/components/finance-module.tsx:28` faz `fin_entries.select("*").order("due_date")` sem limite.
O Supabase hospedado devolve no máximo 1000 linhas e **não avisa**. Como as recorrências geram 12
meses à frente, a conta cresce rápido; ordenado por data, quem some são os meses mais novos:
o mês atual pode aparecer incompleto e os totais errados. Mesmo padrão em `luisa.functions.ts:32`,
`task-checklist.tsx:25-28`, `diary-module.tsx:26-30`.
**É forte candidato ao "não funciona bem".** Conferir quantos lançamentos ela já tem.
**Correção:** buscar só uma janela de meses (ex.: mês −3 a +14) ou paginar.

### B2. Cálculo automático do repasse sobrescreve edição manual — ✔
`finance-module.tsx:85-94` + `finance.ts:45-53`: toda vez que a tela carrega, lançamentos de receita
ainda não recebidos ligados à fórmula `half_housing` voltam para 50% de aluguel+condomínio+energia+internet.
Se ela editar o valor previsto à mão, ele volta sozinho, sem aviso.
**Correção:** não recalcular lançamentos editados manualmente (marcar a edição) ou avisar na tela.

### B3. Luísa pode gravar a mesma despesa duas vezes — ✔
`src/lib/luisa.ts:44,49` sempre devolve `status: "pendente"`, então a trava "esta ação já foi tratada"
em `luisa.functions.ts:168` nunca dispara. A tela esconde o botão após confirmar, então na prática
duplica só com clique duplo, falha de rede + nova tentativa, ou duas abas.
**Correção:** "reservar" a ação no banco de forma atômica antes de inserir (update condicional a `pendente`).

### B4. Outros problemas da Luísa — 📖
- Envia ao modelo as **40 mensagens mais antigas**, não as mais recentes (`luisa.functions.ts:94-99`):
  depois de ~20 trocas ela perde o contexto atual.
- Toda despesa criada pela Luísa entra **já como paga** (`luisa.functions.ts:181-185`) —
  "vou pagar 200 amanhã" vira pagamento feito, e o resumo de confirmação não diz isso.
- Se a consulta ao banco falhar, o modelo recebe "dados reais: R$ 0,00" (`luisa.functions.ts:32-39`).
- Diário/Finanças abertos não atualizam depois que a Luísa grava (`luisa-chat.tsx:134-135`).
- Sem limite de uso nem de tamanho de mensagem (custo da IA sem teto).

### B5. Formulários fecham antes de confirmar que salvou — 📖
`finance-module.tsx:138,299,335,442`, `finance-extra.tsx:62,117`: o formulário some na hora do clique.
Se a rede falhar, ela perde o que digitou e o erro aparece no topo da página, às vezes fora da tela.
**Correção:** fechar só quando o salvamento der certo.

### B6. Exclusões perigosas — ✔ / 📖
- ✔ Excluir tarefa não pede confirmação; o botão fica colado no de editar (toque errado = apagou).
- 📖 Excluir cuidado/contato de pet pergunta "Descartar as alterações não salvas?" (`pets-module.tsx:248,374`)
  — ela lê como "descartar edição", aperta OK e o registro é apagado.
- 📖 Excluir meta de poupança que falha não mostra erro nenhum (`finance-wallets.tsx:59`).

### B7. Contas de dinheiro com detalhes errados — 📖
- Saldo transportado de um mês para outro não é arredondado (`finance-balances.ts:164-168`): vira
  "649,9200000000001" e o próprio formulário de edição recusa o valor.
- Projeção mostra R$ 0 para meses além dos 12 gerados (`finance.ts:92-97`), como se nada vencesse.
- Lançamento com "dia a definir" fica vermelho como "Vencido" (`finance.ts:84-89`).
- Recorrência perde as observações; data no passado gera N lançamentos vencidos (`finance-module.tsx:128-132`).
- Dinheiro em ponto flutuante: arredondamentos de 1 centavo em somas (`finance.ts:41,119-125`).

### B8. Diário some em caso de erro — 📖
`diary-module.tsx:31-32`: se recarregar a lista falhar, mostra "Nenhum registro ainda" + erro —
parece que o diário foi apagado.

### B9. Página dos pets presa a Dobby, Zara e Paco — 📖
`pets-module.tsx:10-11,38-40,96`: tamanhos, ordem e ilustrações fixos por nome. Um 4º pet aparece
sem ilustração e fora de ordem. "Pendências de regularização" conta vacinas futuras também (`:150`).

---

## 🟡 Manutenção, limpeza, detalhes

### C1. Código de finanças difícil de alterar com segurança — 📖
`finance-wallets.tsx` tem 64 linhas e 17 KB (linha mais longa: 1787 caracteres); `finance-module.tsx`
451 linhas misturando banco, regra e tela. O lint acusa 1878 erros, 1865 só de formatação — ou seja,
o lint não serve de alarme. Isso importa porque é o Claude Code da Tayane que vai mexer aqui.
**Correção:** `prettier --write` uma vez; depois dividir os arquivos grandes.

### C2. Dados pessoais e nomes fixos no código — 📖
Trocar um pet, um benefício ou o emprego exige caçar em vários arquivos, e tudo isso vai no JavaScript
público (qualquer um lê sem logar):
| Onde | O quê |
|---|---|
| `lib/finance-balances.ts:5,10`, `finance-wallets.tsx:28,46` | "Pluxee Guarida", "iFood Benefícios Riachuelo" |
| `lib/finance.ts:16,48` | contas da casa e fórmula do repasse (`half_housing`) |
| `finance-module.tsx:85,259,272`, `finance-views.tsx:22,70` | "Joici", "Contracheque Guarida", "Freelas, Padrasto" |
| `pets-module.tsx:10-11,38,95-100,149-176` | Dobby/Zara/Paco, "Vermífugo – Endogard", `/bravecto/i` |
| `house-casa.tsx:19-20`, `room-scene.tsx:18,35-38` | "Liz", "Sala da Liz" |
| `lib/areas.ts:25,27,53` | "Carreira — Guarida", "Visitas à Liz" |
| 13 arquivos | o nome "Minha Vida 360" repetido, sem constante única |
Também: `.lovable/plan/*.md` e `roadmap.md` citam pessoas — limpar antes de qualquer repo público.

### C3. Restos do Lovable e código morto — 📖
- Sem uso: `src/integrations/lovable/`, `supabase/cron-auth.ts`, `supabase/client.server.ts`
  (cliente com poderes de admin — apagar também tira um risco), `MonthWallet`, `WalletStat`, `Stat`, `PageHeader`.
- Só úteis dentro do Lovable: `lib/lovable-error-reporting.ts`, `supabase/previewAuthStorage.ts`.
- 44 dos 46 componentes em `components/ui/` nunca são usados; ~35 dependências só servem a eles.
- `vite.config.ts` depende de `@lovable.dev/vite-tanstack-config`; `AGENTS.md`/`README.md` falam do Lovable.

### C4. Imagens pesadas — 📖
`src/assets/pets/{dobby,paco,zara}.png` ≈ 1 MB cada, carregadas já na home. No 4G do celular isso pesa.
**Correção:** WebP ~200px.

### C5. Celular e acessibilidade — 📖 / ❓
- Botões de tarefa com 24–28px (o recomendado é 44px) e colados.
- Campos com fonte 14px fazem o iPhone dar zoom ao tocar.
- Chat da Luísa e menu móvel sem foco preso nem tecla Esc; erros sem `role="alert"`.

### C6. Segurança — detalhes — 📖
- Sem cabeçalhos de segurança (CSP etc.); sessão fica no `localStorage`.
- Colunas de texto sem tamanho máximo (diário, mensagens, foto do pet em `data:`).
- Policies de UPDATE em tabelas filhas não reconferem o dono do "pai"; `owner_id` sem FK para
  `auth.users`; função `fin_audit_opening` sem `REVOKE`. Impacto prático baixo.
- Chat renderiza imagens em markdown vindas do modelo (vetor de vazamento se um dia entrar texto de terceiros).
- `robots.txt` permite indexar a tela de login.

### C7. Miudezas — 📖
- Páginas de erro em inglês (`routes/__root.tsx:22,50-53`).
- "As tarefas chegam na próxima etapa" em `meu-dia.tsx:104,116`, mas as tarefas já existem.
- Tarefa mensal concluída dia 31 escorrega para 28 e nunca volta (`recurrence.ts:26-30`).
- Aviso de rota ambígua `/area/financas` no console (inofensivo).
