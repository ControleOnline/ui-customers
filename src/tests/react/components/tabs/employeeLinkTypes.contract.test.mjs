/**
 * Contract: Contatos create/edit share the same human company link-type catalog.
 * Refs: app-community#446 #648 #649
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

test('canonical catalog includes every human company link type', () => {
  const src = read('src/react/utils/humanCompanyLinkTypes.js');
  for (const type of EXPECTED) {
    assert.match(src, new RegExp(`['"]${type}['"]`), `missing ${type}`);
  }
});

test('create and edit helpers reuse the same catalog module', () => {
  const createSrc = read('src/react/components/tabs/employeesTabHelpers.js');
  const editSrc = read('src/react/components/tabs/generalTabHelpers.js');
  const contactsSrc = read('src/react/components/tabs/employeeContacts.js');

  assert.match(createSrc, /humanCompanyLinkTypes/);
  assert.match(editSrc, /humanCompanyLinkTypes/);
  assert.match(contactsSrc, /humanCompanyLinkTypes/);
  assert.match(createSrc, /LINK_TYPE_OPTIONS/);
  assert.match(editSrc, /LINK_TYPE_OPTIONS/);
});

test('employees page default context covers all human company roles', () => {
  const src = read('src/react/pages/employees.js');
  assert.match(src, /HUMAN_COMPANY_LINK_TYPES/);
  assert.match(src, /DEFAULT_EMPLOYEE_CONTEXT_TYPES/);
  assert.match(src, /salesman/);
  assert.match(src, /after-sales/);
  assert.match(src, /Cadastro de Vendedor/);
  assert.match(src, /Cadastro de Pos-venda/);
});
