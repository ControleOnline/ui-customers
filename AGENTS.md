## Escopo
- Modulo de relacionamento com clientes, prospects e alguns cadastros comerciais relacionados.
- Cobre listagens, detalhes e navegacoes dessas entidades.

## Estado
- Este modulo tem implementacao ativa em `src/react` e deve constar em novos prompts.
- Se existir `src/vue`, ela e apenas legado e deve ser ignorada, salvo pedido explicito.

## Quando usar
- Prompts sobre clientes, prospects, detalhes de cliente e cadastros comerciais ligados ao relacionamento.

## Regras de detalhe
- No detalhe de cliente/prospect, o pin de cada endereco deve abrir uma escolha de navegacao com pelo menos `Google Maps` e `Waze`.
- Na aba `Vendedores` de cliente PJ, o contexto `APP_TYPE=MANAGER` pode vincular, editar, remover e visualizar multiplos vendedores, inclusive `comission` e `minimum_comission`.
- Fora de `APP_TYPE=MANAGER`, a tela pode identificar o vendedor vinculado, mas nao pode exibir `comission`, `minimum_comission` nem controles de gestao do vinculo.
- Essa restricao de vendedores/comissao e regra de negocio e de autorizacao. O front deve refletir o corte correto, mas a protecao real precisa existir tambem no backend dono de `people_link`.
