# Smoke manifesto — client-details peopleType

- **Issue:** ControleOnline/app-community#625
- **fluxo:** outros
- **flowchartIds:** [1](https://admin.controleonline.com/admin/flowcharts/1)
- **Spec:** `src/tests/browser/manager/client-details-people-type.spec.js`
- **Modelo canônico:** `People.peopleType` = `F` | `J` (contrato não é peopleType)

## Etapas (prints gerados em runtime)

| # | Arquivo | Etapa |
| --- | --- | --- |
| 01 | `01-client-details-dados-cadastrais.png` | Abrir client-details → Dados Cadastrais |
| 02 | `02-tipo-pf-sem-contrato.png` | Picker Tipo PF; sem opção inventada "contrato" |
| 03 | `03-tipo-pj-selecionado.png` | Selecionar PJ (`J`) |
| 04 | `04-pj-persistido-sem-f5.png` | Salvar; tipo permanece `J` sem F5; PUT `/people/30` com `peopleType: "J"` |

Os PNGs e `manifest.json` são gravados em `testInfo.outputDir/client-details-people-type/` e anexados ao relatório Playwright (`testInfo.attach`).
