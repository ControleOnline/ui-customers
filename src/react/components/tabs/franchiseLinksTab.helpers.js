/**
 * Pure helpers for Franchise/Filial (PJ→PJ) people_link management.
 * Administrative CRUD is gated by APP_TYPE === MANAGER.
 *
 * task-485: extractEntityId must accept object | IRI string | scalar id so
 * GET /people_links?company=… rows are not filtered out when company/people
 * are not fully expanded in the payload.
 */

/**
 * Types that exist in people_link.link_type MySQL SET (api-platform-people).
 * GET still sends only `franchisee` so a stale SET without `filial` cannot
 * empty the collection (app-community#521). Client-side accepts `filial`.
 */
export const FRANCHISE_LINK_TYPES = ['franchisee'];

/** UI-only labels / residual payloads may still mention filial. */
export const FRANCHISE_LINK_TYPES_UI = ['franchisee', 'filial'];

/**
 * Read params for franchise links.
 * Canonical rule (only):
 *   company_id = franqueadora (PJ vista)
 *   people_id  = franquia (outra PJ)
 *   link_type  = franchisee
 * One query only — never invert sides.
 */
export const buildFranchiseLinkReadParams = (companyId, itemsPerPage = 100) => {
  const company = extractEntityId(companyId);
  return {
    company,
    linkType: [...FRANCHISE_LINK_TYPES],
    enable: true,
    itemsPerPage,
  };
};

/** @deprecated inverted side is not a valid franchise model; kept for test import stability */
export const buildFranchiseLinkReadParamsByPeople = (
  peopleId,
  itemsPerPage = 100,
) => {
  const people = extractEntityId(peopleId);
  return {
    people,
    linkType: [...FRANCHISE_LINK_TYPES],
    enable: true,
    itemsPerPage,
  };
};

export const buildFranchiseLinkReadQueries = (companyId, itemsPerPage = 100) => {
  const id = extractEntityId(companyId);
  if (!id) {
    return [];
  }
  return [buildFranchiseLinkReadParams(id, itemsPerPage)];
};

export const extractEntityId = value => {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'object') {
    // Nested `{id: {id: 5}}` or `{id: object}` must not become "[object Object]".
    return extractEntityId(value.id || value['@id'] || '');
  }
  const asString = String(value).trim();
  if (asString === '[object Object]') {
    return '';
  }
  return asString.replace(/\D/g, '').trim();
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
  // Accept UI residual `filial` for display; API read uses FRANCHISE_LINK_TYPES only.
  return FRANCHISE_LINK_TYPES_UI.includes(normalized) ? normalized : '';
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

export const resolveLinkedFranchiseParty = (item, companyId = '') => {
  // Canonical: people_id is always the franchise (other PJ).
  // companyId is only used by callers for filtering, not for side inversion.
  void companyId;
  return item?.people ?? item?.people_id ?? null;
};

export const normalizeFranchiseLink = (item, companyId = '') => {
  const linked = normalizeFranchiseCandidate(
    resolveLinkedFranchiseParty(item, companyId),
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

export const extractPeopleLinkCollection = data => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.member)) return data.member;
  if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'];
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const mergePeopleLinkPayloads = (...payloads) => {
  const seen = new Set();
  const merged = [];
  payloads.forEach(payload => {
    extractPeopleLinkCollection(payload).forEach(link => {
      const key =
        extractEntityId(link?.id || link?.['@id']) ||
        `${extractEntityId(link?.company ?? link?.company_id)}:${extractEntityId(
          link?.people ?? link?.people_id,
        )}:${String(link?.linkType || '')}`;
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(link);
    });
  });
  return merged;
};

export const buildFranchiseLinksFromPeopleLinks = (
  payload,
  { companyId = '' } = {},
) => {
  const normalizedCompanyId = extractEntityId(companyId);

  return extractPeopleLinkCollection(payload)
    .filter(link => {
      const linkCompanyId = extractEntityId(
        link?.company ?? link?.company_id,
      );
      const linkPeopleId = extractEntityId(
        link?.people ?? link?.people_id,
      );
      const linkType = normalizeFranchiseLinkType(link?.linkType);
      const linkedRaw = resolveLinkedFranchiseParty(link, normalizedCompanyId);
      const linkedId = extractEntityId(linkedRaw);
      const linkedType = String(
        (typeof linkedRaw === 'object' && linkedRaw
          ? linkedRaw.peopleType
          : '') || '',
      ).toUpperCase();

      if (!linkType || !linkedId) {
        return false;
      }
      // Only rows where company_id is the franchisor being viewed.
      if (normalizedCompanyId) {
        if (linkCompanyId !== normalizedCompanyId) {
          return false;
        }
      }
      if (linkedType && linkedType !== 'J') {
        return false;
      }
      // Franchise must not be the same id as the franchisor.
      if (normalizedCompanyId && linkedId === normalizedCompanyId) {
        return false;
      }
      return true;
    })
    .map(link => {
      const peopleRaw = resolveLinkedFranchiseParty(link, normalizedCompanyId);
      let people = peopleRaw;
      if (typeof peopleRaw !== 'object' || peopleRaw == null) {
        const id = extractEntityId(peopleRaw);
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
