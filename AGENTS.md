## Escopo
- Modulo de relacionamento com clientes, prospects e alguns cadastros comerciais relacionados.
- Cobre listagens, detalhes e navegacoes dessas entidades.

## Estado
- Este modulo tem implementacao ativa em `src/react` e deve constar em novos prompts.
- Se existir `src/vue`, ela e apenas legado e deve ser ignorada, salvo pedido explicito.

## Quando usar
- Prompts sobre clientes, prospects, detalhes de cliente e cadastros comerciais ligados ao relacionamento.

## Regras
- No detalhe React de pessoa fisica (`ClientDetails`), a aba `users` e o lugar canonico para manter usuarios vinculados a essa pessoa.
- Essa aba deve preservar o comportamento legado minimo: listar usuarios, criar usuario, trocar senha, remover usuario e consultar/renovar chave de API sem sair do cadastro da pessoa.
