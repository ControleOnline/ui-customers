/**
 * Unit tests for SalesmanTab commission helpers (override precedence + permissions).
 */
const {
  isCommissionFilled,
  toCommissionNumber,
  resolveEffectiveCommission,
  formatCommissionPercent,
  formatCommissionSubtitle,
  canEditSalesmanCommission,
  shouldDisplayCommission,
  indexDefaultSalesmanLinksByPeopleId,
  buildCommissionSavePayload,
} = require('../../../../react/components/tabs/salesmanTabHelpers');

describe('salesmanTabHelpers', () => {
  describe('isCommissionFilled / toCommissionNumber', () => {
    it('treats null/undefined/empty as not filled', () => {
      expect(isCommissionFilled(null)).toBe(false);
      expect(isCommissionFilled(undefined)).toBe(false);
      expect(isCommissionFilled('')).toBe(false);
      expect(isCommissionFilled('  ')).toBe(false);
      expect(toCommissionNumber(null)).toBe(null);
    });

    it('treats 0 as filled', () => {
      expect(isCommissionFilled(0)).toBe(true);
      expect(toCommissionNumber(0)).toBe(0);
      expect(toCommissionNumber('12.5')).toBe(12.5);
    });
  });

  describe('resolveEffectiveCommission', () => {
    it('uses client link commission when filled (override)', () => {
      const result = resolveEffectiveCommission(
        { comission: 15, minimum_comission: 5 },
        { comission: 10, minimum_comission: 2 },
      );
      expect(result).toEqual({
        comission: 15,
        minimumComission: 5,
        isOverride: true,
        source: 'client',
      });
    });

    it('falls back to salesman-company default when client commission is empty', () => {
      const result = resolveEffectiveCommission(
        { comission: null, minimum_comission: null },
        { comission: 10, minimum_comission: 2 },
      );
      expect(result).toEqual({
        comission: 10,
        minimumComission: 2,
        isOverride: false,
        source: 'default',
      });
    });

    it('returns none when neither client nor default is filled', () => {
      expect(resolveEffectiveCommission({}, null)).toEqual({
        comission: null,
        minimumComission: null,
        isOverride: false,
        source: 'none',
      });
    });

    it('overrides only the filled field and keeps default for the other', () => {
      const result = resolveEffectiveCommission(
        { comission: 20, minimum_comission: null },
        { comission: 10, minimum_comission: 3 },
      );
      expect(result.comission).toBe(20);
      expect(result.minimumComission).toBe(3);
      expect(result.isOverride).toBe(true);
      expect(result.source).toBe('client');
    });
  });

  describe('formatCommissionPercent / formatCommissionSubtitle', () => {
    it('formats percent and subtitle with override/default tags', () => {
      expect(formatCommissionPercent(10)).toBe('10%');
      expect(formatCommissionPercent(null)).toBe('—');
      expect(
        formatCommissionSubtitle({
          comission: 15,
          minimumComission: 5,
          isOverride: true,
          source: 'client',
        }),
      ).toContain('override');
      expect(
        formatCommissionSubtitle({
          comission: 10,
          minimumComission: null,
          isOverride: false,
          source: 'default',
        }),
      ).toContain('padrão');
    });
  });

  describe('canEditSalesmanCommission / shouldDisplayCommission', () => {
    it('allows ROLE_SUPER and ROLE_OWNER only', () => {
      expect(canEditSalesmanCommission({ roles: ['ROLE_SUPER'] })).toBe(true);
      expect(canEditSalesmanCommission({ roles: ['ROLE_OWNER'] })).toBe(true);
      expect(canEditSalesmanCommission({ roles: ['ROLE_EMPLOYEE'] })).toBe(false);
      expect(canEditSalesmanCommission(null)).toBe(false);
    });

    it('shows commission only for MANAGER/ADMIN app types', () => {
      expect(shouldDisplayCommission('MANAGER')).toBe(true);
      expect(shouldDisplayCommission('ADMIN')).toBe(true);
      expect(shouldDisplayCommission('CRM')).toBe(false);
      expect(shouldDisplayCommission('POS')).toBe(false);
    });
  });

  describe('indexDefaultSalesmanLinksByPeopleId / buildCommissionSavePayload', () => {
    it('indexes default salesman links by people id', () => {
      const map = indexDefaultSalesmanLinksByPeopleId([
        { id: 1, people: { id: 50 }, comission: 10 },
        { id: 2, people: '/people/51', comission: 8 },
      ]);
      expect(map['50'].comission).toBe(10);
      expect(map['51'].comission).toBe(8);
    });

    it('builds save payload with numeric commissions', () => {
      expect(
        buildCommissionSavePayload(
          { id: 101 },
          { comission: '15', minimumComission: '5' },
        ),
      ).toEqual({ id: '101', comission: 15, minimum_comission: 5 });
      expect(buildCommissionSavePayload({}, { comission: 1, minimumComission: 0 })).toBe(
        null,
      );
    });
  });
});
