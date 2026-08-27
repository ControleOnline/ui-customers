# Client Details — preservação de capitalização em nome/alias (People)

## Objetivo

Documentar a regra de negócio e o contrato técnico para **campos nominais** de pessoa/colaborador (`name`, `alias` / fantasia): o valor digitado pelo usuário é **persistido e relido com a mesma capitalização**, sem forçar CAIXA ALTA na UI nem no backend.

Origem: residual de [app-community#376](https://github.com/ControleOnline/app-community/issues/376) coberto em [app-community#626](https://github.com/ControleOnline/app-community/issues/626) (cadastro/detalhe de colaborador em `client-details` / EmployeesTab).

## Escopo

| Área | Comportamento canônico |
| --- | --- |
| UI (`ui-customers`) | Inputs de nome/alias **não** aplicam `toUpperCase` / `formatDisplayUppercase` / CSS `text-transform: uppercase` no fluxo de cadastro/edição de colaborador e detalhe de pessoa |
| Backend (`api-platform-people`) | `People::getName()` e `People::getAlias()` retornam o valor **armazenado** (sem `mb_strtoupper` na leitura) |
| Persistência | O payload de escrita grava o texto como recebido (após trim/whitespace apenas, quando aplicável) |
| Exibição | Listas e headers usam o valor retornado pela API, preservando capitalização |
| Busca | Continua case-insensitive no backend (não depende de caixa no valor gravado) |

### Fora de escopo / exceções legítimas

- Campos cujo domínio **exige** caixa alta (ex.: UF de endereço) continuam normalizados — a regra deve ser **explícita** no código e, se necessário, documentada localmente.
- Documentos fiscais (CNPJ/CPF) e formatação numérica/máscara não entram nesta regra de capitalização de nomes.
- Reforma geral de i18n.

## Fluxo (colaborador em client-details)

```text
Usuário digita "Maria Silva" (nome) / "Mari" (alias)
        │
        ▼
  UI: normalizeIdentityValue = String(value)  [sem uppercase]
        │
        ▼
  POST/PUT people (payload com capitalização original)
        │
        ▼
  Banco: name / alias gravados como enviados
        │
        ▼
  GET: People::getName / getAlias → valor armazenado
        │
        ▼
  UI lista / header / detalhe → "Maria Silva" / "Mari"
```

## Modularização (UI)

| Arquivo | Papel na regra |
| --- | --- |
| `src/react/components/tabs/employeesTabHelpers.js` | `normalizeIdentityValue` → identidade (sem uppercase); helpers de create/display |
| `src/react/components/tabs/EmployeesTab.js` | Inputs de nome/alias no modal create **sem** forçar caixa alta no `onChangeText` |
| `src/react/components/tabs/generalTabHelpers.js` | Mesma política de identidade no detalhe PF |
| `src/react/pages/details.js` | Header / título de contato preservam capitalização gravada |

Limite absoluto do projeto: **≤ 500 linhas** por arquivo.

## Backend (`api-platform-people`)

- `People::getName(): string` — retorna `(string) ($this->name ?? '')` (comentário de referência a #626 / #376).
- `People::getAlias()` — idem para alias.
- Removido o uso de helper privado `uppercaseText` / `mb_strtoupper` na **leitura** desses getters.
- Setters gravam o valor recebido; a normalização de caixa **não** é aplicada na saída.

## Critérios de aceite (referência)

- É possível gravar `"Maria Silva"` e reler `"Maria Silva"` (não `"MARIA SILVA"`).
- Campos que legitimamente exigem caixa alta (se houver) continuam normalizados e documentados.
- Busca por nome não deixa de encontrar o registro por causa da capitalização.
- Sem regressão no save de colaborador / people.

## Testes

| Tipo | Cobertura |
| --- | --- |
| Unit (ui-customers) | Helpers de identidade com exemplos mistos (`Maria Silva` / `Mari`) |
| Unit / API (api-platform-people) | Getters de name/alias preservam case |
| Browser smoke | Fluxo de create/edit de colaborador (EmployeesTab) com nome misto, quando presente no suite de client-details |

## Visões do app (`APP_TYPE`)

- `MANAGER` / `CRM` / demais que usam `client-details` e aba Colaboradores: a regra vale para o detalhe compartilhado de pessoa — o módulo **não** deve reintroduzir uppercase em display ou input de nome/alias.
- `ui-customers` é o dono da UI de detalhe; `api-platform-people` é o dono da persistência e dos getters.

## O que este módulo **não** faz

- Não redefine busca full-text ou índices no backend.
- Não altera máscaras de documento (CNPJ/CPF).
- Não aplica title-case ou outras transformações “bonitas” automaticamente — apenas **preserva** o que o usuário digitou.

## Links cruzados

| Destino | URL |
| --- | --- |
| Home deste módulo | https://github.com/ControleOnline/ui-customers/wiki |
| Client Details — aba Colaboradores (refresh) | https://github.com/ControleOnline/ui-customers/wiki/Client-Details-EmployeesTab-Refresh |
| Client Details — criar usuário | https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Criar-Usuario |
| Backend people (wiki) | https://github.com/ControleOnline/api-platform-people/wiki |
| App home | https://github.com/ControleOnline/app-community/wiki |
| Issue residual | https://github.com/ControleOnline/app-community/issues/626 |
| Issue original | https://github.com/ControleOnline/app-community/issues/376 |
| Visões do app | https://github.com/ControleOnline/app-community/blob/master/MODOS_OPERACAO.md |

Cópia versionada no Git (quando espelhada): `docs/technical/Client-Details-People-Name-Case.md`
