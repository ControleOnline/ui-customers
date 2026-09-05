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
| [Client Details — aba Franquia/Filial (PJ → PJ)](https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Franquia-Filial) | Vínculos franchisee/filial no detalhe de PJ; CRUD só MANAGER |
| [Client Details — preservação de capitalização (nome/alias)](https://github.com/ControleOnline/ui-customers/wiki/Client-Details-People-Name-Case) | Nome/alias de pessoa/colaborador sem forçar CAIXA ALTA (UI + API) |
| [Client Details — aba Mídias e gerenciador de avatar](https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Media-Avatar) | Aba Mídias / `people_media`: listar todas as imagens e escolher avatar |
| [Client Details — criar usuário (UsersTab)](https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Criar-Usuario) | Aba Usuários; POST /users com people IRI |
| [Client Details — aba Colaboradores (EmployeesTab) e refresh](https://github.com/ControleOnline/ui-customers/wiki/Client-Details-EmployeesTab-Refresh) | Lista people_links; useFocusEffect após edit (#375) |
| [Client Details — abas e navegação (sem Categories)](https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Abas-Navegacao) | Barra de abas PF/PJ; Categories ausente; classificação em GeneralTab (#758) |
| Página canônica do fluxo (CRM) | https://github.com/ControleOnline/ui-crm/wiki/Cliente-Vendedor-Vinculo-e-Permissoes |

Cópia versionada no Git: `docs/technical/Cliente-Vendedor-Vinculo-e-Permissoes.md`, `docs/technical/Client-Details-Franquia-Filial.md`, `docs/technical/Client-Details-People-Name-Case.md`, `docs/technical/Client-Details-Media-Avatar.md`, `docs/technical/Client-Details-EmployeesTab-Refresh.md, `docs/technical/Client-Details-Abas-Navegacao.md`

### Visão deste módulo

`ui-customers` é o **detalhe e cadastro de pessoas/clientes** reutilizado por várias visões do app (`CRM`, `MANAGER`, `POS`, etc.).

- Dono da tela `ClientDetails` e abas (geral, contatos, documentos, **vendedores**, **Franquia/Filial**, etc.).
- No fluxo comercial, recebe handoff do `ui-crm`.
- Gestão administrativa de vendedores, comissões e vínculos franquia/filial: apenas quando `APP_TYPE=MANAGER`.
- Fora de `MANAGER` (ex.: CRM): pode identificar o vendedor / ver listagem de franquia, sem CRUD administrativo.

## Regras específicas

- No contexto `provider`, a aba de produtos do detalhe da pessoa juridica deve permitir criar um novo produto sem sair do fluxo do fornecedor.

### Módulos relacionados (mesmo fluxo)

| Módulo | Papel | Entrada da documentação |
| --- | --- |
| `ui-crm` | Entrada comercial / handoff | https://github.com/ControleOnline/ui-crm/wiki |
| `api-platform-people` | Backend `people_link` / SalesmanService | https://github.com/ControleOnline/api-platform-people/wiki |
| `app-community` | Home do app e mapa de submódulos | https://github.com/ControleOnline/app-community/wiki |
