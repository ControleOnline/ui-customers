# Client Details — Usuários (UsersTab): listar, carregar e criar

Documentação técnica da aba **Usuários** na tela **Client Details** (`/client-details`): carregamento dos usuários da pessoa selecionada ao abrir a aba, estados de loading/vazio/erro, edição e criação com vínculo correto (IRI) e escopo multi-tenant.

Trilhas de origem:

- [app-community#369](https://github.com/ControleOnline/app-community/issues/369) — criar usuário com `people` em IRI
- [app-community#759](https://github.com/ControleOnline/app-community/issues/759) — ao abrir a aba, disparar leitura dos usuários da pessoa (antes nenhum GET era feito)

## Como este módulo se encaixa

| Visão (`APP_TYPE`) | Uso neste fluxo |
| --- | --- |
| **MANAGER** | Detalhe administrativo de pessoa/cliente/colaborador; aba **Usuários** lista, carrega do backend e permite criar/editar usuário vinculado à pessoa |
| **CRM** / outros | Reutilizam `ClientDetails` conforme rota e `contextKey`; a mesma aba e contrato de API se aplicam quando a tab de usuários está visível |

`contextKey` (query) seleciona o modo do detalhe (`employee`, `client`, `provider`, contatos, etc.). Listagem e criação na aba Usuários **não** dependem de um `contextKey` exclusivo: o filtro de leitura e o payload de escrita usam a **pessoa** do detalhe (`clientId` / `@id`).

A aba faz parte do conjunto PF em `buildClientTabDefs` (ver [Client Details — abas e navegação](Client-Details-Abas-Navegacao)). Em PJ a chave `users` também pode aparecer conforme a montagem vigente das tabs.

## Objetivo

Registrar regras de negócio, contratos de API e modularização do fluxo:

1. **leitura** dos usuários da pessoa ao acionar/abrir a aba (`GET` com filtro `people`);
2. estados de **carregamento**, **vazio** e **erro** sem quebrar outras abas;
3. criação/edição via `POST` / ações do store `users` com autenticação de sessão e vínculo correto à pessoa (IRI);
4. preservação de escopo multi-tenant (não misturar company/outra pessoa);
5. componentes e helpers ≤ 500 linhas, com testes unitários e smoke browser.

## Repositórios afetados

| Módulo | Papel no fluxo |
| --- | --- |
| `ui-customers` | Página `ClientDetails`, aba `UsersTab`, helpers e smoke de criação |
| `api-platform-users` | Recurso `User` — coleção filtrável e `POST /users` (`CreateUserAction`), security `ROLE_HUMAN` |
| `app-community` | Composição / pin dos submódulos; rota `/client-details` |

## Regras de negócio (UI)

### Entrada

- Rota: `/client-details?clientId=<id>&contextKey=<contexto>` (ex.: `employee`).
- Aba: **Usuários** (`UsersTab`), chave `users` na barra de abas.
- Ao **selecionar/abrir** a aba, o componente dispara a leitura dos usuários da pessoa selecionada.

### Carregamento ao abrir a aba (#759)

Antes do hotfix #759, a aba só refletia usuários eventualmente embutidos em `client.user` e **não** disparava chamada ao backend ao ser acionada.

Comportamento atual em `UsersTab`:

1. Resolve o IRI da pessoa: `toPeopleIri(client?.id || client?.['@id'])`.
2. Se houver IRI e `usersStore.actions.getItems`, chama:

```text
actions.getItems({
  people: peopleIri,
  itemsPerPage: 100,
  __storeMeta: {
    dedupeKey: `client-details-users-${peopleIri}`,
    skipSystemError: true,
  },
})
```

3. Normaliza a resposta (`member` / `hydra:member` ou array) com `normalizeUserItem` e atualiza o estado local `users`.
4. `isLoadingUsers` controla o texto **“Carregando usuários...”**; em seguida lista ou estado vazio **“Nenhum usuário cadastrado”**.
5. Em falha de rede/API, o `catch` **não** limpa a lista embutida de `client.user` (preserva fallback) e **não** propaga erro de sistema (`skipSystemError`), para não quebrar as outras abas do detalhe.
6. Dependências do efeito: `actions.getItems`, `client?.id`, `client?.['@id']` — troca de pessoa no detalhe reexecuta a leitura com o novo IRI.

Há um segundo `useEffect` que hidrata a partir de `client.user` (payload embutido do detalhe). O GET scoped tem prioridade de refresh quando disponível.

### Escopo multi-tenant / não misturar dados

- O filtro de leitura usa **somente** o IRI da pessoa do detalhe aberto (`people: peopleIri`).
- `dedupeKey` inclui o IRI da pessoa para não reutilizar cache de outra pessoa na mesma sessão de store.
- A UI **não** deve listar usuários de outra company ou de outro `clientId`; o backend aplica o escopo de segurança do token e o filtro `people`.

### Criação — contrato do payload

Ação: **Adicionar Usuário** → modal com username, senha, confirmação (e timezone quando aplicável).

O frontend **deve** enviar:

| Campo | Formato | Observação |
| --- | --- | --- |
| `username` | string | Obrigatório |
| `password` | string | Obrigatório (política de senha via `ui-common`) |
| `people` | **IRI** `/people/{id}` | **Não** enviar id numérico nu (`"106218"`). Use `toPeopleIri(client.id \| client['@id'])` |
| `timezone` | IRI `/timezones/{id}` ou omitido | Opcional |

Helper canônico: `toPeopleIri` em `src/react/components/tabs/usersTabHelpers.js`.

### Autenticação na requisição

- `GET` da coleção e `POST /users` exigem usuário autenticado com papel **`ROLE_HUMAN`** (no POST: `securityPostDenormalize`).
- A camada de API do app deve enviar o token/header de sessão válido (ex.: `API-TOKEN`). Ausência de credencial resulta em falha de auth (historicamente o backend podia responder HTTP 500 com `{"message":"Authentication required"}`; a UI trata 401 e a mensagem “Authentication required” de forma explícita na criação).

### Feedback de erro (criação/edição)

`extractErrorMessage` (mesmo helpers):

- HTTP **401** → mensagem orientando novo login;
- corpo com texto *Authentication required* → mesma mensagem amigável em PT;
- violações de validação / política de senha → mapeadas via `mapPasswordErrorMessage`.

Após sucesso, o usuário criado/atualizado entra na listagem local da aba (normalização via `normalizeUserItem`) e pode sincronizar de volta em `client.user` via `onUpdateClient` / `mapUsersForClient`.

## Regras de negócio (API)

| Operação | Segurança | Observação |
| --- | --- | --- |
| `GET` coleção `/users` com filtro `people` | sessão `ROLE_HUMAN` (e políticas do recurso) | Usado por `actions.getItems` ao abrir a aba |
| `POST /users` | `is_granted('ROLE_HUMAN')` (securityPostDenormalize) | `CreateUserAction` → `UserService::createUserFromContent` |
| `DELETE /users/{id}` | `ROLE_HUMAN` | `DeleteUserAction` |
| change-api-key / change-password | `ROLE_HUMAN` | controllers dedicados |

O vínculo com a pessoa na **escrita** é o campo `people` no payload (IRI). Na **leitura**, o filtro `people` limita a coleção à pessoa do detalhe. Payload de escrita com id nu (sem `/people/`) quebra a deserialização/associação e pode se manifestar como erro genérico de autenticação no cliente — por isso o frontend **obrigatoriamente** normaliza para IRI.

## Modularização (UI)

| Arquivo | Papel |
| --- | --- |
| `src/react/pages/details.js` | `ClientDetails`, resolução de `contextKey` e tabs |
| `src/react/pages/clientDetailsHelpers.js` | `buildClientTabDefs` (inclui chave `users` em PF) |
| `src/react/components/tabs/UsersTab.js` | Listagem com GET ao montar/abrir, loading/vazio, create/edit (store `users`) |
| `src/react/components/tabs/UserFormModal.js` / `UserApiKeyModal.js` | Modais de formulário e API key |
| `src/react/components/tabs/usersTabHelpers.js` | `toPeopleIri`, `extractErrorMessage`, `normalizeUserItem`, `mapUsersForClient`, etc. |

Limite absoluto de linhas do projeto: **≤ 500** por arquivo.

## Testes

| Tipo | Local | Cobertura |
| --- | --- | --- |
| Unit | `src/tests/react/components/tabs/usersTabHelpers.test.js` | `toPeopleIri`, `extractErrorMessage` (401 / Authentication required), normalização |
| Browser smoke | `src/tests/browser/manager/client-details-create-user.spec.js` | `/client-details?...&contextKey=employee&initialTab=users` → Adicionar Usuário → POST com token + people IRI → sucesso na listagem |

Evidência de aceite do #759: ao acionar a aba, deve haver requisição observável de rede filtrada por `people` da pessoa do detalhe (network em `client-details`).

## O que este módulo **não** faz

- Não redefine o fluxo de login do usuário recém-criado.
- Não altera o contrato público de auto-cadastro (outra trilha em `api-platform-people` / auto-cadastro).
- Não é o enforce de autorização no backend — a UI envia o token de sessão, o IRI e o filtro `people`; o gate real é o security do recurso `User`.
- Não reintroduz a aba **Categories** (ver [Client Details — abas e navegação](Client-Details-Abas-Navegacao)).

## Links cruzados

| Destino | URL |
| --- | --- |
| Home deste módulo | https://github.com/ControleOnline/ui-customers/wiki |
| Client Details — abas e navegação | https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Abas-Navegacao |
| Backend users (Home) | https://github.com/ControleOnline/api-platform-users/wiki |
| App home | https://github.com/ControleOnline/app-community/wiki |
| Issue listagem (#759) | https://github.com/ControleOnline/app-community/issues/759 |
| Issue criação (#369) | https://github.com/ControleOnline/app-community/issues/369 |
| Visões do app | https://github.com/ControleOnline/app-community/blob/master/MODOS_OPERACAO.md |

Cópia versionada no Git: `docs/technical/Client-Details-Criar-Usuario.md`
