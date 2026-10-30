# Client Details — criar usuário (UsersTab)

Documentação técnica do fluxo de **criação de usuário** na tela **Client Details** (`/client-details`), com foco no contexto `contextKey=employee` e demais contexts que reutilizam a aba Usuários.

Trilha de origem: [app-community#369](https://github.com/ControleOnline/app-community/issues/369).

## Como este módulo se encaixa

| Visão (`APP_TYPE`) | Uso neste fluxo |
| --- | --- |
| **MANAGER** | Detalhe administrativo de pessoa/cliente/colaborador; aba **Usuários** permite listar e **criar** usuário vinculado à pessoa |
| **CRM** / outros | Reutilizam `ClientDetails` conforme rota e `contextKey`; a mesma aba e contrato de API se aplicam quando a tab de usuários está visível |

`contextKey` (query) seleciona o modo do detalhe (`employee`, `client`, `provider`, contatos, etc.). A criação de usuário na aba Usuários **não** depende de um `contextKey` exclusivo: o contrato de payload e autenticação é o mesmo.

## Objetivo

Registrar regras de negócio, contratos de API e modularização do fluxo:

1. listagem de usuários da pessoa no detalhe;
2. criação de usuário via `POST /users` com autenticação de sessão e vínculo correto à pessoa (IRI);
3. feedback de sucesso/erro (incluindo falhas de autenticação);
4. componentes e helpers ≤ 500 linhas, com testes unitários e smoke browser.

## Repositórios afetados

| Módulo | Papel no fluxo |
| --- | --- |
| `ui-customers` | Página `ClientDetails`, aba `UsersTab`, helpers e smoke de criação |
| `api-platform-users` | Recurso `User`, operação `POST /users` (`CreateUserAction`), security `ROLE_HUMAN` |
| `app-community` | Composição / pin dos submódulos; rota `/client-details` |

## Regras de negócio (UI)

### Entrada

- Rota: `/client-details?clientId=<id>&contextKey=<contexto>` (ex.: `employee`).
- Aba: **Usuários** (`UsersTab`), ou equivalente quando o detalhe expõe a tab de usuários.
- Ação: **Adicionar Usuário** → modal com username, senha, confirmação (e timezone quando aplicável).

### Criação — contrato do payload

O frontend **deve** enviar:

| Campo | Formato | Observação |
| --- | --- | --- |
| `username` | string | Obrigatório |
| `password` | string | Obrigatório (política de senha via `ui-common`) |
| `people` | **IRI** `/people/{id}` | **Não** enviar id numérico nu (`"106218"`). Use `toPeopleIri(client.id \| client['@id'])` |
| `timezone` | IRI `/timezones/{id}` ou omitido | Opcional |

Helper canônico: `toPeopleIri` em `src/react/components/tabs/usersTabHelpers.js`.

### Autenticação na requisição

- O `POST /users` exige usuário autenticado com papel **`ROLE_HUMAN`** (`securityPostDenormalize` na operação Post do recurso `User`).
- A camada de API do app deve enviar o token/header de sessão válido (ex.: `API-TOKEN`). Ausência de credencial resulta em falha de auth (historicamente o backend podia responder HTTP 500 com `{"message":"Authentication required"}`; a UI trata 401 e a mensagem “Authentication required” de forma explícita).

### Feedback de erro

`extractErrorMessage` (mesmo helpers):

- HTTP **401** → mensagem orientando novo login;
- corpo com texto *Authentication required* → mesma mensagem amigável em PT;
- violações de validação / política de senha → mapeadas via `mapPasswordErrorMessage`.

Após sucesso, o usuário criado entra na listagem local da aba (normalização via `normalizeUserItem`).

## Regras de negócio (API)

| Operação | Segurança | Controller |
| --- | --- | --- |
| `POST /users` | `is_granted('ROLE_HUMAN')` (securityPostDenormalize) | `CreateUserAction` → `UserService::createUserFromContent` |
| `DELETE /users/{id}` | `ROLE_HUMAN` | `DeleteUserAction` |
| change-api-key / change-password | `ROLE_HUMAN` | controllers dedicados |

O vínculo com a pessoa é feito pelo campo `people` no payload (IRI). Payload com id nu (sem `/people/`) quebra a deserialização/associação e pode se manifestar como erro genérico de autenticação no cliente — por isso o frontend **obrigatoriamente** normaliza para IRI.

## Modularização (UI)

| Arquivo | Papel |
| --- | --- |
| `src/react/pages/details.js` | `ClientDetails`, resolução de `contextKey` e tabs |
| `src/react/components/tabs/UsersTab.js` | Listagem + fluxo create/edit (orquestra store `users`) |
| `src/react/components/tabs/UsersTabUserModal.js` / `UsersTabApiKeyModal.js` | Modais extraídos |
| `src/react/components/tabs/usersTabHelpers.js` | `toPeopleIri`, `extractErrorMessage`, `normalizeUserItem`, etc. |

Limite absoluto de linhas do projeto: **≤ 500** por arquivo.

## Testes

| Tipo | Local | Cobertura |
| --- | --- | --- |
| Unit | `src/tests/react/components/tabs/usersTabHelpers.test.js` (e `.mjs`) | `toPeopleIri`, `extractErrorMessage` (401 / Authentication required), normalização |
| Browser smoke | `src/tests/browser/manager/client-details-create-user.spec.js` | `/client-details?...&contextKey=employee&initialTab=users` → Adicionar Usuário → POST com token + people IRI → sucesso na listagem |

## O que este módulo **não** faz

- Não redefine o fluxo de login do usuário recém-criado.
- Não altera o contrato público de auto-cadastro (outra trilha em `api-platform-people` / auto-cadastro).
- Não é o enforce de autorização no backend — a UI apenas envia o token de sessão e o IRI correto; o gate real é `ROLE_HUMAN` no `POST /users`.

## Links cruzados

| Destino | URL |
| --- | --- |
| Home deste módulo | https://github.com/ControleOnline/ui-customers/wiki |
| Backend users (Home) | https://github.com/ControleOnline/api-platform-users/wiki |
| App home | https://github.com/ControleOnline/app-community/wiki |
| Issue de origem | https://github.com/ControleOnline/app-community/issues/369 |
| Visões do app | https://github.com/ControleOnline/app-community/blob/master/MODOS_OPERACAO.md |

Cópia versionada no Git: `docs/technical/Client-Details-Criar-Usuario.md`
