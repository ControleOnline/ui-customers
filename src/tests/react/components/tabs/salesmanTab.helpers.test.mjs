import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAvailableSalesmanOptions,
  canManageSalesmen,
  formatCommissionLabel,
  normalizeSalesmanLink,
} from '../../../../react/components/tabs/salesmanTab.helpers.js';

test('canManageSalesmen libera contexto administrativo', () => {
  assert.equal(canManageSalesmen('CRM'), false);
  assert.equal(canManageSalesmen('crm'), false);
  assert.equal(canManageSalesmen('MANAGER'), true);
  assert.equal(canManageSalesmen(' manager '), true);
});

test('normalizeSalesmanLink preserva vendedor e comissoes do vinculo', () => {
  const normalized = normalizeSalesmanLink({
    id: '/people_links/88',
    comission: '12.5',
    minimum_comission: '4',
    company: {
      id: '/people/31',
      name: 'Maria Oliveira',
      alias: 'maria',
    },
  });

  assert.deepEqual(normalized, {
    id: '88',
    sellerId: '31',
    sellerIri: '/people/31',
    sellerName: 'Maria Oliveira',
    sellerAlias: 'maria',
    commission: 12.5,
    minimumCommission: 4,
  });
});

test('buildAvailableSalesmanOptions evita duplicar vendedores ja vinculados', () => {
  const options = buildAvailableSalesmanOptions({
    salesmen: [
      { id: '/people/10', name: 'Ana' },
      { id: '/people/11', name: 'Bruno' },
      { id: '/people/12', name: 'Carla' },
    ],
    linkedSalesmen: [
      { sellerId: '10' },
      { sellerId: '11' },
    ],
    editingLink: {
      sellerId: '11',
    },
  });

  assert.deepEqual(
    options.map(item => item.id),
    ['11', '12'],
  );
});

test('formatCommissionLabel padroniza exibicao percentual', () => {
  assert.equal(formatCommissionLabel('7.5'), '7,50%');
  assert.equal(formatCommissionLabel(null), '0,00%');
});
