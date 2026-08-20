/**
 * Contract: human company link types for Colaboradores (#446).
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

test('employeeContacts EMPLOYEE_CONTACT_LINK_TYPES includes salesman and after-sales', () => {
  const src = read('src/react/components/tabs/employeeContacts.js');
  for (const type of EXPECTED) {
    assert.match(src, new RegExp(`['"]${type}['"]`), `missing ${type}`);
  }
});

test('employeesTabHelpers LINK_TYPE_OPTIONS includes salesman and after-sales', () => {
  const src = read('src/react/components/tabs/employeesTabHelpers.js');
  assert.match(src, /value:\s*['"]salesman['"]/);
  assert.match(src, /value:\s*['"]after-sales['"]/);
});

test('generalTabHelpers LINK_TYPE_OPTIONS and normalize include salesman and after-sales', () => {
  const src = read('src/react/components/tabs/generalTabHelpers.js');
  assert.match(src, /value:\s*['"]salesman['"]/);
  assert.match(src, /value:\s*['"]after-sales['"]/);
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
