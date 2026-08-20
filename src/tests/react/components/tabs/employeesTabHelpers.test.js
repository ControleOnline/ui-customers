/**
 * Unit tests for EmployeesTab pure helpers (app-community#297 modularization).
 */
import {
  formatDateInput,
  parseBrDateToYmd,
  buildEmployeeCreatePayload,
  extractId,
  LINK_TYPE_OPTIONS,
  extractEmployeeSaveErrorMessage,
  buildEmployeePeopleLinkPayload,
  normalizeIdentityValue,
} from '../../../../react/components/tabs/employeesTabHelpers';

describe('employeesTabHelpers', () => {
  it('normalizeIdentityValue preserves user case', () => {
    expect(normalizeIdentityValue('Cláudia Silva')).toBe('Cláudia Silva');
    expect(normalizeIdentityValue('  ACME Ltda  ')).toBe('ACME Ltda');
  });

  it('formatDateInput masks BR date', () => {
    expect(formatDateInput('01022020')).toBe('01/02/2020');
    expect(formatDateInput('01')).toBe('01');
  });

  it('parseBrDateToYmd validates and converts', () => {
    expect(parseBrDateToYmd('01/02/2020')).toBe('2020-02-01');
    expect(parseBrDateToYmd('31/02/2020')).toBeNull();
    expect(parseBrDateToYmd('1/2/20')).toBeNull();
  });

  it('buildEmployeeCreatePayload sets company and optional foundationDate', () => {
    const payload = buildEmployeeCreatePayload({
      name: 'ANA',
      alias: 'A',
      foundationDate: '2020-02-01',
      linkType: 'manager',
      parentPeopleId: '15',
    });
    expect(payload.company).toBe('/people/15');
    expect(payload.foundationDate).toBe('2020-02-01');
    expect(payload.linkType).toBe('manager');
    expect(payload.peopleType).toBe('F');
  });

  it('extractId and LINK_TYPE_OPTIONS', () => {
    expect(extractId('/people/3')).toBe('3');
    expect(LINK_TYPE_OPTIONS.some(o => o.value === 'employee')).toBe(true);
    expect(LINK_TYPE_OPTIONS.some(o => o.value === 'salesman')).toBe(true);
    expect(LINK_TYPE_OPTIONS.some(o => o.value === 'after-sales')).toBe(true);
  });

  it('buildEmployeeCreatePayload omits company when parent id missing', () => {
    const payload = buildEmployeeCreatePayload({
      name: 'ANA',
      alias: 'A',
      linkType: 'employee',
      parentPeopleId: '',
    });
    expect(payload.company).toBeUndefined();
    expect(payload.linkType).toBe('employee');
  });

  it('extractEmployeeSaveErrorMessage prefers detail over Request failed', () => {
    expect(
      extractEmployeeSaveErrorMessage(
        { message: 'Request failed', detail: 'Authentication required' },
        'fallback',
      ),
    ).toBe('Authentication required');
    expect(extractEmployeeSaveErrorMessage({ message: ['a', 'b'] }, '')).toBe('a, b');
    expect(extractEmployeeSaveErrorMessage(null, 'fb')).toBe('fb');
  });

  it('buildEmployeePeopleLinkPayload returns IRIs or null', () => {
    expect(
      buildEmployeePeopleLinkPayload({
        companyId: '10',
        peopleId: '/people/20',
        linkType: 'owner',
      }),
    ).toEqual({
      company: '/people/10',
      people: '/people/20',
      linkType: 'owner',
    });
    expect(
      buildEmployeePeopleLinkPayload({ companyId: '', peopleId: '1', linkType: 'employee' }),
    ).toBeNull();
  });

});
