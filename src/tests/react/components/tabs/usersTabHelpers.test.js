const {
  extractId,
  normalizeUserItem,
  mapUsersForClient,
  formatApiKeyPreview,
  extractErrorMessage,
} = require('../../../../react/components/tabs/usersTabHelpers');

describe('usersTabHelpers', () => {
  it('extracts numeric id from iri or raw value', () => {
    expect(extractId('/users/42')).toBe('42');
    expect(extractId(7)).toBe('7');
    expect(extractId(null)).toBe('');
  });

  it('normalizes nested user payloads', () => {
    const normalized = normalizeUserItem({
      user: {id: '/users/9', username: 'ops', api_key: 'abc123'},
      role: 'Admin',
    });
    expect(normalized).toMatchObject({
      id: '9',
      username: 'ops',
      role: 'Admin',
      apiKey: 'abc123',
    });
  });

  it('returns null for empty entries', () => {
    expect(normalizeUserItem({})).toBeNull();
    expect(normalizeUserItem(null)).toBeNull();
  });

  it('maps users back to client payload shape', () => {
    expect(
      mapUsersForClient([{id: '3', username: 'a', role: 'Usuario', apiKey: 'k'}]),
    ).toEqual([
      {id: '3', '@id': '3', username: 'a', role: 'Usuario', apiKey: 'k'},
    ]);
  });

  it('masks long api keys and keeps short ones', () => {
    expect(formatApiKeyPreview('short')).toBe('short');
    expect(formatApiKeyPreview('1234567890abcdefghij')).toBe('12345678...efghij');
    expect(formatApiKeyPreview('')).toBe('Chave de API indisponivel');
  });

  it('extracts violation messages when present', () => {
    expect(
      extractErrorMessage({violations: [{message: 'dup'}, {message: 'required'}]}),
    ).toBe('dup\nrequired');
    expect(extractErrorMessage({message: 'boom'})).toBe('boom');
  });
});
