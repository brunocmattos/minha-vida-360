# Identidade dark premium + Finanças

## Entrega
- Renovar o visual global com fundo carvão, superfícies em camadas, tipografia sem serifas, bordas discretas e acentos violeta/magenta. Preservar login, tarefas, áreas, Cancelar/Salvar e Voltar.
- Reorganizar Finanças em **Visão geral**, **Receitas e despesas**, **Calendário/fluxo**, **Projeção 12 meses** e **Recorrências/Categorias**.
- Exibir **Carteira do mês** com **Movimentação líquida confirmada no mês** e resultado projetado separado. Informar que não há saldo inicial cadastrado e que o movimento não equivale ao saldo bancário.
- Manter todos os campos e ações dos lançamentos em tabela detalhada, com filtros por tipo, categoria, status e natureza; conservar as visões por vencimento e despesas por categoria.
- Acrescentar natureza **Não classificada / Fixa / Variável / Anual** na criação/edição e nas recorrências, sem confundir natureza com frequência.
- Usar os pagamentos atuais para confirmar entrada/saída. Calendário e fluxo mostram apenas vencimentos e pagamentos cadastrados.
- Indicar importação, IA, dívidas/parcelas e reservas como futuras, sem controles falsos.

## Limites e pressupostos
- Não recebi uma imagem de referência neste pedido; seguirei a direção visual descrita, sem inventar uma referência.
- Não alterar credenciais, políticas de privacidade ou registros existentes; não publicar.
- Não criar saldo inicial, contas bancárias, recorrência anual ou histórico de pagamentos nesta entrega. “Anual” será classificação, não geração automática anual.
- A confirmação financeira preservará o modelo atual de valor efetivo total e data de pagamento.

## Detalhes técnicos
- Atualizar tokens globais, fontes e componentes compartilhados, sem reconstruir o aplicativo.
- Migração aditiva com enum de natureza em lançamentos e modelos de recorrência, default seguro “não classificada”; preservar RLS, índices e dados. Propagar natureza nas ocorrências futuras conforme o escopo de edição existente.
- Reutilizar a lógica financeira atual; separar novas visualizações em componentes pequenos e controles do sistema de design.
- Testar cálculo confirmado vs projetado, classificação e recorrências; executar os testes existentes afetados.
- Verificar no navegador autenticado criação, cancelamento, edição, pagamento, filtros, recarregamento e exclusão de registros temporários de teste; comparar registros anteriores sem expor valores.
- Conferir rotas e telas desktop/celular e consultar o uso de créditos disponível, informando eventual limite de medição.