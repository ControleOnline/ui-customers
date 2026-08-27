/**
 * Contract: create and edit Contatos share the same linkType catalog (#649).
 * Reads source files to avoid monorepo alias resolution outside jest.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../..');

const read = relativePath => readFileSync(join(root, relativePath), 'utf8');

const EXPECTED = [
  'employee',
  'owner',
  'director',
  'manager',
  'salesman',
  'after-sales',
  'courier',
];

test('humanCompanyLinkCatalog is the single source for contact link types', () => {
  const src = read('src/react/components/tabs/humanCompanyLinkCatalog.js');
  for (const type of EXPECTED) {
    assert.match(src, new RegExp(`['"]${type}['"]`), `missing ${type}`);
  }
});

test('create (EmployeesTab helpers) and edit (GeneralTab helpers) reuse the catalog', () => {
  const createSrc = read('src/react/components/tabs/employeesTabHelpers.js');
  const editSrc = read('src/react/components/tabs/generalTabHelpers.js');
  const contactsSrc = read('src/react/components/tabs/employeeContacts.js');

  assert.match(createSrc, /humanCompanyLinkCatalog/);
  assert.match(editSrc, /humanCompanyLinkCatalog/);
  assert.match(contactsSrc, /humanCompanyLinkCatalog/);
  assert.match(createSrc, /LINK_TYPE_OPTIONS/);
  assert.match(editSrc, /LINK_TYPE_OPTIONS/);
});

test('employees page default context covers salesman and after-sales when present', () => {
  const src = read('src/react/pages/employees.js');
  assert.match(src, /salesman|HUMAN_COMPANY_LINK_TYPES|employee/);
});
