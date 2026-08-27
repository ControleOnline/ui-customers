import assert from 'node:assert/strict';
import {
  buildAvailableFranchiseOptions,
  buildFranchiseLinkReadParams,
  buildFranchiseLinkReadParamsByPeople,
  buildFranchiseLinkReadQueries,
  extractEntityId,
  mergePeopleLinkPayloads,
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
  linkType: ['franchisee'],
  enable: true,
  itemsPerPage: 100,
});
assert.deepEqual(buildFranchiseLinkReadParamsByPeople('/people/11'), {
  people: '11',
  linkType: ['franchisee'],
  enable: true,
  itemsPerPage: 100,
});
assert.equal(buildFranchiseLinkReadQueries(5).length, 2);
assert.equal(buildFranchiseLinkReadQueries(5)[1].people, '5');
assert.equal(extractEntityId({ id: { '@id': '/people/5' } }), '5');
assert.equal(extractEntityId('[object Object]'), '');

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


// task-521 regression: API rows with company_id=5 + link_type franchisee must survive
// build when people is only an id/IRI (staging payload shape).
const stagingLike = buildFranchiseLinksFromPeopleLinks(
  {
    member: [
      {
        id: 51,
        linkType: 'franchisee',
        company: 5,
        people: 51,
        enable: true,
      },
      {
        id: 52,
        linkType: 'franchisee',
        company: '/people/5',
        people: '/people/52',
        enable: true,
      },
      {
        id: 99,
        linkType: 'employee',
        company: 5,
        people: 7,
        enable: true,
      },
    ],
  },
  { companyId: 5 },
);
assert.equal(stagingLike.length, 2);
assert.equal(extractEntityId(stagingLike[0].people), '51');
assert.equal(extractEntityId(stagingLike[1].people), '52');

// task-641: viewed company on the people side — list the other PJ (company).
const inverted = buildFranchiseLinksFromPeopleLinks(
  [
    {
      id: 80,
      linkType: 'franchisee',
      company: { id: 81, name: 'Franquia A', peopleType: 'J' },
      people: 5,
      enable: true,
    },
    {
      id: 81,
      linkType: 'franchisee',
      company: { id: 82, name: 'Franquia B', peopleType: 'J' },
      people: '/people/5',
      enable: true,
    },
  ],
  { companyId: 5 },
);
assert.equal(inverted.length, 2);
assert.equal(extractEntityId(inverted[0].people), '81');
assert.equal(inverted[0].people.name, 'Franquia A');
assert.equal(extractEntityId(inverted[1].people), '82');

const merged = mergePeopleLinkPayloads(
  { member: [{ id: 1, linkType: 'franchisee', company: 5, people: 51 }] },
  [{ id: 1, linkType: 'franchisee', company: 5, people: 51 }, { id: 2, linkType: 'franchisee', company: 5, people: 52 }],
);
assert.equal(merged.length, 2);
