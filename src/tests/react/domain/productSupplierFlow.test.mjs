import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreateProductParams,
  buildInitialProviderPayload,
  extractId,
} from '../../../react/domain/productSupplierFlow.js';

test('extractId normalizes numeric ids and hydra ids', () => {
  assert.equal(extractId(42), '42');
  assert.equal(extractId('/people/17'), '17');
  assert.equal(extractId({ '@id': '/people/81' }), '81');
});

test('buildInitialProviderPayload keeps provider identity when only id is available', () => {
  const payload = buildInitialProviderPayload({
    id: 15,
    alias: 'Fornecedor XPTO',
    name: 'Fornecedor XPTO LTDA',
    peopleType: 'provider',
  });

  assert.deepEqual(payload, {
    id: '15',
    '@id': '/people/15',
    alias: 'Fornecedor XPTO',
    name: 'Fornecedor XPTO LTDA',
    peopleType: 'provider',
  });
});

test('buildCreateProductParams returns null when provider has no valid id', () => {
  assert.equal(buildCreateProductParams({ alias: 'Sem id' }), null);
});

test('buildCreateProductParams forwards supplier context to ProductDetails', () => {
  const params = buildCreateProductParams({
    '@id': '/people/33',
    alias: 'Fornecedor Central',
    name: 'Fornecedor Central SA',
    peopleType: 'provider',
  });

  assert.deepEqual(params, {
    context: 'products',
    initialProvider: {
      id: '33',
      '@id': '/people/33',
      alias: 'Fornecedor Central',
      name: 'Fornecedor Central SA',
      peopleType: 'provider',
    },
  });
});
