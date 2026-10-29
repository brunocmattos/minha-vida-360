# Como continuar o comtay sozinha — guia pra Tayane

> Escrito em 29/10/2026, quando o Bruno passou o projeto pra ti. Não precisa saber programar:
> tu conversa em português com o **Claude Code** (que tu já tem), ele mexe no código, e tu confere o
> resultado no celular antes de publicar. Este guia explica como montar tudo uma vez e como pedir
> cada mudança. As decisões de produto são tuas; o Claude cuida da parte técnica.

---

## 1. Onde o projeto está hoje

**O que já existe e funciona** (testado, ainda não está no ar):

- **Casa ilustrada** como tela inicial, com um cômodo pra cada área da vida.
- **Finanças:** receitas, despesas, recorrências projetadas por **24 meses**, carteiras (conta,
  poupança, benefícios), planejamento, metas, dívidas e **contracheques com comparação entre meses**.
- **Meus Filhos:** fichas, fotos, vacinas, vermífugos, Bravecto, veterinários e **cadastro de pet novo**.
- **Meu Dia:** checklist de tarefas com prioridade, data e repetição.
- **Casa (área nova):** rotinas de limpeza (quantas vezes em 30 dias, última vez), **lista de
  compras**, **manutenções e serviços** e o histórico dos últimos 30 dias.
- **Diário.**
- **Luísa:** registra despesa, diário, tarefa ou lembrete, tarefa feita e item da lista de compras.
  Ela sempre pede tua confirmação antes de gravar. Ainda falta ligar uma IA de verdade (passo 5.6).
- **Instala no celular** como app (Android: "Adicionar à tela inicial").

**O que falta pra ir ao ar:** criar as tuas contas, trazer teus dados do Lovable e publicar
(seção 5). Depois disso, a lista do que dá pra construir está na seção 7.

**Onde o código mora:** no GitHub, no repositório `minha-vida-360` (hoje na conta do Bruno; ele
transfere pra tua). O plano completo está em `docs/ROADMAP.md` e o que tu respondeu na entrevista,
em `docs/RESPOSTAS-TAYANE.md`. O Claude lê esses arquivos sozinho.

---

## 2. O que tu vai precisar (contas e custos)

| O quê                                | Pra quê                                                                  | Custo                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **GitHub** (github.com)              | Guarda o código. É de onde o Claude lê e onde ele salva as mudanças      | Grátis                                                                       |
| **Claude Code** (claude.ai)          | Faz as mudanças por ti, no celular ou no computador                      | Já tens                                                                      |
| **Supabase** (supabase.com)          | O banco onde ficam os teus dados, com login                              | Grátis                                                                       |
| **Vercel** (vercel.com)              | Publica o app num endereço da internet e gera uma prévia de cada mudança | Grátis                                                                       |
| **Chave de IA pra Luísa** (opcional) | Pra Luísa conversar de verdade                                           | Paga pelo uso, só com cartão. Uso pessoal costuma dar poucos dólares por mês |
| **Domínio comtay.com.br** (opcional) | Endereço próprio                                                         | ~R$ 40/ano no registro.br (aceita Pix)                                       |

> **Use o mesmo e-mail em tudo** e ative a verificação em duas etapas onde der (GitHub, Supabase,
> Vercel). São essas contas que protegem teus dados.

---

## 3. Receber o projeto (uma vez, com o Bruno)

1. Cria tua conta no **GitHub** e manda o teu nome de usuário pro Bruno.
2. O Bruno faz o merge do PR #1 (as últimas mudanças) e **transfere o repositório pra ti**
   (no GitHub: _Settings → General → Transfer ownership_).
3. Tu recebe um e-mail do GitHub e **aceita a transferência**. A partir daí o projeto é teu.

---

## 4. Ligar o Claude Code ao projeto (uma vez)

1. Abre **claude.ai/code** (ou o app do Claude no celular → Code).
2. Liga o GitHub quando ele pedir e **instala o app "Claude"** no teu GitHub, liberando o
   repositório `minha-vida-360`.
3. Na hora de escolher o ambiente da sessão, vai em **Network access** e libera estes endereços
   (sem isso o Claude não consegue testar nem falar com o banco e a Vercel):
   `registry.npmjs.org`, `*.supabase.co`, `api.supabase.com`, `api.vercel.com`, `*.vercel.app`.
4. Abre uma sessão no repositório e manda: **"Leia o CLAUDE.md e o docs/COMO-CONTINUAR.md e me diga
   em que pé o projeto está."** Se ele responder certinho, está tudo ligado.

---

## 5. Colocar no ar (uma vez, ~1 hora)

O passo a passo técnico está em `docs/SETUP.md`. Aqui vai o resumo do que é contigo e do que é com o
Claude.

> **Importante:** teus dados reais ainda estão **só no Lovable**. Não apaga nada lá até o
> passo 5.4 terminar e tu conferir que está tudo no app novo.

**5.1 Criar o Supabase** (tu, no site). _New project_ → nome `comtay` → região **São Paulo** →
plano Free. **Anota a senha do banco num lugar seguro.** Em _Authentication_, desliga "Allow new users
to sign up" (só tu entra).

**5.2 Criar o teu usuário** (tu, no site). _Authentication → Users → Add user_: e-mail
`tayane@minhavida360.app` (o login continua sendo o teu nome "tayane"), uma senha forte, marca
_Auto Confirm User_.

**5.3 Trazer os dados do Lovable** (precisa de um **computador**). Os comandos que mexem direto no
banco não funcionam pelo Claude na nuvem, então essa parte roda num computador:

- Instala o app **Claude** pro computador (tem Claude Code nele) e abre a pasta do projeto.
- Pede: **"Siga o docs/SETUP.md passos 1 e 3 comigo. Eu digito as senhas quando pedir."**
- Ele roda o export (pede teu nome e senha do Lovable, sem guardar), cria as tabelas no Supabase novo
  e importa. No fim aparece **"Importação conferida: contagens batem."**
- Se não tiver computador, pede ajuda ao Bruno só nesse passo (uns 15 minutos).

**5.4 Publicar na Vercel** (tu, no site). _Add New → Project_ → escolhe o repositório → em
_Environment Variables_ cadastra as quatro variáveis da tabela do `SETUP.md` passo 5 (endereço e
chave pública do Supabase) → **Deploy**. O endereço `….vercel.app` que aparecer é o teu app.

**5.5 Backup diário** (tu, no GitHub). No repositório: _Settings → Secrets and variables →
Actions → New repository secret_ → nome `DATABASE_URL`, valor = a "connection string" do Supabase
(botão _Connect_ → _Session pooler_, com a senha do banco no lugar de `[YOUR-PASSWORD]`). A partir
daí sai um backup todo dia (aba _Actions_ → _backup_).

**5.6 Luísa com IA de verdade (opcional).** Cria uma chave de API num provedor (DeepSeek é o mais
barato; Claude ou ChatGPT também servem) e cadastra na Vercel a variável `LLM_API_KEY`. Pra usar Claude
ou ChatGPT, pede ao Claude Code: **"Configure a Luísa pra usar [Claude/ChatGPT]: me diga quais
variáveis cadastrar na Vercel."** Depois, _Redeploy_.

**5.7 Conferir no celular.** Entra com teu nome e senha. Confere Finanças do mês, Meus Filhos,
Diário e tarefas. Instala na tela inicial. **Só depois disso para de usar o Lovable.**

---

## 6. Como pedir uma mudança (o dia a dia)

1. Abre uma sessão no Claude Code, no repositório `minha-vida-360`.
2. **Pede uma coisa só, com detalhes.** Bom:
   _"Na lista de compras da Casa, quero separar os itens por mercado e farmácia."_
   Ruim: _"melhora a casa"_.
3. Se ajudar, manda **print** da tela e diz o que quer diferente.
4. O Claude faz numa **cópia separada** (branch), roda os testes e abre um **PR**.
5. A Vercel cria uma **prévia** (um link) daquela mudança. Abre no celular e testa.
6. Gostou? Pede **"pode publicar"** ou aperta _Merge_ no PR. Não gostou? Explica o que mudar.
7. No fim da sessão, pede **"/handoff"**: ele anota onde parou, e a próxima sessão continua dali.

**Frases que ajudam:**

- "Me explica em português simples o que tu vai mudar antes de mexer."
- "Mostra um print da prévia no celular."
- "Rode os testes antes de dizer que terminou."
- "Isso mexe nos meus dados? Se sim, me explica o que acontece antes."

---

## 7. O que dá pra construir depois (na ordem que tu pediu)

Cada área nova nasce com 3 coisas: a **tela**, o que a **Luísa** consegue registrar por ela e o
**histórico**. Dá pra colar estes pedidos como estão:

1. **Meu Carro:** _"Crie a área Meu Carro no mesmo formato da área Casa: cadastro do carro,
   manutenções (troca de óleo, revisão, pneus) com data e valor, documentos com vencimento (IPVA,
   licenciamento, seguro) e histórico. A Luísa deve conseguir registrar 'troquei o óleo hoje, 180
   reais'."_
2. **Saúde:** _"Crie a área Saúde no mesmo formato da Casa: atividades (academia, caminhada) com
   frequência por semana, consultas e exames com data, e histórico. A Luísa registra 'fui na
   academia hoje'."_
3. **Contas e cartões em Finanças:** _"Quero cadastrar, editar e excluir minhas contas e cartões,
   com saldo inicial de cada uma."_
4. **Lembretes no celular:** _"Quero notificação no celular 30 e 10 dias antes das vacinas e
   vermífugos dos meus filhos, e no dia das tarefas com data."_
5. **"Luísa, como foi meu mês?":** _"Quero que a Luísa faça um resumo do mês de todas as áreas:
   gastos, tarefas feitas, academia, cuidados dos filhos."_
6. **Importar extrato do Santander:** manda um arquivo de exemplo exportado do app do banco e pede
   _"Quero importar esse extrato e conferir antes de salvar."_
7. **Login com e-mail de verdade + código no celular** (pra recuperar a senha sozinha).
8. **O mundo comtay (o jogo):** o mais trabalhoso. Antes de pedir código, decide de onde vem a arte
   (ilustradora, IA ou personagem montável). Ver `docs/SUGESTOES.md` §3.

---

## 8. Cuidados (pra não perder nada)

- **Nunca** cola senhas ou chaves no chat. Senha e chave vão só nos sites (Supabase, Vercel, GitHub).
- **Nunca** pede pro Claude apagar dados ou "limpar o banco". Se ele sugerir algo que mexe nos teus
  dados, pede pra explicar antes e confere se o backup do dia rodou.
- O Claude Code tem **limite de uso** no teu plano. Pedidos pequenos e um por sessão rendem mais. Se acabar,
  espera renovar.
- Se algo quebrar depois de publicar: _"A última mudança quebrou X. Desfaça a última publicação."_
  A Vercel também deixa voltar pra versão anterior em _Deployments → Promote_.
- Um backup não testado não é backup: de vez em quando pede _"confira se o backup de ontem está
  completo"_.

---

## 9. Se travar

- Copia a mensagem de erro inteira e cola pro Claude: _"Apareceu isso, o que faço?"_
- Se for coisa de conta ou de site (Supabase, Vercel, GitHub), pede: _"Me guia clique a clique."_
- O histórico de decisões e problemas resolvidos está em `docs/ACHADOS.md` e `worklog.md`.
