/**
 * Unit tests for GeneralTab pure helpers and people_link persistence condition.
 */
import {
  normalizeEnable,
  normalizeLinkType,
  formatYmdToBr,
  parseBrDateToYmd,
  formatDateInput,
  toPeopleIri,
  extractId,
  LINK_TYPE_OPTIONS,
} from '../../../components/tabs/generalTabHelpers';

describe('generalTabHelpers', () => {
  describe('normalizeEnable', () => {
    it('accepts boolean true/false', () => {
      expect(normalizeEnable(true)).toBe(true);
      expect(normalizeEnable(false)).toBe(false);
    });
    it('accepts numeric 1/0', () => {
      expect(normalizeEnable(1)).toBe(true);
      expect(normalizeEnable(0)).toBe(false);
    });
    it('accepts string "1"/"true"', () => {
      expect(normalizeEnable('1')).toBe(true);
      expect(normalizeEnable('true')).toBe(true);
      expect(normalizeEnable('0')).toBe(false);
      expect(normalizeEnable('false')).toBe(false);
    });
    it('defaults unknown to false', () => {
      expect(normalizeEnable(null)).toBe(false);
      expect(normalizeEnable(undefined)).toBe(false);
      expect(normalizeEnable('')).toBe(false);
    });
  });

  describe('normalizeLinkType', () => {
    it('keeps known link types', () => {
      for (const opt of LINK_TYPE_OPTIONS) {
        expect(normalizeLinkType(opt.value)).toBe(opt.value);
      }
    });
    it('defaults unknown to employee', () => {
      expect(normalizeLinkType('')).toBe('employee');
      expect(normalizeLinkType('unknown')).toBe('employee');
      expect(normalizeLinkType(null)).toBe('employee');
    });
    it('is case-insensitive', () => {
      expect(normalizeLinkType('OWNER')).toBe('owner');
      expect(normalizeLinkType(' Manager ')).toBe('manager');
    });
  });

  describe('date helpers', () => {
    it('formatYmdToBr converts ISO date', () => {
      expect(formatYmdToBr('2024-03-15')).toBe('15/03/2024');
      expect(formatYmdToBr('2024-03-15T10:00:00Z')).toBe('15/03/2024');
    });
    it('formatDateInput masks progressive input', () => {
      expect(formatDateInput('15')).toBe('15');
      expect(formatDateInput('1503')).toBe('15/03');
      expect(formatDateInput('15032024')).toBe('15/03/2024');
    });
    it('parseBrDateToYmd round-trips valid date', () => {
      expect(parseBrDateToYmd('15/03/2024')).toBe('2024-03-15');
    });
    it('parseBrDateToYmd rejects invalid date', () => {
      expect(parseBrDateToYmd('32/13/2024')).toBeNull();
      expect(parseBrDateToYmd('incomplete')).toBeNull();
    });
  });

  describe('toPeopleIri / extractId', () => {
    it('builds IRI from id', () => {
      expect(toPeopleIri({ id: 42 })).toBe('/people/42');
    });
    it('keeps existing @id IRI', () => {
      expect(toPeopleIri({ '@id': '/people/7' })).toBe('/people/7');
    });
    it('extractId strips non-digits', () => {
      expect(extractId('/people/99')).toBe('99');
      expect(extractId(null)).toBe('');
    });
  });

  describe('people_link persistence condition (task-330)', () => {
    /**
     * Mirrors the condition used in GeneralTab handleSaveRegistration:
     * only call people_link.save when canEditLinkType AND linkType actually changed.
     * This avoids Method Not Allowed on the GetCollection-only PeopleLink API
     * when the user only toggles enable/status.
     */
    const shouldPersistPeopleLink = ({ canEditLinkType, currentLinkType, originalLinkType }) =>
      Boolean(
        canEditLinkType &&
          normalizeLinkType(currentLinkType) !== normalizeLinkType(originalLinkType),
      );

    it('does NOT persist when only enable changes (linkType same)', () => {
      expect(
        shouldPersistPeopleLink({
          canEditLinkType: true,
          currentLinkType: 'employee',
          originalLinkType: 'employee',
        }),
      ).toBe(false);
    });

    it('persists when linkType actually changes', () => {
      expect(
        shouldPersistPeopleLink({
          canEditLinkType: true,
          currentLinkType: 'manager',
          originalLinkType: 'employee',
        }),
      ).toBe(true);
    });

    it('does NOT persist when canEditLinkType is false', () => {
      expect(
        shouldPersistPeopleLink({
          canEditLinkType: false,
          currentLinkType: 'owner',
          originalLinkType: 'employee',
        }),
      ).toBe(false);
    });
  });
});
