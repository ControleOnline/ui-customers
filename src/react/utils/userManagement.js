const extractId = value => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    const match = value.match(/(\d+)$/);
    return match ? match[1] : value;
  }

  if (typeof value === 'object') {
    return extractId(value.id || value['@id'] || '');
  }

  return '';
};

const extractItems = response => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.member)) return response.member;
  if (Array.isArray(response?.['hydra:member'])) return response['hydra:member'];
  return [];
};

const resolvePeopleReference = client => {
  const directReference = String(client?.['@id'] || '').trim();
  if (directReference.startsWith('/people/')) {
    return directReference;
  }

  const extractedId = extractId(client?.id || client?.['@id']);
  return extractedId ? `/people/${extractedId}` : '';
};

const normalizePermissionList = user => {
  const candidates = [];

  if (Array.isArray(user?.permissions)) {
    candidates.push(...user.permissions);
  }

  if (Array.isArray(user?.permission)) {
    candidates.push(...user.permission);
  } else if (user?.permission && typeof user.permission === 'object') {
    candidates.push(...Object.values(user.permission));
  } else if (user?.permission) {
    candidates.push(user.permission);
  }

  if (Array.isArray(user?.roles)) {
    candidates.push(...user.roles);
  }

  if (user?.role) {
    candidates.push(user.role);
  }

  return [...new Set(
    candidates
      .flatMap(value => (Array.isArray(value) ? value : [value]))
      .map(value => String(value || '').trim())
      .filter(Boolean),
  )];
};

const normalizeUser = user => {
  const permissions = normalizePermissionList(user);

  return {
    id: extractId(user?.id || user?.['@id']) || `temp-${Date.now()}`,
    iri: String(user?.['@id'] || ''),
    username: String(user?.username || user?.name || '').trim(),
    email: String(user?.email || '').trim(),
    apiKey: String(user?.apiKey || user?.api_key || '').trim(),
    permissions,
    permissionSummary: permissions.join(' • '),
    raw: user,
  };
};

const buildClientUsersPayload = users =>
  users.map(user => ({
    ...(user?.raw || {}),
    id: user.id || user?.raw?.id,
    '@id': user.iri || user?.raw?.['@id'] || (user.id ? `/users/${user.id}` : ''),
    username: user.username,
    email: user.email,
    apiKey: user.apiKey,
    api_key: user.apiKey,
    role: user.permissions[0] || user?.raw?.role || '',
    permissions: user.permissions,
  }));

const getUserSubtitle = user =>
  [user.permissionSummary, user.email].filter(Boolean).join(' • ');

module.exports = {
  buildClientUsersPayload,
  extractId,
  extractItems,
  getUserSubtitle,
  normalizePermissionList,
  normalizeUser,
  resolvePeopleReference,
};
