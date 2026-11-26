const {
  extractId,
  toPeopleIri,
  normalizeUserItem,
  toTimezoneIri,
  toTimezoneItem,
  extractCollectionItems,
  extractErrorMessage,
  buildUsersListQuery,
  embeddedUsersFromClient,
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

  test('toPeopleIri builds API Platform IRI', () => {
    expect(toPeopleIri(106218)).toBe('/people/106218');
    expect(toPeopleIri('/people/9')).toBe('/people/9');
    expect(toPeopleIri('')).toBe('');
  });

  test('extractErrorMessage maps Authentication required', () => {
    expect(extractErrorMessage({message: 'Authentication required'})).toMatch(/Autenticação necessária/);
    expect(
      extractErrorMessage({response: {status: 401, data: {message: 'Authentication required'}}}),
    ).toMatch(/Autenticação necessária/);
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

  test('buildUsersListQuery uses people IRI and does not send company', () => {
    const query = buildUsersListQuery({id: 31468, company: 3});
    expect(query.people).toBe('/people/31468');
    expect(query.itemsPerPage).toBe(100);
    expect(query.__storeMeta.dedupeKey).toBe('client-details-users-/people/31468');
    expect(query.company).toBeUndefined();
    expect(buildUsersListQuery({})).toBe(null);
  });

  test('embeddedUsersFromClient is fallback only and normalizes items', () => {
    const items = embeddedUsersFromClient({
      user: {id: 9, username: 'alice'},
    });
    expect(items).toHaveLength(1);
    expect(items[0].username).toBe('alice');
    expect(embeddedUsersFromClient({user: []})).toEqual([]);
  });

  test('extractCollectionItems supports hydra and member', () => {
    expect(extractCollectionItems({'hydra:member': [{id: 1}]}).length).toBe(1);
    expect(extractCollectionItems({member: [{id: 2}]}).length).toBe(1);
    expect(extractCollectionItems([{id: 3}]).length).toBe(1);
  });
});
