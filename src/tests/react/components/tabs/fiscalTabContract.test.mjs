import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const fiscalTab = fs.readFileSync(
  new URL('../../../../react/components/tabs/FiscalTab.js', import.meta.url),
  'utf8',
);
const details = fs.readFileSync(
  new URL('../../../../react/pages/details.js', import.meta.url),
  'utf8',
);
const helpers = fs.readFileSync(
  new URL('../../../../react/pages/clientDetailsHelpers.js', import.meta.url),
  'utf8',
);

test('company details exposes the fiscal tab for legal entities', () => {
  assert.match(helpers, /\{ key: 'fiscal', label: label\('fiscal', 'Configurações Fiscais'\) \}/);
  assert.match(details, /activeTabKey === 'fiscal'/);
  assert.match(details, /<FiscalTab \{\.\.\.tabProps\} navigation=\{navigation\} \/>/);
});

test('company fiscal tab delegates the complete fiscal settings to ui-accounting', () => {
  assert.match(fiscalTab, /@controleonline\/ui-accounting\/src\/react\/components\/fiscal\/FiscalCompanyConfig/);
  assert.match(fiscalTab, /<FiscalCompanyConfig company=\{client\} navigation=\{navigation\} \/>/);
  assert.doesNotMatch(fiscalTab, /IntegrationConfigPage/);
  assert.doesNotMatch(fiscalTab, /providerKey: 'receita-federal'/);
});
