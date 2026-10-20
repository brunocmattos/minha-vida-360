# Casa 360 + Assistente Luísa (MVP)

## Escopo desta entrega

### 1. Página inicial "Casa" (nova rota `/casa`, autenticada)
- Ilustração em corte transversal (SVG/CSS leve, sem imagem pesada): casa clean, poucos móveis, plantas discretas, luz quente, paleta clara e arejada — contraste com o dark dos módulos internos, que permanece.
- Cômodos clicáveis com etiquetas: Quarto → Saúde Mental; Banheiro → Skincare & Cuidados; Home office → Carreira & Estudos; Academia → Saúde Física; Escritório (térreo) → Finanças; Cozinha → Alimentação; Jardim → Meus Filhos; Sala → Liz / Relacionamentos (espaço próprio, claramente separado do jardim dos pets).
- Cada zona navega para a área correspondente existente (`/area/saude`, `/area/autocuidado`, `/area/carreira`, `/area/financas`, `/area/cachorros`, `/area/social`…). Zonas sem módulo pronto levam à página da área (placeholder honesto já existente).
- Acessibilidade: lista textual alternativa de ambientes (links reais) abaixo/ao lado da casa; foco visível; `prefers-reduced-motion` respeitado.
- Mobile: a casa não encolhe ilegível — em telas pequenas vira cartões de ambientes empilhados (mesma ilustração por cômodo, simplificada) + lista textual.
- Animações discretas (brilho de luz, folhas), CSS puro.
- Luísa visível na casa (personagem ilustrada ruiva, SVG próprio, original) com balão "Falar com a Luísa" que abre o chat.
- Pets no jardim: reusar as ilustrações já existentes `src/assets/pets/{dobby,paco,zara}.png` em escala coerente.
- Avatar da usuária: NÃO será inventado (sem foto real). A casa não exibirá personagem da usuária; só a Luísa e os pets.
- `/` passa a redirecionar para `/casa` (logada) em vez de `/meu-dia`; "Meu Dia" continua no menu.

### 2. Assistente Luísa — chat global persistente (MVP real, não simulado)
- **Banco (migração aditiva, RLS por owner):**
  - `luisa_conversations` (id, owner_id, title, created_at, updated_at)
  - `luisa_messages` (id, owner_id, conversation_id, role, content, action jsonb, created_at)
  - Grants + policies SELECT/INSERT/UPDATE/DELETE por `auth.uid()`.
- **Backend:** server function autenticada (`requireSupabaseAuth`) chamando o Lovable AI Gateway (`openai/gpt-6-astra`, chave `LOVABLE_API_KEY` só no servidor). O modelo interpreta a mensagem e devolve JSON estruturado: `{ reply, action? }`.
- **Ações de escrita (com confirmação obrigatória):**
  - `criar_despesa`: extrai descrição, valor (R$), data/competência; grava em `fin_entries` (kind=despesa, nature=variavel, wallet=banco, sem recorrência) **somente após a usuária confirmar o resumo** exibido no chat. Se faltar valor ou data, a Luísa pergunta.
  - `registrar_diario`: grava em nova tabela `diary_entries` (owner_id, entry_date, area_slug, content, created_at) — cria a base mínima real do Diário 360, listada na página da área.
  - `consultar_resumo`: responde com dados reais (resumo do mês financeiro, cuidados de pets pendentes) sem escrever nada.
  - Pets (ex.: "atualiza vacina do Paco"): a Luísa responde que ainda não grava cuidados de pets pelo chat e orienta abrir Meus Filhos — **sem fingir automação**.
- Confirmação: card no chat com os campos interpretados + botões Confirmar/Cancelar; grava só após sucesso real; erro exibido com opção de corrigir. Sem duplicar: ação confirmada grava uma vez (botão desabilita após sucesso).
- **UI:** botão flutuante "Luísa" em todas as telas autenticadas (dentro do AppShell) + acesso pela casa. Painel de chat com histórico de conversas (lista + nova conversa), mensagens persistidas, estados de erro. Microfone: botão com Web Speech API quando disponível; se o navegador não suportar, o botão some — sem promessa falsa.
- Estética da Luísa: avatar SVG ruivo ilustrado, original, usado na casa e no chat.

### 3. O que NÃO entra nesta entrega (informado com honestidade)
- Avatar da usuária (aguarda foto real/autorização).
- Escrita em pets, tarefas e demais módulos via chat (arquitetura extensível fica pronta; só despesa e diário gravam).
- Importação de extratos, IA avançada, publicação.
- Nenhum dado de peso/idade dos pets é alterado.

## Arquivos principais
- `supabase/migrations/0008_luisa_chat_diary.sql` (novo)
- `src/routes/_authenticated/casa.tsx` (novo) + `src/components/house/*` (SVG da casa, cômodos, Luísa)
- `src/components/luisa-chat.tsx` (novo), `src/lib/luisa.functions.ts` (server fn), `src/lib/luisa.ts` (tipos/parser)
- `src/components/app-shell.tsx` (botão flutuante + montar chat)
- `src/routes/index.tsx` (redirect → /casa)
- `src/components/diary-module.tsx` (listagem mínima real do Diário 360)
- Testes: `src/test/luisa.test.ts` (parser de ação, validações)

## Verificação
- Build + testes existentes (27) e novos.
- Playwright autenticado: casa desktop/mobile, navegação pelos cômodos, chat end-to-end ("gastei R$120 no mercado" → confirmação → registro real em fin_entries → aparece em Despesas), diário, RLS anônima bloqueada.
