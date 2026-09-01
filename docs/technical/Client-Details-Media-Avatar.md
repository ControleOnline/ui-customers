# Client Details — aba Mídias e gerenciador de avatar (`people_media`)

## Objetivo

Documentar o contrato da aba **Mídias** em `client-details` (`MediaTab`): listar **todas** as imagens associadas à pessoa, permitir escolher uma como mídia do tipo (avatar, logo, etc.) e enviar arquivo novo sem perder os demais vínculos.

Origem: [app-community#433](https://github.com/ControleOnline/app-community/issues/433) (listagem incompleta no gerenciador) e dependência de preview [app-community#432](https://github.com/ControleOnline/app-community/issues/432) (URL/403 do download).

## Escopo

| Área | Comportamento canônico |
| --- | --- |
| UI (`ui-customers` `MediaTab`) | Carrega `media_types` do `peopleType` do cadastro e `people_media` da pessoa com página ampla (`itemsPerPage: 100`) |
| Biblioteca do `DefaultUpload` | Contexto `people_media`; o gerenciador (`Gerenciador de {tipo}`) deve exibir **todos** os arquivos já vinculados à pessoa, não um único card |
| Persistência | `GET/POST/PUT/DELETE` em `people_media` via store `people` (`getPeopleMedia`, `savePeopleMedia`, `deletePeopleMedia`) |
| Tipos | Cada `mediaType` (ex.: avatar, logo) tem **um** vínculo corrente no card da aba; a biblioteca lista o acervo para escolher |
| Formato | PNG/JPG (`image/png,image/jpeg`) |

### Fora de escopo

- Correção isolada de URL malformada / 403 no download do thumbnail (permanece em #432).
- Redesign da aba Mídias ou galeria genérica de arquivos da empresa.
- Mídia de produto, pedido ou dispositivo.

## Fluxo

```text
Abrir /client-details?clientId={id} → aba Mídias
        │
        ├─ GET media_types filtrado por peopleType (F/J)
        │
        └─ GET people_media
              people=/people/{id}
              mediaType.peopleType={F|J}
              itemsPerPage=100
        │
        ▼
  Grid: um card por mediaType
        │
        ├─ DefaultUpload
        │     context = people_media
        │     attachments = vínculo corrente daquele tipo (0 ou 1)
        │     libraryContexts = [people_media]
        │
        ├─ "Gerenciar {tipo}" → gerenciador / biblioteca
        │     lista o acervo da pessoa (N cards se N arquivos)
        │     usuário escolhe um arquivo existente
        │     savePeopleMedia { people, mediaType, file }
        │
        └─ "Enviar nova"
              upload PNG/JPG → attach no tipo corrente
              reload getPeopleMedia
```

Regra de negócio da listagem (#433): com **2+ imagens** associadas à pessoa, o gerenciador mostra **2+ cards**. Paginação default da API (ex.: 1 item) **não** pode ser o contrato da UI — a query da aba força `itemsPerPage: 100`.

## Modularização

| Arquivo | Papel |
| --- | --- |
| `ui-customers/src/react/components/tabs/MediaTab.js` | Aba Mídias; `loadPeopleMedia` / `loadMediaTypes`; um card por tipo |
| `ui-customers/src/react/pages/details.js` | Compõe `MediaTab` no detalhe do cliente |
| `ui-default` `DefaultUpload` | Upload, preview, biblioteca e título `Gerenciador de {tipo}` |
| store `people` (`getPeopleMedia` / `savePeopleMedia` / `deletePeopleMedia`) | Contrato HTTP `people_media` |
| `api-platform-people` | Coleção `people_media` filtrada por pessoa e tipo |

`mediaByTypeId` agrupa o payload pelo id do `mediaType` para o card da aba (vínculo corrente). A **biblioteca** do gerenciador é o lugar que precisa do acervo completo — não o agrupamento do card.

## Contrato de API (UI)

`getPeopleMedia` na aba:

- `people`: IRI `/people/{clientId}`
- `mediaType.peopleType`: `F` ou `J` alinhado a `client.peopleType`
- `itemsPerPage`: `100` (evita truncar o acervo na primeira página)

Escrita:

- `savePeopleMedia`: `{ id?, people, mediaType, file }` — cria ou substitui o vínculo do tipo
- `deletePeopleMedia`: `{ mediaId }` — remove só aquele vínculo

Payload de coleção aceito: array cru, `member`, `hydra:member` ou `items` (`normalizeCollection`).

## Visões do app (`APP_TYPE`)

- `MANAGER` e `CRM`: usam o mesmo `client-details`; a aba Mídias é do módulo `ui-customers`, não uma tela exclusiva de um modo.
- `POS` / `SHOP` / `PPC`: não são donos desta aba; não devem reimplementar `people_media` para avatar de cliente.
- `ui-people` (perfil autenticado) tem gerenciador de avatar próprio no header do perfil — contrato irmão, não substituto desta aba.

O que o módulo **não** faz:

- Não gera thumbnail se o download do arquivo falhar (#432).
- Não pagina a biblioteca na UI além do `itemsPerPage` da query.
- Não mistura mídia de **outra** pessoa / empresa no acervo do `clientId` aberto.

## Testes

| Tipo | Onde |
| --- | --- |
| Unit | `ui-customers/src/tests/react/components/tabs/peopleMediaTabs.test.js` — `MediaTab` chama `getPeopleMedia` com pessoa + `itemsPerPage` |
| Browser | suíte de client-details / media quando publicada em `https://s.controleonline.com/tests` |

Aceite funcional (#433):

- 2+ `people_media` no cliente → gerenciador lista todos
- escolha de qualquer item da lista como mídia do tipo
- "Enviar nova" continua criando vínculo sem apagar o acervo residual
- preview visível somente quando o pipeline de arquivo (#432) responde URL válida

## Links cruzados

| Destino | URL |
| --- | --- |
| Home deste módulo | https://github.com/ControleOnline/ui-customers/wiki |
| Client Details — criar usuário | https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Criar-Usuario |
| Client Details — Colaboradores | https://github.com/ControleOnline/ui-customers/wiki/Client-Details-EmployeesTab-Refresh |
| Backend people | https://github.com/ControleOnline/api-platform-people/wiki |
| App home | https://github.com/ControleOnline/app-community/wiki |
| Issue #433 | https://github.com/ControleOnline/app-community/issues/433 |
| Issue #432 (preview) | https://github.com/ControleOnline/app-community/issues/432 |
| Visões do app | https://github.com/ControleOnline/app-community/blob/master/MODOS_OPERACAO.md |

Cópia versionada no Git: `docs/technical/Client-Details-Media-Avatar.md`
