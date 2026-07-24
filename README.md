# UI Customers

Modulo React Native/Web para listagens e detalhes compartilhados de clientes, fornecedores e franquias.

## Relacionamentos

As abas de vendedores e contatos consultam o store `people_link`. Filtros de colecao usam IDs numericos; gravacoes preservam as IRIs exigidas pelo contrato JSON-LD.

## Validacao

Na raiz do `app-community`:

```sh
npm test -- --runInBand modules/controleonline/ui-customers/src/tests/react
npm run test:browser:manager -- --grep "scopes sellers and contacts"
```
