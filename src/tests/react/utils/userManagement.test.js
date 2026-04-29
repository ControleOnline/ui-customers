const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildClientUsersPayload,
  extractId,
  extractItems,
  getUserSubtitle,
  normalizePermissionList,
  normalizeUser,
  resolvePeopleReference,
} = require('../../../react/utils/userManagement');

test('extractId normaliza ids numericos e IRIs', () => {
  assert.equal(extractId(15), '15');
  assert.equal(extractId('/users/98'), '98');
  assert.equal(extractId({ '@id': '/people/44' }), '44');
  assert.equal(extractId(null), '');
});

test('extractItems aceita array direto e formatos Hydra', () => {
  const items = [{ id: 1 }, { id: 2 }];

  assert.deepEqual(extractItems(items), items);
  assert.deepEqual(extractItems({ member: items }), items);
  assert.deepEqual(extractItems({ 'hydra:member': items }), items);
  assert.deepEqual(extractItems({}), []);
});

test('resolvePeopleReference preserva iri existente ou monta a partir do id', () => {
  assert.equal(resolvePeopleReference({ '@id': '/people/9' }), '/people/9');
  assert.equal(resolvePeopleReference({ id: 12 }), '/people/12');
  assert.equal(resolvePeopleReference({}), '');
});

test('normalizePermissionList consolida permissoes sem duplicidade', () => {
  const permissions = normalizePermissionList({
    permissions: ['ROLE_ADMIN', 'ROLE_ADMIN'],
    permission: { first: 'ROLE_USER' },
    roles: ['ROLE_MANAGER'],
    role: 'ROLE_ADMIN',
  });

  assert.deepEqual(permissions, ['ROLE_ADMIN', 'ROLE_USER', 'ROLE_MANAGER']);
});

test('normalizeUser preserva dados relevantes para a aba de usuarios', () => {
  const user = normalizeUser({
    '@id': '/users/88',
    username: 'maria',
    email: 'maria@controleonline.com',
    api_key: 'token-88',
    permission: ['ROLE_MANAGER'],
  });

  assert.equal(user.id, '88');
  assert.equal(user.iri, '/users/88');
  assert.equal(user.username, 'maria');
  assert.equal(user.email, 'maria@controleonline.com');
  assert.equal(user.apiKey, 'token-88');
  assert.deepEqual(user.permissions, ['ROLE_MANAGER']);
  assert.equal(user.permissionSummary, 'ROLE_MANAGER');
});

test('buildClientUsersPayload devolve payload coerente para atualizar o parent client', () => {
  const payload = buildClientUsersPayload([
    {
      id: '88',
      iri: '/users/88',
      username: 'maria',
      email: 'maria@controleonline.com',
      apiKey: 'token-88',
      permissions: ['ROLE_MANAGER', 'ROLE_API'],
      raw: {
        active: true,
      },
    },
  ]);

  assert.deepEqual(payload, [
    {
      active: true,
      id: '88',
      '@id': '/users/88',
      username: 'maria',
      email: 'maria@controleonline.com',
      apiKey: 'token-88',
      api_key: 'token-88',
      role: 'ROLE_MANAGER',
      permissions: ['ROLE_MANAGER', 'ROLE_API'],
    },
  ]);
});

test('getUserSubtitle combina permissao e email quando disponiveis', () => {
  assert.equal(
    getUserSubtitle({
      permissionSummary: 'ROLE_MANAGER',
      email: 'maria@controleonline.com',
    }),
    'ROLE_MANAGER • maria@controleonline.com',
  );
  assert.equal(getUserSubtitle({ permissionSummary: '', email: '' }), '');
});
