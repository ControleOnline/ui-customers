import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMPANY_DETAILS_TAB_LAYOUT,
  COMPANY_DETAILS_TAB_SCROLL_PROPS,
  getSellersEmptyStatePresentation,
} from '../../../react/pages/companyDetailsPresentation.js';

test('company detail tab strip can scroll without shrinking tab labels', () => {
  assert.equal(COMPANY_DETAILS_TAB_SCROLL_PROPS.horizontal, true);
  assert.equal(COMPANY_DETAILS_TAB_SCROLL_PROPS.showsHorizontalScrollIndicator, false);
  assert.equal(COMPANY_DETAILS_TAB_LAYOUT.header.flexGrow, 0);
  assert.equal(COMPANY_DETAILS_TAB_LAYOUT.content.flexDirection, 'row');
  assert.equal(COMPANY_DETAILS_TAB_LAYOUT.content.minWidth, '100%');
  assert.equal(COMPANY_DETAILS_TAB_LAYOUT.button.flexGrow, 1);
  assert.equal(COMPANY_DETAILS_TAB_LAYOUT.button.flexShrink, 0);
});

test('Sellers empty state shows the existing add action only to managers', () => {
  assert.deepEqual(getSellersEmptyStatePresentation(true), {
    actionLabel: 'Vincular vendedor',
    guidance: null,
  });
  assert.deepEqual(getSellersEmptyStatePresentation(false), {
    actionLabel: null,
    guidance: 'Peça a um administrador para vincular um vendedor.',
  });
});
