
## Ponto de entrada

- A documentação funcional e de regras deste modulo vive na **wiki do proprio repositório** e na wiki principal do app.
- Regras transversais de qualidade, modularizacao e limites de componente vivem em `https://github.com/ControleOnline/agents-mcp/blob/master/skills/shared/code-quality.md`.
- Quando houver detalhe especifico de implementacao, prefira comentar no codigo em ingles perto da regra.
- Este arquivo deve ficar curto e servir apenas como ponte para as fontes oficiais.

## Documentação (navegação humana)

Sempre comece pela **Home** da wiki e siga as categorias abaixo.

| Categoria | Destino |
| --- | --- |
| Home do módulo | https://github.com/ControleOnline/ui-customers/wiki |
| Wiki principal do app | https://github.com/ControleOnline/app-community/wiki |
| Wiki da API | https://github.com/ControleOnline/api-community/wiki |
| Visões do app (`APP_TYPE`) | https://github.com/ControleOnline/app-community/blob/master/MODOS_OPERACAO.md |

### Por categoria — cadastro e detalhe de clientes

| Página | O que documenta |
| --- | --- |
| [Cliente × Vendedor — vínculo e permissões](https://github.com/ControleOnline/ui-customers/wiki/Cliente-Vendedor-Vinculo-e-Permissoes) | Aba Vendedores no detalhe; corte MANAGER vs CRM/outros |
| [Client Details — criar usuário (UsersTab)](https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Criar-Usuario) | Criação de usuário no detalhe; people em IRI; auth ROLE_HUMAN |
| Página canônica do fluxo (CRM) | https://github.com/ControleOnline/ui-crm/wiki/Cliente-Vendedor-Vinculo-e-Permissoes |

Cópias versionadas no Git: `docs/technical/Cliente-Vendedor-Vinculo-e-Permissoes.md`, `docs/technical/Client-Details-Criar-Usuario.md`

### Visão deste módulo

`ui-customers` é o **detalhe e cadastro de pessoas/clientes** reutilizado por várias visões do app (`CRM`, `MANAGER`, `POS`, etc.).

- Dono da tela `ClientDetails` e abas (geral, contatos, documentos, **vendedores**, etc.).
- No fluxo comercial, recebe handoff do `ui-crm`.
- Gestão administrativa de vendedores e comissões: apenas quando `APP_TYPE=MANAGER`.
- Fora de `MANAGER` (ex.: CRM): pode identificar o vendedor, sem expor comissão nem CRUD administrativo.

## Regras específicas

- No contexto `provider`, a aba de produtos do detalhe da pessoa juridica deve permitir criar um novo produto sem sair do fluxo do fornecedor.

### Módulos relacionados (mesmo fluxo)

| Módulo | Papel | Entrada da documentação |
| --- | --- | --- |
| `ui-crm` | Entrada comercial / handoff | https://github.com/ControleOnline/ui-crm/wiki |
| `api-platform-people` | Backend `people_link` / SalesmanService | https://github.com/ControleOnline/api-platform-people/wiki |
| `api-platform-users` | Backend `POST /users` (ROLE_HUMAN) | https://github.com/ControleOnline/api-platform-users/wiki |
| `app-community` | Home do app e mapa de submódulos | https://github.com/ControleOnline/app-community/wiki |

### Usuários no detalhe de pessoa

- Aba `UsersTab` em `src/react/components/tabs/` (helpers em `usersTabHelpers.js`, modais em `UserFormModal` / `UserApiKeyModal`).
- Lista geral da empresa: `UsersPage` em `ui-users` (rota Manager `UsersPage` / path `users`).
