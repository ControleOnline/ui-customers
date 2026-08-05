# Cliente × Vendedor — vínculo e permissões (ui-customers)

Documentação técnica do papel de `ui-customers` na entrega `ControleOnline/ui-crm#2`.

## Papel deste módulo

Aba **Vendedores** no detalhe do cliente (`ClientDetails`).

- Lista vínculos `sellers-client` via store `people_link`.
- Navegação para o detalhe da pessoa/empresa vinculada.
- Gestão administrativa (vincular, editar, remover, múltiplos vínculos, comissões) deve ocorrer **somente** quando `APP_TYPE=MANAGER`.

## Arquivos principais

- `src/react/components/tabs/SalesmanTab.js`
- helpers de montagem de links em `employeeContacts` / helpers da aba (quando presentes no branch da entrega)
- página de detalhe: `src/react/pages/details.js` (passa contexto / `APP_TYPE` para a aba)

## Contrato com outros módulos

| Origem | Expectativa |
| --- | --- |
| `ui-crm` | chega com `clientId`, `contextKey=client`, opcionalmente `initialTab=sellers` |
| `api-platform-people` | leitura/escrita de `people_link`; vínculo automático e campos de comissão |

## Regras de UI

| Capacidade | MANAGER | Não MANAGER |
| --- | --- | --- |
| Ver vendedor | sim | sim |
| CRUD de vínculos | sim | não |
| Ver comissão / comissão mínima | sim | não |

## Segurança

A UI **não** é enforcement final. Comissão e escrita de vínculos sensíveis devem ser filtradas no backend (`PeopleLink` / `PeopleLinkService`).

## Documento canônico do fluxo completo

Ver também: `ControleOnline/ui-crm` → `docs/technical/Cliente-Vendedor-Vinculo-e-Permissoes.md`
