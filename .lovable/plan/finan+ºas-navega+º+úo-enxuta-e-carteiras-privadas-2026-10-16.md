# Finanças: navegação enxuta e carteiras privadas

## Resultado
- `/area/financas` vira um painel curto: três carteiras, gráfico pequeno de receitas/despesas e **exatamente quatro cards** — Receitas, Despesas, Dívidas e Planejamento anual. Sem tabelas extensas ou atalho Parcelamentos.
- Cada card abre sua própria tela, com Voltar seguro e a mesma competência mantida na navegação.
- Preservar login, tarefas, identidade dark, registros reais, histórico, regras de Joici e todos os fluxos existentes. Não publicar.

## 1. Navegação e apresentação primeiro
- Reutilizar os formulários e cálculos atuais, separando sua apresentação por tela; não reconstruir o módulo.
- Receitas: fixas, variáveis, temporárias, nessa ordem; preservar nomes/subgrupos e confirmação independente. Guarida terá **Ver contracheque**, sem adicionar consignados às despesas.
- Despesas: tabela detalhada, filtros e visões por grupo/categoria/vencimento; recorrências e categorias em seção secundária recolhível. Anuais/periódicas ficam em seção própria mesmo com valor zero, com **Lançar previsão**.
- Detalhes de parcelas e composição de agrupadores em modal acessível, com progresso e fim; nunca somar agrupador como lançamento adicional.
- Dívidas: preservar SPC/Serasa isolado e completar criação/edição/exclusão, sem impacto nas carteiras.
- Planejamento anual: 12 meses, resultado previsto, contas anuais e metas de poupança, sem dupla contagem.
- Cores semânticas com rótulos/ícones: verde para receitas, vermelho para despesas/negativos, cinza para previsto e violeta/azul para planejamento. Menos texto branco e mais respiro, mantendo contraste e celular.

## 2. Saldos e transferências
- Guardar a abertura autorizada de novembro/2026 **somente na conta privada**, sem colocá-la no código ou nos testes. Identificação: **saldo de abertura informado — conta corrente (a confirmar)**.
- Lápis permite editar sem justificativa; destaque separado para Saldo mês anterior e opção de incluir/excluir no cálculo. Guardar histórico de ajustes.
- Saldo real estimado = abertura incluída + recebimentos confirmados − pagamentos confirmados + transferências líquidas. Resultado previsto separado; nunca tratar previsto como dinheiro disponível.
- Para competências seguintes, calcular abertura pelo fechamento anterior; ajuste manual prevalece sem modificar receitas/despesas passadas. Meses sem abertura conhecida continuam indicando valor a definir, sem presumir zero como saldo conhecido.
- Poupança, Pluxee e iFood terão aberturas próprias ajustáveis. Nenhum valor de poupança/alimentação será inferido.
- Transferências apenas entre conta corrente e poupança, com valor/data e reversão registrada. Não entram como receita/despesa. Pluxee/iFood não poderão ser origem/destino.
- Metas de poupança com criar/editar/excluir; valores e prazos podem ficar a definir. Não cadastrar metas de exemplo.

## 3. Alimentação e integridade dos registros
- Separar Pluxee Guarida e iFood Benefícios Riachuelo dentro de Alimentação, preservando os recebimentos atuais de Pluxee.
- Cadastrar iFood autorizado de forma idempotente, previsto mensal zero, natureza fixa, sem confirmar recebimento. Preservar Pluxee existente e sua edição mensal.
- Manter benefício fora de conta corrente e do resultado bancário do planejamento.
- Conferir contagens e registros antes/depois; preservar os cinco registros SPC/Serasa e seu total informado, parcelas, contracheque e fórmula de Joici.

## Detalhes técnicos
- Rotas próprias sob `/area/financas`, usando a convenção existente e rotas desaninhadas quando necessário para não ficarem ocultas pela página `/area/$slug`. Metadados próprios por tela; competência em parâmetro de busca compartilhado.
- Extrair a leitura/ações financeiras compartilhadas sem alterar as regras existentes; reutilizar componentes de pagamento, edição, categorias, anuais e contracheque.
- Migração **aditiva** para aberturas por proprietária/carteira/competência, histórico de ajustes, transferências e metas. Todas as tabelas novas terão `owner_id`, concessões explícitas e RLS privada; validar valores, carteiras e referências por proprietária.
- Diferenciar os dois benefícios com identificação própria, preservando a categoria geral de benefício e dados existentes. Cadastro real somente via ação autenticada/consulta privada, nunca fixture, código público ou semente de carregamento.
- Reversão de transferência atômica/idempotente, preservando trilha de auditoria. Aberturas e exclusão de metas também serão validadas na camada privada.

## Verificação e entrega
- Testes automáticos: confirmado versus previsto, inclusão de abertura, transporte mensal/ajuste manual, transferências sem dupla contagem/reversão, benefícios separados e Joici.
- Navegador autenticado: quatro rotas, criação/edição/cancelamento, pagamentos, modal de parcelas, contracheque, anuais zeradas, transferências e recarregamento; desktop/celular e ausência de erros.
- Conferir RLS e bloqueio anônimo/de proprietária incorreta, cadastro iFood sem duplicação e preservação dos registros anteriores. Não divulgar dados privados nas evidências.
- Informar consumo de créditos quando disponível, testes realizados e qualquer limitação. O acesso dentro do editor Lovable depende da sessão da usuária; validar o app servido e não alegar ter operado o editor se esse acesso não estiver disponível.

## Ordem e limite
Executar navegação/UI e integridade primeiro, depois saldos/benefícios/transferências/metas. Se houver bloqueio ou a entrega precisar ser dividida, deixar o app coerente e informar precisamente o que funciona e o que ainda falta; não apresentar saldos ou ações pendentes como concluídos.