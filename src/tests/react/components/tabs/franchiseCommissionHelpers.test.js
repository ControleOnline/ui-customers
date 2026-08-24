/**
 * Unit tests for franchise commission helpers (ui-customers#10).
 */
import {
  isFranchiseeLink,
  pickFranchiseeLink,
  canEditFranchiseCommission,
  buildFranchiseeLinkParams,
  normalizeCommissionFields,
  validateCommissionFields,
  formatPercent,
  formatMinimum,
} from '../../../../react/components/tabs/franchiseCommissionHelpers';

describe('franchiseCommissionHelpers', () => {
  describe('isFranchiseeLink', () => {
    it('accepts franchisee link matching people and company', () => {
      const link = {
        linkType: 'franchisee',
        people: {id: 11},
        company: {'@id': '/people/3'},
      };
      expect(isFranchiseeLink(link, {peopleId: '11', companyId: '3'})).toBe(true);
    });

    it('rejects non-franchisee link types', () => {
      expect(
        isFranchiseeLink(
          {linkType: 'client', people: {id: 11}, company: {id: 3}},
          {peopleId: '11', companyId: '3'},
        ),
      ).toBe(false);
    });

    it('rejects mismatched people id', () => {
      expect(
        isFranchiseeLink(
          {linkType: 'franchisee', people: {id: 99}, company: {id: 3}},
          {peopleId: '11', companyId: '3'},
        ),
      ).toBe(false);
    });
  });

  describe('pickFranchiseeLink', () => {
    it('picks from hydra member payload', () => {
      const payload = {
        'hydra:member': [
          {id: 1, linkType: 'client', people: {id: 11}, company: {id: 3}},
          {
            id: 2,
            linkType: 'franchisee',
            people: {id: 11},
            company: {id: 3},
            comission: 12.5,
          },
        ],
      };
      const link = pickFranchiseeLink(payload, {peopleId: 11, companyId: 3});
      expect(link?.id).toBe(2);
      expect(link?.comission).toBe(12.5);
    });

    it('returns null when no franchisee link', () => {
      expect(pickFranchiseeLink([{linkType: 'employee'}], {})).toBe(null);
    });
  });

  describe('canEditFranchiseCommission', () => {
    it('allows ROLE_SUPER', () => {
      expect(
        canEditFranchiseCommission({
          user: {roles: ['ROLE_SUPER']},
          currentCompany: {user: {owner_enabled: false}},
        }),
      ).toBe(true);
    });

    it('allows franchisor owner', () => {
      expect(
        canEditFranchiseCommission({
          user: {roles: ['ROLE_MANAGER']},
          currentCompany: {user: {owner_enabled: true}},
        }),
      ).toBe(true);
    });

    it('denies other profiles', () => {
      expect(
        canEditFranchiseCommission({
          user: {roles: ['ROLE_MANAGER']},
          currentCompany: {user: {owner_enabled: false}},
        }),
      ).toBe(false);
    });
  });

  describe('buildFranchiseeLinkParams', () => {
    it('includes linkType franchisee and ids', () => {
      expect(buildFranchiseeLinkParams({peopleId: '/people/11', companyId: 3})).toEqual({
        linkType: ['franchisee'],
        people: '11',
        company: '3',
      });
    });
  });

  describe('normalizeCommissionFields / validate / format', () => {
    it('normalizes numeric fields', () => {
      expect(normalizeCommissionFields({comission: '10', minimum_comission: 2000})).toEqual({
        comission: 10,
        minimum_comission: 2000,
      });
    });

    it('validates percentage range and minimum >= 0', () => {
      expect(validateCommissionFields({comission: 10, minimum_comission: 0}).ok).toBe(true);
      expect(validateCommissionFields({comission: 101, minimum_comission: 0}).ok).toBe(false);
      expect(validateCommissionFields({comission: 10, minimum_comission: -1}).ok).toBe(false);
    });

    it('formats display values', () => {
      expect(formatPercent(12.5)).toBe('12.5%');
      expect(formatMinimum(2000)).toBe('2000');
      expect(formatPercent(null)).toBe('—');
    });
  });
});
