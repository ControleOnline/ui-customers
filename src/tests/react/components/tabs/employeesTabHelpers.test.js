/**
 * Unit tests for EmployeesTab pure helpers (app-community#297 modularization).
 * Includes navigation contract for employee detail (app-community#9).
 */
import {
  formatDateInput,
  parseBrDateToYmd,
  buildEmployeeCreatePayload,
  extractId,
  LINK_TYPE_OPTIONS,
  buildEmployeeDetailNavParams,
} from '../../../../react/components/tabs/employeesTabHelpers';

describe('employeesTabHelpers', () => {
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
    expect(LINK_TYPE_OPTIONS.map(o => o.value)).toEqual([
      'employee',
      'owner',
      'director',
      'manager',
      'salesman',
      'after-sales',
      'courier',
    ]);
  });

  it('buildEmployeeDetailNavParams opens employee detail on general tab', () => {
    const params = buildEmployeeDetailNavParams({
      employee: { id: '/people/42', linkType: 'employee' },
      parentPeopleId: '15',
    });
    expect(params).toEqual({
      clientId: '42',
      contextKey: 'contacts',
      initialTab: 'general',
      parentCompanyId: '15',
      linkType: 'employee',
    });
  });

  it('buildEmployeeDetailNavParams returns null without employee id', () => {
    expect(
      buildEmployeeDetailNavParams({ employee: {}, parentPeopleId: '15' }),
    ).toBeNull();
  });
});
