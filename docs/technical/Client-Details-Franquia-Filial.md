# Client Details — aba Franquia/Filial (PJ → PJ)

Espelho versionado da wiki:
https://github.com/ControleOnline/ui-customers/wiki/Client-Details-Franquia-Filial

Issue: https://github.com/ControleOnline/app-community/issues/453

## Resumo

Aba no detalhe de **Pessoa Jurídica** para vínculos PJ→PJ (`people_link.linkType` `franchisee` = Franquia, `filial` = Filial).
CRUD administrativo somente em `APP_TYPE=MANAGER`. Picker e listagem somente PJ. Comissão/royalties fora de escopo.

## Contrato

- `company` = PJ editada; `people` = PJ vinculada (`peopleType=J`).
- AuthZ de escrita no backend (`PeopleLink` + `securityFilter`); UI não é enforcement final.
- Componentes: `FranchiseLinksTab`, `FranchiseLinksManageModal`, `useFranchiseLinksManage`, `franchiseLinksTab.helpers`.
- Smoke: `src/tests/browser/manager/client-details-franchise-links.spec.js`.
