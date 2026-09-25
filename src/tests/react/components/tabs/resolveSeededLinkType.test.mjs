import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {
  resolveSeededLinkType,
  normalizeLinkType,
} = require('../../../../react/components/tabs/generalTabHelpers.js');

test('resolveSeededLinkType prefers client linkType over route seed', () => {
  assert.equal(resolveSeededLinkType('courier', 'owner'), 'courier');
  assert.equal(resolveSeededLinkType('after-sales', 'employee'), 'after-sales');
});

test('resolveSeededLinkType falls back to route when client empty', () => {
  assert.equal(resolveSeededLinkType('', 'owner'), 'owner');
  assert.equal(resolveSeededLinkType(undefined, 'manager'), 'manager');
  assert.equal(resolveSeededLinkType(null, ''), normalizeLinkType(''));
});
