## Escopo

- `ui-customers` concentra listagens e detalhes compartilhados de clientes, fornecedores e franquias.
- As abas de relacionamento de pessoas juridicas usam `people_link` como fonte de verdade.

## Contrato de relacionamentos

- Filtros de leitura de `/people_links` recebem IDs numericos em `company` e `people`.
- Payloads de gravacao de relacionamentos continuam usando IRIs JSON-LD.
- Vendedores devem ser validados pelo `people` do cadastro aberto; contatos devem ser validados pelo `company` do cadastro aberto.
- Respostas fora do escopo solicitado nunca devem ser renderizadas, mesmo quando o backend ignorar um filtro.
- Abas que compartilham o store `people_link` devem consumir o retorno da propria action para nao misturar consultas concorrentes.

## Testes

- Testes unitarios vivem em `src/tests/react`.
- O smoke do detalhe compartilhado vive em `src/tests/browser/manager`.
