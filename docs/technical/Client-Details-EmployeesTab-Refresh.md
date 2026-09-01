# Client Details — aba Colaboradores (EmployeesTab) e atualização da lista

Documentação técnica da aba **Colaboradores** no detalhe do cliente/empresa (`Client Details`) e do padrão de **invalidação/refetch** da lista após edição, sem refresh manual da página.

Trilha de origem: [app-community#375](https://github.com/ControleOnline/app-community/issues/375).

## Como este módulo se encaixa

| Visão (`APP_TYPE`) | Uso neste fluxo |
| --- | --- |
| **MANAGER** | Detalhe administrativo de pessoa jurídica/cliente; aba **Colaboradores** lista e permite criar vínculos (`people_link`) e abrir o detalhe PF do colaborador |
| **CRM** / outros | Reutilizam `ClientDetails` e a mesma aba quando a tab está visível; o contrato de leitura (`people_links`) e o ciclo de foco são os mesmos |

`ui-customers` é o dono da tela de detalhe e das abas (incluindo `EmployeesTab`). O backend de vínculos permanece em `api-platform-people` (`people_link`); esta página não redefine contratos de escrita.

## Objetivo

Registrar:

1. fonte de dados da lista de colaboradores;
2. ciclo de vida da lista (montagem vs reganho de foco);
3. fluxo de criação vs edição (e por que o edit dependia de F5 antes do #375);
4. modularização e testes de aceitação do refresh.

## Repositórios afetados

| Módulo | Papel no fluxo |
| --- | --- |
| `ui-customers` | `EmployeesTab`, helpers, smoke de refresh ao foco |
| `app-community` | Composição / pin do submódulo; rota `/client-details` |
| `api-platform-people` | Recurso `people_link` (leitura da coleção; inalterado no #375) |

## Regras de negócio (UI)

### Entrada

- Rota típica: `/client-details?clientId=<id>` (pessoa jurídica / empresa).
- Aba: **Colaboradores** (`EmployeesTab`).
- Lista: vínculos da empresa com `linkType` em `{ employee, owner, director, manager, courier }`, obtidos via store `people_link` (`getItems` / `getPeopleLinks`).

Parâmetros de leitura relevantes (via helpers / `buildPeopleLinkReadParams`):

- `companyId` = id da pessoa jurídica pai;
- `linkTypes` = conjunto acima;
- `itemsPerPage` elevado (ex.: 100) para não truncar empresas com muitos colaboradores.

Normalização: `buildEmployeeContactsFromPeopleLinks` + avatares a partir de `peopleMedia` já presente no payload de `people_links` (sem chamada extra a `/people_media` na listagem).

### Criação de colaborador

1. Botão **+** abre modal local (`name`, `alias`, data, `linkType`).
2. Save chama `peopleActions.company(payload)` (payload montado por `buildEmployeeCreatePayload`).
3. Em sucesso: fecha modal e **chama `fetchEmployees()` imediatamente** — a lista já era atualizada sem F5 nesse caminho.

### Edição de colaborador (problema resolvido no #375)

1. Toque na linha navega para o detalhe PF do colaborador (`buildEmployeeDetailNavParams`: `contextKey=contacts`, `initialTab=general`, `parentCompanyId`, `linkType`).
2. No detalhe, o usuário altera e salva (fluxo de outras abas / people).
3. Ao **voltar** para a aba Colaboradores, a lista precisa refletir os novos valores **sem** reload completo da página.

**Causa raiz (#375):** `fetchEmployees` era disparado só no `useEffect` de montagem. Ao navegar para o detalhe e voltar, a tab **não** era desmontada/remontada de forma confiável; o efeito de montagem não rodava de novo e a lista ficava com o snapshot antigo.

**Solução canônica:** trocar o efeito de montagem por `useFocusEffect` + `useCallback`, reexecutando `fetchEmployees` **sempre que a tab reganha foco** (padrão já usado em telas como `Profile` em `ui-people`).

```text
montagem / reganho de foco
        │
        ▼
  fetchEmployees()
        │
        ▼
  getPeopleLinks(companyId, linkTypes, itemsPerPage)
        │
        ▼
  normalize → setEmployees(...)
```

Create continua chamando `fetchEmployees()` após save; edit/return passa a invalidar via foco.

### O que não muda

- Contrato de API / payload de escrita de `people` / `people_link`.
- Layout da aba, campos do colaborador, exclusão ou troca de `linkType` além do já existente.
- AuthZ: continua a mesma leitura já autorizada; sem endpoint ou campo novo.

## Modularização (UI)

| Arquivo | Papel |
| --- | --- |
| `src/react/components/tabs/EmployeesTab.js` | Lista, modal de create, `fetchEmployees`, `useFocusEffect` |
| `src/react/components/tabs/employeesTabHelpers.js` | `LINK_TYPE_OPTIONS`, normalização, nav params, payload create |
| `src/react/components/tabs/employeeContacts.js` | `buildEmployeeContactsFromPeopleLinks`, params de leitura |
| `src/react/pages/details.js` | ClientDetails e composição das tabs |

Limite absoluto do projeto: **≤ 500 linhas** por arquivo.

## Testes

| Tipo | Local | Cobertura |
| --- | --- | --- |
| Unit | `src/tests/react/components/tabs/employeesTabHelpers.test.js` (e media) | helpers de normalização / linkType / media |
| Browser smoke | `src/tests/browser/manager/client-details-employees-refresh.spec.js` | lista inicial → simulação de leave/return (foco) → segundo GET de `people_links` com payload atualizado, sem F5 |

O smoke cobre o critério de aceite de #375: após “voltar” (regain de foco), a UI mostra o nome/alias atualizados a partir da resposta mockada da API.

## O que este módulo **não** faz

- Não é o enforcement de autorização de escrita no backend.
- Não redefine o fluxo de detalhe PF do colaborador (GeneralTab etc.).
- Não substitui o padrão de outras abas (GeneralTab, MediaTab, UsersTab) — apenas alinha EmployeesTab ao lifecycle de foco já usado no ecossistema.

## Links cruzados

| Destino | URL |
| --- | --- |
| Home deste módulo | https://github.com/ControleOnline/ui-customers/wiki |
| Client Details — criar usuário (UsersTab) | https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Criar-Usuario |
| Cliente × Vendedor | https://github.com/ControleOnline/ui-customers/wiki/Cliente-Vendedor-Vinculo-e-Permissoes |
| App home | https://github.com/ControleOnline/app-community/wiki |
| Issue de origem | https://github.com/ControleOnline/app-community/issues/375 |
| Visões do app | https://github.com/ControleOnline/app-community/blob/master/MODOS_OPERACAO.md |

Cópia versionada no Git: `docs/technical/Client-Details-EmployeesTab-Refresh.md`
