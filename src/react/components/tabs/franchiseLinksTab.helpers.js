/**
 * Pure helpers for Franchise/Filial (PJ→PJ) people_link management.
 * Administrative CRUD is gated by APP_TYPE === MANAGER.
 *
 * task-485: extractEntityId must accept object | IRI string | scalar id so
 * GET /people_links?company=… rows are not filtered out when company/people
 * are not fully expanded in the payload.
 */

export const FRANCHISE_LINK_TYPES = ['franchisee', 'filial'];

export const buildFranchiseLinkReadParams = (companyId, itemsPerPage = 100) => ({
  company: extractEntityId(companyId),
  // The API owns relationship filtering; sending both exact values avoids
  // downloading unrelated people_link rows and filtering the dataset in UI.
  linkType: [...FRANCHISE_LINK_TYPES],
  itemsPerPage,
});

export const extractEntityId = value => {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'object') {
    return String(value.id || value['@id'] || '')
      .replace(/\D/g, '')
      .trim();
  }
  return String(value)
    .replace(/\D/g, '')
    .trim();
};

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
  // Accept full People object, IRI string or numeric id
  const peopleId = extractEntityId(item);
  const peopleIri = toPeopleIri(item);
  const peopleName = String(
    (typeof item === 'object' && item
      ? item.name || item.alias
      : '') || '',
  ).trim();
  const peopleAlias = String(
    (typeof item === 'object' && item ? item.alias : '') || '',
  ).trim();
  const peopleType = String(
    (typeof item === 'object' && item ? item.peopleType : '') || '',
  ).toUpperCase();

  if (!peopleId || !peopleIri) {
    return null;
  }

  // Only PJ (legal entity) when type is known; allow missing type (partial embed)
  if (peopleType && peopleType !== 'J') {
    return null;
  }

  return {
    id: peopleId,
    iri: peopleIri,
    name: peopleName || `ID ${peopleId}`,
    alias: peopleAlias,
    peopleType: peopleType || 'J',
  };
};

export const normalizeFranchiseLink = item => {
  // Linked PJ is in `people` when company is the current client (parent)
  const linked = normalizeFranchiseCandidate(
    item?.people ?? item?.people_id ?? null,
  );
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
    comission: item?.comission ?? item?.commission ?? 0,
    minimumComission:
      item?.minimum_comission ?? item?.minimumComission ?? 0,
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
    comission: Number(String(formData.comission ?? 0).replace(',', '.')) || 0,
    minimum_comission:
      Number(String(formData.minimumComission ?? 0).replace(',', '.')) || 0,
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
      // company/people may be object, IRI string or scalar (task-485)
      const linkCompanyId = extractEntityId(
        link?.company ?? link?.company_id,
      );
      const linkType = normalizeFranchiseLinkType(link?.linkType);
      const linkedPeopleId = extractEntityId(
        link?.people ?? link?.people_id,
      );
      const peopleType = String(
        (typeof link?.people === 'object' && link?.people
          ? link.people.peopleType
          : '') || '',
      ).toUpperCase();

      if (!linkType || !linkedPeopleId) {
        return false;
      }
      if (normalizedCompanyId && linkCompanyId && linkCompanyId !== normalizedCompanyId) {
        return false;
      }
      // When company filter was requested but row has no company id, keep if people exists
      // (API already filtered by company query param).
      // PJ only when type known
      if (peopleType && peopleType !== 'J') {
        return false;
      }
      return true;
    })
    .map(link => {
      const peopleRaw = link?.people;
      let people = peopleRaw;
      if (typeof peopleRaw !== 'object' || peopleRaw == null) {
        const id = extractEntityId(peopleRaw ?? link?.people_id);
        people = id
          ? { id, '@id': `/people/${id}`, name: `ID ${id}`, peopleType: 'J' }
          : {};
      }
      return {
        ...link,
        people,
      };
    });
};
