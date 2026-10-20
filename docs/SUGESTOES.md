# Sugestões — Minha Vida 360

O que fazer além de consertar (os consertos estão em [ACHADOS.md](ACHADOS.md)).
A ordem de execução está em [ROADMAP.md](ROADMAP.md).

---

## 1. Luísa com IA barata (ex.: DeepSeek)

A ideia da Luísa é boa e a estrutura dela já é a certa: o modelo **só propõe**, a Tayane **confirma**,
e o servidor valida tudo de novo antes de gravar (`src/lib/luisa.ts`). Trocar o "cérebro" é
uma mudança pequena e localizada em `src/lib/luisa.functions.ts`.

**Provedor configurável, não fixo.** Em vez de trocar Lovable por DeepSeek no código, ler três
variáveis de ambiente — `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` — usando o `@ai-sdk/openai` que já
está instalado. Assim dá pra trocar de provedor na Vercel, sem mexer em código, se o preço ou a
qualidade mudarem.

**O que muda para o DeepSeek funcionar** (verificado na documentação deles em 2026-10-20):

- Hoje o código usa a _Responses API_ da OpenAI com esquema JSON estrito e opções de "reasoning".
  O DeepSeek fala o formato **chat completions** (compatível com OpenAI, `https://api.deepseek.com`)
  e só tem **modo JSON** (`json_object`), sem esquema estrito.
- Então: usar `provider.chat(...)` em vez de `provider.responses(...)`, tirar as opções de reasoning,
  pedir JSON no prompt com um exemplo e manter a validação que já existe (`parseLuisaOutput`).
- A documentação avisa que às vezes volta resposta vazia — o código já tem um "tente de novo" pra isso.

**Custo estimado** (`deepseek-flash`, preço de pico: US$ 0,30/1M tokens de entrada, US$ 1,20/1M de saída):
cada mensagem leva ~3 mil tokens de contexto e devolve ~300 → **~US$ 0,001 por mensagem**.
Com 30 mensagens por dia, uns **US$ 1/mês**; fora do horário de pico, metade. Estimativa, não medição.

**Ponto de atenção — privacidade.** A Luísa manda pro modelo o resumo financeiro do mês e os
cuidados dos pets. O DeepSeek processa na China. Se isso incomodar, as opções baratas equivalentes
(Gemini Flash-Lite, GPT mini, Claude Haiku) custam na mesma ordem de centavos — e com o provedor
configurável a troca é só de variável.

**Antes de ligar em produção:** limite diário de mensagens por usuária e tamanho máximo de mensagem
(ACHADOS B4), e corrigir o histórico que pega as mensagens mais antigas.

**Próximos poderes da Luísa** (mesmo padrão "propõe → confirma"):

- Relatórios só de leitura: "quanto gastei com os filhos esse mês?", "o que vence essa semana?".
- Criar tarefa no Meu Dia, registrar cuidado de pet, lançar receita.

---

## 2. Deixar fácil de mudar (foto, cor, texto) — sem ser dev

Hoje mudar uma cor é fácil (`src/styles.css`), mas mudar um nome ou uma foto exige caçar em vários
arquivos (ACHADOS C2). A proposta é **um lugar para cada tipo de coisa**:

| O quê                                                 | Onde ficaria                                 | Como ela pede ao Claude Code             |
| ----------------------------------------------------- | -------------------------------------------- | ---------------------------------------- |
| Cores, fontes, tema de cada cômodo                    | `src/config/theme.css`                       | "deixa o quarto mais rosa"               |
| Textos, nome do app, áreas, lugares, pets, benefícios | `src/config/content.ts`                      | "troca o nome do Paco na tela"           |
| Fotos e ilustrações                                   | `public/images/` (mesmo nome = troca a foto) | manda a foto e pede "usa essa no jardim" |

E o `CLAUDE.md` já instrui o Claude Code a explicar em português simples, trabalhar em branch,
rodar os testes e **nunca** mexer em dados ou banco sem confirmar com ela.

**Fluxo de mudança pelo celular:**

1. Ela abre o Claude Code no celular (claude.ai/code ou app), no repositório do GitHub.
2. Pede a mudança em português. O Claude Code cria um branch e faz a mudança.
3. A Vercel gera sozinha um **link de prévia** daquele branch → ela abre no celular e confere.
4. Gostou → o Claude Code junta no principal → a Vercel publica no endereço oficial.
5. Não gostou → descarta o branch; nada mudou no app dela.

Pré-requisito: o código num repositório **privado** no GitHub conectado à Vercel (Fase 1).

---

## 3. O mini-jogo: mapa da vida

A visão: um mapa com a casa, o hospital, o veterinário, a Guarida, o banco… ela toca num lugar, a
bonequinha dela anda até lá e abre as pendências daquela área. **O projeto atual já tem metade
das peças.**

**O que já existe e serve:**

- A casa (`house-casa.tsx`) já é um desenho SVG com áreas tocáveis, acessível por teclado e com uma
  lista de links por baixo como alternativa.
- Cada lugar do mapa já tem uma área equivalente em `src/lib/areas.ts`: hospital → `saude`,
  veterinário → `cachorros`, Guarida → `carreira`, banco → `financas`, casa → `casa`, carro → `carro`.
- A página de cada área (`/area/<slug>`) já existe.
- Já dá pra contar pendências: tarefas por área (`tasks.area_slug`), cuidados atrasados dos pets
  (`careStatus` em `lib/pet-care.ts`), contas não pagas (`fin_entries`).

**O que falta:** só finanças, filhos e diário têm módulo de verdade; as outras áreas mostram
"em construção" e, por enquanto, as pendências delas seriam só as tarefas.

**Arquitetura sugerida:**

1. **Lugares como dados**: um arquivo `places` com `{ id, nome, x, y, área, imagem }` (posição em %
   do mapa). O mapa e a lista acessível nascem do mesmo arquivo — adicionar um lugar é adicionar uma linha.
2. **SVG, não canvas**: uma imagem de fundo + pontos tocáveis, igual a casa faz hoje. Com menos de
   ~20 lugares é leve e funciona bem no celular.
3. **Bonequinha andando**: animação com CSS (`transform`), seguindo um pequeno mapa de caminhos
   entre os lugares. Sem biblioteca nova. Para quem pede "menos movimento" no celular, ela teletransporta.
4. **Pendências**: um contador (badge) em cada lugar; tocar abre uma gaveta de baixo com a lista e um
   link para a página completa da área.
5. **Celular primeiro**: alvos de toque de 44px, imagem de fundo em WebP leve, uma proporção fixa de mapa.
6. **A casa vira o "interior"**: tocar na casa entra na casa ilustrada atual, que continua igual.
7. **Lembrar onde a bonequinha está** no próprio aparelho (não precisa de banco pra isso no começo).

Pode ser construído em partes: primeiro o mapa estático com badges (já útil), depois a animação,
depois a bonequinha personalizável.

---

## 4. Celular e experiência

- Botões de toque maiores (44px) e afastados; confirmação antes de excluir (ACHADOS B6, C5).
- Fonte dos campos em 16px para o iPhone não dar zoom ao tocar.
- Imagens em WebP (a home hoje carrega ~3 MB só de ilustração).
- **Instalar como app (PWA)**: ícone na tela inicial e abertura em tela cheia, sem barra do navegador.
  O app já tem a base (`viewport-fit=cover`, cor de tema). Barato e muda muito a sensação de "app de verdade".

---

## 5. Segurança e tranquilidade

- No Supabase novo: cadastro público desligado, senha forte, e de preferência MFA (código no celular)
  para a conta dela — é a vida financeira dela ali.
- Backup: confirmar no painel o que o plano escolhido do Supabase oferece (o gratuito, até onde sei,
  não dá backup que ela mesma consiga restaurar). Um export periódico (ex.: semanal, via GitHub Actions)
  para um lugar privado evita perder anos de registros, seja qual for o plano.
- Plano gratuito do Supabase **pausa o projeto após ~1 semana sem uso** (confirmar a regra atual):
  se ela ficar uns dias sem abrir, o app para até alguém reativar no painel. Um "ping" agendado
  ou o plano pago resolve.
- Cabeçalhos de segurança na Vercel (`vercel.json`) — custo baixo.
- Tirar dados pessoais do código para a configuração (ACHADOS C2) antes de qualquer chance de o repo ficar público.

---

## 6. O que **não** fazer agora

- Reescrever o app do zero: a base é boa, testada e o esquema do banco é sólido.
- Trocar de framework ou de banco.
- Adicionar biblioteca de animação/jogo antes de o mapa estático provar o valor.
- Deixar a Luísa gravar sem confirmação — o "propõe → confirma" é o que torna ela segura.
