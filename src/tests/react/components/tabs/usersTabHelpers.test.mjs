/**
 * Unit tests for UsersTab pure helpers (#369).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractId,
  toPeopleIri,
  normalizeUserItem,
  mapUsersForClient,
  extractErrorMessage,
  buildCreateUserPayload,
  formatApiKeyPreview,
} from '../../../../react/components/tabs/usersTabHelpers.js';

describe('usersTabHelpers', () => {
  it('extractId strips non-digits', () => {
    assert.equal(extractId('/people/106218'), '106218');
    assert.equal(extractId('106218'), '106218');
    assert.equal(extractId(null), '');
  });

  it('toPeopleIri builds API Platform IRI', () => {
    assert.equal(toPeopleIri(106218), '/people/106218');
    assert.equal(toPeopleIri('/people/9'), '/people/9');
    assert.equal(toPeopleIri(''), '');
  });

  it('buildCreateUserPayload uses people IRI', () => {
    const payload = buildCreateUserPayload({
      username: 'alice',
      password: 'secret',
      confirmPassword: 'secret',
      peopleId: 106218,
    });
    assert.equal(payload.people, '/people/106218');
    assert.equal(payload.username, 'alice');
  });

  it('extractErrorMessage maps 401 / Authentication required', () => {
    const msg = extractErrorMessage({
      response: {status: 401, data: {message: 'Authentication required'}},
    });
    assert.match(msg, /Autenticação necessária/);
    assert.match(
      extractErrorMessage({message: 'Authentication required'}),
      /Autenticação necessária/,
    );
  });

  it('normalizeUserItem and mapUsersForClient', () => {
    const n = normalizeUserItem({id: '/users/1', username: 'bob', apiKey: 'k'});
    assert.equal(n.id, '1');
    assert.equal(n.username, 'bob');
    const mapped = mapUsersForClient([n]);
    assert.equal(mapped[0].username, 'bob');
  });

  it('formatApiKeyPreview truncates long keys', () => {
    assert.equal(formatApiKeyPreview('short'), 'short');
    assert.match(formatApiKeyPreview('abcdefghijklmnopqrstuvwxyz'), /\.\.\./);
  });
});
