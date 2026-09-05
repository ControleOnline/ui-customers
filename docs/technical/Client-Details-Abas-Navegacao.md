# Client Details — abas e navegação

Documentação técnica da **barra de abas** da tela **Client Details** (`/client-details`): como as abas são montadas, quais chaves existem por tipo de pessoa e contexto, e o que **não** faz parte da navegação desta tela.

Trilha de origem: [app-community#758](https://github.com/ControleOnline/app-community/issues/758) (remoção da aba dedicada `Categories` / Classificação).

## Como este módulo se encaixa

| Visão (`APP_TYPE`) | Uso neste fluxo |
| --- | --- |
| **MANAGER** | Detalhe administrativo de pessoa/cliente/colaborador/fornecedor; abas de cadastro e vínculos |
| **CRM** / **POS** / outros | Reutilizam `ClientDetails` conforme rota e `contextKey`; o conjunto de abas é o mesmo contrato de UI (filtrado por `peopleType` e contexto) |

`contextKey` (query) seleciona o modo do detalhe (`employee`, `client`, `provider`, etc.). Ele **não** adiciona a aba Categories; apenas influencia abas condicionais (ex.: `products` em contexto de fornecedor).

## Objetivo

Registrar:

1. fonte única de definição das abas (`buildClientTabDefs`);
2. conjuntos canônicos PF vs PJ e abas condicionais;
3. resolução de aba inicial (`resolveInitialTabIndex`) quando a query pede uma chave inexistente ou removida;
4. onde fica a classificação de pessoa (não é aba dedicada nesta tela).

## Repositórios afetados

| Módulo | Papel no fluxo |
| --- | --- |
| `ui-customers` | Página `details.js` (ClientDetails), helpers `clientDetailsHelpers.js`, abas em `src/react/components/tabs/` |
| `app-community` | Composição / pin do submódulo; rota `/client-details` |

Não há delta de API obrigatório para a navegação de abas: a remoção da aba é contrato de UI.

## Regras de negócio (navegação)

### Entrada

- Rota: `/client-details?clientId=<id>&contextKey=<contexto>` (ex.: `employee`).
- Opcional: parâmetro de aba inicial (quando a navegação externa pede uma chave específica).

### Montagem das abas

Helper canônico: `buildClientTabDefs({ isPessoaJuridica, isProviderContext, t })` em:

`src/react/pages/clientDetailsHelpers.js`

| Tipo | Abas (ordem) |
| --- | --- |
| **Pessoa física (PF)** | `general` → `media` → `users` → [`products` se provider] → `contracts` |
| **Pessoa jurídica (PJ)** | `general` → `fiscal` → `media` → `sellers` → `franchise` → `contacts` → [`products` se provider] → `contracts` |

- `isProviderContext`: `detailContext` ∈ `{ provider, providers }`.
- Labels vêm de i18n `people` / `title` / chave, com fallback legível.
- **Não existe** chave `categories` (rótulo “Classificação”) na barra de abas de Client Details.

### Aba inicial

Helper: `resolveInitialTabIndex({ requestedInitialTab, nextClient, detailContext })`.

- Se não houver aba solicitada → índice `0` (`general`).
- A chave pedida é resolvida contra a **mesma lista** usada em `buildClientTabDefs` (PF/PJ + provider).
- Chave desconhecida, legada ou removida (ex.: `categories`) → fallback para `0`. Assim a tela não quebra nem aponta para aba inexistente.

### Classificação (Categories) — o que permanece e o que não

| Item | Situação em Client Details |
| --- | --- |
| Aba dedicada `categories` / “Classificação” na barra de tabs | **Ausente** (removida; não deve ser reintroduzida nesta tela) |
| UI de classificação da pessoa | Embutida em **GeneralTab** via `PeopleCategoriesPanel` |
| Catálogo global de categorias | Fora do escopo desta tela (admin / discoveryCategory; stores `categories` / `people_categories`) |

`PeopleCategoriesPanel` (issue histórica de classificação por timeline):

- PF: contextos `profession`, `position` (cargo pode exigir `people_company_id`)
- PJ: contextos `sector`, `activity_branch`

O componente legado `CategoriesTab.js` **não** entra no switch de renderização de `details.js` e **não** deve ser ligado de novo à barra de abas de Client Details. Classificação operacional fica no painel da aba Geral.

### Renderização

`details.js` monta `tabs = buildClientTabDefs(...)` e, no conteúdo, despacha por `activeTabKey`:

- `general` → `GeneralTab` (inclui `PeopleCategoriesPanel`, documentos, endereços, etc.)
- `fiscal` → configs fiscais (PJ)
- `media` → mídias / avatar
- `sellers` ou `users` → `UsersTab` (e fluxos de vendedores conforme contexto)
- `franchise` → Franquia/Filial
- `contacts` → contatos
- `products` → produtos (provider)
- `contracts` → contratos

Não há `case`/`branch` para `categories`.

## Modularização

| Artefato | Responsabilidade |
| --- | --- |
| `clientDetailsHelpers.js` | `buildClientTabDefs`, `resolveInitialTabIndex`, seeds de rota, merge de contato |
| `details.js` | Orquestra tabs, estado ativo, loaders; deve permanecer ≤ 500 linhas com helpers extraídos |
| `GeneralTab.js` | Cadastro geral + painel de classificação embutido |
| `PeopleCategoriesPanel.js` | CRUD de classificação da pessoa (timeline) |
| Demais `*Tab.js` | Conteúdo exclusivo de cada chave de aba |

## Fora de escopo desta página

- Redesign visual da barra de abas
- Cadastro/admin do catálogo global de categorias
- Alteração de regras de `people_categories` no backend
- Fluxos de outras telas que listem categorias fora de Client Details

## Links relacionados

| Destino | Link |
| --- | --- |
| Client Details — criar usuário (UsersTab) | [Client-Details-Criar-Usuario](Client-Details-Criar-Usuario) |
| Client Details — Mídias / avatar | [Client-Details-Media-Avatar](Client-Details-Media-Avatar) |
| Client Details — Franquia/Filial | [Client-Details-Franquia-Filial](Client-Details-Franquia-Filial) |
| Client Details — Colaboradores / refresh | [Client-Details-EmployeesTab-Refresh](Client-Details-EmployeesTab-Refresh) |
| Home ui-customers | [Home](Home) |
| App-Home | https://github.com/ControleOnline/app-community/wiki |
| Issue #758 | https://github.com/ControleOnline/app-community/issues/758 |

## Manutenção

Ao adicionar ou remover aba em Client Details:

1. Atualizar **simultaneamente** `buildClientTabDefs` e a lista espelhada em `resolveInitialTabIndex`.
2. Garantir branch de render em `details.js` (ou ausência explícita, se a aba for retirada).
3. Atualizar esta página e a entrada na Home/Sidebar.
4. Não reintroduzir `categories` na barra sem decisão de produto documentada: classificação permanece no painel da aba Geral.
