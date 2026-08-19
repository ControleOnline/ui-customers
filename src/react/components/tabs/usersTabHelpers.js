/**
 * Pure helpers for UsersTab — keep the component under the 500-line limit.
 */

export const extractId = value => String(value || '').replace(/\D/g, '');

/** API Platform expects people as IRI (e.g. /people/106218), not a bare id. */
export const toPeopleIri = value => {
  const id = extractId(value);
  return id ? `/people/${id}` : '';
};

export const normalizeUserItem = entry => {
  if (!entry) {
    return null;
  }

  const id = extractId(entry?.id || entry?.['@id'] || entry?.user?.id || entry?.user?.['@id']);
  const username = String(
    entry?.username || entry?.name || entry?.user?.username || '',
  ).trim();
  const apiKey = String(
    entry?.apiKey || entry?.api_key || entry?.user?.apiKey || entry?.user?.api_key || '',
  ).trim();
  const role = String(entry?.role || 'Usuario').trim() || 'Usuario';

  if (!id && !username && !apiKey) {
    return null;
  }

  return {
    id: id || `temp-${Date.now()}`,
    username,
    name: username,
    role,
    apiKey,
  };
};

export const mapUsersForClient = users =>
  (Array.isArray(users) ? users : []).map(user => ({
    id: extractId(user?.id) || user?.id,
    '@id': extractId(user?.id) || user?.id,
    username: user?.username || user?.name || '',
    role: user?.role || 'Usuario',
    apiKey: user?.apiKey || '',
  }));

export const extractErrorMessage = error => {
  if (Array.isArray(error?.message)) {
    return error.message
      .map(item => item?.message || item)
      .filter(Boolean)
      .join(', ');
  }

  const status = error?.response?.status || error?.status;
  if (status === 401) {
    return 'Autenticação necessária. Faça login novamente e tente criar o usuário.';
  }

  if (error?.response?.data?.message) {
    return String(error.response.data.message);
  }

  if (error?.response?.data?.error) {
    return String(error.response.data.error);
  }

  if (error?.response?.data?.response?.error) {
    return String(error.response.data.response.error);
  }

  const msg = error?.message || '';
  if (/authentication required/i.test(msg)) {
    return 'Autenticação necessária. Faça login novamente e tente criar o usuário.';
  }

  return msg;
};

export const buildCreateUserPayload = ({ username, password, confirmPassword, peopleId }) => ({
  username: String(username || '').trim(),
  password: String(password || ''),
  confirmPassword: String(confirmPassword || ''),
  people: toPeopleIri(peopleId) || peopleId,
});

export const formatApiKeyPreview = value => {
  const apiKey = String(value || '').trim();
  if (!apiKey) {
    return 'Chave de API indisponivel';
  }

  if (apiKey.length <= 16) {
    return apiKey;
  }

  return `${apiKey.slice(0, 8)}...${apiKey.slice(-6)}`;
};

export const copyTextToClipboard = async text => {
  const normalizedText = String(text ?? '').trim();
  if (!normalizedText) {
    return false;
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator?.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(normalizedText);
    return true;
  }

  return false;
};
