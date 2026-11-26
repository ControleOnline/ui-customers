import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const helpers = fs.readFileSync(
  new URL('../../../../react/components/tabs/generalTabHelpers.js', import.meta.url),
  'utf8',
);
const employeesHelpers = fs.readFileSync(
  new URL('../../../../react/components/tabs/employeesTabHelpers.js', import.meta.url),
  'utf8',
);
const contacts = fs.readFileSync(
  new URL('../../../../react/components/tabs/employeeContacts.js', import.meta.url),
  'utf8',
);
const generalTab = fs.readFileSync(
  new URL('../../../../react/components/tabs/GeneralTab.js', import.meta.url),
  'utf8',
);
const createFields = fs.readFileSync(
  new URL('../../../../react/components/tabs/EmployeeCreateFormFields.js', import.meta.url),
  'utf8',
);

test('peopleType contract is F/J only — contrato is not a People type', () => {
  assert.match(helpers, /PEOPLE_TYPE_OPTIONS/);
  assert.match(helpers, /value: 'F'/);
  assert.match(helpers, /value: 'J'/);
  assert.doesNotMatch(helpers, /value: 'contrato'/);
  assert.match(helpers, /do not invent values/);
});

test('create payload and general save persist peopleType from the form', () => {
  assert.match(employeesHelpers, /peopleType: normalizePeopleType\(peopleType\)/);
  assert.match(generalTab, /peopleType,/);
  assert.match(generalTab, /onUpdateClient\?\.\('peopleType', peopleType\)/);
  assert.match(createFields, /PEOPLE_TYPE_OPTIONS/);
});

test('employee list keeps PJ collaborators linked to the company', () => {
  assert.match(contacts, /peopleType F\|J both allowed as collaborators/);
  assert.doesNotMatch(
    contacts,
    /peopleType \|\| ''\)\.toUpperCase\(\) === 'J'/,
  );
});
