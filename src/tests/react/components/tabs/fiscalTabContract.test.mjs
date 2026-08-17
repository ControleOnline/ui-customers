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

test('fiscal tab reuses the shared integration page with the edited company id', () => {
  assert.match(fiscalTab, /IntegrationConfigPage/);
  assert.match(fiscalTab, /providerKey: 'receita-federal'/);
  assert.match(fiscalTab, /companyId: client\?\.id/);
  assert.match(fiscalTab, /embedded/);
});
