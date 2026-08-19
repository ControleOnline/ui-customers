import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  extractId,
  mapAddressesForClient,
  normalizeAddress,
  normalizeId,
  resolveAddressSaveId,
  toPeopleIri,
} from '../../../../react/components/tabs/addressesTabHelpers.js';

describe('addressesTabHelpers', () => {
  it('extractId strips non-digits', () => {
    assert.equal(extractId('/addresses/42'), '42');
    assert.equal(extractId(99), '99');
    assert.equal(extractId(null), '');
  });

  it('normalizeId never invents a timestamp for missing id', () => {
    assert.equal(normalizeId(undefined), '');
    assert.equal(normalizeId(null), '');
    assert.equal(normalizeId(''), '');
    assert.equal(normalizeId('/addresses/7'), '7');
    assert.equal(normalizeId(15), '15');
  });

  it('normalizeAddress preserves numeric id and builds @id', () => {
    const nested = {
      id: 55,
      street: {street: 'Rua A', district: {district: 'Centro', city: {city: 'SP', state: {uf: 'SP', country: {countrycode: 'BR'}}}}},
      number: 10,
      complement: 'Apto 1',
      nickname: 'Matriz',
    };
    const normalized = normalizeAddress(nested);
    assert.equal(normalized.id, '55');
    assert.equal(normalized['@id'], '/addresses/55');
    assert.equal(normalized.street, 'Rua A');
    assert.equal(normalized.city, 'SP');
    assert.equal(normalized.state, 'SP');
    assert.equal(normalized.country, 'BR');
    assert.equal(normalized.number, '10');
  });

  it('normalizeAddress from @id only still yields digits id', () => {
    const normalized = normalizeAddress({'@id': '/addresses/88', street: 'Rua B'});
    assert.equal(normalized.id, '88');
    assert.equal(normalized['@id'], '/addresses/88');
  });

  it('mapAddressesForClient keeps id/@id stable', () => {
    const mapped = mapAddressesForClient([
      {id: '3', street: 'X', number: '1'},
    ]);
    assert.equal(mapped[0].id, '3');
    assert.equal(mapped[0]['@id'], '/addresses/3');
  });

  it('resolveAddressSaveId prefers payload then editingItem', () => {
    assert.equal(
      resolveAddressSaveId({id: '9', '@id': '/addresses/9'}, {id: '9'}),
      '9',
    );
    assert.equal(resolveAddressSaveId({id: 12}, {}), '12');
    assert.equal(resolveAddressSaveId(null, {}), '');
    assert.equal(
      resolveAddressSaveId({'@id': '/addresses/21'}, {street: 'Z'}),
      '21',
    );
  });

  it('toPeopleIri resolves nested and flat people shapes', () => {
    assert.equal(toPeopleIri({'@id': '/people/5'}), '/people/5');
    assert.equal(toPeopleIri({id: 8}), '/people/8');
    assert.equal(toPeopleIri({people: {'@id': '/people/3'}}), '/people/3');
    assert.equal(toPeopleIri({}), '');
  });
});
