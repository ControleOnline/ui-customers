/**
 * Pure helpers for AddressesTab — keep the tab under the 500-line limit
 * and make address id / IRI handling testable (app-community#282).
 */

export const extractId = value => String(value || '').replace(/\D/g, '');

/**
 * Normalize an address id to digits only.
 * Never invents a timestamp id for missing values (that caused PUT 404
 * and silent create paths when editing existing franchise addresses).
 */
export const normalizeId = value => {
  const digits = extractId(value);
  if (digits) return digits;
  const raw = String(value || '').trim();
  return raw || '';
};

export const toPeopleIri = person => {
  const rawIri = String(person?.['@id'] || '').trim();
  if (rawIri.startsWith('/people/')) {
    return rawIri;
  }

  const nestedIri = String(person?.people?.['@id'] || person?.people || '').trim();
  if (nestedIri.startsWith('/people/')) {
    return nestedIri;
  }

  const id = extractId(person?.id || person?.people?.id || rawIri || nestedIri);
  return id ? `/people/${id}` : '';
};

export const normalizeString = value => {
  const text = String(value || '').trim();
  return text.length > 0 ? text : undefined;
};

export const normalizeZipCode = value =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 8);

/**
 * Flatten API/people address shapes into a stable client model.
 * Always preserves a numeric `id` and an `/addresses/{id}` `@id` when known.
 */
export const normalizeAddress = address => {
  if (!address || typeof address !== 'object') {
    return {
      id: '',
      '@id': '',
      street: '',
      number: '',
      city: '',
      state: '',
      zipCode: '',
      complement: '',
      district: '',
      country: '',
      nickname: '',
    };
  }

  const rawId = address?.id ?? address?.['@id'];
  const id = normalizeId(rawId);
  const iri =
    String(address?.['@id'] || '').startsWith('/addresses/')
      ? String(address['@id'])
      : id
        ? `/addresses/${id}`
        : '';

  return {
    id,
    '@id': iri,
    street: address?.street?.street || address?.street || '',
    number: String(address?.number ?? '').trim(),
    city:
      address?.street?.district?.city?.city ||
      address?.street?.city?.city ||
      address?.city ||
      '',
    state:
      address?.street?.district?.city?.state?.uf ||
      address?.street?.district?.city?.state?.state ||
      address?.street?.city?.state?.uf ||
      address?.street?.city?.state?.state ||
      address?.state ||
      '',
    zipCode:
      (typeof address?.zipCode === 'object'
        ? address?.zipCode?.cep
        : address?.zipCode) ||
      address?.street?.cep?.cep ||
      address?.postal_code ||
      address?.cep ||
      '',
    complement: address?.complement || '',
    district:
      address?.street?.district?.district ||
      address?.district ||
      '',
    country:
      address?.street?.district?.city?.state?.country?.countrycode ||
      address?.street?.district?.city?.state?.country?.countryname ||
      address?.street?.city?.state?.country?.countrycode ||
      address?.street?.city?.state?.country?.countryname ||
      address?.country ||
      '',
    nickname: address?.nickname || '',
  };
};

export const mapAddressesForClient = list =>
  (Array.isArray(list) ? list : []).map(item => {
    const id = normalizeId(item?.id || item?.['@id']);
    const iri =
      String(item?.['@id'] || '').startsWith('/addresses/')
        ? String(item['@id'])
        : id
          ? `/addresses/${id}`
          : '';
    return {
      id,
      '@id': iri,
      street: item.street,
      number: item.number,
      complement: item.complement,
      district: item.district,
      city: item.city,
      state: item.state,
      zipCode: item.zipCode,
      country: item.country,
      nickname: item.nickname,
    };
  });

/**
 * Resolve the id/IRI that must be sent on edit so the default store
 * issues PUT /addresses/{id} instead of POST /addresses.
 */
export const resolveAddressSaveId = (editingItem, payload = {}) => {
  const candidates = [
    payload?.id,
    payload?.['@id'],
    editingItem?.['@id'],
    editingItem?.id,
  ];
  for (const candidate of candidates) {
    const digits = normalizeId(candidate);
    if (digits) return digits;
  }
  return '';
};

export const buildAddressMapQueryParts = address => {
  const streetLine = [normalizeString(address?.street), normalizeString(address?.number)]
    .filter(Boolean)
    .join(', ');
  const cityStateLine = [normalizeString(address?.city), normalizeString(address?.state)]
    .filter(Boolean)
    .join(' - ');

  return [
    streetLine,
    normalizeString(address?.district),
    cityStateLine,
    normalizeString(address?.country),
    normalizeZipCode(address?.zipCode),
    normalizeString(address?.complement),
  ];
};

export const buildAddressPrimaryLine = address =>
  [normalizeString(address?.street), normalizeString(address?.number)]
    .filter(Boolean)
    .join(', ');

export const buildAddressSecondaryLine = address =>
  [
    normalizeString(address?.district),
    [normalizeString(address?.city), normalizeString(address?.state)]
      .filter(Boolean)
      .join(' - '),
    normalizeString(address?.country),
  ]
    .filter(Boolean)
    .join(' • ');
