import assert from 'node:assert/strict';
import {
  buildAvailableFranchiseOptions,
  buildFranchiseLinkReadParams,
  buildFranchiseLinksFromPeopleLinks,
  buildFranchiseSavePayload,
  canManageFranchiseLinks,
  franchiseLinkTypeLabel,
  normalizeFranchiseCandidate,
  normalizeFranchiseLink,
  normalizeFranchiseLinkType,
} from '../../../../react/components/tabs/franchiseLinksTab.helpers.js';

assert.deepEqual(buildFranchiseLinkReadParams('/people/11'), {
  company: '11',
  linkType: ['franchisee', 'filial'],
  itemsPerPage: 100,
});

assert.equal(canManageFranchiseLinks('MANAGER'), true);
assert.equal(canManageFranchiseLinks('manager'), true);
assert.equal(canManageFranchiseLinks('SHOP'), false);

assert.equal(normalizeFranchiseLinkType('franchisee'), 'franchisee');
assert.equal(normalizeFranchiseLinkType('FILIAL'), 'filial');
assert.equal(normalizeFranchiseLinkType('other'), '');

assert.equal(franchiseLinkTypeLabel('franchisee'), 'Franquia');
assert.equal(franchiseLinkTypeLabel('filial'), 'Filial');

assert.equal(
  normalizeFranchiseCandidate({ id: 1, name: 'ACME', peopleType: 'F' }),
  null,
);
assert.deepEqual(
  normalizeFranchiseCandidate({
    id: 10,
    name: 'ACME LTDA',
    alias: 'acme',
    peopleType: 'J',
  }),
  {
    id: '10',
    iri: '/people/10',
    name: 'ACME LTDA',
    alias: 'acme',
    peopleType: 'J',
  },
);

const link = normalizeFranchiseLink({
  id: 5,
  linkType: 'franchisee',
  people: { id: 20, name: 'Franquia X', peopleType: 'J' },
  company: { id: 1 },
});
assert.equal(link.linkedId, '20');
assert.equal(link.linkType, 'franchisee');
assert.equal(link.linkedName, 'Franquia X');

const payload = buildFranchiseSavePayload({
  editingLink: null,
  formData: {
    linkedIri: '/people/20',
    linkType: 'filial',
    comission: '12,5',
    minimumComission: '250',
  },
  companyIri: '/people/1',
});
assert.deepEqual(payload, {
  company: '/people/1',
  people: '/people/20',
  linkType: 'filial',
  comission: 12.5,
  minimum_comission: 250,
  enable: true,
});

assert.equal(
  buildFranchiseSavePayload({
    formData: { linkedIri: '', linkType: 'franchisee' },
    companyIri: '/people/1',
  }),
  null,
);

const fromApi = buildFranchiseLinksFromPeopleLinks(
  {
    'hydra:member': [
      {
        id: 1,
        linkType: 'franchisee',
        company: { id: 100 },
        people: { id: 200, name: 'F1', peopleType: 'J' },
      },
      {
        id: 2,
        linkType: 'employee',
        company: { id: 100 },
        people: { id: 201, name: 'PF', peopleType: 'F' },
      },
      {
        id: 3,
        linkType: 'filial',
        company: { id: 999 },
        people: { id: 300, name: 'Other', peopleType: 'J' },
      },
    ],
  },
  { companyId: 100 },
);
assert.equal(fromApi.length, 1);
assert.equal(fromApi[0].id, 1);

const options = buildAvailableFranchiseOptions({
  candidates: [
    { id: 1, name: 'A', peopleType: 'J' },
    { id: 2, name: 'B', peopleType: 'J' },
  ],
  linkedItems: [{ linkedId: '1' }],
  editingLink: null,
});
assert.equal(options.length, 1);
assert.equal(options[0].id, '2');

console.log('franchiseLinksTab.helpers.test.mjs OK');
