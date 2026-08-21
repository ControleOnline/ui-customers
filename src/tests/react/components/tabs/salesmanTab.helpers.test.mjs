import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildAvailableSalesmanOptions,
  buildSalesmanSavePayload,
  canManageSalesmen,
  formatCommissionLabel,
  normalizeCommissionValue,
  normalizeSalesmanLink,
  toPeopleIri,
} from '../../../../react/components/tabs/salesmanTab.helpers.js';

describe('salesmanTab.helpers', () => {
  it('gates management to MANAGER app type only', () => {
    assert.equal(canManageSalesmen('MANAGER'), true);
    assert.equal(canManageSalesmen('manager'), true);
    assert.equal(canManageSalesmen('CRM'), false);
    assert.equal(canManageSalesmen(''), false);
  });

  it('normalizes commission values and labels', () => {
    assert.equal(normalizeCommissionValue('12,5'), 12.5);
    assert.equal(normalizeCommissionValue('abc'), 0);
    assert.equal(formatCommissionLabel(10), '10,00%');
  });

  it('builds people IRI and normalizes links', () => {
    assert.equal(toPeopleIri({ id: 7 }), '/people/7');
    assert.equal(toPeopleIri('/people/9'), '/people/9');
    const link = normalizeSalesmanLink({
      id: 3,
      company: { id: 11, name: 'Ana' },
      comission: '5',
      minimum_comission: '1',
    });
    assert.equal(link.sellerId, '11');
    assert.equal(link.commission, 5);
    assert.equal(link.minimumCommission, 1);
  });

  it('filters already linked salesmen from options', () => {
    const options = buildAvailableSalesmanOptions({
      salesmen: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
      linkedSalesmen: [{ sellerId: '1' }],
      editingLink: null,
    });
    assert.equal(options.length, 1);
    assert.equal(options[0].id, '2');
  });

  it('builds save payload for create and update', () => {
    const created = buildSalesmanSavePayload({
      editingLink: null,
      formData: { sellerIri: '/people/5', commission: '8', minimumCommission: '2' },
      clientIri: '/people/20',
      linkType: 'sellers-client',
    });
    assert.equal(created.company, '/people/5');
    assert.equal(created.people, '/people/20');
    assert.equal(created.comission, 8);
    assert.equal(created.minimum_comission, 2);
    assert.equal(created.id, undefined);

    const updated = buildSalesmanSavePayload({
      editingLink: { id: '99' },
      formData: { sellerIri: '/people/5', commission: '8', minimumCommission: '2' },
      clientIri: '/people/20',
      linkType: 'sellers-client',
    });
    assert.equal(updated.id, '99');
  });
});
