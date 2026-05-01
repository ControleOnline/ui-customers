export const extractEntityId = value =>
  String(value || '')
    .replace(/\D/g, '')
    .trim();

export const toPeopleIri = value => {
  const directIri = String(value?.['@id'] || value || '').trim();
  if (directIri.startsWith('/people/')) {
    return directIri;
  }

  const id = extractEntityId(value?.id || value?.['@id'] || value);
  return id ? `/people/${id}` : '';
};

export const normalizeAppType = value =>
  String(value || '')
    .trim()
    .toUpperCase();

export const canManageSalesmen = appType => normalizeAppType(appType) === 'MANAGER';

export const normalizeCommissionValue = value => {
  const normalized = String(value ?? '')
    .replace(',', '.')
    .trim();
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCommissionLabel = value =>
  `${normalizeCommissionValue(value).toFixed(2).replace('.', ',')}%`;

export const normalizeSalesmanCandidate = item => {
  const sellerId = extractEntityId(item?.id || item?.['@id']);
  const sellerIri = toPeopleIri(item);
  const sellerName = String(item?.name || item?.alias || '').trim();
  const sellerAlias = String(item?.alias || '').trim();

  if (!sellerId || !sellerIri || !sellerName) {
    return null;
  }

  return {
    id: sellerId,
    iri: sellerIri,
    name: sellerName,
    alias: sellerAlias,
  };
};

export const normalizeSalesmanLink = item => {
  const seller = normalizeSalesmanCandidate(item?.company || {});
  if (!seller) {
    return null;
  }

  return {
    id: extractEntityId(item?.id || item?.['@id']) || String(item?.id || item?.['@id'] || ''),
    sellerId: seller.id,
    sellerIri: seller.iri,
    sellerName: seller.name,
    sellerAlias: seller.alias,
    commission: normalizeCommissionValue(item?.comission),
    minimumCommission: normalizeCommissionValue(item?.minimum_comission),
  };
};

export const buildAvailableSalesmanOptions = ({
  salesmen,
  linkedSalesmen,
  editingLink,
}) => {
  const currentSellerId = extractEntityId(editingLink?.sellerId);
  const linkedSellerIds = new Set(
    (Array.isArray(linkedSalesmen) ? linkedSalesmen : [])
      .map(item => extractEntityId(item?.sellerId))
      .filter(id => id && id !== currentSellerId),
  );

  return (Array.isArray(salesmen) ? salesmen : [])
    .map(normalizeSalesmanCandidate)
    .filter(Boolean)
    .filter(item => !linkedSellerIds.has(item.id));
};
