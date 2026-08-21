/**
 * Pure helpers for Franchise/Filial (PJ→PJ) people_link management.
 * Administrative CRUD is gated by APP_TYPE === MANAGER.
 */

export const FRANCHISE_LINK_TYPES = ['franchisee', 'filial'];

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

/** Administrative link/edit/remove only in MANAGER app type. */
export const canManageFranchiseLinks = appType =>
  normalizeAppType(appType) === 'MANAGER';

export const normalizeFranchiseLinkType = value => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return FRANCHISE_LINK_TYPES.includes(normalized) ? normalized : '';
};

export const franchiseLinkTypeLabel = (linkType, t) => {
  const type = normalizeFranchiseLinkType(linkType);
  if (type === 'franchisee') {
    return t?.t?.('people', 'title', 'franchise') || 'Franquia';
  }
  if (type === 'filial') {
    return t?.t?.('people', 'title', 'branch') || 'Filial';
  }
  return type || '-';
};

export const normalizeFranchiseCandidate = item => {
  const peopleId = extractEntityId(item?.id || item?.['@id']);
  const peopleIri = toPeopleIri(item);
  const peopleName = String(item?.name || item?.alias || '').trim();
  const peopleAlias = String(item?.alias || '').trim();
  const peopleType = String(item?.peopleType || '').toUpperCase();

  if (!peopleId || !peopleIri || !peopleName) {
    return null;
  }

  // Only PJ (legal entity)
  if (peopleType && peopleType !== 'J') {
    return null;
  }

  return {
    id: peopleId,
    iri: peopleIri,
    name: peopleName,
    alias: peopleAlias,
    peopleType: peopleType || 'J',
  };
};

export const normalizeFranchiseLink = item => {
  // Linked PJ is in `people` when company is the current client (parent)
  const linked = normalizeFranchiseCandidate(item?.people || {});
  if (!linked) {
    return null;
  }

  const linkType = normalizeFranchiseLinkType(item?.linkType);
  if (!linkType) {
    return null;
  }

  return {
    id:
      extractEntityId(item?.id || item?.['@id']) ||
      String(item?.id || item?.['@id'] || ''),
    linkedId: linked.id,
    linkedIri: linked.iri,
    linkedName: linked.name,
    linkedAlias: linked.alias,
    linkType,
  };
};

export const buildAvailableFranchiseOptions = ({
  candidates,
  linkedItems,
  editingLink,
}) => {
  const currentLinkedId = extractEntityId(editingLink?.linkedId);
  const linkedIds = new Set(
    (Array.isArray(linkedItems) ? linkedItems : [])
      .map(item => extractEntityId(item?.linkedId))
      .filter(id => id && id !== currentLinkedId),
  );

  return (Array.isArray(candidates) ? candidates : [])
    .map(normalizeFranchiseCandidate)
    .filter(Boolean)
    .filter(item => !linkedIds.has(item.id));
};

export const buildFranchiseSavePayload = ({
  editingLink,
  formData,
  companyIri,
}) => {
  if (!companyIri || !formData?.linkedIri) {
    return null;
  }

  const linkType = normalizeFranchiseLinkType(formData.linkType);
  if (!linkType) {
    return null;
  }

  return {
    ...(editingLink?.id ? { id: editingLink.id } : {}),
    company: companyIri,
    people: formData.linkedIri,
    linkType,
    enable: true,
  };
};

export const buildFranchiseLinksFromPeopleLinks = (
  payload,
  { companyId = '' } = {},
) => {
  const extractItems = data => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.member)) return data.member;
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'];
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

  const normalizedCompanyId = extractEntityId(companyId);

  return extractItems(payload)
    .filter(link => {
      const linkCompanyId = extractEntityId(
        link?.company?.id || link?.company?.['@id'],
      );
      const linkType = normalizeFranchiseLinkType(link?.linkType);
      const linkedPeopleId = extractEntityId(
        link?.people?.id || link?.people?.['@id'],
      );
      const peopleType = String(link?.people?.peopleType || '').toUpperCase();

      if (!linkType || !linkedPeopleId) {
        return false;
      }
      if (normalizedCompanyId && linkCompanyId !== normalizedCompanyId) {
        return false;
      }
      // PJ only
      if (peopleType && peopleType !== 'J') {
        return false;
      }
      return true;
    })
    .map(link => ({
      ...link,
      // ensure company/people objects present for list rendering
    }));
};
