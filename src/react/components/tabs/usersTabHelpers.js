const extractId = value => String(value || '').replace(/\D/g, '');

const normalizeUserItem = entry => {
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

const mapUsersForClient = users =>
  users.map(user => ({
    id: extractId(user?.id) || user?.id,
    '@id': extractId(user?.id) || user?.id,
    username: user?.username || user?.name || '',
    role: user?.role || 'Usuario',
    apiKey: user?.apiKey || '',
  }));

const formatApiKeyPreview = value => {
  const apiKey = String(value || '').trim();
  if (!apiKey) {
    return 'Chave de API indisponivel';
  }

  if (apiKey.length <= 16) {
    return apiKey;
  }

  return `${apiKey.slice(0, 8)}...${apiKey.slice(-6)}`;
};

const copyTextToClipboard = async text => {
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

const extractErrorMessage = error => {
  if (Array.isArray(error?.violations) && error.violations.length) {
    return error.violations
      .map(item => item?.message || item)
      .filter(Boolean)
      .join('\n');
  }

  return error?.message || error?.error || (typeof error === 'string' ? error : '');
};

const apiKeyModalStyles = {
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minWidth: 132,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
};

module.exports = {
  apiKeyModalStyles,
  copyTextToClipboard,
  extractErrorMessage,
  extractId,
  formatApiKeyPreview,
  mapUsersForClient,
  normalizeUserItem,
};
