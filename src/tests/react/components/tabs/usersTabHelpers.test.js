const {
  extractId,
  normalizeUserItem,
  toTimezoneIri,
  toTimezoneItem,
  extractCollectionItems,
} = require('../../../../react/components/tabs/usersTabHelpers');

describe('usersTabHelpers', () => {
  test('extractId strips non-digits', () => {
    expect(extractId('/timezones/42')).toBe('42');
    expect(extractId(7)).toBe('7');
  });

  test('toTimezoneIri builds IRI', () => {
    expect(toTimezoneIri(3)).toBe('/timezones/3');
    expect(toTimezoneIri('/timezones/9')).toBe('/timezones/9');
    expect(toTimezoneIri('')).toBe(null);
  });

  test('toTimezoneItem maps entry', () => {
    expect(toTimezoneItem({id: 1, name: 'America/Sao_Paulo'})).toEqual({
      id: '1',
      name: 'America/Sao_Paulo',
      displayName: 'America/Sao_Paulo',
    });
  });

  test('normalizeUserItem keeps timezoneId', () => {
    const item = normalizeUserItem({
      id: 10,
      username: 'alice',
      timezone: '/timezones/5',
    });
    expect(item.timezoneId).toBe('5');
    expect(item.username).toBe('alice');
  });

  test('extractCollectionItems supports hydra and member', () => {
    expect(extractCollectionItems({'hydra:member': [{id: 1}]}).length).toBe(1);
    expect(extractCollectionItems({member: [{id: 2}]}).length).toBe(1);
    expect(extractCollectionItems([{id: 3}]).length).toBe(1);
  });
});
