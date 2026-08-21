/**
 * Unit tests for SalesmanTab commission helpers (override precedence + permissions).
 * Node native test runner.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isCommissionFilled,
  toCommissionNumber,
  resolveEffectiveCommission,
  canEditSalesmanCommission,
  shouldDisplayCommission,
  buildCommissionSavePayload,
} from '../../../../react/components/tabs/salesmanTabHelpers.js';

describe('salesmanTabHelpers', () => {
  describe('isCommissionFilled / toCommissionNumber', () => {
    it('treats null/undefined/empty as not filled', () => {
      assert.equal(isCommissionFilled(null), false);
      assert.equal(isCommissionFilled(undefined), false);
      assert.equal(isCommissionFilled(''), false);
      assert.equal(isCommissionFilled('  '), false);
      assert.equal(toCommissionNumber(null), null);
    });

    it('treats 0 as filled', () => {
      assert.equal(isCommissionFilled(0), true);
      assert.equal(toCommissionNumber(0), 0);
      assert.equal(toCommissionNumber('12.5'), 12.5);
    });
  });

  describe('resolveEffectiveCommission', () => {
    it('prefers client override when filled', () => {
      const result = resolveEffectiveCommission(
        { comission: 10, minimum_comission: 5 },
        { comission: 20, minimum_comission: 8 },
      );
      assert.equal(result.comission, 10);
      assert.equal(result.minimumComission, 5);
      assert.equal(result.isOverride, true);
      assert.equal(result.source, 'client');
    });

    it('falls back to default when client empty', () => {
      const result = resolveEffectiveCommission(
        { comission: null, minimum_comission: null },
        { comission: 15, minimum_comission: 3 },
      );
      assert.equal(result.comission, 15);
      assert.equal(result.minimumComission, 3);
      assert.equal(result.isOverride, false);
      assert.equal(result.source, 'default');
    });
  });

  describe('canEditSalesmanCommission', () => {
    it('allows ROLE_SUPER and ROLE_OWNER', () => {
      assert.equal(canEditSalesmanCommission({ roles: ['ROLE_SUPER'] }), true);
      assert.equal(canEditSalesmanCommission({ roles: ['ROLE_OWNER'] }), true);
      assert.equal(canEditSalesmanCommission({ roles: ['ROLE_ADMIN'] }), false);
      assert.equal(canEditSalesmanCommission({}), false);
    });
  });

  describe('shouldDisplayCommission', () => {
    it('shows for MANAGER and ADMIN only', () => {
      assert.equal(shouldDisplayCommission('MANAGER'), true);
      assert.equal(shouldDisplayCommission('ADMIN'), true);
      assert.equal(shouldDisplayCommission('CRM'), false);
    });
  });

  describe('buildCommissionSavePayload', () => {
    it('builds numeric payload with link id', () => {
      const payload = buildCommissionSavePayload(
        { id: 42 },
        { comission: '12.5', minimumComission: '1' },
      );
      assert.equal(payload.id, '42');
      assert.equal(payload.comission, 12.5);
      assert.equal(payload.minimum_comission, 1);
    });
  });
});
