# Cliente × Vendedor — vínculo e permissões (ui-customers)

Documentação técnica do papel de `ui-customers` na entrega `ControleOnline/ui-crm#2`, estendida por `ui-customers#10` (comissão de franquia) e `ui-customers#12` (comissão de vendedor + override por cliente).

## Papel deste módulo

Aba **Vendedores** no detalhe do cliente (`ClientDetails`).

- Lista vínculos `sellers-client` via store `people_link`.
- Navegação para o detalhe da pessoa/empresa vinculada.
- Gestão administrativa (vincular, editar, remover, múltiplos vínculos, comissões) deve ocorrer **somente** quando `APP_TYPE=MANAGER` (ou `ADMIN`).

## Arquivos principais

- `src/react/components/tabs/SalesmanTab.js`
- `src/react/components/tabs/salesmanTabHelpers.js` (precedência de comissão, permissão de edição, formatação)
- helpers de montagem de links em `employeeContacts.js`
- página de detalhe: `src/react/pages/details.js` (passa contexto / `APP_TYPE` para a aba)

## Regra de negócio — sentido do fluxo de comissão

| Papel do vínculo | `linkType` | Direção do pagamento | Quem paga / quem recebe |
| --- | --- | --- | --- |
| **Franquia** | `franchisee` | Franqueada → Franqueadora | A franqueada **paga** a comissão ao franqueador |
| **Vendedor** | `salesman` (empresa↔vendedor) e `sellers-client` (vendedor↔cliente) | Empresa → Vendedor | O vendedor **recebe** a comissão da empresa da qual é vendedor |

Essa distinção é obrigatória na documentação e, quando possível, em tooltips/ajuda da UI.

## Precedência de comissão (vendedor)

No vínculo padrão do vendedor com a empresa (`people_link` com `linkType = salesman`) pode existir uma comissão padrão (ex.: 10%).

Quando existir vínculo específico do vendedor com **aquele cliente** (`people_link` com `linkType = sellers-client`), a comissão informada nesse vínculo **prevalece** (ex.: 15%).

Ordem de resolução (por campo `comission` / `minimum_comission`):

1. Valor do vínculo **vendedor ↔ cliente** (`sellers-client`), se estiver preenchido (inclui `0`)
2. Senão, valor padrão do vínculo **vendedor ↔ empresa** (`salesman`)
3. Senão, sem valor (`—`)

Na aba **Vendedores** o valor **efetivo** é exibido com indicação:

- `override` — veio do vínculo cliente-vendedor
- `padrão` — veio do vínculo vendedor-empresa

Implementação canônica: `resolveEffectiveCommission` em `salesmanTabHelpers.js`.

## Regras de UI

| Capacidade | MANAGER / ADMIN | Não MANAGER |
| --- | --- | --- |
| Ver vendedor | sim | sim |
| CRUD de vínculos | sim | não |
| Ver comissão / comissão mínima | sim | não |
| Editar comissão (lápis) | somente `ROLE_SUPER` ou `ROLE_OWNER` | não |

Edição de `comission` / `minimum_comission` no vínculo `sellers-client`:

- **Editável** (ícone de lápis) para **superadmin** (`ROLE_SUPER`) ou **owner** (`ROLE_OWNER`) da empresa.
- Somente leitura para demais perfis.
- Persistência via `people_link.save` no backend (`api-platform-people`).

## Contrato com outros módulos

| Origem | Expectativa |
| --- | --- |
| `ui-crm` | chega com `clientId`, `contextKey=client`, opcionalmente `initialTab=sellers` |
| `api-platform-people` | leitura/escrita de `people_link`; campos `comission`, `minimum_comission`, `linkType`; vínculo automático e filtros de segurança |

## Segurança

A UI **não** é enforcement final. Comissão e escrita de vínculos sensíveis devem ser filtradas no backend (`PeopleLink` / `PeopleLinkService`).

- Comissão não deve ser exposta fora de `MANAGER`/`ADMIN` na UI.
- Escrita restrita a superadmin/owner na UI; o backend deve aplicar o mesmo menor privilégio.

## Testes

- Unit: `src/tests/react/components/tabs/salesmanTabHelpers.test.js` (precedência, permissão, formatação)
- Browser smoke: `src/tests/browser/manager/client-details-salesman-commission.spec.js` (padrão, override, editável vs somente leitura)

## Documento canônico do fluxo completo

Ver também: `ControleOnline/ui-crm` → `docs/technical/Cliente-Vendedor-Vinculo-e-Permissoes.md`
