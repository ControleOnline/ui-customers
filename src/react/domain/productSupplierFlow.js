export const extractId = value => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const match = value.match(/(\d+)$/);
    return match ? match[1] : value;
  }
  if (typeof value === 'object') {
    return extractId(value.id || value['@id'] || '');
  }
  return '';
};

export const buildInitialProviderPayload = client => {
  const providerId = extractId(client?.id || client?.['@id']);

  return {
    id: providerId,
    '@id': client?.['@id'] || (providerId ? `/people/${providerId}` : ''),
    alias: String(client?.alias || '').trim(),
    name: String(client?.name || '').trim(),
    peopleType: client?.peopleType || '',
  };
};

export const buildCreateProductParams = client => {
  const initialProvider = buildInitialProviderPayload(client);

  if (!initialProvider.id) {
    return null;
  }

  return {
    context: 'products',
    initialProvider,
  };
};
